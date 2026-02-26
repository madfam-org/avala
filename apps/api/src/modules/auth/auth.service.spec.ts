import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService, JwtPayload } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { UnauthorizedException } from '@nestjs/common';

// Mock global fetch for Janua calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'TRAINEE',
    tenantId: 'tenant-123',
    status: 'ACTIVE',
    tenant: {
      id: 'tenant-123',
      name: 'Test Tenant',
      slug: 'test-tenant',
    },
  };

  const mockTenant = {
    id: 'tenant-123',
    name: 'Test Tenant',
    slug: 'test-tenant',
  };

  beforeEach(async () => {
    mockFetch.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            tenant: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('http://janua.test'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user when Janua authenticates and local user exists', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser as any);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(mockUser as any);

      const result = await service.validateUser('test@example.com', 'validpassword');

      expect(result).toEqual(mockUser);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://janua.test/api/v1/auth/signin',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com', password: 'validpassword' }),
        }),
      );
    });

    it('should return null when Janua rejects credentials', async () => {
      mockFetch.mockResolvedValue({ ok: false });

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
      expect(prismaService.user.findFirst).not.toHaveBeenCalled();
    });

    it('should return null when Janua authenticates but no local user', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(null);

      const result = await service.validateUser('unknown@example.com', 'validpassword');

      expect(result).toBeNull();
    });

    it('should return null when Janua request fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return tokens and user info on successful login', async () => {
      jest.spyOn(prismaService.tenant, 'findUnique').mockResolvedValue(mockTenant as any);

      const result = await service.login(mockUser as any);

      expect(result).toHaveProperty('accessToken', 'mock-jwt-token');
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tenant');
      expect(result.user.email).toBe('test@example.com');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        tenantId: mockUser.tenantId,
        role: mockUser.role,
      });
    });

    it('should throw UnauthorizedException when tenant not found', async () => {
      jest.spyOn(prismaService.tenant, 'findUnique').mockResolvedValue(null);

      await expect(service.login(mockUser as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateJwtPayload', () => {
    it('should return user when JWT payload is valid', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);

      const payload: JwtPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-123',
        role: 'TRAINEE',
      };

      const result = await service.validateJwtPayload(payload);

      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      const payload: JwtPayload = {
        sub: 'invalid-user',
        email: 'test@example.com',
        tenantId: 'tenant-123',
        role: 'TRAINEE',
      };

      const result = await service.validateJwtPayload(payload);

      expect(result).toBeNull();
    });

    it('should return null when tenant ID mismatch', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);

      const payload: JwtPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        tenantId: 'different-tenant',
        role: 'TRAINEE',
      };

      const result = await service.validateJwtPayload(payload);

      expect(result).toBeNull();
    });
  });
});
