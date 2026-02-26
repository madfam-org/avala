import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiTooManyRequestsResponse,
} from "@nestjs/swagger";
import { ThrottlerGuard, Throttle } from "@nestjs/throttler";
import { RenecService } from "./renec.service";
import { RenecScraperService } from "./renec-scraper.service";
import {
  CentroQueryDto,
  CertificadorQueryDto,
  RenecECQueryDto,
  RenecSearchDto,
  StartHarvestDto,
} from "./dto/renec.dto";

@ApiTags("RENEC Directory")
@Controller("renec")
@UseGuards(ThrottlerGuard)
@Throttle({ default: { ttl: 60000, limit: 30 } })
@ApiTooManyRequestsResponse({ description: "Too many requests. Please try again later." })
export class RenecController {
  constructor(
    private readonly renecService: RenecService,
    private readonly scraperService: RenecScraperService,
  ) {}

  // ============================================
  // CENTROS
  // ============================================

  @Get("centros")
  @ApiOperation({ summary: "List evaluation centers" })
  @ApiResponse({ status: 200, description: "List of centros with pagination" })
  async getCentros(@Query() query: CentroQueryDto) {
    return this.renecService.getCentros(query);
  }

  @Get("centros/:centroId")
  @ApiOperation({ summary: "Get centro by ID" })
  @ApiResponse({
    status: 200,
    description: "Centro details with relationships",
  })
  async getCentroById(@Param("centroId") centroId: string) {
    return this.renecService.getCentroById(centroId);
  }

  // ============================================
  // CERTIFICADORES
  // ============================================

  @Get("certificadores")
  @ApiOperation({ summary: "List certificadores (ECE/OC)" })
  @ApiResponse({
    status: 200,
    description: "List of certificadores with pagination",
  })
  async getCertificadores(@Query() query: CertificadorQueryDto) {
    return this.renecService.getCertificadores(query);
  }

  @Get("certificadores/:certId")
  @ApiOperation({ summary: "Get certificador by ID" })
  @ApiResponse({
    status: 200,
    description: "Certificador details with centers",
  })
  async getCertificadorById(@Param("certId") certId: string) {
    return this.renecService.getCertificadorById(certId);
  }

  // ============================================
  // EC STANDARDS (from RENEC)
  // ============================================

  @Get("ec-standards")
  @ApiOperation({ summary: "List EC standards from RENEC" })
  @ApiResponse({
    status: 200,
    description: "List of EC standards with pagination",
  })
  async getRenecECStandards(@Query() query: RenecECQueryDto) {
    return this.renecService.getRenecECStandards(query);
  }

  @Get("ec-standards/sectors")
  @ApiOperation({ summary: "Get all EC sectors with counts" })
  @ApiResponse({
    status: 200,
    description: "List of sectors with EC counts",
  })
  async getSectors() {
    return this.renecService.getSectors();
  }

  @Get("ec-standards/:ecClave")
  @ApiOperation({ summary: "Get EC standard by code" })
  @ApiResponse({
    status: 200,
    description: "EC standard details with evaluating centers",
  })
  async getRenecECById(@Param("ecClave") ecClave: string) {
    return this.renecService.getRenecECById(ecClave);
  }

  // ============================================
  // SEARCH
  // ============================================

  @Get("search")
  @ApiOperation({ summary: "Search across all RENEC entities" })
  @ApiResponse({ status: 200, description: "Search results with scores" })
  async search(@Query() query: RenecSearchDto) {
    return this.renecService.search(query);
  }

  // ============================================
  // STATISTICS
  // ============================================

  @Get("stats")
  @ApiOperation({ summary: "Get RENEC data statistics" })
  @ApiResponse({ status: 200, description: "Statistics and data freshness" })
  async getStats() {
    return this.renecService.getStats();
  }

  // ============================================
  // EXPORT
  // ============================================

  @Get("export/centros")
  @ApiOperation({ summary: "Export centros data" })
  async exportCentros(@Query("format") format: "json" | "csv" = "json") {
    return this.renecService.exportCentros(format);
  }

  @Get("export/certificadores")
  @ApiOperation({ summary: "Export certificadores data" })
  async exportCertificadores(@Query("format") format: "json" | "csv" = "json") {
    return this.renecService.exportCertificadores(format);
  }

  @Get("export/ec-standards")
  @ApiOperation({ summary: "Export EC standards data" })
  async exportECStandards(@Query("format") format: "json" | "csv" = "json") {
    return this.renecService.exportECStandards(format);
  }

  // ============================================
  // HARVEST CONTROL (Admin only)
  // ============================================

  @Post("harvest/start")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Start a RENEC harvest job" })
  @ApiResponse({ status: 201, description: "Harvest job started" })
  async startHarvest(@Body() dto: StartHarvestDto) {
    return this.scraperService.startHarvest({
      mode: dto.mode,
      components: dto.components,
      maxPages: dto.maxPages,
      concurrency: dto.concurrency,
    });
  }

  @Get("harvest/status")
  @ApiOperation({ summary: "Get current harvest status" })
  @ApiResponse({ status: 200, description: "Active harvest run or null" })
  async getHarvestStatus() {
    return this.scraperService.getActiveRun();
  }

  @Post("harvest/stop/:runId")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Stop a running harvest" })
  async stopHarvest(@Param("runId") runId: string) {
    const stopped = await this.scraperService.stopHarvest(runId);
    return { success: stopped, runId };
  }

  @Get("harvest/runs")
  @ApiOperation({ summary: "Get recent harvest runs" })
  @ApiResponse({ status: 200, description: "List of recent harvest runs" })
  async getHarvestRuns(@Query("limit") limit?: number) {
    return this.scraperService.getHarvestRuns(limit || 10);
  }
}
