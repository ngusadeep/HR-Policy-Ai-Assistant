import { Body, Controller, Delete, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { AuthService } from 'src/modules/auth/services/auth.service';
import { LoginDto } from 'src/modules/auth/dto/login.dto';
import { RegisterDto } from 'src/modules/auth/dto/register.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from 'src/modules/auth/decorator/public.decorator';
import { AuthUser } from 'src/modules/auth/decorator/auth-user.decorator';
import type { AuthUser as AuthUserPayload } from 'src/modules/auth/interfaces/auth-user.interface';
import { LoginResponseDto } from 'src/modules/auth/dto/responses/login.response.dto';
import { ChangePasswordDto } from 'src/modules/auth/dto/change-password.dto';
import { UpdateProfileDto } from 'src/modules/auth/dto/update-profile.dto';

@ApiTags('Auth')
@ApiBearerAuth('JWT')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @ApiOperation({ summary: 'Register a new employee account (pending approval)' })
  @ApiResponse({ status: 201, description: 'Registration successful, awaiting approval' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and return JWT with user profile' })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Account pending approval or suspended' })
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update own profile details' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  @Patch('profile')
  async updateProfile(
    @AuthUser() user: AuthUserPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.userId, dto);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change own password' })
  @ApiResponse({ status: 200, description: 'Password changed' })
  @ApiResponse({ status: 400, description: 'Current password incorrect or passwords do not match' })
  @Post('change-password')
  async changePassword(
    @AuthUser() user: AuthUserPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.userId, dto);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete own account (non-admins only)' })
  @ApiResponse({ status: 200, description: 'Account deleted' })
  @ApiResponse({ status: 403, description: 'Admins cannot delete their own account' })
  @Delete('account')
  async deleteAccount(@AuthUser() user: AuthUserPayload) {
    return this.authService.deleteAccount(user.userId);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transfer admin role to another active user (admin only)' })
  @ApiResponse({ status: 200, description: 'Admin role transferred' })
  @ApiResponse({ status: 400, description: 'Target user must be active' })
  @ApiResponse({ status: 404, description: 'Target user not found' })
  @Post('transfer-admin/:targetUserId')
  async transferAdminRole(
    @AuthUser() user: AuthUserPayload,
    @Param('targetUserId', ParseIntPipe) targetUserId: number,
  ) {
    return this.authService.transferAdminRole(user.userId, targetUserId);
  }
}
