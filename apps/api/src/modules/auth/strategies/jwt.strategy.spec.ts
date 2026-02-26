import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtStrategy } from "./jwt.strategy";
import { AuthService } from "../auth.service";

describe("JwtStrategy", () => {
  let strategy: JwtStrategy;
  let authService: jest.Mocked<AuthService>;

  const mockAuthService = {
    validateJwtPayload: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue("test-secret"),
    getOrThrow: jest.fn().mockReturnValue("test-secret"),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    authService = module.get(AuthService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(strategy).toBeDefined();
  });

  describe("validate", () => {
    const mockPayload = {
      sub: "user-1",
      email: "test@example.com",
      tenantId: "tenant-1",
      role: "student",
    };

    it("should return user when payload is valid", async () => {
      const mockUser = { id: "user-1", email: "test@example.com" };
      authService.validateJwtPayload.mockResolvedValue(mockUser as any);

      const result = await strategy.validate(mockPayload);

      expect(authService.validateJwtPayload).toHaveBeenCalledWith(mockPayload);
      expect(result).toEqual(mockUser);
    });

    it("should throw UnauthorizedException when user not found", async () => {
      authService.validateJwtPayload.mockResolvedValue(null);

      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException with message when invalid", async () => {
      authService.validateJwtPayload.mockResolvedValue(null);

      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        "Invalid or expired token",
      );
    });
  });
});
