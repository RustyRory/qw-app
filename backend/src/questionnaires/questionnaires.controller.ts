import {
  Body,
  Controller,
  Get,
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
import { QuestionnairesService } from './questionnaires.service';
import { CreateQuestionnaireDto } from './dto/create-questionnaire.dto';
import { UpdateQuestionnaireDto } from './dto/update-questionnaire.dto';

interface RequestWithUser {
  user: { id: string; role: Role };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/questionnaires')
export class QuestionnairesController {
  constructor(private readonly svc: QuestionnairesService) {}

  @Post()
  @Roles(
    Role.COLLABORATEUR,
    Role.RESPONSABLE,
    Role.EXPERT_COMPTABLE,
    Role.ADMIN,
  )
  create(@Body() dto: CreateQuestionnaireDto, @Req() req: RequestWithUser) {
    return this.svc.create(dto, req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Get('prospect/:prospectId')
  findByProspect(@Param('prospectId') prospectId: string) {
    return this.svc.findByProspect(prospectId);
  }

  @Patch(':id/reponses')
  @Roles(
    Role.COLLABORATEUR,
    Role.RESPONSABLE,
    Role.EXPERT_COMPTABLE,
    Role.ADMIN,
  )
  updateReponses(@Param('id') id: string, @Body() dto: UpdateQuestionnaireDto) {
    return this.svc.updateReponses(id, dto);
  }

  @Patch(':id/valider')
  @Roles(Role.RESPONSABLE, Role.EXPERT_COMPTABLE, Role.ADMIN)
  validate(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.svc.validate(id, req.user.id);
  }

  @Patch(':id/refuser')
  @Roles(Role.RESPONSABLE, Role.EXPERT_COMPTABLE, Role.ADMIN)
  refuse(
    @Param('id') id: string,
    @Body('motif') motif: string,
    @Req() req: RequestWithUser,
  ) {
    return this.svc.refuse(id, motif, req.user.id);
  }
}
