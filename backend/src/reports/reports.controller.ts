import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('messages-by-line')
    getMessagesByLine(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ) {
        return this.reportsService.getMessagesByLine(startDate, endDate);
    }

    @Get('messages-by-operator')
    getMessagesByOperator(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ) {
        return this.reportsService.getMessagesByOperator(startDate, endDate);
    }

    @Get('lines-status')
    getLinesStatus() {
        return this.reportsService.getLinesStatus();
    }

    @Get('detailed')
    getDetailedMessages(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ) {
        return this.reportsService.getDetailedMessages(startDate, endDate);
    }
}
