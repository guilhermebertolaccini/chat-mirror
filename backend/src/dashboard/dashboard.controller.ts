import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('dashboard')
export class DashboardController {
    constructor(private readonly prisma: PrismaService) { }

    @Get('metrics')
    async getMetrics(
        @Query('search') search?: string,
        @Query('date') date?: string
    ) {
        // Prepare Operator Filter
        const operatorFilter = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { email: { contains: search, mode: 'insensitive' as const } }
            ],
            role: 'operador'
        } : { role: 'operador' };

        // Prepare Date Filter (for messages)
        // Default to today if not provided, or specific date
        const targetDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        const [totalOperators, operatorsOnline, activeLines, totalMessages] = await Promise.all([
            // 1. Total Operators (matching search)
            this.prisma.user.count({ where: operatorFilter }),

            // 2. Operators Online (matching search + status logic)
            // Note: This matches the 'operators' endpoint logic roughly
            this.prisma.user.count({
                where: {
                    ...operatorFilter,
                    lines: {
                        some: { status: 'connected' }
                    }
                }
            }),

            // 3. Active Lines (belonging to matching operators)
            this.prisma.line.count({
                where: {
                    status: 'connected',
                    operator: search ? {
                        OR: [
                            { name: { contains: search, mode: 'insensitive' } },
                            { email: { contains: search, mode: 'insensitive' } }
                        ]
                    } : undefined
                }
            }),

            // 4. Total Messages (filtered by date AND matching operator)
            this.prisma.message.count({
                where: {
                    timestamp: {
                        gte: startOfDay,
                        lte: endOfDay
                    },
                    conversation: search ? {
                        line: {
                            operator: {
                                OR: [
                                    { name: { contains: search, mode: 'insensitive' } },
                                    { email: { contains: search, mode: 'insensitive' } }
                                ]
                            }
                        }
                    } : undefined
                }
            }),
        ]);

        return {
            totalOperators,
            operatorsOnline,
            activeLines,
            totalMessages,
        };
    }

    @Get('operators')
    async getOperators() {
        // Fetch operators with their lines to determine status
        const operators = await this.prisma.user.findMany({
            where: { role: 'operador' },
            include: {
                lines: true,
            },
            orderBy: { name: 'asc' },
        });

        // Map to the format expected by frontend (enriched with online status from lines)
        return operators.map(op => {
            const connectedLine = op.lines.find(l => l.status === 'connected');
            return {
                ...op,
                // If they have at least one connected line, consider them online for now
                status: connectedLine ? 'online' : 'offline',
                // Return the first connected line info if available
                currentLine: connectedLine ? {
                    id: connectedLine.id,
                    instanceName: connectedLine.instanceName,
                    phoneNumber: connectedLine.phoneNumber,
                    status: connectedLine.status
                } : null
            };
        });
    }

    @Get('search')
    async searchGlobal(
        @Query('q') query: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('operatorId') operatorId?: string
    ) {
        if (!query || query.length < 3) return [];

        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;

        // Adjust end date to end of day if provided
        if (end) end.setHours(23, 59, 59, 999);

        // Common filter for operator
        const operatorFilter = operatorId && operatorId !== 'all' ? {
            line: { operatorId }
        } : {};

        // 1. Search Conversations (Contact Name or Number)
        const conversations = await this.prisma.conversation.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            { contactName: { contains: query, mode: 'insensitive' } },
                            { remoteJid: { contains: query, mode: 'insensitive' } }
                        ]
                    },
                    operatorId && operatorId !== 'all' ? { line: { operatorId } } : {},
                    start || end ? {
                        updatedAt: {
                            gte: start,
                            lte: end
                        }
                    } : {}
                ]
            },
            include: {
                line: { include: { operator: true } },
                messages: {
                    orderBy: { timestamp: 'desc' },
                    take: 1
                }
            },
            take: 20
        });

        // 2. Search Messages (Content)
        const messages = await this.prisma.message.findMany({
            where: {
                AND: [
                    { content: { contains: query, mode: 'insensitive' } },
                    start || end ? {
                        timestamp: {
                            gte: start,
                            lte: end
                        }
                    } : {},
                    operatorId && operatorId !== 'all' ? {
                        conversation: { line: { operatorId } }
                    } : {}
                ]
            },
            include: {
                conversation: {
                    include: {
                        line: { include: { operator: true } }
                    }
                }
            },
            orderBy: { timestamp: 'desc' },
            take: 50
        });

        // 3. Map to Unified Result Format
        const results = new Map<string, any>();

        // Add conversations first
        conversations.forEach(conv => {
            const lastMsg = conv.messages[0];
            results.set(conv.id, {
                type: 'conversation',
                id: conv.id,
                contactName: conv.contactName || conv.remoteJid,
                remoteJid: conv.remoteJid,
                lineId: conv.lineId,
                operatorName: conv.line.operator?.name || 'Sem operador',
                snippet: lastMsg?.content || 'Sem mensagens recent',
                timestamp: conv.updatedAt, // or lastMsg timestamp
                matchType: 'contact'
            });
        });

        // Add message matches (overwrite if better or just add)
        messages.forEach(msg => {
            if (!results.has(msg.conversationId)) {
                results.set(msg.conversationId, {
                    type: 'message',
                    id: msg.conversationId, // We link to conversation
                    contactName: msg.conversation.contactName || msg.conversation.remoteJid,
                    remoteJid: msg.conversation.remoteJid,
                    lineId: msg.conversation.lineId,
                    operatorName: msg.conversation.line.operator?.name || 'Sem operador',
                    snippet: msg.content, // Show the matching message
                    timestamp: msg.timestamp,
                    matchType: 'content'
                });
            }
        });

        return Array.from(results.values());
    }
}
