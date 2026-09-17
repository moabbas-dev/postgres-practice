import { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'

let configured = false

/**
 * We intentionally do NOT configure a MonacoEnvironment.getWorker here.
 * The 'sql' language has no dedicated language-service worker (unlike
 * typescript/json/css/html), so plain editing, Monarch-based syntax
 * highlighting, and our own completion provider all work fine on the
 * main thread without one.
 */
export function configureMonaco() {
  if (configured) return
  configured = true
  loader.config({ monaco })
}
