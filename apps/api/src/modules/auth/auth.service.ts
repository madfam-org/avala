import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { User } from '@avala/db';

export interface JwtPayload {
  sub: string; // user ID
  email: string;
  tenantId: string;
  role: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly januaBaseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.januaBaseUrl = this.configService.getOrThrow<string>('JANUA_BASE_URL');
  }

  /**
   * Validate user credentials by delegating to Janua's signin endpoint.
   * Janua owns all credential management (bcrypt, MFA, etc.).
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    // Authenticate against Janua
    const januaOk = await this.authenticateViaJanua(email, password);
    if (!januaOk) {
      return null;
    }

    // Look up the local user record
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        status: 'ACTIVE',
      },
      include: {
        tenant: true,
      },
    });

    if (!user) {
      this.logger.warn(`Janua authenticated ${email} but no local user found`);
      return null;
    }

    // Update last login timestamp
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return user;
  }

  /**
   * Authenticate credentials against Janua's Resource Owner Password flow.
   * Returns true if Janua accepted the credentials.
   */
  private async authenticateViaJanua(email: string, password: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.januaBaseUrl}/api/v1/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        this.logger.debug(`Janua rejected credentials for ${email}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Janua authentication request failed: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Login and generate JWT tokens
   */
  async login(user: User) {
    // Fetch tenant info
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
    });

    if (!tenant) {
      throw new UnauthorizedException('Tenant not found');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    this.logger.log(`User ${user.email} logged in successfully`);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
      accessToken,
    };
  }

  /**
   * Validate JWT payload (used by JwtStrategy)
   */
  async validateJwtPayload(payload: JwtPayload): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    // Verify tenant hasn't changed
    if (user.tenantId !== payload.tenantId) {
      return null;
    }

    return user;
  }

  /**
   * Get current user by ID
   */
  async getCurrentUser(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: true,
      },
    });
  }

}
