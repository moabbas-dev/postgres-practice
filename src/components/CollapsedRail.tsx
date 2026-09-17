import type { ReactNode } from 'react'

interface CollapsedRailProps {
  label: string
  icon: ReactNode
  onExpand: () => void
  title?: string
}

/** The thin vertical strip shown in place of a folded panel — click anywhere to expand it back. */
export function CollapsedRail({ label, icon, onExpand, title }: CollapsedRailProps) {
  return (
    <button
      onClick={onExpand}
      title={title ?? `Expand ${label}`}
      className="flex h-full w-full cursor-pointer flex-col items-center gap-2 bg-surface pt-3 text-text-muted hover:text-accent"
    >
      {icon}
      <span className="text-[10px] font-semibold tracking-wide text-text-muted" style={{ writingMode: 'vertical-rl' }}>
        {label}
      </span>
    </button>
  )
}
