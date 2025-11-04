import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private auth: admin.auth.Auth;

  onModuleInit() {
    // Initialize Firebase Auth only if Firebase app is available
    if (admin.apps.length > 0) {
      this.auth = admin.auth();
      console.log('✅ Firebase Auth service initialized');
    } else {
      console.warn('⚠️ Firebase app not initialized. FirebaseService will not work properly.');
    }
  }

  private ensureInitialized() {
    if (!this.auth) {
      throw new Error('Firebase Auth not initialized. Make sure Firebase Admin SDK is properly configured.');
    }
  }

  // Verify Firebase ID token
  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    this.ensureInitialized();
    try {
      return await this.auth.verifyIdToken(idToken);
    } catch (error) {
      throw new Error('Invalid Firebase ID token');
    }
  }

  // Get user by Firebase UID
  async getUserByUid(uid: string): Promise<admin.auth.UserRecord> {
    this.ensureInitialized();
    try {
      return await this.auth.getUser(uid);
    } catch (error) {
      throw new Error('Firebase user not found');
    }
  }

  // Create custom token for client-side auth
  async createCustomToken(uid: string, additionalClaims?: any): Promise<string> {
    this.ensureInitialized();
    try {
      return await this.auth.createCustomToken(uid, additionalClaims);
    } catch (error) {
      throw new Error('Failed to create custom token');
    }
  }

  // Delete user from Firebase
  async deleteUser(uid: string): Promise<void> {
    this.ensureInitialized();
    try {
      await this.auth.deleteUser(uid);
    } catch (error) {
      throw new Error('Failed to delete Firebase user');
    }
  }

  // Send email verification
  async generateEmailVerificationLink(email: string): Promise<string> {
    this.ensureInitialized();
    try {
      return await this.auth.generateEmailVerificationLink(email);
    } catch (error) {
      throw new Error('Failed to generate email verification link');
    }
  }

  // Send password reset email
  async generatePasswordResetLink(email: string): Promise<string> {
    this.ensureInitialized();
    try {
      return await this.auth.generatePasswordResetLink(email);
    } catch (error) {
      throw new Error('Failed to generate password reset link');
    }
  }
}