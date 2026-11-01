import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY || '';
const defaultFromEmail = process.env.RESEND_FROM_EMAIL || 'MAXLINE LOGISTICS <support@maxlinelogistics.com>';

export const resend = new Resend(resendApiKey);

export class EmailService {
  /**
   * Send a branded welcome email to a newly registered seller
   */
  static async sendWelcomeEmail(toEmail: string, sellerName: string, businessName: string) {
    try {
      const data = await resend.emails.send({
        from: defaultFromEmail,
        to: [toEmail],
        subject: `Welcome to MAXLINE LOGISTICS, ${sellerName}!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #0f172a; margin: 0; font-size: 24px; font-weight: 800;">MAXLINE <span style="color: #2563eb;">LOGISTICS</span></h1>
              <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Next-Gen Multi-Carrier Freight & Logistics SaaS</p>
            </div>
            <div style="padding: 20px; background-color: #f8fafc; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #1e293b; font-size: 18px; margin-top: 0;">Welcome aboard, ${sellerName}! 👋</h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                Your merchant account for <strong>${businessName || 'Your Business'}</strong> is now registered on MAXLINE LOGISTICS.
                You can now log in, compare live B2B/B2C freight rates, automate doorstep pickups across 29,000+ pincodes, and manage your shipments in real-time.
              </p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="https://www.maxlinelogistics.com/login" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
                  Sign In To Seller Portal →
                </a>
              </div>
            </div>
            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px;">
              © 2026 MAXLINE LOGISTICS PVT LTD. All rights reserved.<br>
              Need assistance? Email us at <a href="mailto:support@maxlinelogistics.com" style="color: #2563eb;">support@maxlinelogistics.com</a>
            </p>
          </div>
        `
      });
      return { success: true, id: data.data?.id };
    } catch (err: any) {
      console.error('[EmailService] Error sending welcome email:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Send KYC Status Update email
   */
  static async sendKycStatusEmail(toEmail: string, sellerName: string, status: 'APPROVED' | 'REJECTED', reason?: string) {
    const isApproved = status === 'APPROVED';
    try {
      const data = await resend.emails.send({
        from: defaultFromEmail,
        to: [toEmail],
        subject: `MAXLINE Merchant KYC: Application ${isApproved ? 'Approved 🎉' : 'Needs Review'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #0f172a; margin: 0; font-size: 24px; font-weight: 800;">MAXLINE <span style="color: #2563eb;">LOGISTICS</span></h1>
            </div>
            <div style="padding: 20px; background-color: ${isApproved ? '#f0fdf4' : '#fff1f2'}; border-radius: 8px; margin-bottom: 20px; border: 1px solid ${isApproved ? '#bbf7d0' : '#fecdd3'};">
              <h2 style="color: ${isApproved ? '#166534' : '#9f1239'}; font-size: 18px; margin-top: 0;">
                ${isApproved ? '🎉 KYC Verification Approved!' : '⚠️ KYC Documents Action Required'}
              </h2>
              <p style="color: #334155; font-size: 14px; line-height: 1.6;">
                Dear ${sellerName},<br>
                ${isApproved 
                  ? 'Congratulations! Your merchant KYC verification and business documents have been successfully verified and approved by our onboarding operations team. You now have full access to book shipments across all partner courier networks.' 
                  : `Your KYC documents require correction: ${reason || 'Please review your uploaded documents and re-upload clear government-issued IDs.'}`
                }
              </p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="https://www.maxlinelogistics.com/app" style="background-color: ${isApproved ? '#16a34a' : '#e11d48'}; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
                  ${isApproved ? 'Go To Dashboard →' : 'Update KYC Documents →'}
                </a>
              </div>
            </div>
          </div>
        `
      });
      return { success: true, id: data.data?.id };
    } catch (err: any) {
      console.error('[EmailService] Error sending KYC email:', err.message);
      return { success: false, error: err.message };
    }
  }
}
