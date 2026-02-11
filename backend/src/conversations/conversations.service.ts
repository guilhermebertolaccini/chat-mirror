import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) { }

  async findAll(lineId: string) {
    if (!lineId) return [];

    return this.prisma.conversation.findMany({
      where: { lineId },
      include: {
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 1, // Get only the last message for preview
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, limit?: number, before?: string, after?: string) {
    const take = limit ? Number(limit) : 50; // Default 50 messages

    let messages;

    if (after) {
      // Fetch specificmessages AFTER a cursor (Polling for new messages)
      // Order ASC to get them in chronological order
      messages = await this.prisma.message.findMany({
        where: { conversationId: id },
        take: take,
        skip: 1,
        cursor: { id: after },
        orderBy: { timestamp: 'asc' },
      });
      // No need to reverse, they are already ASC
    } else {
      // Fetch latest messages OR messages BEFORE a cursor (History)
      // Order DESC to get latest first (or closest to 'before' cursor)
      const cursor = before ? { id: before } : undefined;

      messages = await this.prisma.message.findMany({
        where: { conversationId: id },
        take: take,
        skip: cursor ? 1 : 0,
        cursor: cursor,
        orderBy: { timestamp: 'desc' },
      });

      // Reverse to return ASC (top to bottom)
      messages.reverse();
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
    });

    return {
      ...conversation,
      messages: messages
    };
  }
}
