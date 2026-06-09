import nodemailer from 'nodemailer';
import sendgrid from '@sendgrid/mail';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

/**
 * Utility functions for sending emails
 */
export const emailUtils = {
  /**
   * Send an email using configured email service
   * @param options Email options (to, subject, body, etc.)
   * @returns Send result
   */
  async sendEmail(options: {
    to: string;
    subject: string;
    body: string;
    cc?: string[];
    bcc?: string[];
    replyTo?: string;
    attachments?: Array<{
      filename: string;
      content: string | Buffer;
      contentType?: string;
    }>;
  }): Promise<any> {
    try {
      // Determine which email service to use based on configuration
      const emailService = process.env.EMAIL_SERVICE || 'smtp'; // smtp, sendgrid, gmail

      let result;

      switch (emailService.toLowerCase()) {
        case 'sendgrid':
          result = await this.sendViaSendGrid(options);
          break;
        case 'gmail':
          result = await this.sendViaGmail(options);
          break;
        case 'smtp':
        default:
          result = await this.sendViaSMTP(options);
          break;
      }

      return result;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  },

  /**
   * Send email via SMTP
   */
  private async sendViaSMTP(options: {
    to: string;
    subject: string;
    body: string;
    cc?: string[];
    bcc?: string[];
    replyTo?: string;
    attachments?: Array<{
      filename: string;
      content: string | Buffer;
      contentType?: string;
    }>;
  }): Promise<any> {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    });

    // Prepare mail options
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@realestateagent.com',
      to: options.to,
      subject: options.subject,
      html: options.body,
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo,
      attachments: options.attachments
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    return {
      messageId: info.messageId,
      envelope: info.envelope,
      accepted: info.accepted,
      rejected: info.rejected
    };
  },

  /**
   * Send email via SendGrid
   */
  private async sendViaSendGrid(options: {
    to: string;
    subject: string;
    body: string;
    cc?: string[];
    bcc?: string[];
    replyTo?: string;
    attachments?: Array<{
      filename: string;
      content: string | Buffer;
      contentType?: string;
    }>;
  }): Promise<any> {
    // Set SendGrid API key
    sendgrid.setApiKey(process.env.SENDGRID_API_KEY || '');

    // Prepare email
    const email = {
      to: options.to,
      from: process.env.EMAIL_FROM || 'noreply@realestateagent.com',
      subject: options.subject,
      html: options.body,
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo
    };

    // Add attachments if provided
    if (options.attachments && options.attachments.length > 0) {
      email.attachments = options.attachments.map(att => ({
        content: Buffer.isBuffer(att.content) ? att.content.toString('base64') : Buffer.from(att.content).toString('base64'),
        filename: att.filename,
        type: att.contentType || 'application/octet-stream',
        disposition: 'attachment'
      }));
    }

    // Send email
    const [response] = await sendgrid.send(email);
    return {
      messageId: response.headers['x-message-id'],
      statusCode: response.statusCode,
      headers: response.headers
    };
  },

  /**
   * Send email via Gmail API
   */
  private async sendViaGmail(options: {
    to: string;
    subject: string;
    body: string;
    cc?: string[];
    bcc?: string[];
    replyTo?: string;
    attachments?: Array<{
      filename: string;
      content: string | Buffer;
      contentType?: string;
    }>;
  }): Promise<any> {
    // This would require OAuth2 setup - simplified version
    // In reality, you'd need to handle token refresh, etc.
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );

    // Set credentials (would typically come from secure storage)
    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN
    });

    const accessToken = await oauth2Client.getAccessToken();

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Create email message
    const emailParts = [
      `To: ${options.to}`,
      options.cc ? `Cc: ${options.cc.join(',')}` : '',
      options.bcc ? `Bcc: ${options.bcc.join(',')}` : '',
      options.replyTo ? `Reply-To: ${options.replyTo}` : '',
      'Subject: ' + options.subject,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      '',
      options.body
    ].filter(part => part.trim() !== '').join('\r\n');

    // Encode to base64url
    const encodedEmail = Buffer.from(emailParts).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send email
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    });

    return {
      messageId: res.data.id,
      threadId: res.data.threadId,
      labelIds: res.data.labelIds
    };
  },

  /**
   * Verify email configuration
   */
  async verifyConfiguration(): Promise<{ valid: boolean; service: string; message: string }> {
    try {
      const emailService = process.env.EMAIL_SERVICE || 'smtp';

      // Try to send a test email to ourselves
      const testOptions = {
        to: process.env.EMAIL_FROM || 'test@example.com',
        subject: 'Email Configuration Test',
        body: '<p>This is a test email to verify email configuration.</p>'
      };

      await this.sendEmail(testOptions);

      return {
        valid: true,
        service: emailService,
        message: 'Email configuration is valid and working'
      };
    } catch (error) {
      return {
        valid: false,
        service: process.env.EMAIL_SERVICE || 'unknown',
        message: `Email configuration error: ${error.message}`
      };
    }
  }
};