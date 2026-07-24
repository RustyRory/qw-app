import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateSignatureDto {
  @IsOptional()
  @IsString()
  @MaxLength(300000)
  @Matches(/^data:image\/(png|jpeg);base64,/, {
    message:
      'La signature doit être une image encodée en base64 (PNG ou JPEG).',
  })
  signatureDataUri?: string | null;
}
