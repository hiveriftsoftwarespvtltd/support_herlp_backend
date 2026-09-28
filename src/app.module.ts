import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConsultationsModule } from './modules/consultations/consultations.module';
import { InquiriesModule } from './modules/inquiries/inquiries.module';
import { ServicesModule } from './modules/services/services.module';
import { IndustriesModule } from './modules/industries/industries.module';
import { SoftwareExpertiseModule } from './modules/software-expertise/software-expertise.module';
import { BlogsModule } from './modules/blogs/blogs.module';
import { TestimonialsModule } from './modules/testimonials/testimonials.module';
import { NewsletterModule } from './modules/newsletter/newsletter.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGODB_URI') ||
          configService.get<string>('MONGO_URI') ||
          'mongodb://localhost:27017/support_help',
      }),
    }),
    UsersModule,
    AuthModule,
    ConsultationsModule,
    InquiriesModule,
    ServicesModule,
    IndustriesModule,
    SoftwareExpertiseModule,
    BlogsModule,
    TestimonialsModule,
    NewsletterModule,
    SettingsModule,
    AuditLogsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
