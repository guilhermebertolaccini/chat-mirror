import { Controller, Post, Body, Get, Param, NotFoundException } from '@nestjs/common';
import { LinesService } from './lines.service';
import { PrismaService } from '../prisma/prisma.service';

// In a real app, UseGuards(JwtAuthGuard) would be here
@Controller('lines')
export class LinesController {
    constructor(
        private readonly linesService: LinesService,
        private readonly prisma: PrismaService
    ) { }

    @Post()
    async createLine(@Body() body: { operatorId: string; instanceName: string }) {
        return this.linesService.createLine(body.operatorId, body.instanceName);
    }

    @Get(':id')
    async getLine(@Param('id') id: string) {
        const line = await this.prisma.line.findUnique({
            where: { id },
            include: {
                operator: true
            }
        });

        if (!line) throw new NotFoundException('Line not found');

        return line;
    }

    @Get(':id/qrcode')
    async getQrCode(@Param('id') id: string) {
        const line = await this.prisma.line.findUnique({ where: { id } });
        if (!line) throw new NotFoundException('Line not found');

        // If instanceName matches "user-ID", we can use it.
        // Assuming we stored it correctly.
        return this.linesService.getQrCode(line.instanceName);
    }
    @Post(':id/sync')
    async syncLine(@Param('id') id: string) {
        const line = await this.prisma.line.findUnique({ where: { id } });
        if (!line) throw new NotFoundException('Line not found');

        return this.linesService.syncInstance(line.instanceName);
    }
    @Post('sync-all')
    async syncAll() {
        return this.linesService.syncAllLines();
    }
}
