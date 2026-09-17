/** Describes the practice database schema for the explorer UI. This is metadata
 * about the tables that live inside PGlite — it does not create them. */

export interface DatabaseColumn {
  name: string
  type: string
  nullable: boolean
  isPrimaryKey: boolean
  isForeignKey: boolean
  references?: { table: string; column: string }
  default?: string
  description?: string
}

export interface DatabaseTable {
  name: string
  description: string
  columns: DatabaseColumn[]
  rowCountApprox: number
  category: 'people' | 'catalog' | 'commerce' | 'engagement' | 'support' | 'reference'
}

export interface DatabaseRelationship {
  fromTable: string
  fromColumn: string
  toTable: string
  toColumn: string
  kind: 'one-to-many' | 'many-to-many' | 'one-to-one'
  viaTable?: string
}
