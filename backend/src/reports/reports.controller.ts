import { Controller, Get } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('messages-by-line')
    getMessagesByLine() {
        return this.reportsService.getMessagesByLine();
    }

    @Get('messages-by-operator')
    getMessagesByOperator() {
        return this.reportsService.getMessagesByOperator();
    }

    @Get('lines-status')
    getLinesStatus() {
        return this.reportsService.getLinesStatus();
    }
}
