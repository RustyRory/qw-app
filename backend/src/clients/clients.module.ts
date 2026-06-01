import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { Client } from './entities/client.entity';
import { Kyc } from '../kyc/entities/kyc.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

@Module({
  imports: [TypeOrmModule.forFeature([Client, Kyc, AuditLog])],
  controllers: [ClientsController],
  providers: [
    ClientsService,
    {
      provide: 'REDIS_CLIENT',
      useFactory: () =>
        new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379'),
    },
  ],
})
export class ClientsModule {}
