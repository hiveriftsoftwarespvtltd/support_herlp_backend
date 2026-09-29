import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    const inputEmail = loginDto.email.toLowerCase().trim();
    const inputPassword = loginDto.password;

    const envAdminEmail = (
      this.configService.get<string>('ADMIN_EMAIL') || 'supporthelp@gmail.com'
    )
      .toLowerCase()
      .trim();
    const envAdminPassword =
      this.configService.get<string>('ADMIN_PASSWORD') || '123456';

    // 1. Check if user exists in database
    let user = await this.usersService.findByEmailWithPassword(inputEmail);

    // 2. If not found in DB, check if credentials match .env administrator
    const isEnvAdmin =
      (inputEmail === envAdminEmail ||
        inputEmail === 'vineetvineet8006@gmail.com' ||
        inputEmail === 'admin@supporthelp.online') &&
      inputPassword === envAdminPassword;

    if (!user) {
      if (isEnvAdmin) {
        // Automatically provision Admin User in MongoDB
        const hashedPassword = await bcrypt.hash(envAdminPassword, 10);
        user = await this.usersService.create({
          name: 'Super Administrator',
          email: inputEmail,
          password: hashedPassword,
          role: UserRole.SUPER_ADMIN,
          isActive: true,
          isEmailVerified: true,
        });
      } else {
        throw new UnauthorizedException('Invalid email or password');
      }
    } else {
      // User found in DB - verify password
      let isPasswordValid = false;
      try {
        isPasswordValid = await bcrypt.compare(inputPassword, user.password);
      } catch {
        isPasswordValid = false;
      }

      // Allow fallback if matching env password or plain text match
      if (!isPasswordValid && (isEnvAdmin || inputPassword === user.password)) {
        isPasswordValid = true;
      }

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('This account has been deactivated');
      }
    }

    // Update last login timestamp
    await this.usersService.updateLastLogin((user._id as any).toString());

    // Generate JWT token (Persistent session with 365d TTL)
    const payload = {
      sub: (user._id as any).toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = this.jwtService.sign(payload);

    return {
      success: true,
      message: 'Login successful! Welcome to Support Help Admin.',
      data: {
        token,
        user: {
          id: (user._id as any).toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      success: true,
      data: {
        id: (user._id as any).toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        lastLoginAt: user.lastLoginAt,
      },
    };
  }
}
