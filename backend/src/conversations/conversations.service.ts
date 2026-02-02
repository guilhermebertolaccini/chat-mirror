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

  async findOne(id: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' }, // Chat history order
        },
      },
    });
    return conversation;
  }
}
