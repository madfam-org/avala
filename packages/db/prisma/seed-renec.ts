/**
 * RENEC Production Seed Script
 *
 * Seeds the database with real RENEC data from extracted JSON files
 * at packages/renec-client/data/extracted/.
 *
 * Loads: Sectors, Committees, EC Standards, Certifiers, Centers,
 *        Accreditations, Center Offerings, and EC Occupations.
 *
 * Usage:
 *   pnpm db:seed:renec                    # Seed from extracted data
 *   pnpm db:seed:renec --verbose          # With verbose logging
 */

import { PrismaClient } from "@prisma/client";
import { existsSync, readFileSync } from "fs";
import { join, resolve } from "path";
import { createHash } from "crypto";

const prisma = new PrismaClient();

// Path to the extracted data from renec-client
const EXTRACTED_DATA_DIR = resolve(
  __dirname,
  "../../renec-client/data/extracted",
);

// ─── Interfaces matching extracted JSON structures ───────────────────────────

interface ExtractedEC {
  idEstandarCompetencia: string;
  idSectorProductivo: string;
  codigo: string;
  nivel: string;
  titulo: string;
  comite: string;
  secProductivo: string;
}

interface ECECEMatrixFile {
  generated_at: string;
  total_ecs: number;
  matrix: Record<
    string,
    {
      ece_ids: string[];
      ece_count: number;
      title: string;
    }
  >;
}

interface ExtractedCertifier {
  id: string; // "ECE-00001"
  canonical_name: string;
  alternate_names: string[];
  normalized_key: string;
  entity_type: string;
  ec_codes: string[];
}

interface CertifierRegistryFile {
  generated_at: string;
  total_count: number;
  registry: ExtractedCertifier[];
}

interface ExtractedCenter {
  id: string; // "CCAP-00001"
  canonical_name: string;
  alternate_names: string[];
  normalized_key: string;
  ec_codes: string[];
  ec_count: number;
}

interface CenterRegistryFile {
  generated_at: string;
  total_count: number;
  registry: ExtractedCenter[];
}

interface ExtractedCommittee {
  clave: string;
  nombre: string;
  presidente: string | null;
  vicepresidente: string | null;
  calleNumero: string | null;
  colonia: string | null;
  codigoPostal: number | null;
  localidad: string | null;
  telefonos: string | null;
  correo: string | null;
  url: string | null;
  idSectorProductivo: number | null;
  sectorProductivoStr: string | null;
  puestoPresidente: string | null;
  puestoVicepresidente: string | null;
  fechaIntegracion: number | null;
  idTipoComite: number | null;
  contacto: string | null;
  delegacionStr: string | null;
  entidadStr: string | null;
  estandaresAsociados: {
    codigo: string;
    titulo: string;
  }[];
  id: number;
}

interface ECCertifiersAllFile {
  extraction_date: string;
  summary: Record<string, unknown>;
  failed_ecs: string[];
  ec_details: Record<
    string,
    {
      title: string;
      certifiers: string[];
      courses: string[];
      occupations: string[];
      committee_members: string[];
    }
  >;
}

// ─── INEGI State codes mapping ───────────────────────────────────────────────

const ESTADO_INEGI_MAP: Record<string, string> = {
  Aguascalientes: "01",
  "Baja California": "02",
  "Baja California Sur": "03",
  Campeche: "04",
  Coahuila: "05",
  Colima: "06",
  Chiapas: "07",
  Chihuahua: "08",
  "Ciudad de México": "09",
  CDMX: "09",
  "Distrito Federal": "09",
  "CIUDAD DE MÉXICO": "09",
  Durango: "10",
  Guanajuato: "11",
  Guerrero: "12",
  Hidalgo: "13",
  Jalisco: "14",
  México: "15",
  "Estado de México": "15",
  Michoacán: "16",
  Morelos: "17",
  Nayarit: "18",
  "Nuevo León": "19",
  Oaxaca: "20",
  Puebla: "21",
  Querétaro: "22",
  "Quintana Roo": "23",
  "San Luis Potosí": "24",
  Sinaloa: "25",
  Sonora: "26",
  Tabasco: "27",
  Tamaulipas: "28",
  Tlaxcala: "29",
  Veracruz: "30",
  Yucatán: "31",
  Zacatecas: "32",
};

// ─── CLI ─────────────────────────────────────────────────────────────────────

interface CLIArgs {
  verbose: boolean;
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  return {
    verbose: args.includes("--verbose") || args.includes("-v"),
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(message: string, verbose: boolean) {
  if (verbose) {
    console.log(`  [${new Date().toISOString()}] ${message}`);
  }
}

function normalizeEstadoInegi(
  estado: string | null | undefined,
): string | null {
  if (!estado) return null;
  const normalized = estado.trim();
  return ESTADO_INEGI_MAP[normalized] || null;
}

function contentHash(obj: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(obj))
    .digest("hex")
    .slice(0, 16);
}

function loadJsonFile<T>(fileName: string, label: string): T | null {
  const filePath = join(EXTRACTED_DATA_DIR, fileName);
  if (!existsSync(filePath)) {
    console.log(`   ⚠️  ${label} not found at ${filePath}`);
    return null;
  }
  try {
    const content = readFileSync(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch (error) {
    console.log(`   ⚠️  Failed to parse ${label}:`, error);
    return null;
  }
}

// ─── Step 1: Seed Sectors from ec_standards_api.json ─────────────────────────

async function seedSectors(
  ecStandards: ExtractedEC[],
  verbose: boolean,
): Promise<Map<number, string>> {
  // Build unique sector mapping from EC data: idSectorProductivo → secProductivo name
  const sectorMap = new Map<number, string>();
  for (const ec of ecStandards) {
    const sectorIdInt = parseInt(ec.idSectorProductivo, 10);
    if (!isNaN(sectorIdInt) && !sectorMap.has(sectorIdInt)) {
      sectorMap.set(sectorIdInt, ec.secProductivo || `Sector ${sectorIdInt}`);
    }
  }

  const sectorLookup = new Map<number, string>(); // sectorIdInt → DB UUID
  const BATCH_SIZE = 50;
  const entries = Array.from(sectorMap.entries());

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);

    const results = await prisma.$transaction(
      batch.map(([sectorIdInt, nombre]) => {
        const data = {
          nombre,
          tipo: "productivo",
          sourceUrl: `https://conocer.gob.mx/conocer/#/renec`,
          contentHash: contentHash({ sectorId: sectorIdInt, nombre }),
          lastSyncedAt: new Date(),
        };

        return prisma.renecSector.upsert({
          where: { sectorId: sectorIdInt },
          update: data,
          create: { sectorId: sectorIdInt, ...data },
        });
      }),
    );

    for (const result of results) {
      sectorLookup.set(result.sectorId, result.id);
    }

    log(`Sectors batch ${i}-${i + batch.length} processed`, verbose);
  }

  return sectorLookup;
}

// ─── Step 2: Seed Committees from committees_complete.json ───────────────────

async function seedCommittees(
  committees: ExtractedCommittee[],
  sectorLookup: Map<number, string>,
  verbose: boolean,
): Promise<Map<string, string>> {
  const committeeLookup = new Map<string, string>(); // committeeKey → DB UUID
  const BATCH_SIZE = 50;

  for (let i = 0; i < committees.length; i += BATCH_SIZE) {
    const batch = committees.slice(i, i + BATCH_SIZE);

    const results = await prisma.$transaction(
      batch.map((committee) => {
        const committeeKey = committee.clave;

        // Resolve sector FK
        const sectorDbId =
          committee.idSectorProductivo != null
            ? sectorLookup.get(committee.idSectorProductivo) ?? null
            : null;

        // Parse fechaIntegracion from epoch milliseconds
        const fechaIntegracion =
          committee.fechaIntegracion != null
            ? new Date(committee.fechaIntegracion)
            : null;

        const data = {
          nombre: committee.nombre || "",
          presidente: committee.presidente ?? null,
          vicepresidente: committee.vicepresidente ?? null,
          puestoPresidente: committee.puestoPresidente ?? null,
          puestoVicepresidente: committee.puestoVicepresidente ?? null,
          contacto: committee.contacto ?? null,
          correo: committee.correo ?? null,
          telefonos: committee.telefonos ?? null,
          url: committee.url ?? null,
          calleNumero: committee.calleNumero ?? null,
          colonia: committee.colonia ?? null,
          codigoPostal:
            committee.codigoPostal != null
              ? String(committee.codigoPostal)
              : null,
          localidad: committee.localidad ?? null,
          delegacion: committee.delegacionStr ?? null,
          entidad: committee.entidadStr ?? null,
          fechaIntegracion,
          idTipoComite: committee.idTipoComite ?? null,
          sectorId: sectorDbId,
          sourceUrl: `https://conocer.gob.mx/conocer/#/renec`,
          contentHash: contentHash(committee),
          lastSyncedAt: new Date(),
        };

        return prisma.renecCommittee.upsert({
          where: { committeeKey },
          update: data,
          create: { committeeKey, ...data },
        });
      }),
    );

    for (const result of results) {
      committeeLookup.set(result.committeeKey, result.id);
    }

    log(`Committees batch ${i}-${i + batch.length} processed`, verbose);
  }

  return committeeLookup;
}

// ─── Step 3: Seed EC Standards from ec_standards_api.json ────────────────────

// Pre-built reverse lookup: ecClave → committee key
let _ecToCommitteeKeyCache: Map<string, string> | null = null;

function buildEcToCommitteeKeyIndex(
  committees: ExtractedCommittee[],
): Map<string, string> {
  if (!_ecToCommitteeKeyCache) {
    _ecToCommitteeKeyCache = new Map();
    for (const committee of committees) {
      for (const ea of committee.estandaresAsociados ?? []) {
        if (ea.codigo) {
          _ecToCommitteeKeyCache.set(ea.codigo, committee.clave);
        }
      }
    }
  }
  return _ecToCommitteeKeyCache;
}

async function seedECStandards(
  ecStandards: ExtractedEC[],
  committees: ExtractedCommittee[],
  ecDetailsLookup: ECCertifiersAllFile["ec_details"] | null,
  sectorLookup: Map<number, string>,
  committeeLookup: Map<string, string>,
  verbose: boolean,
): Promise<{ created: number; updated: number; skipped: number }> {
  let created = 0;
  const updated = 0;
  const skipped = 0;

  // Build reverse index: ecClave → committeeKey
  const ecToCommitteeKey = buildEcToCommitteeKeyIndex(committees);

  // Batch upsert using transactions for performance
  const BATCH_SIZE = 100;

  // Collect EC DB IDs for occupation seeding afterwards
  const ecDbIds = new Map<string, string>(); // ecClave → DB UUID

  for (let i = 0; i < ecStandards.length; i += BATCH_SIZE) {
    const batch = ecStandards.slice(i, i + BATCH_SIZE);

    const results = await prisma.$transaction(
      batch.map((ec) => {
        const ecClave = ec.codigo;
        if (!ecClave) return prisma.$queryRaw`SELECT 1`; // no-op

        // Resolve committee FK via reverse index
        const committeeKey = ecToCommitteeKey.get(ecClave) ?? null;
        const committeeDbId = committeeKey
          ? committeeLookup.get(committeeKey) ?? null
          : null;

        // Resolve sector FK
        const sectorIdInt = parseInt(ec.idSectorProductivo, 10);
        const sectorDbId = !isNaN(sectorIdInt)
          ? sectorLookup.get(sectorIdInt) ?? null
          : null;

        // Find occupations & committee members from ec_certifiers_all
        const ecDetail = ecDetailsLookup?.[ecClave] ?? null;

        // Find committee data for competencias JSON
        const committeeData = committeeKey
          ? committees.find((c) => c.clave === committeeKey) ?? null
          : null;

        const data = {
          titulo: ec.titulo || "",
          version: "01",
          vigente: true,
          sector: ec.secProductivo || null,
          nivelCompetencia: ec.nivel ? parseInt(ec.nivel, 10) : null,
          proposito: null as string | null,
          committeeId: committeeDbId,
          sectorId: sectorDbId,
          competencias: buildCompetenciasJson(ec, committeeData, ecDetail),
          elementosJson: [],
          critDesempeno: [],
          critConocimiento: [],
          critProducto: [],
          sourceUrl: `https://conocer.gob.mx/conocer/#/renec`,
          contentHash: contentHash(ec),
          lastSyncedAt: new Date(),
        };

        return prisma.renecEC.upsert({
          where: { ecClave },
          update: data,
          create: { ecClave, ...data },
        });
      }),
    );

    // Collect DB UUIDs from upsert results
    for (const result of results) {
      if (result && typeof result === "object" && "ecClave" in result) {
        const r = result as { id: string; ecClave: string };
        ecDbIds.set(r.ecClave, r.id);
      }
    }

    const batchEnd = Math.min(i + BATCH_SIZE, ecStandards.length);
    log(`EC Standards batch ${i}-${batchEnd} processed`, verbose);
    created += batch.length; // approximation (upsert doesn't distinguish)
  }

  // Seed EC Occupations from ecDetailsLookup
  if (ecDetailsLookup) {
    let totalOccupations = 0;
    const occupationPairs: { ecId: string; occupation: string }[] = [];

    for (const [ecClave, detail] of Object.entries(ecDetailsLookup)) {
      const ecDbId = ecDbIds.get(ecClave);
      if (!ecDbId) continue;

      for (const occupation of detail.occupations ?? []) {
        if (occupation && occupation.trim().length > 0) {
          occupationPairs.push({ ecId: ecDbId, occupation: occupation.trim() });
        }
      }
    }

    const OCC_BATCH_SIZE = 200;
    for (let i = 0; i < occupationPairs.length; i += OCC_BATCH_SIZE) {
      const batch = occupationPairs.slice(i, i + OCC_BATCH_SIZE);

      const result = await prisma.renecECOccupation.createMany({
        data: batch,
        skipDuplicates: true,
      });

      totalOccupations += result.count;
      log(
        `EC Occupations batch ${i}-${i + batch.length}: ${result.count} created`,
        verbose,
      );
    }

    console.log(`   EC Occupations: ${totalOccupations} created`);
  }

  return { created, updated, skipped };
}

function buildCompetenciasJson(
  ec: ExtractedEC,
  committee: ExtractedCommittee | null,
  ecDetail: ECCertifiersAllFile["ec_details"][string] | null,
): object {
  return {
    comite: ec.comite || null,
    idSectorProductivo: ec.idSectorProductivo || null,
    idEstandarCompetencia: ec.idEstandarCompetencia || null,
    ...(committee
      ? {
          committeeKey: committee.clave || null,
          committeeName: committee.nombre || null,
          committeePresident: committee.presidente || null,
          committeeContact: committee.correo || null,
          committeeSector: committee.sectorProductivoStr || null,
          committeeState: committee.entidadStr || null,
        }
      : {}),
    ...(ecDetail
      ? {
          occupations: ecDetail.occupations || [],
          courses: ecDetail.courses || [],
          committeeMembers: ecDetail.committee_members || [],
        }
      : {}),
  };
}

// ─── Step 4: Seed Certifiers from master_ece_registry.json ───────────────────

function resolveCertifierTipo(entityType: string): "ECE" | "OC" {
  const upper = (entityType || "").toUpperCase();
  if (upper.includes("OC") || upper.includes("GOBIERNO")) {
    return "OC";
  }
  // Default to ECE for "ECE", "Unknown", "SA de CV", "SC", or anything else
  return "ECE";
}

async function seedCertifiers(
  registry: ExtractedCertifier[],
  verbose: boolean,
): Promise<number> {
  let processed = 0;
  const BATCH_SIZE = 50;

  for (let i = 0; i < registry.length; i += BATCH_SIZE) {
    const batch = registry.slice(i, i + BATCH_SIZE);

    await prisma.$transaction(
      batch.map((cert) => {
        const certId = cert.id; // "ECE-00001"

        const data = {
          razonSocial: cert.canonical_name || "",
          nombreComercial: null as string | null,
          activo: true,
          tipo: resolveCertifierTipo(cert.entity_type),
          alternateNames: cert.alternate_names ?? [],
          normalizedKey: cert.normalized_key ?? null,
          sourceUrl: `https://conocer.gob.mx/conocer/#/renec`,
          contentHash: contentHash(cert),
          lastSyncedAt: new Date(),
        };

        return prisma.renecCertifier.upsert({
          where: { certId },
          update: data,
          create: { certId, ...data },
        });
      }),
    );

    processed += batch.length;
    log(`Certifiers batch ${i}-${i + batch.length} processed`, verbose);
  }

  return processed;
}

// ─── Step 5: Seed Centers from master_ccap_registry.json ─────────────────────

async function seedCenters(
  registry: ExtractedCenter[],
  verbose: boolean,
): Promise<number> {
  let processed = 0;
  const BATCH_SIZE = 50;

  for (let i = 0; i < registry.length; i += BATCH_SIZE) {
    const batch = registry.slice(i, i + BATCH_SIZE);

    await prisma.$transaction(
      batch.map((center) => {
        const centerId = center.id; // "CCAP-00001"

        const data = {
          nombre: center.canonical_name || "",
          activo: true,
          alternateNames: center.alternate_names ?? [],
          normalizedKey: center.normalized_key ?? null,
          sourceUrl: `https://conocer.gob.mx/conocer/#/renec`,
          contentHash: contentHash(center),
          lastSyncedAt: new Date(),
        };

        return prisma.renecCenter.upsert({
          where: { centerId },
          update: data,
          create: { centerId, ...data },
        });
      }),
    );

    processed += batch.length;
    log(`Centers batch ${i}-${i + batch.length} processed`, verbose);
  }

  return processed;
}

// ─── Step 6: Seed Accreditations from ec_ece_matrix.json ─────────────────────

async function seedAccreditations(
  matrix: ECECEMatrixFile["matrix"],
  verbose: boolean,
): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;

  // Pre-fetch all RenecEC and RenecCertifier IDs for fast lookup
  console.log("   Building lookup tables...");
  const allECs = await prisma.renecEC.findMany({
    select: { id: true, ecClave: true },
  });
  const ecLookup = new Map(allECs.map((ec) => [ec.ecClave, ec.id]));

  const allCerts = await prisma.renecCertifier.findMany({
    select: { id: true, certId: true },
  });
  const certLookup = new Map(allCerts.map((c) => [c.certId, c.id]));

  console.log(
    `   Lookup: ${ecLookup.size} ECs, ${certLookup.size} Certifiers`,
  );

  // Collect all valid accreditation pairs
  const pairs: { ecId: string; certifierId: string }[] = [];

  for (const [ecClave, entry] of Object.entries(matrix)) {
    const ecId = ecLookup.get(ecClave);
    if (!ecId) {
      log(`Accreditation skip: EC ${ecClave} not in DB`, verbose);
      continue;
    }

    for (const eceId of entry.ece_ids) {
      const certifierId = certLookup.get(eceId);
      if (!certifierId) {
        log(`Accreditation skip: Certifier ${eceId} not in DB`, verbose);
        skipped++;
        continue;
      }
      pairs.push({ ecId, certifierId });
    }
  }

  console.log(`   Inserting ${pairs.length} accreditation records...`);

  // Batch insert accreditations
  const BATCH_SIZE = 200;
  for (let i = 0; i < pairs.length; i += BATCH_SIZE) {
    const batch = pairs.slice(i, i + BATCH_SIZE);

    // Use skipDuplicates to handle re-runs gracefully
    const result = await prisma.renecAccreditation.createMany({
      data: batch.map((p) => ({
        certifierId: p.certifierId,
        ecId: p.ecId,
        vigente: true,
      })),
      skipDuplicates: true,
    });

    created += result.count;
    log(
      `Accreditations batch ${i}-${i + batch.length}: ${result.count} created`,
      verbose,
    );
  }

  skipped = pairs.length - created;

  return { created, skipped };
}

// ─── Step 7: Seed Center Offerings from master_ccap_registry.json ────────────

async function seedCenterOfferings(
  registry: ExtractedCenter[],
  verbose: boolean,
): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;

  // Pre-fetch lookups
  const allECs = await prisma.renecEC.findMany({
    select: { id: true, ecClave: true },
  });
  const ecLookup = new Map(allECs.map((ec) => [ec.ecClave, ec.id]));

  const allCenters = await prisma.renecCenter.findMany({
    select: { id: true, centerId: true },
  });
  const centerLookup = new Map(allCenters.map((c) => [c.centerId, c.id]));

  // Collect all valid offering pairs
  const pairs: { centerId: string; ecId: string }[] = [];

  for (const center of registry) {
    const centerDbId = centerLookup.get(center.id);
    if (!centerDbId) continue;

    for (const ecCode of center.ec_codes) {
      const ecId = ecLookup.get(ecCode);
      if (!ecId) {
        log(`Offering skip: EC ${ecCode} not in DB`, verbose);
        skipped++;
        continue;
      }
      pairs.push({ centerId: centerDbId, ecId });
    }
  }

  console.log(`   Inserting ${pairs.length} center offering records...`);

  const BATCH_SIZE = 200;
  for (let i = 0; i < pairs.length; i += BATCH_SIZE) {
    const batch = pairs.slice(i, i + BATCH_SIZE);

    const result = await prisma.renecCenterOffering.createMany({
      data: batch.map((p) => ({
        centerId: p.centerId,
        ecId: p.ecId,
        activo: true,
      })),
      skipDuplicates: true,
    });

    created += result.count;
    log(
      `Offerings batch ${i}-${i + batch.length}: ${result.count} created`,
      verbose,
    );
  }

  skipped = pairs.length - created + skipped;

  return { created, skipped };
}

// ─── Sync Job Record ─────────────────────────────────────────────────────────

async function createSyncJobRecord(
  stats: Record<string, number>,
  startTime: Date,
): Promise<void> {
  const totalProcessed = Object.values(stats).reduce((a, b) => a + b, 0);

  await prisma.renecSyncJob.create({
    data: {
      jobType: "FULL_SYNC",
      status: "COMPLETED",
      startedAt: startTime,
      completedAt: new Date(),
      itemsProcessed: totalProcessed,
      itemsCreated: totalProcessed,
      itemsUpdated: 0,
      itemsSkipped: 0,
      errors: [],
    },
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs();
  const startTime = new Date();

  console.log("🌱 RENEC Production Seed (Phase 1B)\n");
  console.log(`   Data directory: ${EXTRACTED_DATA_DIR}`);
  console.log("");

  // Verify data directory exists
  if (!existsSync(EXTRACTED_DATA_DIR)) {
    console.log(`❌ Extracted data directory not found: ${EXTRACTED_DATA_DIR}`);
    console.log(
      "   Run the RENEC extractor first: cd packages/renec-client && pnpm extract\n",
    );
    process.exit(1);
  }

  // ── Load all data files ──────────────────────────────────────────────────

  console.log("📂 Loading data files...");

  const ecStandards = loadJsonFile<ExtractedEC[]>(
    "ec_standards_api.json",
    "EC Standards API",
  );
  const eceMatrix = loadJsonFile<ECECEMatrixFile>(
    "ec_ece_matrix.json",
    "EC-ECE Matrix",
  );
  const certifierRegistry = loadJsonFile<CertifierRegistryFile>(
    "master_ece_registry.json",
    "Certifier Registry",
  );
  const centerRegistry = loadJsonFile<CenterRegistryFile>(
    "master_ccap_registry.json",
    "Center Registry",
  );
  const committees = loadJsonFile<ExtractedCommittee[]>(
    "committees_complete.json",
    "Committees",
  );
  const ecCertifiersAll = loadJsonFile<ECCertifiersAllFile>(
    "ec_certifiers_all.json",
    "EC Certifiers All",
  );

  console.log(`   EC Standards:  ${ecStandards?.length ?? 0}`);
  console.log(`   Certifiers:    ${certifierRegistry?.registry?.length ?? 0}`);
  console.log(`   Centers:       ${centerRegistry?.registry?.length ?? 0}`);
  console.log(`   Committees:    ${committees?.length ?? 0}`);
  console.log(
    `   EC-ECE Matrix: ${eceMatrix ? Object.keys(eceMatrix.matrix).length : 0} ECs`,
  );
  console.log(
    `   EC Details:    ${ecCertifiersAll ? Object.keys(ecCertifiersAll.ec_details).length : 0} ECs`,
  );
  console.log("");

  if (!ecStandards || ecStandards.length === 0) {
    console.log(
      "⚠️  No EC standards data found. Cannot proceed.\n",
    );
    process.exit(1);
  }

  const validEcStandards: ExtractedEC[] = ecStandards;
  const validCommittees: ExtractedCommittee[] = committees ?? [];

  const stats: Record<string, number> = {};

  // ── Step 1: Seed Sectors ───────────────────────────────────────────────

  console.log("💾 Step 1/7: Seeding Sectors...");
  const sectorLookup = await seedSectors(validEcStandards, args.verbose);
  console.log(`   ✅ ${sectorLookup.size} Sectors processed\n`);
  stats.sectors = sectorLookup.size;

  // ── Step 2: Seed Committees ────────────────────────────────────────────

  if (validCommittees.length > 0) {
    console.log("💾 Step 2/7: Seeding Committees...");
    const committeeLookup = await seedCommittees(
      validCommittees,
      sectorLookup,
      args.verbose,
    );
    console.log(`   ✅ ${committeeLookup.size} Committees processed\n`);
    stats.committees = committeeLookup.size;

    // ── Step 3: Seed EC Standards ──────────────────────────────────────────

    console.log("💾 Step 3/7: Seeding EC Standards...");
    const ecResult = await seedECStandards(
      validEcStandards,
      validCommittees,
      ecCertifiersAll?.ec_details ?? null,
      sectorLookup,
      committeeLookup,
      args.verbose,
    );
    console.log(
      `   ✅ ${ecResult.created} EC Standards processed\n`,
    );
    stats.ecStandards = ecResult.created;
  } else {
    console.log("⏭️  Step 2/7: Skipping Committees (no data)\n");

    // Still seed EC Standards without committee lookup
    console.log("💾 Step 3/7: Seeding EC Standards...");
    const emptyCommitteeLookup = new Map<string, string>();
    const ecResult = await seedECStandards(
      validEcStandards,
      validCommittees,
      ecCertifiersAll?.ec_details ?? null,
      sectorLookup,
      emptyCommitteeLookup,
      args.verbose,
    );
    console.log(
      `   ✅ ${ecResult.created} EC Standards processed\n`,
    );
    stats.ecStandards = ecResult.created;
  }

  // ── Step 4: Seed Certifiers ──────────────────────────────────────────────

  if (certifierRegistry?.registry) {
    console.log("💾 Step 4/7: Seeding Certifiers...");
    const certCount = await seedCertifiers(
      certifierRegistry.registry,
      args.verbose,
    );
    console.log(`   ✅ ${certCount} Certifiers processed\n`);
    stats.certifiers = certCount;
  } else {
    console.log("⏭️  Step 4/7: Skipping Certifiers (no data)\n");
  }

  // ── Step 5: Seed Centers ─────────────────────────────────────────────────

  if (centerRegistry?.registry) {
    console.log("💾 Step 5/7: Seeding Centers...");
    const centerCount = await seedCenters(
      centerRegistry.registry,
      args.verbose,
    );
    console.log(`   ✅ ${centerCount} Centers processed\n`);
    stats.centers = centerCount;
  } else {
    console.log("⏭️  Step 5/7: Skipping Centers (no data)\n");
  }

  // ── Step 6: Seed Accreditations ──────────────────────────────────────────

  if (eceMatrix?.matrix) {
    console.log("💾 Step 6/7: Seeding Accreditations (EC→Certifier)...");
    const accResult = await seedAccreditations(eceMatrix.matrix, args.verbose);
    console.log(
      `   ✅ ${accResult.created} Accreditations created (${accResult.skipped} skipped)\n`,
    );
    stats.accreditations = accResult.created;
  } else {
    console.log("⏭️  Step 6/7: Skipping Accreditations (no data)\n");
  }

  // ── Step 7: Seed Center Offerings ────────────────────────────────────────

  if (centerRegistry?.registry) {
    console.log("💾 Step 7/7: Seeding Center Offerings (Center→EC)...");
    const offerResult = await seedCenterOfferings(
      centerRegistry.registry,
      args.verbose,
    );
    console.log(
      `   ✅ ${offerResult.created} Center Offerings created (${offerResult.skipped} skipped)\n`,
    );
    stats.centerOfferings = offerResult.created;
  } else {
    console.log("⏭️  Step 7/7: Skipping Center Offerings (no data)\n");
  }

  // ── Record sync job ──────────────────────────────────────────────────────

  await createSyncJobRecord(stats, startTime);

  // ── Summary ──────────────────────────────────────────────────────────────

  const duration = ((Date.now() - startTime.getTime()) / 1000).toFixed(2);

  console.log("═══════════════════════════════════════");
  console.log("✅ RENEC seed completed!\n");
  console.log("📊 Seed Summary:");
  for (const [key, value] of Object.entries(stats)) {
    console.log(`   ${key}: ${value}`);
  }
  console.log(`   Duration: ${duration}s\n`);

  // Get final counts from database
  const [
    ecCount,
    certCount,
    centerCount,
    accCount,
    offeringCount,
    sectorCount,
    committeeCount,
    occupationCount,
    syncCount,
  ] = await Promise.all([
    prisma.renecEC.count(),
    prisma.renecCertifier.count(),
    prisma.renecCenter.count(),
    prisma.renecAccreditation.count(),
    prisma.renecCenterOffering.count(),
    prisma.renecSector.count(),
    prisma.renecCommittee.count(),
    prisma.renecECOccupation.count(),
    prisma.renecSyncJob.count(),
  ]);

  console.log("📈 Database State:");
  console.log(`   RenecSector:          ${sectorCount}`);
  console.log(`   RenecCommittee:       ${committeeCount}`);
  console.log(`   RenecEC:              ${ecCount}`);
  console.log(`   RenecECOccupation:    ${occupationCount}`);
  console.log(`   RenecCertifier:       ${certCount}`);
  console.log(`   RenecCenter:          ${centerCount}`);
  console.log(`   RenecAccreditation:   ${accCount}`);
  console.log(`   RenecCenterOffering:  ${offeringCount}`);
  console.log(`   RenecSyncJob:         ${syncCount}`);
  console.log(
    `   Total:                ${sectorCount + committeeCount + ecCount + occupationCount + certCount + centerCount + accCount + offeringCount + syncCount}`,
  );
  console.log("");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding RENEC data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
