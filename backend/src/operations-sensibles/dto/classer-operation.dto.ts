import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ClasserOperationDto {
  @IsString()
  @IsNotEmpty({ message: 'Le motif de classement est obligatoire' })
  @MaxLength(2000)
  motif: string;
}
