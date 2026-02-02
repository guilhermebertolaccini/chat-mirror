import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('dashboard')
export class DashboardController {
    constructor(private readonly prisma: PrismaService) { }

    @Get('metrics')
    async getMetrics() {
        const [totalOperators, operatorsOnline, activeLines, totalMessages] = await Promise.all([
            this.prisma.user.count({ where: { role: 'operador' } }),
            // Logic for online operators would ideally check line status
            this.prisma.line.count({ where: { status: 'connected' } }),
            this.prisma.line.count({ where: { status: 'connected' } }),
            this.prisma.message.count(),
        ]);

        return {
            totalOperators,
            operatorsOnline, // Simplified: Assuming online = has connected line
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
