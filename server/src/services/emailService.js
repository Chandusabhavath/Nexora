import nodemailer from 'nodemailer';

/**
 * NEXORA Transactional Email Service
 * Handles delivery of OTP verification codes, notifications, and receipts.
 */

// Configure SMTP transport from environment variables or create simulated transport
const createEmailTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    });
  }

  return null;
};

/**
 * Render responsive HTML email template for 6-digit verification code
 */
const renderOTPEmailTemplate = (otpCode, expiresInMinutes = 5) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your NEXORA Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAF8; color: #1F2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAF8; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #E5E7EB; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
          
          <!-- Brand Header -->
          <tr>
            <td style="background-color: #0F382C; padding: 32px 40px; text-align: center;">
              <table role="presentation" align="center" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color: #FFFFFF; border-radius: 12px; width: 44px; height: 44px; text-align: center; font-size: 24px; font-weight: 900; color: #0F382C; line-height: 44px;">
                    N
                  </td>
                  <td style="padding-left: 14px; text-align: left;">
                    <div style="font-size: 22px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">NEXORA</div>
                    <div style="font-size: 10px; font-weight: 700; color: #86EFAC; text-transform: uppercase; letter-spacing: 1.5px;">Hyperlocal Marketplace</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 40px 40px 32px 40px;">
              <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; color: #111827; text-align: center;">
                Verify Your Email Address
              </h1>
              <p style="margin: 0 0 28px 0; font-size: 14px; line-height: 22px; color: #4B5563; text-align: center;">
                Please use the 6-digit one-time password below to authenticate into your NEXORA account.
              </p>

              <!-- OTP Code Display Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center" style="background-color: #F0FDF4; border: 2px dashed #0F382C; border-radius: 16px; padding: 24px 20px;">
                    <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #0F382C; margin-bottom: 8px;">
                      Verification Code
                    </div>
                    <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #0F382C; margin-left: 10px;">
                      ${otpCode}
                    </div>
                    <div style="font-size: 11px; font-weight: 600; color: #059669; margin-top: 10px;">
                      Valid for ${expiresInMinutes} minutes
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <div style="background-color: #F9FAFB; border-radius: 12px; padding: 14px 16px; border: 1px solid #F3F4F6; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 12px; line-height: 18px; color: #6B7280;">
                  <strong style="color: #374151;">Security Reminder:</strong> NEXORA will never ask you for this code over the phone or message. If you did not request this login code, you can safely disregard this email.
                </p>
              </div>

              <p style="margin: 0; font-size: 12px; color: #9CA3AF; text-align: center;">
                Need help? Contact support at <a href="mailto:support@nexora.com" style="color: #0F382C; text-decoration: underline;">support@nexora.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAF8; padding: 20px 40px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0; font-size: 11px; color: #9CA3AF; line-height: 16px;">
                &copy; ${new Date().getFullYear()} NEXORA Hyperlocal Platform. All rights reserved.<br>
                Mumbai &bull; Bangalore &bull; Delhi NCR &bull; Hyderabad
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

/**
 * Send Transactional Email containing plain 6-digit OTP code
 * @param {Object} params
 * @param {string} params.email - Recipient email address
 * @param {string} params.otpCode - Plain 6-digit verification code
 * @param {number} [params.expiresInMinutes=5] - Expiration duration in minutes
 * @returns {Promise<{success: boolean, messageId?: string, simulated?: boolean}>}
 */
export const sendOTPEmail = async ({ email, otpCode, expiresInMinutes = 5 }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const fromAddress = process.env.EMAIL_FROM || '"NEXORA Security" <auth@nexora.com>';
  const subject = `${otpCode} is your NEXORA verification code`;
  const htmlContent = renderOTPEmailTemplate(otpCode, expiresInMinutes);
  const textContent = `Your NEXORA verification code is: ${otpCode}. This code is valid for ${expiresInMinutes} minutes. Never share this code with anyone.`;

  const transporter = createEmailTransporter();

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: fromAddress,
        to: normalizedEmail,
        subject,
        text: textContent,
        html: htmlContent,
      });

      console.log(`[EmailService] OTP email dispatched to ${normalizedEmail} (MessageId: ${info.messageId})`);
      return { success: true, messageId: info.messageId, simulated: false };
    } catch (err) {
      console.error(`[EmailService] SMTP delivery failed for ${normalizedEmail}:`, err.message);
      // Fallback to simulated delivery in case SMTP server is temporarily unreachable
    }
  }

  // Simulated email delivery fallback (for local dev, testing, or before SMTP credentials are configured)
  console.log(`\n======================================================`);
  console.log(`[EmailService/Simulated] Transactional OTP Email Sent`);
  console.log(`To: ${normalizedEmail}`);
  console.log(`Subject: ${subject}`);
  console.log(`6-Digit Verification Code: [ ${otpCode} ]`);
  console.log(`Expires in: ${expiresInMinutes} minutes`);
  console.log(`======================================================\n`);

  return {
    success: true,
    messageId: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    simulated: true,
  };
};

export default {
  sendOTPEmail,
};
