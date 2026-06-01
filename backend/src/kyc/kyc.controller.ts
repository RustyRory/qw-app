import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { KycService } from './kyc.service';
import { UpdateKycDto } from './dto/update-kyc.dto';

interface RequestWithUser {
  user: { id: string; role: UserRole };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Get(':clientId')
  findOne(@Param('clientId') clientId: string) {
    return this.kycService.findByClient(clientId);
  }

  @Patch(':clientId')
  update(
    @Param('clientId') clientId: string,
    @Body() dto: UpdateKycDto,
    @Req() req: RequestWithUser,
  ) {
    return this.kycService.update(clientId, dto, req.user);
  }
}
