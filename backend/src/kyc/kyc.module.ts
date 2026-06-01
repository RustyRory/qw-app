import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { Kyc } from './entities/kyc.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';

@Module({
  imports: [TypeOrmModule.forFeature([Kyc, AuditLog])],
  controllers: [KycController],
  providers: [
    KycService,
    {
      provide: 'REDIS_CLIENT',
      useFactory: () =>
        new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379'),
    },
  ],
})
export class KycModule {}
