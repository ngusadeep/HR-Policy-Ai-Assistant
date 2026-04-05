import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserStatus } from 'src/modules/users/entities/user.entity';

export class UpdateUserStatusDto {
  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  @IsNotEmpty()
  @IsEnum(UserStatus)
  status: UserStatus;
}
