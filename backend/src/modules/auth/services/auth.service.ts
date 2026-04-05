import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from 'src/modules/users/users.service';
import type { LoginDto } from '../dto/login.dto';
import type { RegisterDto } from '../dto/register.dto';
import type { ForgotPasswordDto } from '../dto/forgot-password.dto';
import type { ChangePasswordDto } from '../dto/change-password.dto';
import type { UpdateProfileDto } from '../dto/update-profile.dto';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from 'src/modules/users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { LoginResponseDto } from 'src/modules/auth/dto/responses/login.response.dto';
import { RoleRepository } from 'src/modules/roles/repositories/role.repository';
import { UserResponseDto } from 'src/modules/users/dto/responses/user.response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly roleRepository: RoleRepository,
  ) {}

  async validateUser(email: string, pass: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !(await user.comparePassword(pass))) {
      throw new UnauthorizedException('Invalid credentials.');
    }
    return user;
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const userRole = await this.roleRepository.findByName('User');

    const createDto = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      gender: dto.gender,
      title: dto.title,
      password: dto.password,
      ...(userRole ? { roleId: userRole.id } : {}),
    };

    const user = await this.usersService.create(createDto);

    return {
      message:
        'Registration successful. Your account is pending admin approval before you can sign in.',
      userId: user.id,
    };
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { email, password } = loginDto;
    const user = await this.usersService.findByEmail(email);

    if (!user || !(await user.comparePassword(password))) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (user.status === UserStatus.PENDING) {
      throw new ForbiddenException(
        'Your account is pending admin approval. Please check back later.',
      );
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException(
        'Your account has been suspended. Please contact your administrator.',
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role?.name ?? 'User',
    };

    return new LoginResponseDto(this.jwtService.sign(payload), user);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const resetToken = this.jwtService.sign(
      { userId: user.id },
      {
        secret: this.configService.getOrThrow<string>('jwtResetSecret'),
        expiresIn: '1h',
      },
    );
    return {
      message: 'Password reset instructions sent to your email',
      resetToken,
    };
  }

  async resetPassword(token: string, password: string) {
    try {
      const decoded = this.jwtService.verify<{ userId: number }>(token, {
        secret: this.configService.getOrThrow<string>('jwtResetSecret'),
      });

      const user = await this.usersService.findById(decoded.userId);
      if (!user) {
        throw new BadRequestException('Invalid token');
      }

      await this.usersService.updatePassword(decoded.userId, password);
      return { message: 'Password successfully reset' };
    } catch {
      throw new BadRequestException('Invalid or expired token');
    }
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!(await user.comparePassword(dto.currentPassword))) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('New passwords do not match');
    }

    await this.usersService.updatePassword(userId, dto.newPassword);
    return { message: 'Password successfully changed' };
  }

  async updateProfile(userId: number, dto: UpdateProfileDto): Promise<UserResponseDto> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing && existing.id !== userId) {
      throw new ConflictException('Email is already in use by another account.');
    }
    return this.usersService.update(userId, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      gender: dto.gender,
      title: dto.title,
    });
  }

  async deleteAccount(userId: number): Promise<{ deleted: boolean }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    if (user.role?.name === 'Admin') {
      throw new ForbiddenException('Admins cannot delete their own account. Transfer your admin role first.');
    }
    return this.usersService.remove(userId);
  }

  async transferAdminRole(currentAdminId: number, targetUserId: number): Promise<{ message: string }> {
    if (currentAdminId === targetUserId) {
      throw new BadRequestException('You cannot transfer the admin role to yourself.');
    }

    const [adminRole, userRole] = await Promise.all([
      this.roleRepository.findByName('Admin'),
      this.roleRepository.findByName('User'),
    ]);

    if (!adminRole || !userRole) {
      throw new BadRequestException('Roles not found. Please ensure the system is seeded.');
    }

    const targetUser = await this.usersService.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('Target user not found.');
    }
    if (targetUser.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('Target user must be active to receive the admin role.');
    }

    await Promise.all([
      this.usersService.update(targetUserId, { roleId: adminRole.id }),
      this.usersService.update(currentAdminId, { roleId: userRole.id }),
    ]);

    return { message: `Admin role transferred to ${targetUser.firstName} ${targetUser.lastName}.` };
  }
}
