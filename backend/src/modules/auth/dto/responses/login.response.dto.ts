import { ApiProperty } from '@nestjs/swagger';
import { User, UserGender, UserStatus } from 'src/modules/users/entities/user.entity';

class AuthUserDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ enum: UserGender })
  gender: UserGender;

  @ApiProperty({ example: 'Frontend Engineer' })
  title: string;

  @ApiProperty({ example: 'admin' })
  role: string;

  @ApiProperty({ enum: UserStatus })
  status: UserStatus;

  constructor(user: User) {
    this.id = user.id;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.email = user.email;
    this.gender = user.gender;
    this.title = user.title;
    this.role = user.role?.name?.toLowerCase() ?? 'user';
    this.status = user.status;
  }
}

export class LoginResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  access_token: string;

  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;

  constructor(access_token: string, user: User) {
    this.access_token = access_token;
    this.user = new AuthUserDto(user);
  }
}
