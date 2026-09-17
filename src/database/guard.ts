const ONLY_READ_PATTERN = /^\s*(select|with|table|values|explain)\b/i
const FORBIDDEN_PATTERN =
  /\b(insert|update|delete|drop|alter|truncate|grant|revoke|create|vacuum|reindex|cluster|copy|merge|call|do|listen|notify|begin|commit|rollback|savepoint|set\s+session|set\s+role)\b/i

export class GuardError extends Error {}

/**
 * Strips SQL comments (`-- ...` and `/* ... *\/`, including nested block
 * comments as Postgres allows) so the guard can classify a query by its real
 * leading keyword. String/identifier/dollar-quoted literals are passed
 * through untouched so `--`/`/*` sequences inside them aren't mistaken for
 * comment markers. Only used for classification here — the original SQL
 * text is always what gets executed/displayed.
 */
function stripSqlComments(sql: string): string {
  let result = ''
  let i = 0
  const n = sql.length
  while (i < n) {
    const two = sql.slice(i, i + 2)
    if (two === '--') {
      const nl = sql.indexOf('\n', i)
      if (nl === -1) {
        i = n
      } else {
        result += '\n'
        i = nl + 1
      }
      continue
    }
    if (two === '/*') {
      let depth = 1
      i += 2
      while (i < n && depth > 0) {
        if (sql.slice(i, i + 2) === '/*') {
          depth++
          i += 2
        } else if (sql.slice(i, i + 2) === '*/') {
          depth--
          i += 2
        } else {
          i++
        }
      }
      result += ' '
      continue
    }
    const c = sql[i]
    if (c === "'" || c === '"') {
      let j = i + 1
      while (j < n) {
        if (sql[j] === c) {
          if (sql[j + 1] === c) {
            j += 2
            continue
          }
          j += 1
          break
        }
        j++
      }
      result += sql.slice(i, j)
      i = j
      continue
    }
    if (c === '$') {
      const tagMatch = /^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/.exec(sql.slice(i))
      if (tagMatch) {
        const tag = tagMatch[0]
        const endIdx = sql.indexOf(tag, i + tag.length)
        if (endIdx !== -1) {
          result += sql.slice(i, endIdx + tag.length)
          i = endIdx + tag.length
          continue
        }
      }
    }
    result += c
    i++
  }
  return result
}

/** Rejects anything that isn't a single read-only statement, as a defense-in-depth
 * layer alongside the always-rolled-back transaction wrapper in db.ts. Comments and
 * surrounding whitespace are ignored when classifying the query; the caller's
 * original SQL text is untouched and is what actually gets executed. */
export function guardReadOnly(sql: string): void {
  const uncommented = stripSqlComments(sql)
  const trimmed = uncommented.trim().replace(/;+\s*$/g, '')
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
