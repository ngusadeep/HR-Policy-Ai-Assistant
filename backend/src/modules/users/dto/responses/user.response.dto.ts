import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User, UserGender, UserStatus } from 'src/modules/users/entities/user.entity';
import { RoleResponseDto } from 'src/modules/roles/dto/responses/role.response.dto';

export class UserResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ enum: UserGender, example: UserGender.PREFER_NOT_TO_SAY })
  gender: UserGender;

  @ApiProperty({ example: 'Frontend Engineer' })
  title: string;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  status: UserStatus;

  @ApiPropertyOptional({ type: () => RoleResponseDto })
  role: RoleResponseDto | null;

  @ApiProperty({ example: '2025-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-01-01T00:00:00Z' })
  updatedAt: Date;

  constructor(user: User) {
    this.id = user.id;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.email = user.email;
    this.gender = user.gender;
    this.title = user.title;
    this.status = user.status;
    this.role = user.role ? new RoleResponseDto(user.role) : null;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
