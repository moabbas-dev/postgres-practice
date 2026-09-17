/** Deterministic PRNG (mulberry32) so the seed dataset is 100% reproducible. */
export function mulberry32(seed: number) {
  let a = seed
  return function rand() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export class Rng {
  private next: () => number

  constructor(seed: number) {
    this.next = mulberry32(seed)
  }

  float(): number {
    return this.next()
  }

  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  numeric(min: number, max: number, decimals = 2): number {
    const v = this.next() * (max - min) + min
    const f = Math.pow(10, decimals)
    return Math.round(v * f) / f
  }

  bool(trueProbability = 0.5): boolean {
    return this.next() < trueProbability
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)]
  }

  pickN<T>(arr: readonly T[], n: number): T[] {
    const pool = [...arr]
    const out: T[] = []
    for (let i = 0; i < n && pool.length > 0; i++) {
      const idx = Math.floor(this.next() * pool.length)
      out.push(pool.splice(idx, 1)[0])
    }
    return out
  }

  weighted<T>(items: readonly (readonly [T, number])[]): T {
    const total = items.reduce((sum, [, w]) => sum + w, 0)
    let r = this.next() * total
    for (const [item, w] of items) {
      r -= w
      if (r <= 0) return item
    }
    return items[items.length - 1][0]
  }

  dateBetween(start: Date, end: Date): Date {
    const t = start.getTime() + this.next() * (end.getTime() - start.getTime())
    return new Date(t)
  }

  uuid(): string {
    const hex = () => Math.floor(this.next() * 16).toString(16)
    const seg = (n: number) => Array.from({ length: n }, hex).join('')
    return `${seg(8)}-${seg(4)}-4${seg(3)}-${(8 + Math.floor(this.next() * 4)).toString(16)}${seg(3)}-${seg(12)}`
  }
}
