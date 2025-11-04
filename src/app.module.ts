import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FirebaseModule } from './firebase/firebase.module';
import { MailModule } from './mail/mail.module';
import { User } from './users/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mongodb',
        url: configService.get<string>('DATABASE_URL'), // Atlas URI
        database: configService.get<string>('MONGO_DB_NAME'),
        ssl: true,
        authSource: 'admin',
        entities: [User],
        synchronize: true, // only for dev
        logging: true,
      }),
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const rawExpiresIn = configService.get<string>('JWT_EXPIRES_IN');
        const expiresIn = rawExpiresIn && !Number.isNaN(Number(rawExpiresIn)) ? Number(rawExpiresIn) : rawExpiresIn;
        return {
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: { expiresIn: expiresIn as any },
        };
      },
      inject: [ConfigService],
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get('MAIL_HOST'),
          port: Number(configService.get('MAIL_PORT')),
          secure: false,
          auth: {
            user: configService.get('MAIL_USER'),
            pass: configService.get('MAIL_PASS'),
          },
        },
        defaults: {
          from: `"Trivia Pro" <${configService.get('MAIL_FROM')}>`,
        },
        template: {
          dir: join(__dirname, '..', 'src/mail/templates'),
          adapter: new HandlebarsAdapter(),
          options: { strict: true },
        },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    FirebaseModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
