import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BeforeInsert, BeforeUpdate, Index } from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcryptjs';

export enum AuthProvider {
  EMAIL = 'email',
  GOOGLE = 'google',
  FIREBASE = 'firebase'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column({ nullable: true })
  @Exclude()
  password?: string;

  @Column({ nullable: true })
  @Index()
  firebaseUid?: string;

  @Column({ 
    type: 'enum',
    enum: AuthProvider,
    default: AuthProvider.EMAIL
  })
  authProvider: AuthProvider;

  @Column({ nullable: true })
  @Exclude()
  resetPasswordToken?: string;

  @Column({ nullable: true })
  @Exclude()
  resetPasswordExpires?: Date;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true })
  @Exclude()
  emailVerificationToken?: string;

  @Column({ default: 'Trivia Master' })
  displayName: string;

  @Column({ default: 0 })
  level: number;

  @Column({ default: 0 })
  xp: number;

  @Column({ default: 0 })
  gamesPlayed: number;

  @Column({ default: 0 })
  currentStreak: number;

  @Column({ type: 'decimal', default: 0 })
  winRate: number;

  @Column({ default: 0 })
  totalPoints: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword?() {
    if (this.password && this.authProvider === AuthProvider.EMAIL) {
      if (this.password.length < 60) { // Only hash if not already hashed
        this.password = await bcrypt.hash(this.password, 12);
      }
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(password, this.password);
  }
}