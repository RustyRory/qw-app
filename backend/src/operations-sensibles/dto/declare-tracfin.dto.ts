import { IsDateString } from 'class-validator';

export class DeclareTracfinDto {
  @IsDateString()
  date: string;
}
