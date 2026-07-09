import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionnaireAcceptation } from './entities/questionnaire-acceptation.entity';
import { QuestionnairesService } from './questionnaires.service';
import { QuestionnairesController } from './questionnaires.controller';

@Module({
  imports: [TypeOrmModule.forFeature([QuestionnaireAcceptation])],
  controllers: [QuestionnairesController],
  providers: [QuestionnairesService],
  exports: [QuestionnairesService],
})
export class QuestionnairesModule {}
