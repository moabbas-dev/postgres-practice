import { useDragResize } from '../hooks/useResizablePanel'

interface ResizeHandleProps {
  axis: 'x' | 'y'
  size: number
  onResize: (size: number) => void
  min: number
  max: number
  invert?: boolean
  className?: string
}

/** A thin draggable divider for resizing an adjacent panel's width ('x') or height ('y'). */
export function ResizeHandle({ axis, size, onResize, min, max, invert, className = '' }: ResizeHandleProps) {
  const { onMouseDown } = useDragResize({ axis, size, onResize, min, max, invert })
  const isX = axis === 'x'
  return (
    <div
      role="separator"
      aria-orientation={isX ? 'vertical' : 'horizontal'}
      onMouseDown={onMouseDown}
      className={`group z-10 shrink-0 touch-none ${isX ? 'w-1.5 cursor-col-resize' : 'h-1.5 cursor-row-resize'} ${className}`}
    >
      <div
        className={`bg-border-subtle transition-colors group-hover:bg-accent group-active:bg-accent ${
          isX ? 'mx-auto h-full w-px' : 'my-auto h-px w-full'
        }`}
      />
    </div>
  )
}
