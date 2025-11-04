import { Controller, Post, Body, Get, Query, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: { email: string; password: string; displayName?: string }) {
    const user = await this.authService.register(registerDto);
    return { message: 'Registration successful. Please check your email for verification.', user };
  }

  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    return await this.authService.login(loginDto);
  }

  @Post('firebase')
  async firebaseAuth(@Body() body: { idToken: string }) {
    return await this.authService.firebaseAuth(body.idToken);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    await this.authService.forgotPassword(body.email);
    return { message: 'If an account exists, a password reset email has been sent.' };
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; password: string }) {
    await this.authService.resetPassword(body.token, body.password);
    return { message: 'Password has been reset successfully.' };
  }

  @Post('verify-email')
  async verifyEmail(@Body() body: { token: string }) {
    await this.authService.verifyEmail(body.token);
    return { message: 'Email verified successfully.' };
  }

  @Post('resend-verification')
  async resendVerification(@Body() body: { email: string }) {
    await this.authService.sendVerificationEmail(body.email);
    return { message: 'Verification email sent.' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req) {
    return req.user;
  }
}