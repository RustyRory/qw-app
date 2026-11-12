import { IsString, MinLength } from 'class-validator';
import { MotDePasseRobuste } from '../../common/validators/mot-de-passe';

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword: string;

  @MotDePasseRobuste()
  newPassword: string;
}
