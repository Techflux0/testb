import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendVerificationEmail(email: string, verificationUrl: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Verify Your Email - Trivia Pro',
      template: './verification',
      context: {
        verificationUrl,
        email,
      },
    });
  }

  async sendPasswordReset(email: string, resetUrl: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Reset Your Password - Trivia Pro',
      template: './password-reset',
      context: {
        resetUrl,
        email,
      },
    });
  }

  async sendWelcomeEmail(email: string, name: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Welcome to Trivia Pro!',
      template: './welcome',
      context: {
        name,
        email,
      },
    });
  }
}