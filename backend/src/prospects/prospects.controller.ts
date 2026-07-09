import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { ProspectsService } from './prospects.service';
import { CreateProspectDto } from './dto/create-prospect.dto';
import { UpdateProspectDto } from './dto/update-prospect.dto';

interface RequestWithUser {
  user: { id: string; role: Role };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/prospects')
export class ProspectsController {
  constructor(private readonly prospectsService: ProspectsService) {}

  @Post()
  @Roles(Role.COLLABORATEUR, Role.RESPONSABLE, Role.ADMIN)
  create(@Body() dto: CreateProspectDto, @Req() req: RequestWithUser) {
    return this.prospectsService.create(dto, req.user);
  }

  @Get()
  findAll(@Req() req: RequestWithUser) {
    return this.prospectsService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.prospectsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.COLLABORATEUR, Role.RESPONSABLE, Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProspectDto,
    @Req() req: RequestWithUser,
  ) {
    return this.prospectsService.update(id, dto, req.user);
  }

  // Convertit le prospect en client et retourne le Client créé
  @Post(':id/convert')
  @Roles(Role.COLLABORATEUR, Role.RESPONSABLE, Role.ADMIN)
  convertToClient(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.prospectsService.convertToClient(id, req.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.COLLABORATEUR, Role.RESPONSABLE, Role.ADMIN)
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.prospectsService.remove(id, req.user);
  }
}
