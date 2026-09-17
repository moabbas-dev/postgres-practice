/// <reference lib="webworker" />
import { PGlite } from '@electric-sql/pglite'
import { worker } from '@electric-sql/pglite/worker'

worker({
  async init() {
    return new PGlite({
      dataDir: 'idb://postgres-arena-v1',
    })
  },
})
