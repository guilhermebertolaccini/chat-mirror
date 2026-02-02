import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
    constructor(private readonly webhooksService: WebhooksService) { }

    @Post('evolution')
    @HttpCode(HttpStatus.OK)
    async handleEvolutionWebhook(@Body() payload: any) {
        // 1. Immediate acknowledgement (Fire & Forget strategy)
        // We don't wait for processing to finish, we just queue it.
        await this.webhooksService.handleWebhook(payload);
        return { status: 'acknowledged' };
    }
}
