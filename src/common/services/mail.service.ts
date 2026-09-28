import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { InquiryDocument } from '../../modules/inquiries/schemas/inquiry.schema';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initTransporter();
  }

  private initTransporter() {
    const host = this.configService.get<string>('EMAIL_HOST') || 'smtp.gmail.com';
    const port = Number(this.configService.get<number>('EMAIL_PORT') || 587);
    const user = this.configService.get<string>('EMAIL_USER');
    const pass = this.configService.get<string>('EMAIL_PASS');
    const secure = this.configService.get<string>('EMAIL_SECURE') === 'true' || port === 465;

    if (!user || !pass) {
      this.logger.warn('EMAIL_USER or EMAIL_PASS not set in environment. Outgoing emails will be logged instead.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
      });
      this.logger.log(`Nodemailer transporter initialized with ${host}:${port} (${user})`);
    } catch (err) {
      this.logger.error('Failed to initialize nodemailer transporter:', err);
    }
  }

  async sendNewInquiryNotification(inquiry: InquiryDocument | any): Promise<boolean> {
    const receiverEmail =
      this.configService.get<string>('CONTACT_RECEIVER_EMAIL') ||
      this.configService.get<string>('ADMIN_EMAIL') ||
      'Contact@Supporthelp.online';

    const fromEmail =
      this.configService.get<string>('MAIL_FROM') ||
      this.configService.get<string>('EMAIL_USER') ||
      'support@supporthelp.online';

    const subject = `🔔 New Inquiry Received: ${inquiry.fullName || 'Lead'} (${inquiry.service || inquiry.softwarePreference || 'General'})`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #368b82 0%, #203f99 100%); color: #ffffff; padding: 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
          .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
          .content { padding: 28px 24px; }
          .info-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          .info-table td { padding: 12px 10px; border-bottom: 1px solid #edf2f7; font-size: 14px; }
          .info-table td.label { font-weight: 600; color: #4a5568; width: 38%; }
          .info-table td.val { color: #1a202c; }
          .message-box { background: #f8fafc; border-left: 4px solid #368b82; padding: 15px; border-radius: 4px; margin-top: 20px; }
          .message-box h4 { margin: 0 0 8px; font-size: 13px; color: #368b82; text-transform: uppercase; letter-spacing: 0.5px; }
          .message-box p { margin: 0; color: #2d3748; line-height: 1.6; font-size: 14px; white-space: pre-wrap; }
          .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #718096; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Support Help - New Inquiry</h1>
            <p>A new potential client has submitted a request on your website</p>
          </div>
          <div class="content">
            <table class="info-table">
              <tr>
                <td class="label">Full Name</td>
                <td class="val"><strong>${inquiry.fullName || 'N/A'}</strong></td>
              </tr>
              <tr>
                <td class="label">Email Address</td>
                <td class="val"><a href="mailto:${inquiry.email}" style="color: #368b82; text-decoration: none;">${inquiry.email}</a></td>
              </tr>
              <tr>
                <td class="label">Phone / Contact</td>
                <td class="val"><a href="tel:${inquiry.phone || ''}" style="color: #1a202c; text-decoration: none;">${inquiry.phone || 'Not provided'}</a></td>
              </tr>
              <tr>
                <td class="label">Company Name</td>
                <td class="val">${inquiry.company || 'Not provided'}</td>
              </tr>
              <tr>
                <td class="label">Service Required</td>
                <td class="val"><strong>${inquiry.service || 'General Inquiry'}</strong></td>
              </tr>
              <tr>
                <td class="label">Software Preference</td>
                <td class="val">${inquiry.softwarePreference || 'Not specified'}</td>
              </tr>
              <tr>
                <td class="label">Source Page</td>
                <td class="val"><code>${inquiry.sourcePage || '/contact-us'}</code></td>
              </tr>
              <tr>
                <td class="label">Date & Time</td>
                <td class="val">${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} IST</td>
              </tr>
            </table>

            <div class="message-box">
              <h4>Client Message / Description</h4>
              <p>${inquiry.message || 'No description provided.'}</p>
            </div>
          </div>
          <div class="footer">
            Support Help Portal &copy; ${new Date().getFullYear()} • Secure Lead Delivery
          </div>
        </div>
      </body>
    </html>
    `;

    if (!this.transporter) {
      this.logger.log(`[SIMULATED EMAIL] To: ${receiverEmail} | Subject: ${subject}`);
      return true;
    }

    try {
      await this.transporter.sendMail({
        from: `"Support Help Leads" <${fromEmail}>`,
        to: receiverEmail,
        replyTo: inquiry.email,
        subject,
        html: htmlContent,
      });
      this.logger.log(`Lead notification email sent successfully to ${receiverEmail}`);

      // Send polite confirmation email to client if valid email
      if (inquiry.email && inquiry.email.includes('@')) {
        this.sendClientAcknowledgment(inquiry, fromEmail).catch((err) => {
          this.logger.warn(`Could not send client acknowledgment: ${err.message}`);
        });
      }

      return true;
    } catch (err: any) {
      this.logger.error(`Error sending email to ${receiverEmail}: ${err.message}`, err.stack);
      return false;
    }
  }

  private async sendClientAcknowledgment(inquiry: any, fromEmail: string) {
    if (!this.transporter) return;

    const subject = `We have received your inquiry – Support Help`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #368b82; margin-top: 0;">Hello ${inquiry.fullName || 'Valued Client'},</h2>
        <p style="color: #4a5568; line-height: 1.6;">
          Thank you for reaching out to <strong>Support Help</strong>. We have received your inquiry regarding <strong>${inquiry.service || inquiry.softwarePreference || 'our services'}</strong>.
        </p>
        <p style="color: #4a5568; line-height: 1.6;">
          One of our certified accounting & bookkeeping specialists is reviewing your requirements and will connect with you within <strong>2 to 4 business hours</strong>.
        </p>
        <div style="background: #edf7f6; padding: 12px 16px; border-radius: 6px; margin: 18px 0; color: #286b64; font-size: 13px;">
          Need immediate assistance? You can also call us directly at <strong>+1 (888) 787-7678</strong>.
        </div>
        <p style="color: #718096; font-size: 12px; margin-top: 25px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
          Best regards,<br>
          <strong>Support Help Team</strong><br>
          <a href="https://supporthelp.online" style="color: #368b82;">www.supporthelp.online</a>
        </p>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"Support Help" <${fromEmail}>`,
      to: inquiry.email,
      subject,
      html,
    });
  }

  async sendConsultationNotification(consultation: any): Promise<boolean> {
    const receiverEmail =
      this.configService.get<string>('CONTACT_RECEIVER_EMAIL') ||
      this.configService.get<string>('ADMIN_EMAIL') ||
      'Contact@Supporthelp.online';

    const fromEmail =
      this.configService.get<string>('MAIL_FROM') ||
      this.configService.get<string>('EMAIL_USER') ||
      'support@supporthelp.online';

    const subject = `📅 New Consultation Booking: ${consultation.name} - ${consultation.primaryService}`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #368b82 0%, #203f99 100%); color: #ffffff; padding: 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
          .content { padding: 28px 24px; }
          .info-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          .info-table td { padding: 12px 10px; border-bottom: 1px solid #edf2f7; font-size: 14px; }
          .info-table td.label { font-weight: 600; color: #4a5568; width: 38%; }
          .info-table td.val { color: #1a202c; }
          .slot-box { background: #edf7f6; border: 1px solid #368b82; padding: 12px 16px; border-radius: 8px; margin: 18px 0; color: #286b64; font-weight: bold; }
          .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #718096; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Consultation Booking</h1>
            <p>A client has requested a free 30-minute consultation</p>
          </div>
          <div class="content">
            <div class="slot-box">
              ⏰ Requested Time Slot: ${consultation.preferredTimeSlot}
            </div>
            <table class="info-table">
              <tr>
                <td class="label">Client Name</td>
                <td class="val"><strong>${consultation.name}</strong></td>
              </tr>
              <tr>
                <td class="label">Work Email</td>
                <td class="val"><a href="mailto:${consultation.workEmail}">${consultation.workEmail}</a></td>
              </tr>
              <tr>
                <td class="label">Phone</td>
                <td class="val"><a href="tel:${consultation.phone}">${consultation.phone}</a></td>
              </tr>
              <tr>
                <td class="label">Company Name</td>
                <td class="val">${consultation.companyName || 'Not provided'}</td>
              </tr>
              <tr>
                <td class="label">Primary Service</td>
                <td class="val"><strong>${consultation.primaryService}</strong></td>
              </tr>
              <tr>
                <td class="label">Overview / Notes</td>
                <td class="val">${consultation.overview || 'None provided'}</td>
              </tr>
            </table>
          </div>
          <div class="footer">
            Support Help Portal &copy; ${new Date().getFullYear()}
          </div>
        </div>
      </body>
    </html>
    `;

    if (!this.transporter) {
      this.logger.log(`[SIMULATED EMAIL] Consultation: ${subject}`);
      return true;
    }

    try {
      await this.transporter.sendMail({
        from: `"Support Help Consultations" <${fromEmail}>`,
        to: receiverEmail,
        replyTo: consultation.workEmail,
        subject,
        html: htmlContent,
      });
      this.logger.log(`Consultation notification email sent for ${consultation.workEmail}`);
      return true;
    } catch (err: any) {
      this.logger.error(`Error sending consultation email: ${err.message}`);
      return false;
    }
  }
}
