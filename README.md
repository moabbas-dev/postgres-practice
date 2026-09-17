# Postgres Arena

A production-quality, **frontend-only** PostgreSQL practice platform. It runs a real
PostgreSQL server (compiled to WebAssembly) entirely inside your browser tab — no
backend, no signup, no installed database. Write SQL, run it against ~75,000 rows of
realistic e-commerce data, and get instant, result-based feedback across 149
exercises spanning 10 difficulty levels, from `SELECT *` to multi-stage recursive
CTE / window-function pipelines.

```bash
npm install
npm run dev
```

Open the printed local URL. The first load generates the seed dataset (a few
seconds) and persists it to IndexedDB, so every reload after that is instant.

---

## Why PGlite

The brief for this project explicitly required investigating whether "normal
PostgreSQL" can run in a browser — it can't, but a WebAssembly build of the real
Postgres server can, and that's what [PGlite](https://pglite.dev) (`@electric-sql/pglite`)
provides. It was chosen over the alternatives for one reason: **it is Postgres**,
not an emulation of it.

- **sql.js** only wraps SQLite — no window functions in the SQL-standard sense,
  no `JSONB`, no `LATERAL`, no real `RECURSIVE` semantics, no PostgreSQL-specific
  functions (`generate_series`, `DISTINCT ON`, array operators, ...). A large slice
  of this curriculum (Levels 6–10) would simply be impossible.
- **A cloud/managed Postgres instance** would technically satisfy "the user runs
  real SQL," but it isn't frontend-only, requires an account/API and a live
  connection, can't isolate every learner's mutations from each other, and fails
  the "works after `npm install && npm run dev`" requirement outright.
- **PGlite** is the actual Postgres backend, built with Emscripten to WASM. Window
  functions, recursive CTEs, `LATERAL`, full JSON/JSONB, arrays, regex, all of it —
  because it's the same query planner and executor as a real server.

PGlite runs inside a **Web Worker** (`@electric-sql/pglite/worker`), so a long
seeding pass or an expensive query never freezes the UI thread — the editor, the
sidebar, and the schema explorer all stay responsive. The database file lives in
**IndexedDB** (`idb://postgres-arena-v1`), so the ~75k-row dataset is generated
once per browser profile and reloaded instantly afterward.

---

## Architecture

```text
src/
  components/          Presentational + orchestration React components (sidebar,
                        editor toolbar, results table, schema explorer, ...)
  features/
    editor/             Monaco wrapper, schema-aware completions, a lightweight
                        SQL formatter
    validation/         The OK/KO comparison engine (see below)
    progress/           Two zustand stores (completion progress, query history),
                        both persisted to IndexedDB
  database/
    schema.sql          The practice database DDL (20 tables, 11 enums, indexes)
    seed.ts             Deterministic seed-data generator (see below)
    rng.ts               Seeded PRNG (mulberry32) used by the generator
    wordLists.ts        Curated name/product/geography data for realistic seeding
    pgWorker.ts         The Web Worker entry point that boots PGlite
    db.ts               Public API: initDatabase / runUserQuery / previewTable
    guard.ts            Read-only statement guard (defense in depth, unit-tested)
  data/
    levels.ts            The 10 level definitions
    exercises/           One file per level (level1.ts … level10.ts) + an index
                        that aggregates, sorts, and cross-references them
    schemaExplorer.ts   Hand-written metadata describing the schema for the
                        right-hand explorer panel (tables, columns, relationships)
  types/                Shared TypeScript types (Exercise, QueryResult,
                        ValidationResult, UserProgress, ...)
  hooks/                useDatabase (init + progress), useTheme
```

### The database: "NorthStar Retail"

Rather than a toy 3-table schema, the project models a mid-size e-commerce
retailer with an HR org chart, a support desk, and a behavioral event stream —
chosen specifically so every curriculum level has something real to query
against:

- **People**: `departments` (self-referencing, 3-level hierarchy), `employees`
  (self-referencing `manager_id`, `jsonb` metadata, `text[]` skills), `customers`
  (self-referencing `referred_by` for referral-graph exercises, tiers, tags).
- **Catalog**: `categories` (self-referencing 2-level tree), `suppliers`,
  `products` (`uuid` PK, enum `status`, `text[]` tags, `jsonb` attributes),
  `warehouses` + `inventory` (a genuine many-to-many with a quantity attribute).
- **Commerce**: `orders`, `order_items`, `payments`, `coupons` +
  `order_coupons` (many-to-many), `memberships`.
- **Engagement**: `reviews`, and `events` — a ~30k-row sessionized behavioral
  stream (page views → cart → checkout → purchase) built specifically for
  funnel, gaps-and-islands, and time-series exercises.
- **Support**: `support_tickets` + `ticket_messages`.

Every PostgreSQL data type the curriculum needs is present: `integer`, `numeric`,
`text`, `date`/`timestamptz`, `boolean`, nullable columns, `uuid`, `jsonb`,
`text[]`/`integer[]`, and 11 native `enum` types. One-to-many, many-to-many, and
self-referencing (hierarchical) relationships are all represented for real, not
simulated.

### Seed data generation

`src/database/seed.ts` is a **deterministic** generator (seeded PRNG, no
`Math.random`) that produces ~75,000 rows of plausible data — real-sounding
names, brands, cities, product combinations, and realistic distributions (e.g.
order status weighted toward `delivered`, customer tiers weighted toward
`bronze`). It builds batched, multi-row `INSERT` statements (via
`src/database/sqlLiterals.ts`) and runs them through PGlite in the worker on
first boot.

To regenerate or resize the dataset, edit the volume constants in `seed.ts`
(e.g. `orderCount`, `sessionCount`, `reviewCount`) or the curated pools in
`wordLists.ts`, then clear the app's IndexedDB (DevTools → Application →
IndexedDB → delete `/pglite/postgres-arena-v1`) and reload — the schema and seed
run again automatically since `initDatabase` checks whether `orders` already has
rows before doing anything.

---

## How exercises are structured

Each of the 149 exercises (`src/types/exercise.ts`) carries:

```ts
{
  id, level, order, title, difficultyScore,
  description, requirements?, tablesInvolved, conceptTags,
  hints: [{ order, text }],
  solution: { sql, explanation, conceptsUsed },
  validation: { orderMatters, requireColumnNames?, roundDecimals? },
}
```

The 10 levels progress from `SELECT`/`WHERE`/`ORDER BY` fundamentals through
filtering, aggregation, joins, subqueries, CTEs & set operations, PostgreSQL-
specific features (JSON, arrays, `generate_series`, `DISTINCT ON`, regex),
window functions, recursive CTEs & `LATERAL`, and finally genuinely hard,
multi-stage problems (cohort retention curves, RFM segmentation, gaps-and-
islands, market-basket analysis) at Levels 9–10 — see `src/data/levels.ts` for
the full breakdown and `src/data/exercises/level*.ts` for the exercises
themselves.

## How validation works

**Nothing is validated by comparing SQL strings.** Both "Run" and "Submit"
execute real SQL against the real database; "Submit" additionally executes the
exercise's stored `solution.sql` and diffs the two *results*.

1. `src/database/db.ts#runUserQuery` wraps every query in
   `pg.transaction(...)`, always calling `tx.rollback()` in a `finally` block —
   so no query, however written, can ever mutate the shared practice dataset.
   A `guardReadOnly` check (`src/database/guard.ts`, unit-tested) additionally
   rejects anything that isn't a single `SELECT`/`WITH`/`VALUES` statement and a
   `statement_timeout` protects against runaway queries.
2. `src/features/validation/normalize.ts` converts each result row into a
   canonical, order-preserving array of primitive values — numeric strings
   (Postgres returns `numeric` columns as strings to preserve precision) are
   parsed to numbers, optionally rounded via the exercise's `roundDecimals`, and
   arrays/objects are compared structurally.
3. `src/features/validation/compare.ts` then decides OK/KO:
   - **Row count / column count** mismatches are reported explicitly.
   - When `validation.orderMatters` is `false` (the default), rows are compared
     as a **multiset** — sorted canonical keys are compared sequentially, so
     `SELECT name FROM t WHERE x` and the same query with an extra `ORDER BY`
     are both accepted, while duplicate rows still matter (two identical rows
     ≠ one row).
   - When `orderMatters` is `true` (exercises that explicitly require a
     specific order), rows are compared positionally, and the failure message
     distinguishes "right rows, wrong order" from "wrong values".
   - `requireColumnNames` is opt-in per exercise (used only where the exercise
     is specifically teaching column aliasing); by default, output is compared
     positionally so equivalent queries with different aliases both pass.
4. On failure, the UI shows a category ("wrong number of columns", "missing
   rows", "unexpected rows", "incorrect ordering", "query error", ...) without
   ever revealing the correct SQL. On success, exercises unlock a **Show
   official solution** panel with the reference query and an explanation.

This is exercised directly by unit tests — see `src/features/validation/*.test.ts`
for NULL handling, numeric precision, duplicate rows, ordering, and column-name
enforcement.

> **On "multiple hidden datasets":** this project runs a single, large,
> deterministic dataset rather than swapping datasets per submission. Given a
> frontend-only architecture with one persisted PGlite instance, standing up
> genuinely different datasets per exercise would mean re-seeding (multi-second
> cost) on every submission — a poor interactive experience for a code editor.
> Instead, anti-hardcoding comes from dataset scale (75k+ rows; static/guessed
> output is infeasible) and from validating against the *result of the
> reference query*, not a stored expected value — so a student who "hardcodes"
> a specific row set from experimentation still has to reproduce it exactly,
> which for anything beyond trivial `LIMIT`-based exercises requires actually
> understanding the underlying query.

---

## Editor, schema explorer, progress & history

- **Editor** — Monaco (`@monaco-editor/react`), lazy-loaded so it doesn't block
  first paint. SQL syntax highlighting, a schema-aware completion provider
  (table/column names from `schemaExplorer.ts`), `Ctrl/Cmd+Enter` to run, and a
  lightweight built-in formatter (`features/editor/formatSql.ts`).
- **Schema explorer** (right panel) — every table, its columns/types/PK/FK
  relationships, and a "Preview 15 rows" action that runs a real (sandboxed)
  query against the live database.
- **Progress** (`features/progress/store.ts`) — per-exercise status
  (unattempted/attempted/completed), attempt and submission counts, and the
  last query written, persisted to IndexedDB via `zustand/persist` with a
  custom async storage adapter over `idb-keyval`.
- **Query history** (`features/progress/historyStore.ts`) — the last 20 queries
  per exercise, each tagged with its outcome, restorable or deletable, also
  persisted to IndexedDB.

Both stores hydrate asynchronously on boot; the app shows the init/seeding
screen until the database *and* progress store are ready, so there's no flash
of empty progress.

---

## Adding a new exercise

Open the relevant `src/data/exercises/level<N>.ts` and add an entry using the
`defineExercise` helper (`src/data/exercises/helpers.ts`), which fills in
sensible `validation` defaults (`orderMatters: false`):

```ts
defineExercise({
  id: 'l3-18',                  // must be unique across the whole app
  level: 3,
  order: 18,                    // must be unique within the level, 1..N with no gaps
  title: 'Your title',
  difficultyScore: 3,           // 1-10
  description: 'What the learner must do, referencing real column names.',
  requirements: ['Optional bullet list of hard constraints.'],
  tablesInvolved: ['orders', 'customers'],
  conceptTags: ['GROUP BY', 'HAVING'],
  hints: [{ order: 1, text: '...' }, { order: 2, text: '...' }],
  solution: {
    sql: 'SELECT ...',          // the reference query — this IS the answer key
    explanation: 'Why this works / what feature it demonstrates.',
    conceptsUsed: ['GROUP BY'],
  },
  // validation: { orderMatters: true, roundDecimals: 2 }, // only if needed
})
```

`src/data/exercises/index.test.ts` runs automatically in CI-style checks
(`npm test`) and will fail the build if: an id is duplicated, a level's `order`
values aren't a contiguous `1..N` sequence, a solution/explanation/hint is
empty, or `difficultyScore` is out of range — so most structural mistakes are
caught immediately.

**Two things worth getting right when writing `solution.sql`:**

- If the query uses `ARRAY_AGG`/`JSONB_AGG`/`STRING_AGG` without an explicit
  `ORDER BY` inside the aggregate, the element order is not guaranteed to be
  stable — always add one (see Level 6 exercises for the pattern).
- If the query uses `ROW_NUMBER()`/`LAG()`/`LEAD()`/`FIRST_VALUE()`/
  `LAST_VALUE()` and the `ORDER BY` key can contain ties, add a deterministic
  tiebreaker (a primary key column) and say so in `requirements` — otherwise a
  correct-but-differently-tied user query can be marked KO. (Level 7's exercises
  document this pattern explicitly.)

## Adding a new level

1. Add an entry to `LEVELS` in `src/data/levels.ts`.
2. Create `src/data/exercises/level<N>.ts` exporting `level<N>Exercises`.
3. Import and spread it into `ALL_EXERCISES` in `src/data/exercises/index.ts`.

The sidebar, progress tracking, and navigation all derive from `ALL_EXERCISES` /
`EXERCISES_BY_LEVEL`, so nothing else needs to change.

---

## Security / execution model

Every query — Run, Submit, or a schema-explorer preview — goes through the same
`runUserQuery`:

1. `guardReadOnly` rejects anything that isn't a single read-only statement
   (`SELECT`/`WITH`/`VALUES`), and rejects known DDL/DML/transaction-control
   keywords as a second layer of defense.
2. The query executes inside `pg.transaction(...)`, which is **always** rolled
   back in a `finally` block — so even if the guard were bypassed, nothing can
   persist.
3. `SET LOCAL statement_timeout` bounds how long a single query can run.
4. PGlite itself only ever touches its own IndexedDB-backed virtual filesystem
   — it has no access to the real filesystem, network, or other browser APIs.

There is no server, so there's nothing to attack beyond the user's own tab —
but the sandboxing above means a learner also can't accidentally corrupt their
own practice dataset while experimenting.

---

## Testing

```bash
npm test        # vitest run
```

63 unit tests cover the parts of the system where a bug would be silently
wrong rather than loudly broken: result normalization (NULL vs. `0` vs. `''`,
numeric-string vs. number, rounding), multiset comparison (ordering, missing
rows, unexpected rows, duplicates), the read-only statement guard, the progress
store's state transitions (attempts, completion, non-regression from a later
failed submission), and structural integrity of the entire 149-exercise
dataset.

## Scripts

```bash
npm run dev       # start the Vite dev server
npm run build     # typecheck (tsc -b) + production build
npm run preview   # preview the production build
npm run lint      # oxlint
npm test          # vitest run
```
