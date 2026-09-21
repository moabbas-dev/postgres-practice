import { CaseUpper, Loader2, Play, RotateCcw, Sparkles, Send, TextSelect } from 'lucide-react'

interface EditorToolbarProps {
  onRun: () => void
  onRunSelected: () => void
  onSubmit: () => void
  onFormat: () => void
  onUppercaseKeywords: () => void
  onReset: () => void
  isRunning: boolean
  isSubmitting: boolean
}

export function EditorToolbar({ onRun, onRunSelected, onSubmit, onFormat, onUppercaseKeywords, onReset, isRunning, isSubmitting }: EditorToolbarProps) {
  const busy = isRunning || isSubmitting
  return (
    <div className="flex min-w-0 items-center gap-2 overflow-x-auto border-b border-border-subtle bg-surface px-3 py-2">
      <button
        onClick={onRun}
        disabled={busy}
        title="Run the whole query"
        className="flex shrink-0 items-center gap-1.5 rounded-md bg-surface-raised px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-surface-hover disabled:opacity-50 cursor-pointer"
      >
        {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 text-accent" />}
        Run
        <kbd className="ml-1 rounded border border-border-subtle px-1 text-[9px] text-text-muted">⌘'</kbd>
      </button>
      <button
        onClick={onRunSelected}
        disabled={busy}
        title="Run only the selected text (or the whole query if nothing is selected)"
        className="flex shrink-0 items-center gap-1.5 rounded-md bg-surface-raised px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-surface-hover disabled:opacity-50 cursor-pointer"
      >
        {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TextSelect className="h-3.5 w-3.5 text-accent" />}
        Run selected
        <kbd className="ml-1 rounded border border-border-subtle px-1 text-[9px] text-text-muted">⌘;</kbd>
      </button>
      <button
        onClick={onSubmit}
        disabled={busy}
        title="Submit for grading"
        className="flex shrink-0 items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-canvas transition-colors hover:bg-accent/90 disabled:opacity-50 cursor-pointer"
      >
        {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        Submit
        <kbd className="ml-1 rounded border border-canvas/30 px-1 text-[9px] text-canvas/70">⌘⏎</kbd>
      </button>

      <div className="ml-auto flex shrink-0 items-center gap-1">
        <button onClick={onFormat} title="Format query" className="rounded-md p-1.5 text-text-muted hover:bg-surface-hover hover:text-text-primary cursor-pointer">
          <Sparkles className="h-4 w-4" />
        </button>
        <button
          onClick={onUppercaseKeywords}
          title="Uppercase SQL keywords"
          className="rounded-md p-1.5 text-text-muted hover:bg-surface-hover hover:text-text-primary cursor-pointer"
        >
          <CaseUpper className="h-4 w-4" />
        </button>
        <button onClick={onReset} title="Reset to starter query" className="rounded-md p-1.5 text-text-muted hover:bg-surface-hover hover:text-text-primary cursor-pointer">
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
