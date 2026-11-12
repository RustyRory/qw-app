import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { CabinetService } from './cabinet.service';
import { UpdateCabinetDto } from './dto/update-cabinet.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/cabinet')
export class CabinetController {
  constructor(private readonly cabinetService: CabinetService) {}

  @Get()
  get() {
    return this.cabinetService.get();
  }

  @Put()
  @Roles(Role.ADMIN)
  update(@Body() dto: UpdateCabinetDto) {
    return this.cabinetService.update(dto);
  }
}
