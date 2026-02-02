import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class WebhooksService {
    private readonly logger = new Logger(WebhooksService.name);

    constructor(@InjectQueue('webhooks') private webhooksQueue: Queue) { }

    async handleWebhook(payload: any) {
        // 1. Basic validation (can be expanded)
        if (!payload) return;

        // 2. Add to Queue for processing
        await this.webhooksQueue.add('process-webhook', payload, {
            removeOnComplete: true,
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
        });

        this.logger.log(`Webhook queued: ${payload?.event || 'unknown'}`);
        return { success: true };
    }
}
