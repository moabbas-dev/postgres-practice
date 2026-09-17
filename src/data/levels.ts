import type { Level } from '../types'

export const LEVELS: Level[] = [
  {
    id: 1,
    title: 'Super Easy',
    subtitle: 'SQL fundamentals',
    description: 'SELECT, column aliases, DISTINCT, basic WHERE, comparisons, AND/OR, ORDER BY, LIMIT/OFFSET.',
    concepts: ['SELECT', 'aliases', 'DISTINCT', 'WHERE', 'comparisons', 'AND/OR', 'ORDER BY', 'LIMIT/OFFSET'],
  },
  {
    id: 2,
    title: 'Easy',
    subtitle: 'Filtering & simple functions',
    description: 'LIKE / ILIKE, IN, BETWEEN, IS NULL, CASE, basic string/numeric/date functions.',
    concepts: ['LIKE', 'ILIKE', 'IN', 'BETWEEN', 'IS NULL', 'CASE', 'string functions', 'numeric functions', 'date functions'],
  },
  {
    id: 3,
    title: 'Basic SQL',
    subtitle: 'Aggregation & first joins',
    description: 'COUNT, SUM, AVG, MIN, MAX, GROUP BY, HAVING, and your first JOINs.',
    concepts: ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'GROUP BY', 'HAVING', 'basic JOIN'],
  },
  {
    id: 4,
    title: 'Intermediate',
    subtitle: 'Joins & subqueries',
    description: 'INNER/LEFT/RIGHT/FULL joins, self joins, many-to-many, subqueries, EXISTS / NOT EXISTS.',
    concepts: ['INNER JOIN', 'LEFT JOIN', 'FULL JOIN', 'self join', 'many-to-many', 'subqueries', 'correlated subqueries', 'EXISTS'],
  },
  {
    id: 5,
    title: 'Advanced SQL',
    subtitle: 'CTEs, set operations & NULL handling',
    description: 'CTEs, UNION/INTERSECT/EXCEPT, derived tables, conditional aggregation, FILTER, COALESCE, NULLIF.',
    concepts: ['CTE', 'UNION', 'INTERSECT', 'EXCEPT', 'derived tables', 'FILTER', 'COALESCE', 'NULLIF'],
  },
  {
    id: 6,
    title: 'Advanced PostgreSQL',
    subtitle: 'Postgres-specific power tools',
    description: 'Date/time functions, INTERVAL, regex, casting, arrays, JSON/JSONB, generate_series, DISTINCT ON.',
    concepts: ['DATE_TRUNC', 'EXTRACT', 'INTERVAL', 'regex', 'casting', 'arrays', 'JSONB', 'generate_series', 'DISTINCT ON'],
  },
  {
    id: 7,
    title: 'Window Functions',
    subtitle: 'OVER, PARTITION BY & ranking',
    description: 'ROW_NUMBER, RANK, DENSE_RANK, LAG/LEAD, running totals, moving averages, top-N per group.',
    concepts: ['OVER', 'PARTITION BY', 'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'LAG', 'LEAD', 'running totals', 'top-N per group'],
  },
  {
    id: 8,
    title: 'Very Advanced',
    subtitle: 'Recursion, LATERAL & advanced JSON',
    description: 'Recursive CTEs, hierarchical data, LATERAL joins, advanced JSONB, gaps and islands.',
    concepts: ['recursive CTE', 'hierarchical data', 'LATERAL', 'CROSS JOIN LATERAL', 'JSONB aggregation', 'gaps and islands'],
  },
  {
    id: 9,
    title: 'Expert',
    subtitle: 'Combining everything',
    description: 'Real-world problems combining recursive CTEs, window functions, LATERAL, JSONB, and complex business logic.',
    concepts: ['multi-CTE pipelines', 'window + recursion', 'LATERAL', 'cohort analysis', 'time-series', 'hierarchical queries'],
  },
  {
    id: 10,
    title: 'Extremely Hard',
    subtitle: 'Final boss',
    description: 'Genuinely difficult, multi-stage PostgreSQL problems that mirror real data-engineering work.',
    concepts: ['graph-like queries', 'multi-stage CTEs', 'advanced windowing', 'cohort analysis', 'gaps and islands', 'JSONB transformation'],
  },
]

export const LEVEL_BY_ID = new Map(LEVELS.map((l) => [l.id, l]))
