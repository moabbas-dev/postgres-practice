import { useCallback, useEffect, useRef, useState } from 'react'

function readNumber(key: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(key)
    const n = raw === null ? NaN : Number(raw)
    return Number.isFinite(n) ? n : fallback
  } catch {
    return fallback
  }
}

function writeValue(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // private browsing / quota exceeded — layout prefs just won't persist
  }
}

function readBool(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : raw === '1'
  } catch {
    return fallback
  }
}

/** A panel size (width or height, in px) persisted to localStorage under `key`. */
export function usePersistedSize(key: string, defaultSize: number): [number, (n: number) => void] {
  const [size, setSizeState] = useState(() => readNumber(key, defaultSize))
  const setSize = useCallback(
    (n: number) => {
      setSizeState(n)
      writeValue(key, String(n))
    },
    [key],
  )
  return [size, setSize]
}

/** A collapsed/expanded flag persisted to localStorage under `key`. */
export function usePersistedCollapsed(key: string, defaultCollapsed = false): [boolean, (v: boolean) => void] {
  const [collapsed, setCollapsedState] = useState(() => readBool(key, defaultCollapsed))
  const setCollapsed = useCallback(
    (v: boolean) => {
      setCollapsedState(v)
      writeValue(key, v ? '1' : '0')
    },
    [key],
  )
  return [collapsed, setCollapsed]
}

interface UseDragResizeOptions {
  /** 'x' drags horizontally to resize a width; 'y' drags vertically to resize a height. */
  axis: 'x' | 'y'
  size: number
  onResize: (size: number) => void
  min: number
  max: number
  /** true when moving toward increasing screen coordinates should shrink (not grow) the size. */
  invert?: boolean
}

/** Drag-to-resize on a handle element. Returns the mousedown handler to attach to it.
 * Plain mouse events (rather than Pointer Events) are used deliberately — these handles are
 * only rendered on desktop layouts, and mouse events are dispatched more consistently across
 * browsers/automation tooling than pointer events for a simple click-and-drag interaction. */
export function useDragResize({ axis, size, onResize, min, max, invert }: UseDragResizeOptions) {
  const stateRef = useRef({ axis, size, onResize, min, max, invert })
  useEffect(() => {
    stateRef.current = { axis, size, onResize, min, max, invert }
  })

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const { axis, size, onResize, min, max, invert } = stateRef.current
    const startPos = axis === 'x' ? e.clientX : e.clientY
    const startSize = size
    const prevCursor = document.body.style.cursor
    const prevSelect = document.body.style.userSelect
    document.body.style.cursor = axis === 'x' ? 'col-resize' : 'row-resize'
    document.body.style.userSelect = 'none'

    function onMove(ev: MouseEvent) {
      const pos = axis === 'x' ? ev.clientX : ev.clientY
      const delta = invert ? startPos - pos : pos - startPos
      onResize(Math.min(max, Math.max(min, startSize + delta)))
    }
    function onUp() {
      document.body.style.cursor = prevCursor
      document.body.style.userSelect = prevSelect
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [])

  return { onMouseDown }
}
