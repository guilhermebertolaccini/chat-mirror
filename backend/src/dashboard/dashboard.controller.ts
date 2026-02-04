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
}
