import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { UserGender } from 'src/modules/users/entities/user.entity';

export class UpdateProfileDto {
  @ApiProperty({ example: 'John', maxLength: 100 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe', maxLength: 100 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(100)
  email: string;

  @ApiProperty({ enum: UserGender })
  @IsNotEmpty()
  @IsEnum(UserGender)
  gender: UserGender;

  @ApiProperty({ example: 'Frontend Engineer', maxLength: 150 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  title: string;
}
