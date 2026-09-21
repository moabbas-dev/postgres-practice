import { describe, expect, it } from 'vitest'
import { uppercaseKeywords } from './uppercaseKeywords'

describe('uppercaseKeywords', () => {
  it('returns empty input unchanged', () => {
    expect(uppercaseKeywords('')).toBe('')
  })

  it('uppercases basic clause keywords', () => {
    expect(uppercaseKeywords('select * from warehouses;')).toBe('SELECT * FROM warehouses;')
  })

  it('uppercases two-word clauses via independent single-word matches', () => {
    const out = uppercaseKeywords('select a from t group by a order by a asc;')
    expect(out).toBe('SELECT a FROM t GROUP BY a ORDER BY a ASC;')
  })

  it('preserves the original whitespace and line breaks exactly (casing-only, not a formatter)', () => {
    const input = 'select   name,\n    price\nfrom products\nwhere   price > 100;'
    const out = uppercaseKeywords(input)
    expect(out).toBe('SELECT   name,\n    price\nFROM products\nWHERE   price > 100;')
  })

  it('does not touch function names or data types', () => {
    const out = uppercaseKeywords("select round(avg(price), 2)::numeric from products;")
    expect(out).toBe("SELECT round(avg(price), 2)::numeric FROM products;")
  })

  it('leaves the contents of single-quoted string literals untouched', () => {
    const out = uppercaseKeywords("select name from products where description like '%from the store%';")
    expect(out).toBe("SELECT name FROM products WHERE description LIKE '%from the store%';")
  })

  it('leaves double-quoted identifiers untouched even when they look like keywords', () => {
    const out = uppercaseKeywords('select "from" as x from t;')
    expect(out).toBe('SELECT "from" AS x FROM t;')
  })

  it('leaves the text of line comments untouched', () => {
    const out = uppercaseKeywords('select 1 -- select this comment stays lowercase\nfrom t;')
    expect(out).toBe('SELECT 1 -- select this comment stays lowercase\nFROM t;')
  })

  it('leaves the text of block comments untouched', () => {
    const out = uppercaseKeywords('select 1 /* from where select */ from t;')
    expect(out).toBe('SELECT 1 /* from where select */ FROM t;')
  })

  it('handles join variants, window functions, and set operations', () => {
    const out = uppercaseKeywords(
      'select a from t1 left join t2 on t1.id = t2.id union all select b from t3 order by 1 limit 10;',
    )
    expect(out).toBe('SELECT a FROM t1 LEFT JOIN t2 ON t1.id = t2.id UNION ALL SELECT b FROM t3 ORDER BY 1 LIMIT 10;')
  })

  it('is idempotent — running it twice gives the same result', () => {
    const once = uppercaseKeywords('select a, b from t where a in (1, 2) and b is not null;')
    expect(uppercaseKeywords(once)).toBe(once)
  })

  it('already-uppercase input is unchanged', () => {
    const input = 'SELECT * FROM warehouses;'
    expect(uppercaseKeywords(input)).toBe(input)
  })
})
