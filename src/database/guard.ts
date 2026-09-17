const ONLY_READ_PATTERN = /^\s*(select|with|table|values|explain)\b/i
const FORBIDDEN_PATTERN =
  /\b(insert|update|delete|drop|alter|truncate|grant|revoke|create|vacuum|reindex|cluster|copy|merge|call|do|listen|notify|begin|commit|rollback|savepoint|set\s+session|set\s+role)\b/i

export class GuardError extends Error {}

/** Rejects anything that isn't a single read-only statement, as a defense-in-depth
 * layer alongside the always-rolled-back transaction wrapper in db.ts. */
export function guardReadOnly(sql: string): void {
  const trimmed = sql.trim().replace(/;+\s*$/g, '')
  if (trimmed.length === 0) throw new GuardError('Query is empty.')

  const parts = trimmed.split(';')
  for (let i = 1; i < parts.length; i++) {
    if (parts[i].trim().length > 0) {
      throw new GuardError('Only a single SELECT statement is allowed. Remove any statements after the first semicolon.')
    }
  }

  if (!ONLY_READ_PATTERN.test(parts[0])) {
    throw new GuardError('Only read-only queries (SELECT / WITH / VALUES) are supported in Postgres Arena.')
  }
  if (FORBIDDEN_PATTERN.test(trimmed)) {
    throw new GuardError('This keyword is not allowed. Postgres Arena only runs read-only SELECT queries.')
  }
}
