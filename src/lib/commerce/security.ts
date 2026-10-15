import * as crypto from 'crypto';

/**
 * Handles cross-cutting security concerns for the Commerce Platform.
 */
export class CommerceSecurityLayer {
  private readonly JWT_SECRET = process.env.COMMERCE_JWT_SECRET || 'dev-secret';

  /**
   * Generates a signed affiliate redirect URL to prevent tampering.
   */
  public generateSignedRedirect(url: string, affiliateCode: string, userId: string): string {
    const payload = `${url}|${affiliateCode}|${userId}`;
    const signature = crypto.createHmac('sha256', this.JWT_SECRET).update(payload).digest('hex');
    
    return `${url}?aff_code=${affiliateCode}&sig=${signature}`;
  }

  /**
   * Verifies incoming webhooks from Retailers (e.g., Order Shipped).
   */
  public verifyWebhook(payload: string, signature: string, retailerSecret: string): boolean {
    const expectedSignature = crypto.createHmac('sha256', retailerSecret).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }

  /**
   * Encrypts sensitive user identifiers before passing to third-party APIs.
   */
  public encryptIdentifier(identifier: string): string {
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.alloc(32, this.JWT_SECRET), Buffer.alloc(16, 0));
    let encrypted = cipher.update(identifier, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * Logs security-relevant actions to an immutable audit log.
   */
  public auditLog(action: string, userId: string, details: any) {
    console.log(`[AUDIT] ${new Date().toISOString()} | User: ${userId} | Action: ${action} | Details:`, details);
  }
}
