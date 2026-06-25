-- Enforce the single-table client invariant at the database level (DECISIONS.md §1):
--   * a COMPANY must carry a legalName
--   * an INDIVIDUAL must carry both firstName and lastName
-- The application also validates this via the discriminated DTO; this is the last line of defense.
ALTER TABLE "clients"
  ADD CONSTRAINT "clients_type_fields_check" CHECK (
    (
      "type" = 'COMPANY' AND "legalName" IS NOT NULL
    )
    OR (
      "type" = 'INDIVIDUAL' AND "firstName" IS NOT NULL AND "lastName" IS NOT NULL
    )
  );
