import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Processor('webhooks')
export class WebhooksProcessor extends WorkerHost {
    private readonly logger = new Logger(WebhooksProcessor.name);

    constructor(private prisma: PrismaService) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        const payload = job.data;
        const event = payload.event;

        // this.logger.debug(`Processing event: ${event}`);

        try {
            if (event === 'messages.upsert') {
                await this.handleMessageUpsert(payload);
            }
            // Add other events like messages.update later
        } catch (error) {
            this.logger.error(`Error processing job ${job.id}: ${error.message}`, error.stack);
            throw error;
        }
    }

    private async handleMessageUpsert(payload: any) {
        const data = payload.data;
        const instanceName = payload.instance;

        // 1. Find the Line
        const line = await this.prisma.line.findUnique({
            where: { instanceName },
        });

        if (!line) {
            this.logger.warn(`Received webhook for unknown line: ${instanceName}`);
            return;
        }

        // 2. Extract Message Details
        const messageData = data.message;
        const key = data.key;
        const remoteJid = key.remoteJid;
        const fromMe = key.fromMe;
        const id = key.id;

        // Safe extraction of content (text, image, etc.)
        // Simplified for MVP - heavily depends on Evolution payload structure
        const content =
            messageData.conversation ||
            messageData.extendedTextMessage?.text ||
            messageData.imageMessage?.caption ||
            'Media/Unknown';

        const messageType = Object.keys(messageData)[0]; // conversation, imageMessage, etc.

        // 3. Upsert Conversation
        // We use lineId + remoteJid as unique pair
        const conversation = await this.prisma.conversation.upsert({
            where: {
                lineId_remoteJid: {
                    lineId: line.id,
                    remoteJid,
                },
            },
            update: {
                updatedAt: new Date(),
                contactName: data.pushName || undefined, // Update name if available
            },
            create: {
                lineId: line.id,
                remoteJid,
                contactName: data.pushName,
            },
        });

        // 4. Create Message
        // Check for duplicates (idempotency)
        const existingMessage = await this.prisma.message.findUnique({
            where: { evolutionId: id },
        });

        if (!existingMessage) {
            await this.prisma.message.create({
                data: {
                    evolutionId: id,
                    conversationId: conversation.id,
                    content,
                    type: messageType,
                    direction: fromMe ? 'SENT' : 'RECEIVED',
                    status: 'DELIVERED', // Evolution usually sends established messages
                    timestamp: new Date(Number(data.messageTimestamp) * 1000),
                },
            });
            // this.logger.log(`Message saved: ${id} for ${instanceName}`);
        }
    }
}
