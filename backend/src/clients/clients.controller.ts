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
import { UserRole } from '../users/entities/user.entity';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

interface RequestWithUser {
  user: { id: string; role: UserRole };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @Roles(UserRole.COLLABORATEUR, UserRole.RESPONSABLE, UserRole.ADMIN)
  create(@Body() dto: CreateClientDto, @Req() req: RequestWithUser) {
    return this.clientsService.create(dto, req.user);
  }

  @Get()
  findAll(@Req() req: RequestWithUser) {
    return this.clientsService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
    @Req() req: RequestWithUser,
  ) {
    return this.clientsService.update(id, dto, req.user);
  }

  @Patch(':id/validate')
  @Roles(UserRole.RESPONSABLE, UserRole.ADMIN)
  validate(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.clientsService.validate(id, req.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.clientsService.remove(id, req.user);
  }
}
