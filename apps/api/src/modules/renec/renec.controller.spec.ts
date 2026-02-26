import { Test, TestingModule } from "@nestjs/testing";
import { ThrottlerGuard } from "@nestjs/throttler";
import { RenecController } from "./renec.controller";
import { RenecService } from "./renec.service";
import { RenecScraperService } from "./renec-scraper.service";

describe("RenecController", () => {
  let controller: RenecController;
  let renecService: jest.Mocked<RenecService>;
   
  let scraperService: any;

  const mockRenecService = {
    getCentros: jest.fn(),
    getCentroById: jest.fn(),
    getCertificadores: jest.fn(),
    getCertificadorById: jest.fn(),
    getRenecECStandards: jest.fn(),
    getRenecECById: jest.fn(),
    search: jest.fn(),
    getStats: jest.fn(),
    exportCentros: jest.fn(),
    exportCertificadores: jest.fn(),
    exportECStandards: jest.fn(),
  };

  const mockScraperService = {
    startHarvest: jest.fn(),
    getActiveRun: jest.fn(),
    stopHarvest: jest.fn(),
    getHarvestRuns: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RenecController],
      providers: [
        { provide: RenecService, useValue: mockRenecService },
        { provide: RenecScraperService, useValue: mockScraperService },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<RenecController>(RenecController);
    renecService = module.get(RenecService);
    scraperService = module.get(RenecScraperService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  // CENTROS
  describe("getCentros", () => {
    it("should get centros", async () => {
      renecService.getCentros.mockResolvedValue({ data: [], total: 0 } as any);
      await controller.getCentros({} as any);
      expect(renecService.getCentros).toHaveBeenCalledWith({});
    });
  });

  describe("getCentroById", () => {
    it("should get centro by id", async () => {
      renecService.getCentroById.mockResolvedValue({} as any);
      await controller.getCentroById("centro-1");
      expect(renecService.getCentroById).toHaveBeenCalledWith("centro-1");
    });
  });

  // CERTIFICADORES
  describe("getCertificadores", () => {
    it("should get certificadores", async () => {
      renecService.getCertificadores.mockResolvedValue({
        data: [],
        total: 0,
      } as any);
      await controller.getCertificadores({} as any);
      expect(renecService.getCertificadores).toHaveBeenCalledWith({});
    });
  });

  describe("getCertificadorById", () => {
    it("should get certificador by id", async () => {
      renecService.getCertificadorById.mockResolvedValue({} as any);
      await controller.getCertificadorById("cert-1");
      expect(renecService.getCertificadorById).toHaveBeenCalledWith("cert-1");
    });
  });

  // EC STANDARDS
  describe("getRenecECStandards", () => {
    it("should get EC standards", async () => {
      renecService.getRenecECStandards.mockResolvedValue({
        data: [],
        total: 0,
      } as any);
      await controller.getRenecECStandards({} as any);
      expect(renecService.getRenecECStandards).toHaveBeenCalledWith({});
    });
  });

  describe("getRenecECById", () => {
    it("should get EC by code", async () => {
      renecService.getRenecECById.mockResolvedValue({} as any);
      await controller.getRenecECById("EC0249");
      expect(renecService.getRenecECById).toHaveBeenCalledWith("EC0249");
    });
  });

  // SEARCH
  describe("search", () => {
    it("should search", async () => {
      renecService.search.mockResolvedValue({ results: [] } as any);
      await controller.search({} as any);
      expect(renecService.search).toHaveBeenCalledWith({});
    });
  });

  // STATISTICS
  describe("getStats", () => {
    it("should get stats", async () => {
      renecService.getStats.mockResolvedValue({} as any);
      await controller.getStats();
      expect(renecService.getStats).toHaveBeenCalled();
    });
  });

  // EXPORT
  describe("exportCentros", () => {
    it("should export centros", async () => {
      renecService.exportCentros.mockResolvedValue({} as any);
      await controller.exportCentros("json");
      expect(renecService.exportCentros).toHaveBeenCalledWith("json");
    });
  });

  describe("exportCertificadores", () => {
    it("should export certificadores", async () => {
      renecService.exportCertificadores.mockResolvedValue({} as any);
      await controller.exportCertificadores("json");
      expect(renecService.exportCertificadores).toHaveBeenCalledWith("json");
    });
  });

  describe("exportECStandards", () => {
    it("should export EC standards", async () => {
      renecService.exportECStandards.mockResolvedValue({} as any);
      await controller.exportECStandards("json");
      expect(renecService.exportECStandards).toHaveBeenCalledWith("json");
    });
  });

  // HARVEST CONTROL
  describe("startHarvest", () => {
    it("should start harvest", async () => {
      scraperService.startHarvest.mockResolvedValue({} as any);
      const dto = { mode: "full" as const, components: ["centros"] };
      await controller.startHarvest(dto as any);
      expect(scraperService.startHarvest).toHaveBeenCalledWith({
        mode: "full",
        components: ["centros"],
        maxPages: undefined,
        concurrency: undefined,
      });
    });
  });

  describe("getHarvestStatus", () => {
    it("should get harvest status", async () => {
      scraperService.getActiveRun.mockResolvedValue(null as any);
      await controller.getHarvestStatus();
      expect(scraperService.getActiveRun).toHaveBeenCalled();
    });
  });

  describe("stopHarvest", () => {
    it("should stop harvest", async () => {
      scraperService.stopHarvest.mockResolvedValue(true);
      const result = await controller.stopHarvest("run-1");
      expect(scraperService.stopHarvest).toHaveBeenCalledWith("run-1");
      expect(result).toEqual({ success: true, runId: "run-1" });
    });
  });

  describe("getHarvestRuns", () => {
    it("should get harvest runs", async () => {
      scraperService.getHarvestRuns.mockResolvedValue([]);
      await controller.getHarvestRuns(10);
      expect(scraperService.getHarvestRuns).toHaveBeenCalledWith(10);
    });
  });
});
