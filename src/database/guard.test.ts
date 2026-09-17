import { describe, expect, it } from 'vitest'
import { GuardError, guardReadOnly } from './guard'

describe('guardReadOnly', () => {
  it('allows a plain SELECT', () => {
    expect(() => guardReadOnly('SELECT * FROM products')).not.toThrow()
  })

  it('allows a WITH (CTE) query', () => {
    expect(() => guardReadOnly('WITH x AS (SELECT 1) SELECT * FROM x')).not.toThrow()
  })

  it('allows a trailing semicolon', () => {
    expect(() => guardReadOnly('SELECT 1;')).not.toThrow()
  })

  it('allows lowercase and mixed case', () => {
    expect(() => guardReadOnly('select * from products')).not.toThrow()
  })

  it('rejects an empty query', () => {
    expect(() => guardReadOnly('   ')).toThrow(GuardError)
  })

  it('rejects INSERT', () => {
    expect(() => guardReadOnly('INSERT INTO products (name) VALUES (1)')).toThrow(GuardError)
  })

  it('rejects UPDATE', () => {
    expect(() => guardReadOnly('UPDATE products SET price = 1')).toThrow(GuardError)
  })

  it('rejects DELETE', () => {
    expect(() => guardReadOnly('DELETE FROM products')).toThrow(GuardError)
  })

  it('rejects DROP TABLE', () => {
    expect(() => guardReadOnly('DROP TABLE products')).toThrow(GuardError)
  })

  it('rejects a second statement stacked after a semicolon', () => {
    expect(() => guardReadOnly('SELECT 1; DROP TABLE products;')).toThrow(GuardError)
  })

  it('rejects a query that does not start with a read-only keyword', () => {
    expect(() => guardReadOnly('EXEC something')).toThrow(GuardError)
  })

  it('rejects transaction control statements', () => {
    expect(() => guardReadOnly('BEGIN')).toThrow(GuardError)
    expect(() => guardReadOnly('COMMIT')).toThrow(GuardError)
  })

  it('allows a mutation keyword when it only appears inside a string literal-like context is still rejected (defense in depth)', () => {
    // The guard is intentionally strict/keyword-based rather than a full SQL
    // parser, so a SELECT that merely mentions a forbidden word is also blocked.
    expect(() => guardReadOnly("SELECT 'insert' AS word")).toThrow(GuardError)
  })

  it('allows a SELECT preceded by a -- comment', () => {
    expect(() => guardReadOnly('-- Write your PostgreSQL query here\nSELECT * FROM warehouses;')).not.toThrow()
  })

  it('allows a SELECT preceded by a /* */ comment', () => {
    expect(() => guardReadOnly('/* Query warehouses */\nSELECT * FROM warehouses;')).not.toThrow()
  })

  it('allows leading blank lines and whitespace before a comment and query', () => {
    expect(() => guardReadOnly('\n\n  -- leading comment\n\n  SELECT * FROM warehouses;')).not.toThrow()
  })

  it('allows a trailing -- comment after the query', () => {
    expect(() => guardReadOnly('SELECT * FROM warehouses; -- trailing note')).not.toThrow()
  })

  it('allows a trailing /* */ comment after the query', () => {
    expect(() => guardReadOnly('SELECT * FROM warehouses /* note */')).not.toThrow()
  })

  it('allows a WITH query preceded by comments', () => {
    expect(() =>
      guardReadOnly('-- CTE example\nWITH x AS (SELECT 1) SELECT * FROM x;')
    ).not.toThrow()
  })

  it('allows a VALUES query preceded by comments', () => {
    expect(() => guardReadOnly('/* literal rows */\nVALUES (1), (2), (3);')).not.toThrow()
  })

  it('allows a comment between statement keywords', () => {
    expect(() => guardReadOnly('SELECT /* inline */ * FROM warehouses;')).not.toThrow()
  })

  it('rejects a query that is only comments', () => {
    expect(() => guardReadOnly('-- just a comment\n/* another comment */')).toThrow(GuardError)
  })

  it('rejects INSERT preceded by a comment', () => {
    expect(() => guardReadOnly('-- sneaky\nINSERT INTO warehouses (name) VALUES (1);')).toThrow(GuardError)
  })

  it('rejects DROP TABLE preceded by a comment', () => {
    expect(() => guardReadOnly('/* drop it */\nDROP TABLE warehouses;')).toThrow(GuardError)
  })

  it('rejects a write statement disguised behind a comment that looks like a SELECT keyword', () => {
    expect(() => guardReadOnly('-- SELECT this is actually a comment\nDELETE FROM warehouses;')).toThrow(GuardError)
  })
})
