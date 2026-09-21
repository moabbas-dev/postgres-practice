import { describe, expect, it } from 'vitest'
import { formatSql } from './formatSql'

describe('formatSql', () => {
  it('returns empty/whitespace-only input unchanged', () => {
    expect(formatSql('')).toBe('')
    expect(formatSql('   ')).toBe('')
  })

  it('uppercases the very first clause keyword, not just the ones that follow', () => {
    expect(formatSql('select * from warehouses;')).toBe('SELECT *\nFROM warehouses;')
  })

  it('collapses arbitrary internal whitespace', () => {
    expect(formatSql('select   *   from    warehouses  ;')).toBe('SELECT *\nFROM warehouses;')
  })

  it('breaks before each major clause keyword', () => {
    const out = formatSql('SELECT name, price FROM products WHERE price > 100 ORDER BY price DESC;')
    expect(out).toBe('SELECT name,\n  price\nFROM products\nWHERE price > 100\nORDER BY price DESC;')
  })

  it('indents comma-separated continuation items under their clause', () => {
    const out = formatSql('SELECT a, b, c FROM t;')
    expect(out).toBe('SELECT a,\n  b,\n  c\nFROM t;')
  })

  it('indents ON as a continuation of the preceding JOIN, not a top-level clause', () => {
    const out = formatSql('SELECT 1 FROM orders o JOIN customers c ON c.id = o.customer_id;')
    expect(out).toContain('JOIN customers c\n  ON c.id = o.customer_id;')
  })

  it('does not break commas inside function call parentheses', () => {
    const out = formatSql("SELECT jsonb_build_object('a', 1, 'b', 2) FROM t;")
    expect(out).toBe("SELECT jsonb_build_object('a', 1, 'b', 2)\nFROM t;")
  })

  it('does not break commas inside array literal brackets', () => {
    const out = formatSql('SELECT ARRAY[1, 2, 3] AS nums FROM t;')
    expect(out).toBe('SELECT ARRAY[1, 2, 3] AS nums\nFROM t;')
  })

  it('leaves keywords and commas inside single-quoted string literals untouched', () => {
    const out = formatSql("SELECT name FROM products WHERE description LIKE '%from the store%' AND tag = 'a,b';")
    expect(out).toBe("SELECT name\nFROM products\nWHERE description LIKE '%from the store%' AND tag = 'a,b';")
  })

  it('leaves keywords inside double-quoted identifiers untouched', () => {
    const out = formatSql('SELECT "from" AS x FROM t;')
    expect(out).toBe('SELECT "from" AS x\nFROM t;')
  })

  it('handles multi-word keywords with normalized casing', () => {
    const out = formatSql('select a from t1 group by a having count(*) > 1 order by a limit 10;')
    expect(out).toBe('SELECT a\nFROM t1\nGROUP BY a\nHAVING count(*) > 1\nORDER BY a\nLIMIT 10;')
  })

  it('handles UNION ALL as a single clause', () => {
    const out = formatSql('SELECT a FROM t1 UNION ALL SELECT b FROM t2;')
    expect(out).toBe('SELECT a\nFROM t1\nUNION ALL\nSELECT b\nFROM t2;')
  })

  it('is idempotent — formatting already-formatted SQL is a no-op', () => {
    const once = formatSql('select a, b from t where a > 1 order by a;')
    expect(formatSql(once)).toBe(once)
  })
})
