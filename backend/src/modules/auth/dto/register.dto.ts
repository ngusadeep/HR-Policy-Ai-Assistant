import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserGender } from 'src/modules/users/entities/user.entity';

export class RegisterDto {
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

  @ApiProperty({ enum: UserGender, example: UserGender.PREFER_NOT_TO_SAY })
  @IsNotEmpty()
  @IsEnum(UserGender)
  gender: UserGender;

  @ApiProperty({ example: 'Frontend Engineer', maxLength: 150 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  title: string;

  @ApiProperty({ example: 'StrongP@ss1', minLength: 7 })
  @IsNotEmpty()
  @IsString()
  @MinLength(7)
  @MaxLength(255)
  password: string;
}
