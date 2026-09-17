import { defineExercise } from './helpers'
import type { Exercise } from '../../types'

export const level10Exercises: Exercise[] = [
  defineExercise({
    id: 'l10-01',
    level: 10,
    order: 1,
    title: 'Top decile spenders within their signup cohort',
    difficultyScore: 9,
    description: "For every customer with at least one completed payment, compute their `lifetime_value` (total completed payment amount) and their `cohort_month` (the month they signed up). Return `customer_id`, `cohort_month`, and `lifetime_value` for customers in the top 10% of spend WITHIN their own cohort (percent rank >= 0.9).",
    tablesInvolved: ['customers', 'orders', 'payments'],
    conceptTags: ['PERCENT_RANK', 'CTE', 'cohort analysis'],
    hints: [
      { order: 1, text: 'First compute lifetime_value per customer, carrying their cohort_month along.' },
      { order: 2, text: 'PERCENT_RANK() OVER (PARTITION BY cohort_month ORDER BY lifetime_value) gives each customer a 0-1 score relative to their own cohort.' },
    ],
    solution: {
      sql: `WITH customer_revenue AS (
  SELECT o.customer_id, DATE_TRUNC('month', c.signup_date) AS cohort_month, SUM(p.amount) AS lifetime_value
  FROM orders o
  JOIN payments p ON p.order_id = o.id
  JOIN customers c ON c.id = o.customer_id
  WHERE p.status = 'completed'
  GROUP BY o.customer_id, DATE_TRUNC('month', c.signup_date)
),
ranked AS (
  SELECT customer_id, cohort_month, lifetime_value,
         PERCENT_RANK() OVER (PARTITION BY cohort_month ORDER BY lifetime_value) AS pct_rank
  FROM customer_revenue
)
SELECT customer_id, cohort_month, ROUND(lifetime_value, 2) AS lifetime_value
FROM ranked
WHERE pct_rank >= 0.9;`,
      explanation: 'PERCENT_RANK() computes (rank - 1) / (partition size - 1), giving a 0-to-1 score that is directly comparable across cohorts of different sizes — exactly what "top 10% within their cohort" requires.',
      conceptsUsed: ['PERCENT_RANK', 'CTE', 'cohort analysis'],
    },
    validation: { roundDecimals: 2 },
  }),
  defineExercise({
    id: 'l10-02',
    level: 10,
    order: 2,
    title: 'Funnel drop-off report',
    difficultyScore: 8,
    description: "The behavioral funnel is page_view → product_view → add_to_cart → begin_checkout → purchase. For every browsing session, determine the FURTHEST funnel stage it reached, then return `max_stage` (1-5) and `session_count` — how many sessions stopped at each stage.",
    tablesInvolved: ['events'],
    conceptTags: ['CASE', 'CTE', 'funnel analysis'],
    hints: [{ order: 1, text: 'Map each event_type to a numeric stage with CASE, then take MAX(stage) per session_id.' }],
    solution: {
      sql: `WITH funnel_order AS (
  SELECT session_id,
         CASE event_type
           WHEN 'page_view' THEN 1
           WHEN 'product_view' THEN 2
           WHEN 'add_to_cart' THEN 3
           WHEN 'begin_checkout' THEN 4
           WHEN 'purchase' THEN 5
           ELSE 0
         END AS stage
  FROM events
),
session_max AS (
  SELECT session_id, MAX(stage) AS max_stage FROM funnel_order WHERE stage > 0 GROUP BY session_id
)
SELECT max_stage, COUNT(*) AS session_count FROM session_max GROUP BY max_stage;`,
      explanation: 'Mapping categorical stages to integers with CASE turns "how far did they get" into a simple MAX() aggregate — a common trick for funnel analysis.',
      conceptsUsed: ['CASE', 'CTE'],
    },
  }),
  defineExercise({
    id: 'l10-03',
    level: 10,
    order: 3,
    title: 'Customer win-backs after a long silence',
    difficultyScore: 8,
    description: 'Find every case where a customer went more than 90 days between two consecutive orders and then ordered again. Return `customer_id`, `gap_days` (rounded to 2 decimals), and `reactivation_date` (the order date that ended the gap).',
    tablesInvolved: ['orders'],
    conceptTags: ['LAG', 'window functions', 'EXTRACT'],
    hints: [{ order: 1, text: 'LAG(order_date) per customer gives you the previous order date on every row; subtract to get the gap.' }],
    solution: {
      sql: `WITH gaps AS (
  SELECT customer_id, order_date,
         LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date, id) AS prev_date
  FROM orders
),
big_gaps AS (
  SELECT customer_id, order_date,
         EXTRACT(EPOCH FROM (order_date - prev_date)) / 86400.0 AS gap_days
  FROM gaps
  WHERE prev_date IS NOT NULL
)
SELECT customer_id, ROUND(gap_days, 2) AS gap_days, order_date AS reactivation_date
FROM big_gaps
WHERE gap_days > 90;`,
      explanation: 'Because LAG only returns a value when a prior row exists in the partition, filtering on prev_date IS NOT NULL automatically restricts this to gaps that were actually followed by a new order — a natural "win-back" definition.',
      conceptsUsed: ['LAG', 'EXTRACT'],
    },
    validation: { roundDecimals: 2 },
  }),
  defineExercise({
    id: 'l10-04',
    level: 10,
    order: 4,
    title: 'RFM customer segmentation',
    difficultyScore: 9,
    description: "Compute a classic RFM segment for every customer with at least one order: Recency (days between 2026-08-16 and their most recent order), Frequency (total order count), and Monetary (total spend across order_items, quantity × unit_price × (1 - discount_pct/100)). Split each metric into 4 NTILE buckets, ordering ascending by the raw metric value (bucket 1 = lowest value, bucket 4 = highest value) — for recency, a LOWER days-since-last-order value is what gets bucketed ascending. Return `customer_id` and `rfm_segment`: the three bucket numbers concatenated as text, e.g. '423'.",
    requirements: ['For every NTILE, break ties in the metric by customer_id ascending, so bucket assignment is fully deterministic.'],
    tablesInvolved: ['orders', 'order_items'],
    conceptTags: ['NTILE', 'multi-stage CTE pipeline', 'string building'],
    hints: [
      { order: 1, text: 'Build recency/frequency in one CTE and monetary value in another, then join them before computing the three NTILE(4) window functions.' },
      { order: 2, text: 'Cast each bucket number to text and concatenate with ||.' },
    ],
    solution: {
      sql: `WITH customer_orders AS (
  SELECT customer_id, MAX(order_date) AS last_order, COUNT(*) AS freq
  FROM orders
  GROUP BY customer_id
),
customer_spend AS (
  SELECT o.customer_id, SUM(oi.quantity * oi.unit_price * (1 - oi.discount_pct / 100.0)) AS monetary
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  GROUP BY o.customer_id
),
rfm_base AS (
  SELECT co.customer_id,
         (DATE '2026-08-16' - co.last_order::date) AS recency_days,
         co.freq,
         cs.monetary
  FROM customer_orders co
  JOIN customer_spend cs ON cs.customer_id = co.customer_id
),
rfm AS (
  SELECT customer_id,
         NTILE(4) OVER (ORDER BY recency_days ASC, customer_id) AS r_score,
         NTILE(4) OVER (ORDER BY freq ASC, customer_id) AS f_score,
         NTILE(4) OVER (ORDER BY monetary ASC, customer_id) AS m_score
  FROM rfm_base
)
SELECT customer_id, (r_score::text || f_score::text || m_score::text) AS rfm_segment
FROM rfm;`,
      explanation: 'RFM segmentation is a real-world marketing technique: three independent NTILE(4) window functions bucket each metric on its own scale, and the three digits combined identify a customer\'s segment (e.g. "111" = worst on all three, "444" = best on all three).',
      conceptsUsed: ['NTILE', 'multi-stage CTE pipeline'],
    },
  }),
  defineExercise({
    id: 'l10-05',
    level: 10,
    order: 5,
    title: 'Median order value',
    difficultyScore: 6,
    description: 'Compute the median order value across all orders (each order\'s value = SUM(quantity × unit_price × (1 - discount_pct/100)) across its items), as a single column `median_order_value`.',
    tablesInvolved: ['orders', 'order_items'],
    conceptTags: ['PERCENTILE_CONT', 'ordered-set aggregate'],
    hints: [{ order: 1, text: 'PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY expr) computes the median via linear interpolation.' }],
    solution: {
      sql: `SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total) AS median_order_value
FROM (
  SELECT o.id, SUM(oi.quantity * oi.unit_price * (1 - oi.discount_pct / 100.0)) AS total
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  GROUP BY o.id
) order_totals;`,
      explanation: 'PERCENTILE_CONT is an "ordered-set aggregate" — unlike a normal aggregate, its WITHIN GROUP (ORDER BY ...) clause is mandatory and defines the ordering it interpolates a target percentile over. PERCENTILE_CONT(0.5) is exactly the median.',
      conceptsUsed: ['PERCENTILE_CONT'],
    },
    validation: { roundDecimals: 2 },
  }),
  defineExercise({
    id: 'l10-06',
    level: 10,
    order: 6,
    title: 'Top 2 earners in every department subtree',
    difficultyScore: 9,
    description: 'For every department, find the top 2 highest-paid employees anywhere within it or its sub-departments (recursively). Return `department_id`, `first_name`, `last_name`, and `salary`.',
    requirements: ['Break salary ties by employee id, ascending.'],
    tablesInvolved: ['departments', 'employees'],
    conceptTags: ['recursive CTE', 'LATERAL', 'arrays'],
    hints: [
      { order: 1, text: 'Build the (ancestor, descendant) department pairs recursively, then ARRAY_AGG the descendant dept ids per ancestor.' },
      { order: 2, text: 'Use a LATERAL subquery with `department_id = ANY(dept_ids) ORDER BY salary DESC LIMIT 2` to pull the top 2 per ancestor.' },
    ],
    solution: {
      sql: `WITH RECURSIVE dept_tree AS (
  SELECT id AS ancestor_id, id AS dept_id FROM departments
  UNION ALL
  SELECT dt.ancestor_id, d.id
  FROM departments d
  JOIN dept_tree dt ON d.parent_department_id = dt.dept_id
),
subtree_depts AS (
  SELECT ancestor_id, ARRAY_AGG(dept_id) AS dept_ids FROM dept_tree GROUP BY ancestor_id
)
SELECT sd.ancestor_id AS department_id, e.first_name, e.last_name, e.salary
FROM subtree_depts sd
CROSS JOIN LATERAL (
  SELECT first_name, last_name, salary
  FROM employees
  WHERE department_id = ANY(sd.dept_ids)
  ORDER BY salary DESC, id
  LIMIT 2
) e;`,
      explanation: 'Collapsing each ancestor\'s full descendant department set into a single array with ARRAY_AGG lets a single LATERAL subquery per ancestor do the "top 2 across many departments" lookup with ANY(array), instead of a separate join per level of depth.',
      conceptsUsed: ['recursive CTE', 'LATERAL', 'ARRAY_AGG'],
    },
    validation: { roundDecimals: 2 },
  }),
  defineExercise({
    id: 'l10-07',
    level: 10,
    order: 7,
    title: 'Frequently bought together',
    difficultyScore: 8,
    description: 'Find the top 10 pairs of DIFFERENT products that appear together most often in the same order. Return `product_1`, `product_2`, and `co_occurrences`, ordered from most to least frequent pairing.',
    requirements: [
      'Each pair should appear only once (not twice in reversed order).',
      'Break ties in co_occurrences by product_1 then product_2, both ascending, so the top 10 cutoff is deterministic.',
    ],
    tablesInvolved: ['order_items'],
    conceptTags: ['self join', 'market basket analysis', 'top-N'],
    hints: [{ order: 1, text: 'Self-join order_items to itself on matching order_id, and use product_id < product_id to avoid counting each pair twice (or with itself).' }],
    solution: {
      sql: `WITH pairs AS (
  SELECT oi1.product_id AS product_1, oi2.product_id AS product_2
  FROM order_items oi1
  JOIN order_items oi2 ON oi1.order_id = oi2.order_id AND oi1.product_id < oi2.product_id
)
SELECT product_1, product_2, COUNT(*) AS co_occurrences
FROM pairs
GROUP BY product_1, product_2
ORDER BY co_occurrences DESC, product_1, product_2
LIMIT 10;`,
      explanation: 'The `oi1.product_id < oi2.product_id` condition in the self join both prevents pairing a product with itself and guarantees each unordered pair is counted exactly once, since only one of the two orderings satisfies "<".',
      conceptsUsed: ['self join', 'market basket analysis'],
    },
    validation: { orderMatters: true },
  }),
  defineExercise({
    id: 'l10-08',
    level: 10,
    order: 8,
    title: 'Low-stock alert per warehouse, as JSON',
    difficultyScore: 8,
    description: 'For every warehouse, return `code` and `low_stock` — a JSON array of its 3 lowest-quantity products (each `{"sku": ..., "quantity": ...}`), ordered from lowest to highest quantity within the array.',
    tablesInvolved: ['warehouses', 'inventory', 'products'],
    conceptTags: ['LATERAL', 'JSONB_AGG', 'jsonb_build_object'],
    hints: [{ order: 1, text: 'Inside the LATERAL, first LIMIT to the 3 lowest-quantity inventory rows for that warehouse, then join to products for the sku before aggregating to JSON.' }],
    solution: {
      sql: `SELECT w.code, j.low_stock
FROM warehouses w
CROSS JOIN LATERAL (
  SELECT jsonb_agg(jsonb_build_object('sku', p.sku, 'quantity', low.quantity) ORDER BY low.quantity ASC, p.sku) AS low_stock
  FROM (
    SELECT product_id, quantity FROM inventory WHERE warehouse_id = w.id ORDER BY quantity ASC LIMIT 3
  ) low
  JOIN products p ON p.id = low.product_id
) j;`,
      explanation: 'The LIMIT happens inside the innermost subquery (per warehouse, via LATERAL) before the JOIN and JSON aggregation — doing it in the other order would require ranking every product in every warehouse first, which is far more expensive.',
      conceptsUsed: ['LATERAL', 'JSONB_AGG', 'jsonb_build_object'],
    },
  }),
  defineExercise({
    id: 'l10-09',
    level: 10,
    order: 9,
    title: 'Cohort retention curve (months 0-3)',
    difficultyScore: 9,
    description: 'For each customer signup cohort (by month), compute a retention curve for months 0 through 3 since signup: for each `(cohort_month, month_number)`, return `cohort_size`, `active_customers` (distinct customers who placed an order in that relative month), and `retention_pct` (rounded to 2 decimals).',
    tablesInvolved: ['customers', 'orders'],
    conceptTags: ['cohort analysis', 'multi-stage CTE pipeline', 'DATE_TRUNC'],
    hints: [
      { order: 1, text: 'month_number = (order month - cohort month), expressed in whole months: (year_diff * 12 + month_diff).' },
      { order: 2, text: 'Compute cohort_size once per cohort_month in its own CTE, then join it into the final aggregation so it is not affected by the month_number filter.' },
    ],
    solution: {
      sql: `WITH cohorts AS (
  SELECT id, DATE_TRUNC('month', signup_date) AS cohort_month FROM customers
),
cohort_sizes AS (
  SELECT cohort_month, COUNT(*) AS cohort_size FROM cohorts GROUP BY cohort_month
),
activity AS (
  SELECT co.cohort_month,
         (EXTRACT(YEAR FROM DATE_TRUNC('month', o.order_date)) - EXTRACT(YEAR FROM co.cohort_month)) * 12
           + (EXTRACT(MONTH FROM DATE_TRUNC('month', o.order_date)) - EXTRACT(MONTH FROM co.cohort_month)) AS month_number,
         o.customer_id
  FROM cohorts co
  JOIN orders o ON o.customer_id = co.id
)
SELECT a.cohort_month, a.month_number, cs.cohort_size,
       COUNT(DISTINCT a.customer_id) AS active_customers,
       ROUND(100.0 * COUNT(DISTINCT a.customer_id) / cs.cohort_size, 2) AS retention_pct
FROM activity a
JOIN cohort_sizes cs ON cs.cohort_month = a.cohort_month
WHERE a.month_number BETWEEN 0 AND 3
GROUP BY a.cohort_month, a.month_number, cs.cohort_size;`,
      explanation: 'This is the query behind almost every SaaS/e-commerce retention chart: a cohort_sizes CTE computed independently of the month_number filter (so the denominator is always the full cohort), joined against month-by-month activity.',
      conceptsUsed: ['cohort analysis', 'multi-stage CTE pipeline'],
    },
    validation: { roundDecimals: 2 },
  }),
  defineExercise({
    id: 'l10-10',
    level: 10,
    order: 10,
    title: 'Possibly wrongly discontinued products',
    difficultyScore: 8,
    description: "Find discontinued products whose margin (price - cost) is in the top 10% of margins across the ENTIRE catalog (percent rank >= 0.9, computed over all products regardless of status). Return `sku`, `name`, `margin`, and `margin_percentile`.",
    tablesInvolved: ['products'],
    conceptTags: ['PERCENT_RANK', 'window functions', 'business logic'],
    hints: [{ order: 1, text: 'Compute PERCENT_RANK() over ALL products first (an unfiltered window), then filter to discontinued ones afterward — filtering earlier would change the percentile\'s meaning.' }],
    solution: {
      sql: `WITH margins AS (
  SELECT sku, name, status, (price - cost) AS margin,
         PERCENT_RANK() OVER (ORDER BY (price - cost)) AS margin_percentile
  FROM products
)
SELECT sku, name, ROUND(margin, 2) AS margin, ROUND(margin_percentile, 4) AS margin_percentile
FROM margins
WHERE status = 'discontinued' AND margin_percentile >= 0.9;`,
      explanation: 'The window function must run over the unfiltered product set so each product\'s percentile reflects its standing across the whole catalog — filtering to status = \'discontinued\' only happens in the outer query, after the ranking is already fixed.',
      conceptsUsed: ['PERCENT_RANK', 'window functions'],
    },
    validation: { roundDecimals: 4 },
  }),
  defineExercise({
    id: 'l10-11',
    level: 10,
    order: 11,
    title: 'Sessionize events by inactivity gap',
    difficultyScore: 9,
    description: "Within each browsing session, split events into sub-sessions whenever more than 120 seconds pass between consecutive events. Return `session_id`, `sub_session_number` (starting at 1), `event_count`, `started_at`, and `ended_at` for every resulting sub-session.",
    tablesInvolved: ['events'],
    conceptTags: ['gaps and islands', 'window functions', 'LAG'],
    hints: [
      { order: 1, text: 'Compute the gap (in seconds) since the previous event in the same session with LAG + EXTRACT(EPOCH FROM ...); the very first event of a session has no previous row, so treat that as a gap too.' },
      { order: 2, text: 'Flag each event 1 if it starts a new sub-session (first event, or gap > 120) else 0, then a running SUM() of that flag within the session is the sub-session number.' },
    ],
    solution: {
      sql: `WITH gaps AS (
  SELECT id, session_id, occurred_at,
         EXTRACT(EPOCH FROM (occurred_at - LAG(occurred_at) OVER (PARTITION BY session_id ORDER BY occurred_at, id))) AS gap_seconds
  FROM events
),
flags AS (
  SELECT id, session_id, occurred_at,
         CASE WHEN gap_seconds IS NULL OR gap_seconds > 120 THEN 1 ELSE 0 END AS is_new_sub
  FROM gaps
),
numbered AS (
  SELECT session_id, occurred_at,
         SUM(is_new_sub) OVER (PARTITION BY session_id ORDER BY occurred_at, id) AS sub_session_number
  FROM flags
)
SELECT session_id, sub_session_number, COUNT(*) AS event_count, MIN(occurred_at) AS started_at, MAX(occurred_at) AS ended_at
FROM numbered
GROUP BY session_id, sub_session_number;`,
      explanation: 'A running SUM() of a 0/1 "new group started here" flag is a general-purpose alternative to the row-number-difference trick — it increments by 1 exactly at each gap, producing a ready-made group id (here, the sub-session number) with no extra arithmetic needed.',
      conceptsUsed: ['gaps and islands', 'window functions', 'LAG'],
    },
  }),
  defineExercise({
    id: 'l10-12',
    level: 10,
    order: 12,
    title: "Each customer's favorite category and spend percentile",
    difficultyScore: 9,
    description: 'For every customer with at least one order, find the single category they have spent the most on (their `top_category_id`), and their `spend_percentile` — a PERCENT_RANK (rounded to 4 decimals) of their total spend across ALL customers.',
    requirements: ['Break ties for top_category_id by category_id, ascending.'],
    tablesInvolved: ['orders', 'order_items', 'products'],
    conceptTags: ['multi-stage CTE pipeline', 'ROW_NUMBER', 'PERCENT_RANK'],
    hints: [
      { order: 1, text: 'Stage 1: per-customer, per-category spend. Stage 2: ROW_NUMBER each customer\'s categories by spend to find their favorite. Stage 3: total spend per customer, ranked with PERCENT_RANK across everyone.' },
    ],
    solution: {
      sql: `WITH customer_category_spend AS (
  SELECT o.customer_id, p.category_id, SUM(oi.quantity * oi.unit_price * (1 - oi.discount_pct / 100.0)) AS cat_spend
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  JOIN products p ON p.id = oi.product_id
  GROUP BY o.customer_id, p.category_id
),
top_category AS (
  SELECT customer_id, category_id,
         ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY cat_spend DESC, category_id) AS rn
  FROM customer_category_spend
),
customer_totals AS (
  SELECT customer_id, SUM(cat_spend) AS total_spend FROM customer_category_spend GROUP BY customer_id
),
ranked_totals AS (
  SELECT customer_id, total_spend, PERCENT_RANK() OVER (ORDER BY total_spend) AS spend_percentile FROM customer_totals
)
SELECT tc.customer_id, tc.category_id AS top_category_id, ROUND(rt.spend_percentile::numeric, 4) AS spend_percentile
FROM top_category tc
JOIN ranked_totals rt ON rt.customer_id = tc.customer_id
WHERE tc.rn = 1;`,
      explanation: 'This threads two independent questions — "which category dominates this customer\'s spend" and "how does this customer\'s total spend compare to everyone else\'s" — through the same customer_category_spend CTE, then joins the two answers back together at the end.',
      conceptsUsed: ['multi-stage CTE pipeline', 'ROW_NUMBER', 'PERCENT_RANK'],
    },
    validation: { roundDecimals: 4 },
  }),
  defineExercise({
    id: 'l10-13',
    level: 10,
    order: 13,
    title: 'JSON profiles for the top 10% of spenders',
    difficultyScore: 8,
    description: "For customers with at least one completed payment, compute total completed spend and rank it with PERCENT_RANK across ALL customers. For those in the top 10% (percent rank >= 0.9), return `customer_id` and a `profile` JSON object with keys 'tier' and 'total_spend'.",
    tablesInvolved: ['customers', 'orders', 'payments'],
    conceptTags: ['PERCENT_RANK', 'jsonb_build_object', 'CTE'],
    hints: [{ order: 1, text: 'Unlike the cohort-scoped percentile exercise, this PERCENT_RANK has no PARTITION BY at all — it ranks every customer against the entire customer base.' }],
    solution: {
      sql: `WITH customer_spend AS (
  SELECT o.customer_id, SUM(p.amount) AS total_spend
  FROM orders o
  JOIN payments p ON p.order_id = o.id
  WHERE p.status = 'completed'
  GROUP BY o.customer_id
),
ranked AS (
  SELECT customer_id, total_spend, PERCENT_RANK() OVER (ORDER BY total_spend) AS pct_rank FROM customer_spend
)
SELECT c.id AS customer_id,
       jsonb_build_object('tier', c.tier, 'total_spend', ROUND(r.total_spend, 2)) AS profile
FROM ranked r
JOIN customers c ON c.id = r.customer_id
WHERE r.pct_rank >= 0.9;`,
      explanation: 'Dropping PARTITION BY entirely (as opposed to the earlier cohort-scoped PERCENT_RANK exercise) makes every customer compete against the whole customer base at once, which is exactly what "top 10% overall" requires.',
      conceptsUsed: ['PERCENT_RANK', 'jsonb_build_object'],
    },
  }),
  defineExercise({
    id: 'l10-14',
    level: 10,
    order: 14,
    title: 'Each product\'s single best co-purchase partner',
    difficultyScore: 9,
    description: 'For every product that has been ordered alongside at least one other product, use LATERAL to find its single most frequently co-purchased partner. Return `product_id`, `best_partner_id`, and `co_occurrences`.',
    requirements: ['Break ties by the partner product id, ascending.'],
    tablesInvolved: ['order_items', 'products'],
    conceptTags: ['LATERAL', 'self join', 'market basket analysis'],
    hints: [
      { order: 1, text: 'First build every (product_1, product_2, co_occurrences) pair with a self join on order_id, excluding a product pairing with itself — this time keep BOTH directions of each pair, since every product needs to look up its own partners.' },
      { order: 2, text: 'Then CROSS JOIN LATERAL each product to its own top-1 row from that pairs table.' },
    ],
    solution: {
      sql: `WITH pairs AS (
  SELECT oi1.product_id AS product_1, oi2.product_id AS product_2, COUNT(*) AS co_occurrences
  FROM order_items oi1
  JOIN order_items oi2 ON oi1.order_id = oi2.order_id AND oi1.product_id <> oi2.product_id
  GROUP BY oi1.product_id, oi2.product_id
)
SELECT p.id AS product_id, top.product_2 AS best_partner_id, top.co_occurrences
FROM products p
CROSS JOIN LATERAL (
  SELECT product_2, co_occurrences FROM pairs WHERE pairs.product_1 = p.id ORDER BY co_occurrences DESC, product_2 LIMIT 1
) top;`,
      explanation: 'This differs from the earlier "top 10 pairs" exercise in one crucial way: that one used product_1 < product_2 to count each unordered pair once, but a per-product lookup needs BOTH directions present, since product A looking up its partners needs a row starting from A even though the same pair also appears starting from B.',
      conceptsUsed: ['LATERAL', 'self join', 'market basket analysis'],
    },
  }),
]
