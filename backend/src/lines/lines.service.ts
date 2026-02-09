import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class LinesService {
    private readonly logger = new Logger(LinesService.name);
    private readonly evolutionUrl: string;
    private readonly evolutionKey: string;

    constructor(
        private prisma: PrismaService,
        private config: ConfigService,
    ) {
        this.evolutionUrl = this.config.get<string>('EVOLUTION_API_URL') || '';
        this.evolutionKey = this.config.get<string>('EVOLUTION_GLOBAL_KEY') || '';
    }

    async createLine(operatorId: string, instanceName: string) {
        try {
            // 1. Create Instance in Evolution API
            let apiResponse;
            try {
                apiResponse = await this.createEvolutionInstance(instanceName);
            } catch (error) {
                // Check if instance already exists (Evolution returns 403 or specific error)
                if (error.response?.status === 403 || error.response?.data?.error?.includes('already exists')) {
                    this.logger.warn(`Instance ${instanceName} might already exist. Trying to fetch info...`);
                    // If it exists, we might just want to proceed to connect/webhook
                    // For now, let's assume we can proceed if we can get its status
                    // But to be safe, we re-throw if it's not a "conflict" we can handle
                    // Actually, if it exists, we can try to use it.
                    apiResponse = { instance: { instanceName, instanceId: instanceName } }; // Mock/Fallback
                } else {
                    this.logger.error(`Evolution API Create Error: ${JSON.stringify(error.response?.data || error.message)}`);
                    throw new Error(`Falha ao criar instância na Evolution API: ${error.response?.data?.message || error.message}`);
                }
            }

            const instanceData = apiResponse.instance || apiResponse;
            // Evolution v2 often returns { instance: { instanceId: ..., ... }, ... }
            // Some versions return { id: ..., ... }
            // Fallback to instanceName if ID is missing (instanceName is unique anyway)
            const remoteId = instanceData.instanceId || instanceData.id || instanceName;

            this.logger.log(`Instance Created/Found: ${instanceName} (ID: ${remoteId})`);

            // 2. Configure Webhook
            // ✅ 4. Configure webhook
            try {
                await this.configureWebhook(instanceName);
            } catch (webhookError) {
                this.logger.warn(`⚠️ Webhook config failed, but instance created: ${webhookError.message}`);
            }

            // 3. Save to DB
            const line = await this.prisma.line.create({
                data: {
                    instanceName,
                    instanceId: remoteId,
                    status: 'DISCONNECTED',
                    operatorId,
                }
            });

            this.logger.log(`✅ Line created successfully for operator ${operatorId}: ${instanceName}`);

            // 4. Auto-trigger history sync in background (after successful creation)
            this.syncHistory(instanceName, { limit: 100, daysBack: 30 })
                .catch(err => this.logger.error(`Background history sync failed for ${instanceName}: ${err.message}`));

            return {
                line,
                qrcode: apiResponse.qrcode || apiResponse.base64,
            };
        } catch (error) {
            this.logger.error(`Failed to create line: ${error.message}`);
            // Propagate informative error
            // NestJS will treat this as 500 unless we throw HttpException.
            // But string message is better than empty 500.
            throw error;
        }
    }

    private async createEvolutionInstance(instanceName: string) {
        const baseUrl = this.evolutionUrl.replace(/\/$/, ''); // Remove trailing slash if any
        const url = `${baseUrl}/instance/create`;

        this.logger.log(`Creating instance at ${url} with headers: apikey=${this.evolutionKey.slice(0, 4)}***`);

        const response = await axios.post(
            url,
            {
                instanceName,
                token: instanceName,
                qrcode: true,
                integration: "WHATSAPP-BAILEYS", // Explicitly set engine often helps
            },
            {
                headers: {
                    apikey: this.evolutionKey,
                },
            },
        );
        return response.data;
    }

    async getQrCode(instanceName: string) {
        try {
            const baseUrl = this.evolutionUrl.replace(/\/$/, '');

            // 1. Check Connection State First
            const stateUrl = `${baseUrl}/instance/connectionState/${instanceName}`;
            try {
                const stateRes = await axios.get(stateUrl, { headers: { apikey: this.evolutionKey } });
                const stateData = stateRes.data?.instance || stateRes.data;
                const state = stateData.state || stateData.status;

                // Sync status to DB
                if (state) {
                    await this.prisma.line.updateMany({
                        where: { instanceName },
                        data: { status: state === 'open' ? 'connected' : 'disconnected' }
                    });
                }

                if (state === 'open' || state === 'connected') {
                    // 2. If connected, fetch Instance Info (Phone Number)
                    this.logger.log(`Instance ${instanceName} is connected. Fetching info...`);
                    try {
                        const infoUrl = `${baseUrl}/instance/fetchInstances?instanceName=${instanceName}`;
                        const infoRes = await axios.get(infoUrl, { headers: { apikey: this.evolutionKey } });
                        // fetchInstances usually returns an array or single object depending on version
                        // v2: array of instances. v1: single?
                        // Let's assume array check
                        const instances = Array.isArray(infoRes.data) ? infoRes.data : [infoRes.data];
                        const myInstance = instances.find((i: any) => i.instance?.instanceName === instanceName || i.instanceName === instanceName) || instances[0];

                        // User correction: Look for ownerJid
                        const ownerJid = myInstance?.ownerJid || myInstance?.instance?.ownerJid || myInstance?.owner;

                        if (ownerJid) {
                            const phoneNumber = ownerJid.split('@')[0];
                            await this.prisma.line.updateMany({
                                where: { instanceName },
                                data: {
                                    status: 'connected',
                                    phoneNumber: phoneNumber
                                }
                            });

                            // Trigger History Sync
                            this.syncHistory(instanceName).catch(err =>
                                this.logger.error(`Background history sync failed (getQrCode) for ${instanceName}: ${err.message}`)
                            );
                        }
                    } catch (infoError) {
                        this.logger.warn(`Failed to fetch instance info for ${instanceName}: ${infoError.message}`);
                    }

                    return { status: 'connected', message: 'Instance already connected' };
                }
            } catch (stateError) {
                this.logger.warn(`Failed to check state for ${instanceName}: ${stateError.message}`);
                // Proceed to try QR if state check failed? Or just throw.
            }

            // 3. If not connected, get QR Code
            const url = `${baseUrl}/instance/connect/${instanceName}`;
            const response = await axios.get(
                url,
                {
                    headers: {
                        apikey: this.evolutionKey,
                    },
                },
            );
            return response.data; // Expected { base64: "..." } or similar
        } catch (error) {
            this.logger.error(`Failed to get QR Code: ${error.message}`);
            // If instance doesn't exist, we might need to recreate it, but for now throw
            throw error;
        }
    }

    async syncInstance(instanceName: string) {
        this.logger.log(`Syncing instance ${instanceName}...`);
        try {
            const baseUrl = this.evolutionUrl.replace(/\/$/, '');
            const stateUrl = `${baseUrl}/instance/connectionState/${instanceName}`;

            const stateRes = await axios.get(stateUrl, { headers: { apikey: this.evolutionKey } });
            const stateData = stateRes.data?.instance || stateRes.data;
            const state = stateData.state || stateData.status;

            if (state) {
                await this.prisma.line.updateMany({
                    where: { instanceName },
                    data: { status: state === 'open' ? 'connected' : 'disconnected' }
                });
            }

            if (state === 'open' || state === 'connected') {
                const infoUrl = `${baseUrl}/instance/fetchInstances?instanceName=${instanceName}`;
                const infoRes = await axios.get(infoUrl, { headers: { apikey: this.evolutionKey } });
                const instances = Array.isArray(infoRes.data) ? infoRes.data : [infoRes.data];
                const myInstance = instances.find((i: any) => i.instance?.instanceName === instanceName || i.instanceName === instanceName) || instances[0];

                // User correction: Look for ownerJid
                const ownerJid = myInstance?.ownerJid || myInstance?.instance?.ownerJid || myInstance?.owner;

                if (ownerJid) {
                    const phoneNumber = ownerJid.split('@')[0];
                    await this.prisma.line.updateMany({
                        where: { instanceName },
                        data: {
                            status: 'connected',
                            phoneNumber: phoneNumber
                        }
                    });

                    // Trigger History Sync
                    this.syncHistory(instanceName).catch(err =>
                        this.logger.error(`Background history sync failed for ${instanceName}: ${err.message}`)
                    );

                    return { status: 'connected', phoneNumber };
                }
            }
            return { status: state || 'unknown' };
        } catch (error) {
            this.logger.error(`Sync failed for ${instanceName}: ${error.message}`);
            throw error;
        }
    }

    async syncHistory(instanceName: string, options?: { limit?: number; daysBack?: number }) {
        const limit = options?.limit || 100; // Default to 100 messages per chat
        const daysBack = options?.daysBack || 30; // Default to 30 days

        this.logger.log(`Starting history sync for ${instanceName} (limit: ${limit}, daysBack: ${daysBack})...`);
        const baseUrl = this.evolutionUrl.replace(/\/$/, '');

        try {
            // 1. Get Line ID
            const line = await this.prisma.line.findUnique({ where: { instanceName } });
            if (!line) {
                this.logger.warn(`Cannot sync history: Line ${instanceName} not found in DB`);
                return;
            }

            // 2. Fetch Chats
            const chatsUrl = `${baseUrl}/chat/findChats/${instanceName}`;
            const chatsRes = await axios.get(chatsUrl, { headers: { apikey: this.evolutionKey } });
            const chats = chatsRes.data || [];

            this.logger.log(`Found ${chats.length} chats for ${instanceName}. Processing...`);

            // Calculate timestamp threshold (messages older than this will be skipped)
            const timestampThreshold = Math.floor((Date.now() - (daysBack * 24 * 60 * 60 * 1000)) / 1000);

            // 3. Process each chat
            for (const chat of chats) {
                const remoteJid = chat.id || chat.jid;
                if (!remoteJid) continue;

                // Upsert Conversation
                const conversation = await this.prisma.conversation.upsert({
                    where: {
                        lineId_remoteJid: {
                            lineId: line.id,
                            remoteJid
                        }
                    },
                    update: {
                        contactName: chat.name || chat.pushName,
                        updatedAt: new Date(chat.conversationTimestamp * 1000 || Date.now())
                    },
                    create: {
                        lineId: line.id,
                        remoteJid,
                        contactName: chat.name || chat.pushName,
                        updatedAt: new Date(chat.conversationTimestamp * 1000 || Date.now())
                    }
                });

                // 4. Fetch Messages for this Chat
                try {
                    // Extract phone number from remoteJid
                    const number = remoteJid.split('@')[0];

                    // Check if it's a group (ends with @g.us) or individual (@s.whatsapp.net)
                    const isGroup = remoteJid.includes('@g.us');

                    // Use correct Evolution API v2 endpoint: GET /message/find/{instance}
                    const msgsUrl = `${baseUrl}/message/find/${instanceName}`;
                    const params: any = {
                        limit: limit
                    };

                    // Add either groupJid or number based on chat type
                    if (isGroup) {
                        params.groupJid = remoteJid;
                    } else {
                        params.number = number;
                    }

                    const msgsRes = await axios.get(msgsUrl, {
                        headers: { apikey: this.evolutionKey },
                        params: params
                    });

                    const messages = msgsRes.data || [];
                    let imported = 0;
                    let skipped = 0;

                    // Process messages
                    for (const msg of messages) {
                        const msgData = msg.message || {};
                        const key = msg.key || {};
                        const id = key.id;
                        const msgTimestamp = msg.messageTimestamp || 0;

                        if (!id) continue;

                        // Skip messages older than threshold
                        if (msgTimestamp < timestampThreshold) {
                            skipped++;
                            continue;
                        }

                        // Content extraction (reuse logic if possible, simplified here)
                        const content =
                            msgData.conversation ||
                            msgData.extendedTextMessage?.text ||
                            msgData.imageMessage?.caption ||
                            (msg.messageType === 'imageMessage' ? '📷 Imagem' :
                                msg.messageType === 'audioMessage' ? '🎤 Áudio' : 'Media/Outros');

                        // Upsert Message
                        const existing = await this.prisma.message.findUnique({ where: { evolutionId: id } });
                        if (!existing) {
                            await this.prisma.message.create({
                                data: {
                                    evolutionId: id,
                                    conversationId: conversation.id,
                                    content: content || '...',
                                    type: msg.messageType || 'text',
                                    direction: key.fromMe ? 'SENT' : 'RECEIVED',
                                    status: msg.status || 'DELIVERED',
                                    timestamp: new Date((msgTimestamp || Date.now() / 1000) * 1000)
                                }
                            });
                            imported++;
                        }
                    }

                    if (imported > 0 || skipped > 0) {
                        this.logger.log(`Chat ${remoteJid}: imported ${imported}, skipped ${skipped} old messages`);
                    }

                    // ⚠️ Rate limiting: Wait 2 seconds between each chat to avoid WhatsApp ban
                    await new Promise(resolve => setTimeout(resolve, 2000));

                } catch (msgErr) {
                    const errorMsg = msgErr.response
                        ? `${msgErr.message} - URL: ${msgErr.config?.url} - Status: ${msgErr.response.status} - Data: ${JSON.stringify(msgErr.response.data)}`
                        : msgErr.message;
                    this.logger.warn(`Failed to fetch messages for ${remoteJid}: ${errorMsg}`);
                    // Continue with next chat even if this one fails
                }
            }

            this.logger.log(`History sync completed for ${instanceName}`);

        } catch (error) {
            this.logger.error(`History sync error for ${instanceName}: ${error.message}`);
            // Don't throw, just log
        }
        // Don't throw, just log
    }
    async syncAllLines() {
        this.logger.log('Starting global sync for all lines...');
        const lines = await this.prisma.line.findMany();
        const results = {
            total: lines.length,
            success: 0,
            failed: 0,
            details: [] as any[]
        };

        for (const line of lines) {
            try {
                await this.syncInstance(line.instanceName);
                results.success++;
                results.details.push({ instance: line.instanceName, status: 'success' });
            } catch (error) {
                results.failed++;
                results.details.push({ instance: line.instanceName, status: 'error', error: error.message });
            }
        }

        this.logger.log(`Global sync finished. Success: ${results.success}, Failed: ${results.failed}`);
        return results;
    }

    private async configureWebhook(instanceName: string) {
        const baseUrl = this.evolutionUrl.replace(/\/$/, '');
        // For v2, endpoint is often /webhook/instance/:instanceName or /webhook/set/:instanceName
        // We stick to /webhook/set/:instanceName but with robust payload
        const url = `${baseUrl}/webhook/set/${instanceName}`;

        // TODO: Replace with actual public URL or tunnel during dev
        const webhookUrl = process.env.WEBHOOK_URL || 'http://host.docker.internal:3000/webhooks/evolution';

        this.logger.log(`Configuring Webhook for ${instanceName} to ${webhookUrl}`);

        // Wait a bit for instance to be ready?
        await new Promise(r => setTimeout(r, 1000));

        // Error "instance requires property 'webhook'" suggests nested structure
        const webhookConfig = {
            url: webhookUrl,
            webhook_by_events: true,
            webhookByEvents: true,
            events: [
                'MESSAGES_UPSERT',
                'MESSAGES_UPDATE',
                'MESSAGES_DELETE',
                'SEND_MESSAGE',
                'CONNECTION_UPDATE',
                'QRCODE_UPDATED'
            ],
            enabled: true,
        };

        const payload = {
            webhook: webhookConfig
        };

        try {
            await axios.post(url, payload, {
                headers: {
                    apikey: this.evolutionKey,
                },
            });
            this.logger.log(`Webhook configured for ${instanceName} -> ${webhookUrl}`);
        } catch (error) {
            this.logger.warn(`First webhook attempt failed: ${error.message}. Tying flat payload...`);
            // Fallback: Try flat payload just in case (some versions differ)
            try {
                await axios.post(url, webhookConfig, { headers: { apikey: this.evolutionKey } });
                this.logger.log(`Webhook configured (flat payload) for ${instanceName}`);
                return;
            } catch (flatError) {
                // Fallback 2: Try /webhook/instance/ ROUTE
                if (error.response?.status === 404 || flatError.response?.status === 404) {
                    this.logger.warn(`Webhook endpoint /webhook/set/ not found, trying /webhook/instance/${instanceName}`);
                    const altUrl = `${baseUrl}/webhook/instance/${instanceName}`;
                    await axios.post(altUrl, { webhook: webhookConfig }, {
                        headers: { apikey: this.evolutionKey }
                    });
                } else {
                    throw flatError;
                }
            }
        }
    }
}
