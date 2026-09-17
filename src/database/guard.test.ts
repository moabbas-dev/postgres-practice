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
})
