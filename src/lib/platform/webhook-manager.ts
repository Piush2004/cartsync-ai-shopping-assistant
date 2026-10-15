import * as crypto from 'crypto';
import { SecretManager } from './secret-manager';

export class WebhookManager {
  constructor(private secretManager: SecretManager) {}

  /**
   * Dispatches an event (e.g. from CommerceEventBus) to subscribed external retailers.
   * Cryptographically signs the payload so the retailer knows it came from CartSync.
   */
  public async dispatchWebhook(tenantId: string, eventType: string, payload: any) {
    // 1. Fetch the tenant's webhook secret securely
    const secret = await this.secretManager.getRetailerSecret(tenantId, 'webhook_signing_key');
    const endpoint = `https://api.partner.com/webhooks/cartsync`; // Mock DB lookup

    // 2. Sign payload
    const signature = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');

    // 3. Dispatch (Mock)
    console.log(`[WebhookManager] Dispatched ${eventType} to ${endpoint} with signature ${signature}`);
  }
}
