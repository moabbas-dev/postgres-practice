const CLAUSE_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT', 'OFFSET',
  'FULL OUTER JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'CROSS JOIN', 'JOIN',
  'UNION ALL', 'UNION', 'INTERSECT', 'EXCEPT', 'WITH',
].sort((a, b) => b.length - a.length)

/** Rendered as an indented continuation of the clause above it, rather than its own top-level line. */
const INDENT_KEYWORDS = ['ON']

const ALL_KEYWORDS = [...CLAUSE_KEYWORDS, ...INDENT_KEYWORDS]

function isWordChar(ch: string | undefined): boolean {
  return !!ch && /[a-zA-Z0-9_]/.test(ch)
}

/**
 * A lightweight, dependency-free SQL formatter — not a full parser, but it does walk the
 * string tracking paren/bracket depth and quoted-string state, so it only breaks lines on
 * clause keywords and commas that are genuinely at the top level of the statement (function
 * arguments, array literals, and text inside string/identifier literals are left untouched).
 */
export function formatSql(sql: string): string {
  const collapsed = sql.trim().replace(/\s+/g, ' ')
  if (!collapsed) return collapsed

  let depth = 0
  let quote: string | null = null
  let out = ''
  let i = 0

  function matchKeywordAt(pos: number): string | null {
    const prev = collapsed[pos - 1]
    if (pos !== 0 && prev !== ' ') return null
    for (const kw of ALL_KEYWORDS) {
      const end = pos + kw.length
      if (collapsed.slice(pos, end).toUpperCase() === kw && !isWordChar(collapsed[end])) {
        return kw
      }
    }
    return null
  }

  while (i < collapsed.length) {
    const ch = collapsed[i]

    if (quote) {
      out += ch
      if (ch === quote) quote = null
      i++
      continue
    }

    if (ch === "'" || ch === '"') {
      quote = ch
      out += ch
      i++
      continue
    }

    if (ch === '(' || ch === '[') {
      depth++
      out += ch
      i++
      continue
    }
    if (ch === ')' || ch === ']') {
      depth = Math.max(0, depth - 1)
      out += ch
      i++
      continue
    }

    if (depth === 0) {
      const kw = matchKeywordAt(i)
      if (kw) {
        out = out.replace(/ +$/, '')
        const isIndent = INDENT_KEYWORDS.includes(kw)
        out += (isIndent ? '\n  ' : '\n') + kw
        i += kw.length
        continue
      }
      if (ch === ',') {
        out += ',\n  '
        i++
        if (collapsed[i] === ' ') i++
        continue
      }
    }

    out += ch
    i++
  }

  return out
    .replace(/ +;/g, ';')
    .split('\n')
    .map((line) => line.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n{2,}/g, '\n')
    .trim()
}
