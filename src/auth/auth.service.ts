import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { User, AuthProvider } from '../users/user.entity';
import { FirebaseService } from '../firebase/firebase.service';
import { MailService } from '../mail/mail.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private firebaseService: FirebaseService,
    private mailService: MailService,
  ) {}

  // Traditional email/password registration
  async register(registerDto: { email: string; password: string; displayName?: string }): Promise<User> {
    const existingUser = await this.usersRepository.findOne({ where: { email: registerDto.email } });
    if (existingUser) {
      throw new ConflictException('User already exists with this email');
    }

    const user = this.usersRepository.create({
      email: registerDto.email,
      password: registerDto.password,
      displayName: registerDto.displayName || 'Trivia Master',
      authProvider: AuthProvider.EMAIL,
    });

    const savedUser = await this.usersRepository.save(user);
    
    // Send verification email
    await this.sendVerificationEmail(savedUser.email);
    
    return savedUser;
  }

  // Firebase Google authentication
  async firebaseAuth(idToken: string): Promise<{ user: User; accessToken: string }> {
    try {
      const decodedToken = await this.firebaseService.verifyIdToken(idToken);
      const firebaseUser = await this.firebaseService.getUserByUid(decodedToken.uid);

      let user = await this.usersRepository.findOne({ 
        where: { firebaseUid: decodedToken.uid } 
      });

      if (!user) {
        user = await this.usersRepository.findOne({ 
          where: { email: firebaseUser.email } 
        });

        if (user) {
          // Link existing account with Firebase
          user.firebaseUid = decodedToken.uid;
          user.authProvider = AuthProvider.FIREBASE;
        } else {
          // Create new user from Firebase
          user = this.usersRepository.create({
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || 'Trivia Master',
            firebaseUid: decodedToken.uid,
            authProvider: AuthProvider.FIREBASE,
            isEmailVerified: firebaseUser.emailVerified,
          });
        }
      }

      const savedUser = await this.usersRepository.save(user);
      const accessToken = this.jwtService.sign({ 
        userId: savedUser.id, 
        email: savedUser.email 
      });

      return { user: savedUser, accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid Firebase authentication');
    }
  }

  // Traditional email/password login
  async login(loginDto: { email: string; password: string }): Promise<{ user: User; accessToken: string }> {
    const user = await this.usersRepository.findOne({ 
      where: { email: loginDto.email, authProvider: AuthProvider.EMAIL } 
    });

    if (!user || !(await user.validatePassword(loginDto.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.jwtService.sign({ 
      userId: user.id, 
      email: user.email 
    });

    return { user, accessToken };
  }

  // Send password reset email
  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if user exists
      return;
    }

    if (user.authProvider !== AuthProvider.EMAIL) {
      throw new BadRequestException(`Please use ${user.authProvider} authentication`);
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = resetExpires;

    await this.usersRepository.save(user);

    // Send email with reset link
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    await this.mailService.sendPasswordReset(user.email, resetUrl);
  }

  // Reset password
    async resetPassword(resetToken: string, newPassword: string): Promise<void> {
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  
      const user = await this.usersRepository.findOne({
        where: {
          resetPasswordToken: hashedToken,
          resetPasswordExpires: MoreThan(new Date()),
        },
      });
  
      if (!user) {
        throw new BadRequestException('Invalid or expired reset token');
      }
  
      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
  
      await this.usersRepository.save(user);
    }

  // Send email verification
  async sendVerificationEmail(email: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user || user.isEmailVerified) {
      return;
    }

    const verifyToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = crypto.createHash('sha256').update(verifyToken).digest('hex');
    
    await this.usersRepository.save(user);

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verifyToken}`;
    await this.mailService.sendVerificationEmail(user.email, verifyUrl);
  }

  // Verify email
    async verifyEmail(verifyToken: string): Promise<void> {
      const hashedToken = crypto.createHash('sha256').update(verifyToken).digest('hex');
  
      const user = await this.usersRepository.findOne({
        where: { emailVerificationToken: hashedToken },
      });
  
      if (!user) {
        throw new BadRequestException('Invalid verification token');
      }
  
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
  
      await this.usersRepository.save(user);
    }

  async validateUserByEmail(email: string, password: string): Promise<User | null> {
  const user = await this.usersRepository.findOne({ 
    where: { email, authProvider: AuthProvider.EMAIL } 
  });
  
  if (user && await user.validatePassword(password)) {
    return user;
  }
  return null;
}

    async validateUser(userId: string): Promise<User | null> {
      return this.usersRepository.findOne({ where: { id: userId } });
    }
}