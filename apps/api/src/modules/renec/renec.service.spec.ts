import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { RenecService } from "./renec.service";
import { PrismaService } from "../../database/prisma.service";

describe("RenecService", () => {
  let service: RenecService;
  let mockPrismaService: any;

  const mockCentro = {
    centerId: "centro-1",
    nombre: "Centro Test",
    estado: "CDMX",
    municipio: "Benito Juarez",
    direccion: "Calle Test 123",
    telefono: "5512345678",
    email: "test@centro.com",
    estadoInegi: "09",
    certifierId: "cert-1",
    lastSyncedAt: new Date(),
    certifier: {
      certId: "cert-1",
      razonSocial: "Certificador Test",
      nombreComercial: "CertTest",
    },
    offerings: [{ ec: { ecClave: "EC0249", titulo: "Test EC" } }],
  };

  const mockCertificador = {
    certId: "cert-1",
    tipo: "EMPRESA",
    razonSocial: "Certificador Test",
    nombreComercial: "CertTest",
    estado: "CDMX",
    estadoInegi: "09",
    telefono: "5512345678",
    email: "test@cert.com",
    representanteLegal: "Juan Perez",
    lastSyncedAt: new Date(),
    centers: [{ centerId: "centro-1", nombre: "Centro Test", estado: "CDMX" }],
  };

  const mockEC = {
    ecClave: "EC0249",
    titulo: "Competencia Laboral Test",
    version: "2.0",
    vigente: true,
    sector: "Servicios",
    proposito: "Test proposito",
    nivelCompetencia: 3,
    lastSyncedAt: new Date(),
    centerOfferings: [],
    accreditations: [],
  };

  beforeEach(async () => {
    const mockPrisma = {
      renecCenter: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
      },
      renecCertifier: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
      },
      renecEC: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
      },
      renecSyncJob: {
        findFirst: jest.fn(),
      },
    };

    mockPrismaService = mockPrisma;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RenecService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<RenecService>(RenecService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getCentros", () => {
    it("should return paginated centros", async () => {
      mockPrismaService.renecCenter.findMany.mockResolvedValue([mockCentro]);
      mockPrismaService.renecCenter.count.mockResolvedValue(1);

      const result = await service.getCentros({});

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it("should filter by search term", async () => {
      mockPrismaService.renecCenter.findMany.mockResolvedValue([mockCentro]);
      mockPrismaService.renecCenter.count.mockResolvedValue(1);

      await service.getCentros({ search: "Test" });

      expect(mockPrismaService.renecCenter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
    });

    it("should filter by estado", async () => {
      mockPrismaService.renecCenter.findMany.mockResolvedValue([]);
      mockPrismaService.renecCenter.count.mockResolvedValue(0);

      await service.getCentros({ estadoInegi: "09" });

      expect(mockPrismaService.renecCenter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ estadoInegi: "09" }),
        }),
      );
    });
  });

  describe("getCentroById", () => {
    it("should return centro by id", async () => {
      mockPrismaService.renecCenter.findUnique.mockResolvedValue(mockCentro);

      const result = await service.getCentroById("centro-1");

      expect(result).toEqual(mockCentro);
    });

    it("should throw NotFoundException if not found", async () => {
      mockPrismaService.renecCenter.findUnique.mockResolvedValue(null);

      await expect(service.getCentroById("invalid")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("getCertificadores", () => {
    it("should return paginated certificadores", async () => {
      mockPrismaService.renecCertifier.findMany.mockResolvedValue([
        mockCertificador,
      ]);
      mockPrismaService.renecCertifier.count.mockResolvedValue(1);

      const result = await service.getCertificadores({});

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it("should filter by tipo", async () => {
      mockPrismaService.renecCertifier.findMany.mockResolvedValue([]);
      mockPrismaService.renecCertifier.count.mockResolvedValue(0);

      await service.getCertificadores({ tipo: "PERSONA_FISICA" as any });

      expect(mockPrismaService.renecCertifier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tipo: "PERSONA_FISICA" }),
        }),
      );
    });
  });

  describe("getCertificadorById", () => {
    it("should return certificador by id", async () => {
      mockPrismaService.renecCertifier.findUnique.mockResolvedValue(
        mockCertificador,
      );

      const result = await service.getCertificadorById("cert-1");

      expect(result).toEqual(mockCertificador);
    });

    it("should throw NotFoundException if not found", async () => {
      mockPrismaService.renecCertifier.findUnique.mockResolvedValue(null);

      await expect(service.getCertificadorById("invalid")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("getRenecECStandards", () => {
    it("should return paginated EC standards", async () => {
      mockPrismaService.renecEC.findMany.mockResolvedValue([mockEC]);
      mockPrismaService.renecEC.count.mockResolvedValue(1);

      const result = await service.getRenecECStandards({});

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it("should filter by vigente status", async () => {
      mockPrismaService.renecEC.findMany.mockResolvedValue([mockEC]);
      mockPrismaService.renecEC.count.mockResolvedValue(1);

      await service.getRenecECStandards({ vigente: true });

      expect(mockPrismaService.renecEC.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ vigente: true }),
        }),
      );
    });
  });

  describe("getRenecECById", () => {
    it("should return EC by clave", async () => {
      mockPrismaService.renecEC.findFirst.mockResolvedValue(mockEC);

      const result = await service.getRenecECById("EC0249");

      expect(result).toEqual(mockEC);
    });

    it("should throw NotFoundException if not found", async () => {
      mockPrismaService.renecEC.findFirst.mockResolvedValue(null);

      await expect(service.getRenecECById("invalid")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("search", () => {
    it("should search across all types", async () => {
      mockPrismaService.renecCenter.findMany.mockResolvedValue([mockCentro]);
      mockPrismaService.renecCertifier.findMany.mockResolvedValue([
        mockCertificador,
      ]);
      mockPrismaService.renecEC.findMany.mockResolvedValue([mockEC]);

      const result = await service.search({ q: "Test" });

      expect(result.data.length).toBeGreaterThan(0);
    });

    it("should filter by type", async () => {
      mockPrismaService.renecCenter.findMany.mockResolvedValue([mockCentro]);

      await service.search({ q: "Test", type: "centro" });

      expect(mockPrismaService.renecCenter.findMany).toHaveBeenCalled();
      expect(mockPrismaService.renecCertifier.findMany).not.toHaveBeenCalled();
    });
  });

  describe("getStats", () => {
    it("should return statistics", async () => {
      mockPrismaService.renecCenter.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(80);
      mockPrismaService.renecCertifier.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(40);
      mockPrismaService.renecEC.count
        .mockResolvedValueOnce(200)
        .mockResolvedValueOnce(150);
      mockPrismaService.renecSyncJob.findFirst.mockResolvedValue({
        completedAt: new Date(),
        status: "COMPLETED",
      });

      const result = await service.getStats();

      expect(result.totalCentros).toBe(100);
      expect(result.totalCertificadores).toBe(50);
      expect(result.totalECStandards).toBe(200);
    });
  });

  describe("exportCentros", () => {
    it("should export centros as JSON", async () => {
      mockPrismaService.renecCenter.findMany.mockResolvedValue([mockCentro]);

      const result = await service.exportCentros("json");

      expect(result).toEqual([mockCentro]);
    });

    it("should export centros as CSV", async () => {
      mockPrismaService.renecCenter.findMany.mockResolvedValue([mockCentro]);

      const result = await service.exportCentros("csv");

      expect(typeof result).toBe("string");
      expect(result).toContain("centerId");
    });
  });

  describe("exportCertificadores", () => {
    it("should export certificadores as JSON", async () => {
      mockPrismaService.renecCertifier.findMany.mockResolvedValue([
        mockCertificador,
      ]);

      const result = await service.exportCertificadores("json");

      expect(result).toEqual([mockCertificador]);
    });
  });

  describe("exportECStandards", () => {
    it("should export EC standards as JSON", async () => {
      mockPrismaService.renecEC.findMany.mockResolvedValue([mockEC]);

      const result = await service.exportECStandards("json");

      expect(result).toEqual([mockEC]);
    });
  });
});
