import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
    constructor(private prisma: PrismaService) { }

    async getMessagesByLine() {
        // Aggregate messages grouped by line
        // Since Prisma doesn't support deep relation grouping easily in one go with relations,
        // we might need to query lines and then aggregate messages, or use raw query.
        // For simplicity and safety (Prisma), let's fetch lines and aggregate.
        // Or efficiently: fetch counting.

        // Approach: Fetch all lines, and for each, counts of sent/received.
        // Ideally we want: Line Name | Sent | Received | Total

        const lines = await this.prisma.line.findMany({
            include: {
                conversations: {
                    select: {
                        messages: {
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

    async getMessagesByOperator() {
        // Group by Operator
        const operators = await this.prisma.user.findMany({
            where: { role: 'operador' },
            include: {
                lines: {
                    include: {
                        conversations: {
                            select: {
                                messages: {
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
}
