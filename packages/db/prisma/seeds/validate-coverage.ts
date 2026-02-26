/**
 * RENEC Data Coverage Validation Script
 *
 * Queries every RENEC table and reports:
 * - Record counts per model
 * - Completeness metrics
 * - Field-level coverage per model
 * - Data quality checks
 * - Referential integrity validation
 *
 * Usage:
 *   pnpm db:seed:validate
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ValidationResult {
  check: string;
  status: "PASS" | "WARN" | "FAIL";
  detail: string;
}

function pct(numerator: number, denominator: number): string {
  if (denominator === 0) return "N/A";
  return ((numerator / denominator) * 100).toFixed(1);
}

function fieldLine(
  label: string,
  populated: number,
  total: number,
): string {
  return `      ${label}: ${populated}/${total} (${pct(populated, total)}%)`;
}

async function main() {
  console.log("🔍 RENEC Data Coverage Validation\n");
  console.log("═══════════════════════════════════════\n");

  const results: ValidationResult[] = [];

  // ── 1. Record Counts ─────────────────────────────────────────────────────

  console.log("📊 Record Counts:");

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

  const counts = {
    RenecEC: { actual: ecCount, expected: 1477 },
    RenecCertifier: { actual: certCount, expected: 482 },
    RenecCenter: { actual: centerCount, expected: 340 },
    RenecAccreditation: { actual: accCount, expected: 7573 },
    RenecCenterOffering: { actual: offeringCount, expected: 680 },
    RenecSector: { actual: sectorCount, expected: 22 },
    RenecCommittee: { actual: committeeCount, expected: 90 },
    RenecECOccupation: { actual: occupationCount, expected: 2000 },
    RenecSyncJob: { actual: syncCount, expected: 1 },
  };

  let totalRecords = 0;
  for (const [model, { actual, expected }] of Object.entries(counts)) {
    const percentage = pct(actual, expected);
    const status = actual >= expected * 0.9 ? "✅" : actual > 0 ? "⚠️" : "❌";
    console.log(
      `   ${status} ${model}: ${actual} / ~${expected} expected (${percentage}%)`,
    );
    totalRecords += actual;

    results.push({
      check: `${model} count`,
      status: actual >= expected * 0.9 ? "PASS" : actual > 0 ? "WARN" : "FAIL",
      detail: `${actual}/${expected} (${percentage}%)`,
    });
  }

  console.log(`\n   Total records: ${totalRecords}\n`);

  // ── 2. EC Data Completeness ──────────────────────────────────────────────

  console.log("📋 EC Standards Completeness:");

  const [
    ecsWithSector,
    ecsWithLevel,
    ecsWithProposito,
    ecsVigente,
    ecsWithCommitteeId,
    ecsWithSectorId,
    ecsWithDescripcion,
    ecsWithFechaDOF,
    ecsWithUrlPDF,
  ] = await Promise.all([
    prisma.renecEC.count({ where: { sector: { not: null } } }),
    prisma.renecEC.count({ where: { nivelCompetencia: { not: null } } }),
    prisma.renecEC.count({ where: { proposito: { not: null } } }),
    prisma.renecEC.count({ where: { vigente: true } }),
    prisma.renecEC.count({ where: { committeeId: { not: null } } }),
    prisma.renecEC.count({ where: { sectorId: { not: null } } }),
    prisma.renecEC.count({ where: { descripcion: { not: null } } }),
    prisma.renecEC.count({ where: { fechaPublicacionDOF: { not: null } } }),
    prisma.renecEC.count({ where: { urlPDF: { not: null } } }),
  ]);

  console.log(`   Sector (string):      ${ecsWithSector}/${ecCount}`);
  console.log(`   Level populated:      ${ecsWithLevel}/${ecCount}`);
  console.log(`   Proposito populated:  ${ecsWithProposito}/${ecCount}`);
  console.log(`   Vigente (active):     ${ecsVigente}/${ecCount}`);
  console.log(`   committeeId (FK):     ${ecsWithCommitteeId}/${ecCount}`);
  console.log(`   sectorId (FK):        ${ecsWithSectorId}/${ecCount}`);
  console.log(`   descripcion:          ${ecsWithDescripcion}/${ecCount}`);
  console.log(`   fechaPublicacionDOF:  ${ecsWithFechaDOF}/${ecCount}`);
  console.log(`   urlPDF:               ${ecsWithUrlPDF}/${ecCount}`);
  console.log("");

  // ── 3. EC Code Format Validation ─────────────────────────────────────────

  console.log("🔤 EC Code Format Validation:");

  const allECs = await prisma.renecEC.findMany({
    select: { ecClave: true },
  });
  const ecCodeRegex = /^EC\d{4}(\.\d{2})?$/;
  const invalidCodes = allECs.filter((ec) => !ecCodeRegex.test(ec.ecClave));

  if (invalidCodes.length === 0) {
    console.log("   ✅ All EC codes match format EC####[.##]");
    results.push({
      check: "EC code format",
      status: "PASS",
      detail: "All codes valid",
    });
  } else {
    console.log(
      `   ⚠️  ${invalidCodes.length} codes don't match expected format:`,
    );
    for (const ec of invalidCodes.slice(0, 10)) {
      console.log(`      - ${ec.ecClave}`);
    }
    results.push({
      check: "EC code format",
      status: "WARN",
      detail: `${invalidCodes.length} codes with non-standard format`,
    });
  }
  console.log("");

  // ── 4. Field-Level Coverage Report ───────────────────────────────────────

  console.log("📊 Field-Level Coverage Report:");

  // RenecCertifier field coverage
  console.log("\n   RenecCertifier:");
  const [
    certWithAltNames,
    certWithNormKey,
    certWithDireccion,
    certWithTelefono,
    certWithEmail,
    certWithSitioWeb,
    certWithRfc,
    certWithRepLegal,
    certWithEstado,
    certWithEstadoInegi,
  ] = await Promise.all([
    prisma.renecCertifier.count({ where: { alternateNames: { isEmpty: false } } }),
    prisma.renecCertifier.count({ where: { normalizedKey: { not: null } } }),
    prisma.renecCertifier.count({ where: { direccion: { not: null } } }),
    prisma.renecCertifier.count({ where: { telefono: { not: null } } }),
    prisma.renecCertifier.count({ where: { email: { not: null } } }),
    prisma.renecCertifier.count({ where: { sitioWeb: { not: null } } }),
    prisma.renecCertifier.count({ where: { rfc: { not: null } } }),
    prisma.renecCertifier.count({ where: { representanteLegal: { not: null } } }),
    prisma.renecCertifier.count({ where: { estado: { not: null } } }),
    prisma.renecCertifier.count({ where: { estadoInegi: { not: null } } }),
  ]);

  console.log(fieldLine("alternateNames", certWithAltNames, certCount));
  console.log(fieldLine("normalizedKey", certWithNormKey, certCount));
  console.log(fieldLine("direccion", certWithDireccion, certCount));
  console.log(fieldLine("telefono", certWithTelefono, certCount));
  console.log(fieldLine("email", certWithEmail, certCount));
  console.log(fieldLine("sitioWeb", certWithSitioWeb, certCount));
  console.log(fieldLine("rfc", certWithRfc, certCount));
  console.log(fieldLine("representanteLegal", certWithRepLegal, certCount));
  console.log(fieldLine("estado", certWithEstado, certCount));
  console.log(fieldLine("estadoInegi", certWithEstadoInegi, certCount));

  // RenecCenter field coverage
  console.log("\n   RenecCenter:");
  const [
    centerWithAltNames,
    centerWithNormKey,
    centerWithDireccion,
    centerWithTelefono,
    centerWithEmail,
    centerWithEstado,
    centerWithEstadoInegi,
    centerWithCodPostal,
    centerWithLatitud,
    centerWithCertifier,
  ] = await Promise.all([
    prisma.renecCenter.count({ where: { alternateNames: { isEmpty: false } } }),
    prisma.renecCenter.count({ where: { normalizedKey: { not: null } } }),
    prisma.renecCenter.count({ where: { direccion: { not: null } } }),
    prisma.renecCenter.count({ where: { telefono: { not: null } } }),
    prisma.renecCenter.count({ where: { email: { not: null } } }),
    prisma.renecCenter.count({ where: { estado: { not: null } } }),
    prisma.renecCenter.count({ where: { estadoInegi: { not: null } } }),
    prisma.renecCenter.count({ where: { codigoPostal: { not: null } } }),
    prisma.renecCenter.count({ where: { latitud: { not: null } } }),
    prisma.renecCenter.count({ where: { certifierId: { not: null } } }),
  ]);

  console.log(fieldLine("alternateNames", centerWithAltNames, centerCount));
  console.log(fieldLine("normalizedKey", centerWithNormKey, centerCount));
  console.log(fieldLine("direccion", centerWithDireccion, centerCount));
  console.log(fieldLine("telefono", centerWithTelefono, centerCount));
  console.log(fieldLine("email", centerWithEmail, centerCount));
  console.log(fieldLine("estado", centerWithEstado, centerCount));
  console.log(fieldLine("estadoInegi", centerWithEstadoInegi, centerCount));
  console.log(fieldLine("codigoPostal", centerWithCodPostal, centerCount));
  console.log(fieldLine("latitud/longitud", centerWithLatitud, centerCount));
  console.log(fieldLine("certifierId (FK)", centerWithCertifier, centerCount));

  // RenecCommittee field coverage
  console.log("\n   RenecCommittee:");
  const [
    commWithPresidente,
    commWithVicepresidente,
    commWithPuestoPresidente,
    commWithPuestoVicepres,
    commWithContacto,
    commWithCorreo,
    commWithTelefonos,
    commWithUrl,
    commWithCalleNumero,
    commWithColonia,
    commWithCodPostal,
    commWithEntidad,
    commWithFechaIntegracion,
    commWithSectorId,
  ] = await Promise.all([
    prisma.renecCommittee.count({ where: { presidente: { not: null } } }),
    prisma.renecCommittee.count({ where: { vicepresidente: { not: null } } }),
    prisma.renecCommittee.count({ where: { puestoPresidente: { not: null } } }),
    prisma.renecCommittee.count({ where: { puestoVicepresidente: { not: null } } }),
    prisma.renecCommittee.count({ where: { contacto: { not: null } } }),
    prisma.renecCommittee.count({ where: { correo: { not: null } } }),
    prisma.renecCommittee.count({ where: { telefonos: { not: null } } }),
    prisma.renecCommittee.count({ where: { url: { not: null } } }),
    prisma.renecCommittee.count({ where: { calleNumero: { not: null } } }),
    prisma.renecCommittee.count({ where: { colonia: { not: null } } }),
    prisma.renecCommittee.count({ where: { codigoPostal: { not: null } } }),
    prisma.renecCommittee.count({ where: { entidad: { not: null } } }),
    prisma.renecCommittee.count({ where: { fechaIntegracion: { not: null } } }),
    prisma.renecCommittee.count({ where: { sectorId: { not: null } } }),
  ]);

  console.log(fieldLine("presidente", commWithPresidente, committeeCount));
  console.log(fieldLine("vicepresidente", commWithVicepresidente, committeeCount));
  console.log(fieldLine("puestoPresidente", commWithPuestoPresidente, committeeCount));
  console.log(fieldLine("puestoVicepresidente", commWithPuestoVicepres, committeeCount));
  console.log(fieldLine("contacto", commWithContacto, committeeCount));
  console.log(fieldLine("correo", commWithCorreo, committeeCount));
  console.log(fieldLine("telefonos", commWithTelefonos, committeeCount));
  console.log(fieldLine("url", commWithUrl, committeeCount));
  console.log(fieldLine("calleNumero", commWithCalleNumero, committeeCount));
  console.log(fieldLine("colonia", commWithColonia, committeeCount));
  console.log(fieldLine("codigoPostal", commWithCodPostal, committeeCount));
  console.log(fieldLine("entidad", commWithEntidad, committeeCount));
  console.log(fieldLine("fechaIntegracion", commWithFechaIntegracion, committeeCount));
  console.log(fieldLine("sectorId (FK)", commWithSectorId, committeeCount));

  // RenecSector field coverage
  console.log("\n   RenecSector:");
  const sectorWithTipo = await prisma.renecSector.count({
    where: { tipo: { not: "productivo" } },
  });
  console.log(fieldLine("nombre (always present)", sectorCount, sectorCount));
  console.log(
    `      tipo breakdown: ${sectorCount - sectorWithTipo} productivo, ${sectorWithTipo} other`,
  );

  // RenecECOccupation - count distinct ECs that have occupations
  console.log("\n   RenecECOccupation:");
  const ecsWithOccupations = await prisma.$queryRaw<
    { count: bigint }[]
  >`SELECT COUNT(DISTINCT ec_id) as count FROM renec_ec_occupations`;
  const ecsWithOcc = Number(ecsWithOccupations[0]?.count ?? 0);
  console.log(`      Total occupation records: ${occupationCount}`);
  console.log(
    `      ECs with occupations: ${ecsWithOcc}/${ecCount} (${pct(ecsWithOcc, ecCount)}%)`,
  );
  if (ecCount > 0) {
    const avgOcc =
      occupationCount > 0 && ecsWithOcc > 0
        ? (occupationCount / ecsWithOcc).toFixed(1)
        : "0";
    console.log(`      Avg occupations per EC (where present): ${avgOcc}`);
  }

  console.log("");

  // ── 5. Referential Integrity ─────────────────────────────────────────────

  console.log("🔗 Referential Integrity:");

  // Accreditations pointing to valid ECs and Certifiers
  const orphanedAccreditations = await prisma.$queryRaw<
    { count: bigint }[]
  >`SELECT COUNT(*) as count FROM renec_accreditations a
    WHERE NOT EXISTS (SELECT 1 FROM renec_ec e WHERE e.id = a.ec_id)
    OR NOT EXISTS (SELECT 1 FROM renec_certifiers c WHERE c.id = a.certifier_id)`;

  const orphanedAccCount = Number(orphanedAccreditations[0]?.count ?? 0);
  console.log(`   Orphaned accreditations: ${orphanedAccCount}`);
  results.push({
    check: "Accreditation referential integrity",
    status: orphanedAccCount === 0 ? "PASS" : "FAIL",
    detail: `${orphanedAccCount} orphaned records`,
  });

  // Center offerings pointing to valid centers and ECs
  const orphanedOfferings = await prisma.$queryRaw<
    { count: bigint }[]
  >`SELECT COUNT(*) as count FROM renec_center_offerings o
    WHERE NOT EXISTS (SELECT 1 FROM renec_ec e WHERE e.id = o.ec_id)
    OR NOT EXISTS (SELECT 1 FROM renec_centers c WHERE c.id = o.center_id)`;

  const orphanedOffCount = Number(orphanedOfferings[0]?.count ?? 0);
  console.log(`   Orphaned center offerings: ${orphanedOffCount}`);
  results.push({
    check: "Center offering referential integrity",
    status: orphanedOffCount === 0 ? "PASS" : "FAIL",
    detail: `${orphanedOffCount} orphaned records`,
  });

  // RenecEC -> RenecCommittee (committeeId)
  const orphanedEcCommittee = await prisma.$queryRaw<
    { count: bigint }[]
  >`SELECT COUNT(*) as count FROM renec_ec e
    WHERE e.committee_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM renec_committees c WHERE c.id = e.committee_id)`;

  const orphanedEcCommCount = Number(orphanedEcCommittee[0]?.count ?? 0);
  console.log(`   EC -> Committee orphans: ${orphanedEcCommCount}`);
  results.push({
    check: "EC->Committee referential integrity",
    status: orphanedEcCommCount === 0 ? "PASS" : "FAIL",
    detail: `${orphanedEcCommCount} orphaned records`,
  });

  // RenecEC -> RenecSector (sectorId)
  const orphanedEcSector = await prisma.$queryRaw<
    { count: bigint }[]
  >`SELECT COUNT(*) as count FROM renec_ec e
    WHERE e.sector_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM renec_sectors s WHERE s.id = e.sector_id)`;

  const orphanedEcSectorCount = Number(orphanedEcSector[0]?.count ?? 0);
  console.log(`   EC -> Sector orphans: ${orphanedEcSectorCount}`);
  results.push({
    check: "EC->Sector referential integrity",
    status: orphanedEcSectorCount === 0 ? "PASS" : "FAIL",
    detail: `${orphanedEcSectorCount} orphaned records`,
  });

  // RenecCommittee -> RenecSector (sectorId)
  const orphanedCommSector = await prisma.$queryRaw<
    { count: bigint }[]
  >`SELECT COUNT(*) as count FROM renec_committees c
    WHERE c.sector_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM renec_sectors s WHERE s.id = c.sector_id)`;

  const orphanedCommSectorCount = Number(orphanedCommSector[0]?.count ?? 0);
  console.log(`   Committee -> Sector orphans: ${orphanedCommSectorCount}`);
  results.push({
    check: "Committee->Sector referential integrity",
    status: orphanedCommSectorCount === 0 ? "PASS" : "FAIL",
    detail: `${orphanedCommSectorCount} orphaned records`,
  });

  // RenecECOccupation -> RenecEC (ecId)
  const orphanedOccupations = await prisma.$queryRaw<
    { count: bigint }[]
  >`SELECT COUNT(*) as count FROM renec_ec_occupations o
    WHERE NOT EXISTS (SELECT 1 FROM renec_ec e WHERE e.id = o.ec_id)`;

  const orphanedOccCount = Number(orphanedOccupations[0]?.count ?? 0);
  console.log(`   ECOccupation -> EC orphans: ${orphanedOccCount}`);
  results.push({
    check: "ECOccupation->EC referential integrity",
    status: orphanedOccCount === 0 ? "PASS" : "FAIL",
    detail: `${orphanedOccCount} orphaned records`,
  });

  console.log("");

  // ── 6. Accreditation Coverage ────────────────────────────────────────────

  console.log("📈 Accreditation Coverage:");

  const ecsWithAccreditation = await prisma.$queryRaw<
    { count: bigint }[]
  >`SELECT COUNT(DISTINCT ec_id) as count FROM renec_accreditations`;

  const ecsWithAcc = Number(ecsWithAccreditation[0]?.count ?? 0);
  console.log(
    `   ECs with >=1 certifier:  ${ecsWithAcc}/${ecCount} (${pct(ecsWithAcc, ecCount)}%)`,
  );

  const certsWithAccreditation = await prisma.$queryRaw<
    { count: bigint }[]
  >`SELECT COUNT(DISTINCT certifier_id) as count FROM renec_accreditations`;

  const certsWithAcc = Number(certsWithAccreditation[0]?.count ?? 0);
  console.log(
    `   Certifiers with >=1 EC:  ${certsWithAcc}/${certCount} (${pct(certsWithAcc, certCount)}%)`,
  );
  console.log("");

  // ── 7. Data Source Attribution ───────────────────────────────────────────

  console.log("🏷️  Data Source Attribution:");
  console.log("   RenecEC:              RENEC API (ec_standards_api.json)");
  console.log(
    "   RenecCertifier:       RENEC Web Scraping (master_ece_registry.json)",
  );
  console.log(
    "   RenecCenter:          RENEC Web Scraping (master_ccap_registry.json)",
  );
  console.log(
    "   RenecAccreditation:   RENEC Web Scraping (ec_ece_matrix.json)",
  );
  console.log(
    "   RenecCenterOffering:  RENEC Web Scraping (master_ccap_registry.json)",
  );
  console.log(
    "   RenecSector:          RENEC API (committees_complete.json, sector mapping)",
  );
  console.log(
    "   RenecCommittee:       RENEC API (committees_complete.json)",
  );
  console.log(
    "   RenecECOccupation:    RENEC Web Scraping (ec_certifiers_all.json)",
  );
  console.log("   RenecSyncJob:         Generated at seed time");
  console.log("");

  // ── Summary ──────────────────────────────────────────────────────────────

  console.log("═══════════════════════════════════════");
  console.log("📋 Validation Summary:\n");

  const passed = results.filter((r) => r.status === "PASS").length;
  const warned = results.filter((r) => r.status === "WARN").length;
  const failed = results.filter((r) => r.status === "FAIL").length;

  for (const r of results) {
    const icon =
      r.status === "PASS" ? "✅" : r.status === "WARN" ? "⚠️" : "❌";
    console.log(`   ${icon} ${r.check}: ${r.detail}`);
  }

  console.log(
    `\n   Results: ${passed} passed, ${warned} warnings, ${failed} failed`,
  );
  console.log("");

  if (failed > 0) {
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error("❌ Validation error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
