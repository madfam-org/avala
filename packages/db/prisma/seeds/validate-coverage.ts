/**
 * RENEC Data Coverage Validation Script
 *
 * Queries every RENEC table and reports:
 * - Record counts per model
 * - Completeness metrics
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

async function main() {
  console.log("🔍 RENEC Data Coverage Validation\n");
  console.log("═══════════════════════════════════════\n");

  const results: ValidationResult[] = [];

  // ── 1. Record Counts ─────────────────────────────────────────────────────

  console.log("📊 Record Counts:");

  const [ecCount, certCount, centerCount, accCount, offeringCount, syncCount] =
    await Promise.all([
      prisma.renecEC.count(),
      prisma.renecCertifier.count(),
      prisma.renecCenter.count(),
      prisma.renecAccreditation.count(),
      prisma.renecCenterOffering.count(),
      prisma.renecSyncJob.count(),
    ]);

  const counts = {
    RenecEC: { actual: ecCount, expected: 1477 },
    RenecCertifier: { actual: certCount, expected: 482 },
    RenecCenter: { actual: centerCount, expected: 340 },
    RenecAccreditation: { actual: accCount, expected: 7573 },
    RenecCenterOffering: { actual: offeringCount, expected: 680 },
    RenecSyncJob: { actual: syncCount, expected: 1 },
  };

  let totalRecords = 0;
  for (const [model, { actual, expected }] of Object.entries(counts)) {
    const pct = expected > 0 ? ((actual / expected) * 100).toFixed(1) : "N/A";
    const status = actual >= expected * 0.9 ? "✅" : actual > 0 ? "⚠️" : "❌";
    console.log(
      `   ${status} ${model}: ${actual} / ~${expected} expected (${pct}%)`,
    );
    totalRecords += actual;

    results.push({
      check: `${model} count`,
      status: actual >= expected * 0.9 ? "PASS" : actual > 0 ? "WARN" : "FAIL",
      detail: `${actual}/${expected} (${pct}%)`,
    });
  }

  console.log(`\n   Total records: ${totalRecords}\n`);

  // ── 2. EC Data Completeness ──────────────────────────────────────────────

  console.log("📋 EC Standards Completeness:");

  const ecsWithSector = await prisma.renecEC.count({
    where: { sector: { not: null } },
  });
  const ecsWithLevel = await prisma.renecEC.count({
    where: { nivelCompetencia: { not: null } },
  });
  const ecsWithProposito = await prisma.renecEC.count({
    where: { proposito: { not: null } },
  });
  const ecsVigente = await prisma.renecEC.count({
    where: { vigente: true },
  });

  console.log(`   Sector populated:     ${ecsWithSector}/${ecCount}`);
  console.log(`   Level populated:      ${ecsWithLevel}/${ecCount}`);
  console.log(`   Proposito populated:  ${ecsWithProposito}/${ecCount}`);
  console.log(`   Vigente (active):     ${ecsVigente}/${ecCount}`);
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

  // ── 4. Referential Integrity ─────────────────────────────────────────────

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
  console.log("");

  // ── 5. Accreditation Coverage ────────────────────────────────────────────

  console.log("📈 Accreditation Coverage:");

  const ecsWithAccreditation = await prisma.$queryRaw<
    { count: bigint }[]
  >`SELECT COUNT(DISTINCT ec_id) as count FROM renec_accreditations`;

  const ecsWithAcc = Number(ecsWithAccreditation[0]?.count ?? 0);
  console.log(
    `   ECs with ≥1 certifier:  ${ecsWithAcc}/${ecCount} (${((ecsWithAcc / ecCount) * 100).toFixed(1)}%)`,
  );

  const certsWithAccreditation = await prisma.$queryRaw<
    { count: bigint }[]
  >`SELECT COUNT(DISTINCT certifier_id) as count FROM renec_accreditations`;

  const certsWithAcc = Number(certsWithAccreditation[0]?.count ?? 0);
  console.log(
    `   Certifiers with ≥1 EC:  ${certsWithAcc}/${certCount} (${((certsWithAcc / certCount) * 100).toFixed(1)}%)`,
  );
  console.log("");

  // ── 6. Data Source Attribution ────────────────────────────────────────────

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
  console.log("   Committee enrichment: RENEC API (committees_complete.json)");
  console.log(
    "   Occupations/Courses:  RENEC Web Scraping (ec_certifiers_all.json)",
  );
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
