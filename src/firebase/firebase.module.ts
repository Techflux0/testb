import { Module, Global, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { FirebaseService } from './firebase.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [FirebaseService],
  exports: [FirebaseService],
})
export class FirebaseModule implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    if (admin.apps.length === 0) {
      try {
        const privateKey = this.configService.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');
        
        if (!privateKey) {
          console.warn('❌ FIREBASE_PRIVATE_KEY not found in environment variables. Firebase Admin SDK will not be initialized.');
          return;
        }

        if (!this.configService.get('FIREBASE_PROJECT_ID')) {
          console.warn('❌ FIREBASE_PROJECT_ID not found in environment variables. Firebase Admin SDK will not be initialized.');
          return;
        }

        const serviceAccount = {
          type: "service_account",
          project_id: this.configService.get('FIREBASE_PROJECT_ID'),
          private_key_id: this.configService.get('FIREBASE_PRIVATE_KEY_ID'),
          private_key: privateKey,
          client_email: this.configService.get('FIREBASE_CLIENT_EMAIL'),
          client_id: this.configService.get('FIREBASE_CLIENT_ID'),
          auth_uri: "https://accounts.google.com/o/oauth2/auth",
          token_uri: "https://oauth2.googleapis.com/token",
          auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
          client_x509_cert_url: this.configService.get('FIREBASE_CLIENT_CERT_URL'),
          universe_domain: "googleapis.com"
        };

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
          databaseURL: `https://${this.configService.get('FIREBASE_PROJECT_ID')}.firebaseio.com`
        });
        
        console.log('✅ Firebase Admin SDK initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
      }
    } else {
      console.log('✅ Firebase Admin SDK already initialized');
    }
  }
}