import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RefuserProspectDto {
  @IsString()
  @IsNotEmpty({ message: 'Le motif de refus est obligatoire' })
  @MaxLength(2000)
  motif: string;
}
