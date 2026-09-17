const NEWLINE_BEFORE = [
  'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT', 'OFFSET',
  'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'FULL OUTER JOIN', 'CROSS JOIN', 'JOIN',
  'UNION ALL', 'UNION', 'INTERSECT', 'EXCEPT', 'WITH', 'ON',
]

/** A lightweight, dependency-free SQL formatter: not a full parser, just
 * inserts newlines before major clause keywords and normalizes whitespace. */
export function formatSql(sql: string): string {
  let text = sql.trim().replace(/\s+/g, ' ')
  if (!text) return text

  // Protect keywords inside string literals by temporarily not touching them —
  // simple heuristic: split on unquoted regions.
  const sorted = [...NEWLINE_BEFORE].sort((a, b) => b.length - a.length)
  for (const kw of sorted) {
    const pattern = new RegExp(`\\s+(${kw.replace(/ /g, '\\s+')})\\b`, 'gi')
    text = text.replace(pattern, (_m, matched) => `\n${matched.toUpperCase()}`)
  }

  text = text.replace(/,\s*/g, ',\n  ')
  text = text.replace(/\n{2,}/g, '\n')

  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
}
