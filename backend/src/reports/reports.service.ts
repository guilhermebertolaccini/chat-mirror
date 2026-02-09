import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
    constructor(private prisma: PrismaService) { }

    async getMessagesByLine(startDate?: string, endDate?: string) {
        const dateFilter = this.getDateFilter(startDate, endDate);

        const lines = await this.prisma.line.findMany({
            include: {
                conversations: {
                    select: {
                        messages: {
                            where: { timestamp: dateFilter },
                            select: {
                                direction: true
                            }
                        }
                    }
                }
            }
        });

        return lines.map(line => {
            let sent = 0;
            let received = 0;

            line.conversations.forEach(conv => {
                conv.messages.forEach(msg => {
                    if (msg.direction === 'SENT') sent++;
                    else received++;
                });
            });

            return {
                lineId: line.id,
                phoneNumber: line.phoneNumber || 'Sem número',
                instanceName: line.instanceName,
                sent,
                received,
                total: sent + received
            };
        });
    }

    async getMessagesByOperator(startDate?: string, endDate?: string) {
        const dateFilter = this.getDateFilter(startDate, endDate);

        const operators = await this.prisma.user.findMany({
            where: { role: 'operador' },
            include: {
                lines: {
                    include: {
                        conversations: {
                            select: {
                                messages: {
                                    where: { timestamp: dateFilter },
                                    select: {
                                        direction: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        return operators.map(op => {
            let sent = 0;
            let received = 0;

            op.lines.forEach(line => {
                line.conversations.forEach(conv => {
                    conv.messages.forEach(msg => {
                        if (msg.direction === 'SENT') sent++;
                        else received++;
                    });
                });
            });

            return {
                operatorId: op.id,
                name: op.name,
                email: op.email,
                sent,
                received,
                total: sent + received
            };
        });
    }

    async getLinesStatus() {
        // Status is real-time, no date filter needed usually, but user asked for "Filtro por data... relatórios"
        // For "Status", date filter applies to "Created At"? Or maybe just connectivity log?
        // Let's keep status as current state for now as requested by logic.
        const lines = await this.prisma.line.findMany({
            include: {
                operator: {
                    select: { name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return lines.map(line => ({
            id: line.id,
            instanceName: line.instanceName,
            phoneNumber: line.phoneNumber,
            status: line.status,
            operatorName: line.operator?.name || 'Sem operador',
            createdAt: line.createdAt
        }));
    }

    async getDetailedMessages(startDate?: string, endDate?: string) {
        const dateFilter = this.getDateFilter(startDate, endDate);

        const messages = await this.prisma.message.findMany({
            where: { timestamp: dateFilter },
            orderBy: { timestamp: 'desc' },
            include: {
                conversation: {
                    include: {
                        line: {
                            include: {
                                operator: true
                            }
                        }
                    }
                }
            }
        });

        return messages.map(msg => ({
            id: msg.id,
            operatorName: msg.conversation.line.operator?.name || 'N/A',
            operatorNumber: msg.conversation.line.phoneNumber || 'N/A', // Number of the line
            recipientNumber: msg.conversation.remoteJid.split('@')[0],
            direction: msg.direction,
            content: msg.content,
            timestamp: msg.timestamp,
            status: msg.status
        }));
    }

    private getDateFilter(startDate?: string, endDate?: string) {
        if (!startDate && !endDate) return undefined;

        const start = startDate ? new Date(startDate) : new Date(0); // Epoch if no start
        const end = endDate ? new Date(endDate) : new Date();

        // Ensure end includes the full day if time is 00:00:00
        if (endDate && end.getHours() === 0) {
            end.setHours(23, 59, 59, 999);
        }

        return {
            gte: start,
            lte: end
        };
    }
}
