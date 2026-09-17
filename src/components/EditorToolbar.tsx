import { Loader2, Play, RotateCcw, Sparkles, Send } from 'lucide-react'

interface EditorToolbarProps {
  onRun: () => void
  onSubmit: () => void
  onFormat: () => void
  onReset: () => void
  isRunning: boolean
  isSubmitting: boolean
}

export function EditorToolbar({ onRun, onSubmit, onFormat, onReset, isRunning, isSubmitting }: EditorToolbarProps) {
  const busy = isRunning || isSubmitting
  return (
    <div className="flex items-center gap-2 border-b border-border-subtle bg-surface px-3 py-2">
      <button
        onClick={onRun}
        disabled={busy}
        className="flex items-center gap-1.5 rounded-md bg-surface-raised px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-surface-hover disabled:opacity-50"
      >
        {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 text-accent" />}
        Run
        <kbd className="ml-1 rounded border border-border-subtle px-1 text-[9px] text-text-muted">⌘⏎</kbd>
      </button>
      <button
        onClick={onSubmit}
        disabled={busy}
        className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-canvas transition-colors hover:bg-accent/90 disabled:opacity-50"
      >
        {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        Submit
      </button>

      <div className="ml-auto flex items-center gap-1">
        <button onClick={onFormat} title="Format query" className="rounded-md p-1.5 text-text-muted hover:bg-surface-hover hover:text-text-primary">
          <Sparkles className="h-4 w-4" />
        </button>
        <button onClick={onReset} title="Reset to starter query" className="rounded-md p-1.5 text-text-muted hover:bg-surface-hover hover:text-text-primary">
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
