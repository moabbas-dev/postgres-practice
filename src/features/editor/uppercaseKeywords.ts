/** PostgreSQL keywords this tool will normalize to uppercase. Deliberately excludes
 * function names (COUNT, ROUND, EXTRACT, ...) and bare data-type names (numeric, text,
 * uuid, ...) — this app's own exercises consistently keep those lowercase, so uppercasing
 * them here would fight the house style rather than match it. */
const KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'AS', 'ON', 'IN', 'EXISTS', 'BETWEEN',
  'LIKE', 'ILIKE', 'SIMILAR', 'IS', 'NULL', 'DISTINCT', 'ALL', 'ANY', 'SOME',
  'GROUP', 'BY', 'HAVING', 'ORDER', 'ASC', 'DESC', 'NULLS', 'FIRST', 'LAST',
  'LIMIT', 'OFFSET', 'UNION', 'INTERSECT', 'EXCEPT', 'WITH', 'RECURSIVE', 'VALUES', 'INTO',
  'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER', 'CROSS', 'NATURAL', 'USING',
  'OVER', 'PARTITION', 'WINDOW', 'FILTER', 'ROWS', 'RANGE', 'GROUPS',
  'PRECEDING', 'FOLLOWING', 'UNBOUNDED', 'CURRENT', 'ROW',
  'LATERAL', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'TRUE', 'FALSE', 'ARRAY', 'DEFAULT',
].sort((a, b) => b.length - a.length)

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => new RegExp(`\\b${kw}\\b`, 'gi'))

/** Matches the regions that must be left untouched: single-quoted string literals and
 * double-quoted identifiers (both support "" / '' as an escaped quote), line comments,
 * and block comments. Everything NOT matched by this is plain SQL code. */
const PROTECTED_REGION = /'(?:[^']|'')*'|"(?:[^"]|"")*"|--[^\n]*|\/\*[\s\S]*?\*\//g

function uppercaseKeywordsInPlainSql(chunk: string): string {
  let result = chunk
  for (const pattern of KEYWORD_PATTERNS) {
    result = result.replace(pattern, (m) => m.toUpperCase())
  }
  return result
}

/**
 * Uppercases PostgreSQL keywords (SELECT, FROM, JOIN, GROUP BY, ...) throughout the query,
 * without touching anything else — indentation, function names, casts, and the contents of
 * string/identifier literals and comments are all preserved exactly as written. This is a
 * pure casing pass, independent of (and safe to combine in either order with) Format Query.
 */
export function uppercaseKeywords(sql: string): string {
  if (!sql) return sql

  let out = ''
  let lastIndex = 0
  for (const match of sql.matchAll(PROTECTED_REGION)) {
    out += uppercaseKeywordsInPlainSql(sql.slice(lastIndex, match.index))
    out += match[0]
    lastIndex = match.index + match[0].length
  }
  out += uppercaseKeywordsInPlainSql(sql.slice(lastIndex))

  return out
}
