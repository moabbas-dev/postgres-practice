import Editor, { type OnMount } from '@monaco-editor/react'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import type { editor as MonacoEditorNs } from 'monaco-editor'
import { configureMonaco } from './monacoSetup'
import { DATABASE_TABLES } from '../../data/schemaExplorer'

configureMonaco()

let completionRegistered = false

function registerSchemaCompletions(monacoInstance: typeof import('monaco-editor')) {
  if (completionRegistered) return
  completionRegistered = true

  monacoInstance.languages.registerCompletionItemProvider('sql', {
    triggerCharacters: ['.', ' '],
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      }

      const suggestions: import('monaco-editor').languages.CompletionItem[] = []

      for (const table of DATABASE_TABLES) {
        suggestions.push({
          label: table.name,
          kind: monacoInstance.languages.CompletionItemKind.Class,
          detail: 'table',
          documentation: table.description,
          insertText: table.name,
          range,
        })
        for (const col of table.columns) {
          suggestions.push({
            label: col.name,
            kind: monacoInstance.languages.CompletionItemKind.Field,
            detail: `${table.name}.${col.name} — ${col.type}`,
            insertText: col.name,
            range,
          })
        }
      }

      return { suggestions }
    },
  })
}

export interface SqlEditorHandle {
  /** The currently selected text in the editor, or '' if there is no selection. */
  getSelectedText: () => string
}

interface SqlEditorProps {
  value: string
  onChange: (value: string) => void
  onRun?: () => void
  onSubmit?: () => void
  onRunSelected?: () => void
  theme: 'dark' | 'light'
  readOnly?: boolean
  height?: string | number
}

export const SqlEditor = forwardRef<SqlEditorHandle, SqlEditorProps>(function SqlEditor(
  { value, onChange, onRun, onSubmit, onRunSelected, theme, readOnly, height = '100%' },
  ref,
) {
  const onRunRef = useRef(onRun)
  const onSubmitRef = useRef(onSubmit)
  const onRunSelectedRef = useRef(onRunSelected)
  useEffect(() => {
    onRunRef.current = onRun
  }, [onRun])
  useEffect(() => {
    onSubmitRef.current = onSubmit
  }, [onSubmit])
  useEffect(() => {
    onRunSelectedRef.current = onRunSelected
  }, [onRunSelected])

  const editorRef = useRef<MonacoEditorNs.IStandaloneCodeEditor | null>(null)

  useImperativeHandle(ref, () => ({
    getSelectedText: () => {
      const editor = editorRef.current
      const selection = editor?.getSelection()
      const model = editor?.getModel()
      if (!editor || !selection || !model || selection.isEmpty()) return ''
      return model.getValueInRange(selection)
    },
  }))

  const handleMount: OnMount = (editor, monacoInstance) => {
    editorRef.current = editor
    registerSchemaCompletions(monacoInstance)
    editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter, () => {
      onSubmitRef.current?.()
    })
    editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Quote, () => {
      onRunRef.current?.()
    })
    editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Semicolon, () => {
      onRunSelectedRef.current?.()
    })
  }

  return (
    <Editor
      height={height}
      defaultLanguage="sql"
      language="sql"
      value={value}
      onChange={(v) => onChange(v ?? '')}
      theme={theme === 'dark' ? 'vs-dark' : 'light'}
      onMount={handleMount}
      options={{
        fontSize: 14,
        fontFamily: "'JetBrains Mono', ui-monospace, SF Mono, Menlo, Consolas, monospace",
        minimap: { enabled: false },
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        readOnly,
        wordWrap: 'on',
        padding: { top: 12, bottom: 12 },
        renderLineHighlight: 'gutter',
        fixedOverflowWidgets: true,
        smoothScrolling: true,
        cursorBlinking: 'smooth',
      }}
    />
  )
})
