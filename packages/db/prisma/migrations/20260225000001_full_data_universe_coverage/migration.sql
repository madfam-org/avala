-- Migration: Full Data Universe Coverage
-- Description: Adds all remaining tables, enums, columns, and indexes to achieve
--              complete coverage of the Avala data model across compliance, credentials,
--              RENEC registry, xAPI events, inter-rater agreement, and quiz/assessment bridging.
--
-- Phase 1: New enum types
-- Phase 2: New tables (RENEC extensions, compliance, credentials, assessment, LRS)
-- Phase 3: Column additions to existing tables
-- Phase 4: Foreign key constraints for new columns on existing tables
-- Phase 5: Indexes for new columns and tables

-- ============================================================
-- PHASE 1: NEW ENUM TYPES
-- ============================================================

-- TrainingModality: DC-3 training delivery method
CREATE TYPE "TrainingModality" AS ENUM ('PRESENCIAL', 'MIXTA', 'EN_LINEA');

-- DC3SignerRole: Role of each signer on a DC-3 certificate
CREATE TYPE "DC3SignerRole" AS ENUM ('EMPLEADOR', 'TRABAJADOR', 'ACE', 'SUPERVISOR');

-- EventVerb: xAPI-aligned verb vocabulary for structured learning events
CREATE TYPE "EventVerb" AS ENUM (
    'LAUNCHED',
    'INITIALIZED',
    'PROGRESSED',
    'COMPLETED',
    'PASSED',
    'FAILED',
    'SATISFIED_CRITERION',
    'ARTIFACT_UPLOADED',
    'ASSESSED',
    'ENROLLED',
    'UNENROLLED'
);

-- LRSAuthType: Authentication method for external LRS connections
CREATE TYPE "LRSAuthType" AS ENUM ('BASIC', 'OAUTH2', 'TOKEN');

-- ============================================================
-- PHASE 2: NEW TABLES
-- ============================================================

-- ------------------------------------------------------------
-- 2.1 RenecSector - CONOCER productive sectors (referenced by committees and ECs)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "renec_sectors" (
    "id"              UUID         NOT NULL DEFAULT gen_random_uuid(),
    "sector_id"       INTEGER      NOT NULL,
    "nombre"          TEXT         NOT NULL,
    "tipo"            TEXT         NOT NULL DEFAULT 'productivo',
    "source_url"      TEXT,
    "content_hash"    TEXT,
    "last_synced_at"  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "created_at"      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "updated_at"      TIMESTAMPTZ  NOT NULL,

    CONSTRAINT "renec_sectors_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "renec_sectors_sector_id_key"
    ON "renec_sectors" ("sector_id");

CREATE INDEX IF NOT EXISTS "renec_sectors_sector_id_idx"
    ON "renec_sectors" ("sector_id");

-- ------------------------------------------------------------
-- 2.2 RenecCommittee - CONOCER normalization committees
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "renec_committees" (
    "id"                    UUID         NOT NULL DEFAULT gen_random_uuid(),
    "committee_key"         TEXT         NOT NULL,
    "nombre"                TEXT         NOT NULL,
    "presidente"            TEXT,
    "vicepresidente"        TEXT,
    "puesto_presidente"     TEXT,
    "puesto_vicepresidente" TEXT,
    "contacto"              TEXT,
    "correo"                TEXT,
    "telefonos"             TEXT,
    "url"                   TEXT,
    "calle_numero"          TEXT,
    "colonia"               TEXT,
    "codigo_postal"         TEXT,
    "localidad"             TEXT,
    "delegacion"            TEXT,
    "entidad"               TEXT,
    "fecha_integracion"     TIMESTAMPTZ,
    "id_tipo_comite"        INTEGER,
    "sector_id"             UUID,
    "source_url"            TEXT,
    "content_hash"          TEXT,
    "last_synced_at"        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "created_at"            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "updated_at"            TIMESTAMPTZ  NOT NULL,

    CONSTRAINT "renec_committees_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "renec_committees_sector_id_fkey"
        FOREIGN KEY ("sector_id") REFERENCES "renec_sectors" ("id")
        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "renec_committees_committee_key_key"
    ON "renec_committees" ("committee_key");

CREATE INDEX IF NOT EXISTS "renec_committees_committee_key_idx"
    ON "renec_committees" ("committee_key");

CREATE INDEX IF NOT EXISTS "renec_committees_sector_id_idx"
    ON "renec_committees" ("sector_id");

-- ------------------------------------------------------------
-- 2.3 RenecECOccupation - EC-to-occupation join table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "renec_ec_occupations" (
    "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
    "ec_id"      UUID        NOT NULL,
    "occupation"  TEXT        NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "renec_ec_occupations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "renec_ec_occupations_ec_id_fkey"
        FOREIGN KEY ("ec_id") REFERENCES "renec_ec" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "renec_ec_occupations_ec_id_occupation_key"
    ON "renec_ec_occupations" ("ec_id", "occupation");

CREATE INDEX IF NOT EXISTS "renec_ec_occupations_ec_id_idx"
    ON "renec_ec_occupations" ("ec_id");

-- ------------------------------------------------------------
-- 2.4 Employer - Employer entities for DC-3 compliance
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "employers" (
    "id"            UUID        NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"     UUID        NOT NULL,
    "business_name" TEXT        NOT NULL,
    "rfc"           TEXT,
    "legal_name"    TEXT,
    "address"       TEXT,
    "work_center"   TEXT,
    "legal_contact" TEXT,
    "email"         TEXT,
    "phone"         TEXT,
    "created_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at"    TIMESTAMPTZ NOT NULL,

    CONSTRAINT "employers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "employers_tenant_id_fkey"
        FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "employers_tenant_id_idx"
    ON "employers" ("tenant_id");

CREATE INDEX IF NOT EXISTS "employers_rfc_idx"
    ON "employers" ("rfc");

-- ------------------------------------------------------------
-- 2.5 DC3Signer - DC-3 signature workflow participants
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "dc3_signers" (
    "id"              UUID           NOT NULL DEFAULT gen_random_uuid(),
    "dc3_id"          UUID           NOT NULL,
    "role"            "DC3SignerRole" NOT NULL,
    "signer_name"     TEXT           NOT NULL,
    "signer_position" TEXT,
    "signature_ref"   TEXT,
    "signed_at"       TIMESTAMPTZ,
    "order"           INTEGER        NOT NULL DEFAULT 0,
    "created_at"      TIMESTAMPTZ    NOT NULL DEFAULT now(),

    CONSTRAINT "dc3_signers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "dc3_signers_dc3_id_fkey"
        FOREIGN KEY ("dc3_id") REFERENCES "dc3_records" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "dc3_signers_dc3_id_idx"
    ON "dc3_signers" ("dc3_id");

-- ------------------------------------------------------------
-- 2.6 SIRCEExportRecord - SIRCE Export <-> DC3 join table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "sirce_export_records" (
    "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
    "export_id"  UUID        NOT NULL,
    "dc3_id"     UUID        NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "sirce_export_records_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sirce_export_records_export_id_fkey"
        FOREIGN KEY ("export_id") REFERENCES "sirce_exports" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "sirce_export_records_export_id_dc3_id_key"
    ON "sirce_export_records" ("export_id", "dc3_id");

CREATE INDEX IF NOT EXISTS "sirce_export_records_export_id_idx"
    ON "sirce_export_records" ("export_id");

CREATE INDEX IF NOT EXISTS "sirce_export_records_dc3_id_idx"
    ON "sirce_export_records" ("dc3_id");

-- ------------------------------------------------------------
-- 2.7 CredentialIssuer - OBv3 credential issuer infrastructure
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "credential_issuers" (
    "id"               UUID        NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"        UUID        NOT NULL,
    "did"              TEXT        NOT NULL,
    "public_key_url"   TEXT,
    "public_key_pem"   TEXT,
    "private_key_path" TEXT,
    "name"             TEXT        NOT NULL,
    "description"      TEXT,
    "logo_url"         TEXT,
    "status_list_url"  TEXT,
    "created_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at"       TIMESTAMPTZ NOT NULL,

    CONSTRAINT "credential_issuers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "credential_issuers_tenant_id_fkey"
        FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "credential_issuers_did_key"
    ON "credential_issuers" ("did");

CREATE INDEX IF NOT EXISTS "credential_issuers_tenant_id_idx"
    ON "credential_issuers" ("tenant_id");

CREATE INDEX IF NOT EXISTS "credential_issuers_did_idx"
    ON "credential_issuers" ("did");

-- ------------------------------------------------------------
-- 2.8 CredentialStatusEntry - Credential revocation tracking
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "credential_status_entries" (
    "id"            UUID               NOT NULL DEFAULT gen_random_uuid(),
    "issuer_id"     UUID               NOT NULL,
    "credential_id" UUID               NOT NULL,
    "status"        "CredentialStatus"  NOT NULL DEFAULT 'ACTIVE',
    "reason"        TEXT,
    "revoked_at"    TIMESTAMPTZ,
    "created_at"    TIMESTAMPTZ        NOT NULL DEFAULT now(),

    CONSTRAINT "credential_status_entries_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "credential_status_entries_issuer_id_fkey"
        FOREIGN KEY ("issuer_id") REFERENCES "credential_issuers" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "credential_status_entries_credential_id_fkey"
        FOREIGN KEY ("credential_id") REFERENCES "credentials" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "credential_status_entries_credential_id_key"
    ON "credential_status_entries" ("credential_id");

CREATE INDEX IF NOT EXISTS "credential_status_entries_issuer_id_idx"
    ON "credential_status_entries" ("issuer_id");

CREATE INDEX IF NOT EXISTS "credential_status_entries_credential_id_idx"
    ON "credential_status_entries" ("credential_id");

-- ------------------------------------------------------------
-- 2.9 CredentialEvidence - Credential <-> Artifact evidence join
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "credential_evidence" (
    "id"            UUID        NOT NULL DEFAULT gen_random_uuid(),
    "credential_id" UUID        NOT NULL,
    "artifact_id"   UUID        NOT NULL,
    "created_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "credential_evidence_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "credential_evidence_credential_id_fkey"
        FOREIGN KEY ("credential_id") REFERENCES "credentials" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "credential_evidence_artifact_id_fkey"
        FOREIGN KEY ("artifact_id") REFERENCES "artifacts" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "credential_evidence_credential_id_artifact_id_key"
    ON "credential_evidence" ("credential_id", "artifact_id");

CREATE INDEX IF NOT EXISTS "credential_evidence_credential_id_idx"
    ON "credential_evidence" ("credential_id");

CREATE INDEX IF NOT EXISTS "credential_evidence_artifact_id_idx"
    ON "credential_evidence" ("artifact_id");

-- ------------------------------------------------------------
-- 2.10 EvaluatorAgreement - Inter-rater reliability tracking
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "evaluator_agreements" (
    "id"                   UUID        NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"            UUID        NOT NULL,
    "assessment_id"        UUID        NOT NULL,
    "evaluator1_id"        UUID        NOT NULL,
    "evaluator2_id"        UUID        NOT NULL,
    "items_compared"       INTEGER     NOT NULL,
    "kappa_coefficient"    DOUBLE PRECISION NOT NULL,
    "percentage_agreement" DOUBLE PRECISION NOT NULL,
    "disagreements"        JSONB       NOT NULL DEFAULT '[]',
    "calculated_at"        TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "evaluator_agreements_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "evaluator_agreements_tenant_id_fkey"
        FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "evaluator_agreements_assessment_id_fkey"
        FOREIGN KEY ("assessment_id") REFERENCES "assessments" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "evaluator_agreements_evaluator1_id_fkey"
        FOREIGN KEY ("evaluator1_id") REFERENCES "users" ("id")
        ON UPDATE CASCADE,
    CONSTRAINT "evaluator_agreements_evaluator2_id_fkey"
        FOREIGN KEY ("evaluator2_id") REFERENCES "users" ("id")
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "evaluator_agreements_tenant_id_idx"
    ON "evaluator_agreements" ("tenant_id");

CREATE INDEX IF NOT EXISTS "evaluator_agreements_assessment_id_idx"
    ON "evaluator_agreements" ("assessment_id");

CREATE INDEX IF NOT EXISTS "evaluator_agreements_evaluator1_id_idx"
    ON "evaluator_agreements" ("evaluator1_id");

CREATE INDEX IF NOT EXISTS "evaluator_agreements_evaluator2_id_idx"
    ON "evaluator_agreements" ("evaluator2_id");

-- ------------------------------------------------------------
-- 2.11 LRSConfiguration - xAPI/cmi5 Learning Record Store config
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "lrs_configurations" (
    "id"                 UUID          NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id"          UUID          NOT NULL,
    "endpoint"           TEXT          NOT NULL,
    "auth_type"          "LRSAuthType" NOT NULL DEFAULT 'BASIC',
    "username"           TEXT,
    "password_hash"      TEXT,
    "api_token"          TEXT,
    "cmi5_enabled"       BOOLEAN       NOT NULL DEFAULT false,
    "cmi5_endpoint"      TEXT,
    "batch_size"         INTEGER       NOT NULL DEFAULT 50,
    "batch_interval_sec" INTEGER       NOT NULL DEFAULT 300,
    "is_active"          BOOLEAN       NOT NULL DEFAULT true,
    "last_sync_at"       TIMESTAMPTZ,
    "created_at"         TIMESTAMPTZ   NOT NULL DEFAULT now(),
    "updated_at"         TIMESTAMPTZ   NOT NULL,

    CONSTRAINT "lrs_configurations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "lrs_configurations_tenant_id_fkey"
        FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "lrs_configurations_tenant_id_idx"
    ON "lrs_configurations" ("tenant_id");

CREATE INDEX IF NOT EXISTS "lrs_configurations_is_active_idx"
    ON "lrs_configurations" ("is_active");

-- ============================================================
-- PHASE 3: COLUMN ADDITIONS TO EXISTING TABLES
-- ============================================================

-- ------------------------------------------------------------
-- 3.1 renec_ec - Committee FK, Sector FK, additional metadata
-- ------------------------------------------------------------
ALTER TABLE "renec_ec"
    ADD COLUMN IF NOT EXISTS "committee_id" UUID,
    ADD COLUMN IF NOT EXISTS "sector_id" UUID,
    ADD COLUMN IF NOT EXISTS "descripcion" TEXT,
    ADD COLUMN IF NOT EXISTS "fecha_publicacion_dof" TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS "url_pdf" TEXT;

-- ------------------------------------------------------------
-- 3.2 renec_certifiers - Deduplication support
-- ------------------------------------------------------------
ALTER TABLE "renec_certifiers"
    ADD COLUMN IF NOT EXISTS "alternate_names" TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS "normalized_key" TEXT;

-- ------------------------------------------------------------
-- 3.3 renec_centers - Deduplication support
-- ------------------------------------------------------------
ALTER TABLE "renec_centers"
    ADD COLUMN IF NOT EXISTS "alternate_names" TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS "normalized_key" TEXT;

-- ------------------------------------------------------------
-- 3.4 dc3_records - Employer, training details, trainee PII, folio
-- ------------------------------------------------------------
ALTER TABLE "dc3_records"
    ADD COLUMN IF NOT EXISTS "employer_id" UUID,
    ADD COLUMN IF NOT EXISTS "hours" INTEGER,
    ADD COLUMN IF NOT EXISTS "modality" "TrainingModality",
    ADD COLUMN IF NOT EXISTS "start_date" TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS "end_date" TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS "trainee_name" TEXT,
    ADD COLUMN IF NOT EXISTS "trainee_curp" TEXT,
    ADD COLUMN IF NOT EXISTS "trainee_rfc" TEXT,
    ADD COLUMN IF NOT EXISTS "trainee_job_title" TEXT,
    ADD COLUMN IF NOT EXISTS "folio" TEXT;

-- ------------------------------------------------------------
-- 3.5 sirce_exports - Format, record count, centro trabajo, completion, validation
-- ------------------------------------------------------------
ALTER TABLE "sirce_exports"
    ADD COLUMN IF NOT EXISTS "format" TEXT DEFAULT 'csv',
    ADD COLUMN IF NOT EXISTS "record_count" INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "centro_trabajo" TEXT,
    ADD COLUMN IF NOT EXISTS "completed_at" TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS "validation_errors" JSONB DEFAULT '[]';

-- ------------------------------------------------------------
-- 3.6 lft_plans - Versioning, centros de trabajo, participants, approval
-- ------------------------------------------------------------
ALTER TABLE "lft_plans"
    ADD COLUMN IF NOT EXISTS "version" INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS "centros_trabajo" TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS "participant_count" INTEGER,
    ADD COLUMN IF NOT EXISTS "approved_by" UUID,
    ADD COLUMN IF NOT EXISTS "approved_at" TIMESTAMPTZ;

-- ------------------------------------------------------------
-- 3.7 credentials - Issuer FK, EC codes alignment
-- ------------------------------------------------------------
ALTER TABLE "credentials"
    ADD COLUMN IF NOT EXISTS "issuer_id" UUID,
    ADD COLUMN IF NOT EXISTS "ec_codes" TEXT[] DEFAULT '{}';

-- ------------------------------------------------------------
-- 3.8 artifacts - Criterion mapping
-- ------------------------------------------------------------
ALTER TABLE "artifacts"
    ADD COLUMN IF NOT EXISTS "criterion_id" UUID;

-- ------------------------------------------------------------
-- 3.9 events - Structured xAPI context columns
-- ------------------------------------------------------------
ALTER TABLE "events"
    ADD COLUMN IF NOT EXISTS "actor_id" UUID,
    ADD COLUMN IF NOT EXISTS "course_id" UUID,
    ADD COLUMN IF NOT EXISTS "ec_code" TEXT,
    ADD COLUMN IF NOT EXISTS "criterion_id" TEXT;

-- ------------------------------------------------------------
-- 3.10 quizzes - Assessment bridge
-- ------------------------------------------------------------
ALTER TABLE "quizzes"
    ADD COLUMN IF NOT EXISTS "assessment_id" UUID;

-- ------------------------------------------------------------
-- 3.11 quiz_attempts - Assessment bridge
-- ------------------------------------------------------------
ALTER TABLE "quiz_attempts"
    ADD COLUMN IF NOT EXISTS "assessment_id" UUID;

-- ============================================================
-- PHASE 4: FOREIGN KEY CONSTRAINTS FOR NEW COLUMNS
-- ============================================================

-- 4.1 renec_ec.committee_id -> renec_committees.id
ALTER TABLE "renec_ec"
    ADD CONSTRAINT "renec_ec_committee_id_fkey"
    FOREIGN KEY ("committee_id") REFERENCES "renec_committees" ("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- 4.2 renec_ec.sector_id -> renec_sectors.id
ALTER TABLE "renec_ec"
    ADD CONSTRAINT "renec_ec_sector_id_fkey"
    FOREIGN KEY ("sector_id") REFERENCES "renec_sectors" ("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- 4.3 dc3_records.employer_id -> employers.id
ALTER TABLE "dc3_records"
    ADD CONSTRAINT "dc3_records_employer_id_fkey"
    FOREIGN KEY ("employer_id") REFERENCES "employers" ("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- 4.4 credentials.issuer_id -> credential_issuers.id
ALTER TABLE "credentials"
    ADD CONSTRAINT "credentials_issuer_id_fkey"
    FOREIGN KEY ("issuer_id") REFERENCES "credential_issuers" ("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- 4.5 artifacts.criterion_id -> criteria.id
ALTER TABLE "artifacts"
    ADD CONSTRAINT "artifacts_criterion_id_fkey"
    FOREIGN KEY ("criterion_id") REFERENCES "criteria" ("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- 4.6 events.actor_id -> users.id
ALTER TABLE "events"
    ADD CONSTRAINT "events_actor_id_fkey"
    FOREIGN KEY ("actor_id") REFERENCES "users" ("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- PHASE 5: INDEXES FOR NEW COLUMNS
-- ============================================================

-- 5.1 renec_ec new column indexes
CREATE INDEX IF NOT EXISTS "renec_ec_committee_id_idx"
    ON "renec_ec" ("committee_id");

CREATE INDEX IF NOT EXISTS "renec_ec_sector_id_idx"
    ON "renec_ec" ("sector_id");

-- 5.2 renec_certifiers deduplication index
CREATE INDEX IF NOT EXISTS "renec_certifiers_normalized_key_idx"
    ON "renec_certifiers" ("normalized_key");

-- 5.3 renec_centers deduplication index
CREATE INDEX IF NOT EXISTS "renec_centers_normalized_key_idx"
    ON "renec_centers" ("normalized_key");

-- 5.4 dc3_records new column indexes
CREATE INDEX IF NOT EXISTS "dc3_records_employer_id_idx"
    ON "dc3_records" ("employer_id");

CREATE INDEX IF NOT EXISTS "dc3_records_folio_idx"
    ON "dc3_records" ("folio");

-- 5.5 credentials new column indexes
CREATE INDEX IF NOT EXISTS "credentials_issuer_id_idx"
    ON "credentials" ("issuer_id");

-- 5.6 artifacts criterion index
CREATE INDEX IF NOT EXISTS "artifacts_criterion_id_idx"
    ON "artifacts" ("criterion_id");

-- 5.7 events structured context indexes
CREATE INDEX IF NOT EXISTS "events_actor_id_idx"
    ON "events" ("actor_id");

CREATE INDEX IF NOT EXISTS "events_verb_idx"
    ON "events" ("verb");

CREATE INDEX IF NOT EXISTS "events_course_id_idx"
    ON "events" ("course_id");
