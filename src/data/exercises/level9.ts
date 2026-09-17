import { defineExercise } from './helpers'
import type { Exercise } from '../../types'

export const level9Exercises: Exercise[] = [
  defineExercise({
    id: 'l9-01',
    level: 9,
    order: 1,
    title: "The employee closest to their department's average salary",
    difficultyScore: 7,
    description: "For each department, find the single employee whose salary is closest to that department's average salary. Return `department_id`, `first_name`, `last_name`, and `salary`.",
    requirements: ['Break ties by employee id, ascending.'],
    tablesInvolved: ['employees'],
    conceptTags: ['window functions', 'CTE', 'ABS'],
    hints: [
      { order: 1, text: 'First compute each department\'s average salary in a CTE.' },
      { order: 2, text: 'Join employees to that CTE, compute ABS(salary - avg_salary), then rank ascending by that difference within each department.' },
    ],
    solution: {
      sql: `WITH dept_avg AS (
  SELECT department_id, AVG(salary) AS avg_salary FROM employees GROUP BY department_id
),
diffs AS (
  SELECT e.department_id, e.id, e.first_name, e.last_name, e.salary,
         ROW_NUMBER() OVER (PARTITION BY e.department_id ORDER BY ABS(e.salary - d.avg_salary), e.id) AS rn
  FROM employees e
  JOIN dept_avg d ON d.department_id = e.department_id
)
SELECT department_id, first_name, last_name, salary FROM diffs WHERE rn = 1;`,
      explanation: 'Ranking by the absolute distance from a computed average, then keeping rank 1 per partition, is a reusable pattern for any "closest to X" problem.',
      conceptsUsed: ['CTE', 'window functions', 'ABS'],
    },
    validation: { roundDecimals: 2 },
  }),
  defineExercise({
    id: 'l9-02',
    level: 9,
    order: 2,
    title: 'Second-highest order total per customer',
    difficultyScore: 7,
    description: "For each customer, find their second-highest order total (computed as SUM(quantity × unit_price × (1 - discount_pct/100)) per order). Return `customer_id`, `order_id`, and `total`. Customers with fewer than 2 distinct order totals should not appear.",
    tablesInvolved: ['orders', 'order_items'],
    conceptTags: ['DENSE_RANK', 'CTE', 'top-N per group'],
    hints: [{ order: 1, text: 'Compute each order\'s total first, then DENSE_RANK() the totals within each customer and keep rank 2.' }],
    solution: {
      sql: `WITH order_totals AS (
  SELECT o.id AS order_id, o.customer_id,
         SUM(oi.quantity * oi.unit_price * (1 - oi.discount_pct / 100.0)) AS total
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  GROUP BY o.id, o.customer_id
),
ranked AS (
  SELECT customer_id, order_id, total,
         DENSE_RANK() OVER (PARTITION BY customer_id ORDER BY total DESC) AS rnk
  FROM order_totals
)
SELECT customer_id, order_id, ROUND(total, 2) AS total FROM ranked WHERE rnk = 2;`,
      explanation: 'DENSE_RANK is the right choice over ROW_NUMBER here: if two orders tie for the highest total, the "second-highest" should be the next distinct value, not an arbitrary tied row.',
      conceptsUsed: ['DENSE_RANK', 'CTE'],
    },
    validation: { roundDecimals: 2 },
  }),
  defineExercise({
    id: 'l9-03',
    level: 9,
    order: 3,
    title: 'Rolled-up salary cost per department',
    difficultyScore: 7,
    description: 'For every department, compute the total salary cost of everyone in that department AND all of its sub-departments (recursively). Return `department_id` and `total_salary_cost`.',
    tablesInvolved: ['departments', 'employees'],
    conceptTags: ['recursive CTE', 'hierarchical rollup'],
    hints: [{ order: 1, text: 'Build an (ancestor, descendant) pair table with a recursive CTE first, then join it to employees and aggregate per ancestor.' }],
    solution: {
      sql: `WITH RECURSIVE dept_tree AS (
  SELECT id AS ancestor_id, id AS dept_id FROM departments
  UNION ALL
  SELECT dt.ancestor_id, d.id
  FROM departments d
  JOIN dept_tree dt ON d.parent_department_id = dt.dept_id
)
SELECT dt.ancestor_id AS department_id, SUM(e.salary) AS total_salary_cost
FROM dept_tree dt
JOIN employees e ON e.department_id = dt.dept_id
GROUP BY dt.ancestor_id;`,
      explanation: 'The recursive CTE materializes every (ancestor, descendant) department pair, including self-pairs — joining that to employees and grouping by ancestor gives a full rollup in one pass, without a procedural tree walk.',
      conceptsUsed: ['recursive CTE', 'hierarchical rollup'],
    },
    validation: { roundDecimals: 2 },
  }),
  defineExercise({
    id: 'l9-04',
    level: 9,
    order: 4,
    title: 'Longest streak of consecutive ordering months',
    difficultyScore: 8,
    description: "For each customer, find their longest streak of consecutive calendar MONTHS in which they placed at least one order. Return `customer_id`, `streak_length` (in months), `streak_start`, and `streak_end` — but only streaks of 3 or more months.",
    tablesInvolved: ['orders'],
    conceptTags: ['gaps and islands', 'time-series analysis'],
    hints: [
      { order: 1, text: 'Reduce to one row per (customer, distinct order month) first, then apply the gaps-and-islands trick using a month index instead of a day index.' },
      { order: 2, text: '(year * 12 + month) minus a per-customer row number is constant across a run of consecutive months.' },
    ],
    solution: {
      sql: `WITH order_months AS (
  SELECT DISTINCT customer_id, DATE_TRUNC('month', order_date) AS m FROM orders
),
numbered AS (
  SELECT customer_id, m, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY m) AS rn FROM order_months
),
islands AS (
  SELECT customer_id, m, (EXTRACT(YEAR FROM m) * 12 + EXTRACT(MONTH FROM m)) - rn AS grp FROM numbered
)
SELECT customer_id, COUNT(*) AS streak_length, MIN(m) AS streak_start, MAX(m) AS streak_end
FROM islands
GROUP BY customer_id, grp
HAVING COUNT(*) >= 3;`,
      explanation: 'The same gaps-and-islands identity works at any time granularity — converting each month to a single incrementing integer (year*12 + month) makes "consecutive months" behave just like "consecutive days".',
      conceptsUsed: ['gaps and islands', 'time-series analysis'],
    },
  }),
  defineExercise({
    id: 'l9-05',
    level: 9,
    order: 5,
    title: "Each customer's 3 most recent orders, as JSON",
    difficultyScore: 7,
    description: 'For every customer who has placed at least one order, return `id` and `recent_orders` — a JSON array of their 3 most recent orders (each `{"date": ..., "status": ...}`), most recent first.',
    tablesInvolved: ['customers', 'orders'],
    conceptTags: ['LATERAL', 'JSONB_AGG', 'jsonb_build_object'],
    hints: [{ order: 1, text: 'Use a LATERAL subquery to first LIMIT to 3 recent orders per customer, then aggregate that limited set into JSON.' }],
    solution: {
      sql: `SELECT c.id, j.recent_orders
FROM customers c
CROSS JOIN LATERAL (
  SELECT jsonb_agg(jsonb_build_object('date', sub.order_date, 'status', sub.status) ORDER BY sub.order_date DESC) AS recent_orders
  FROM (
    SELECT order_date, status FROM orders WHERE orders.customer_id = c.id ORDER BY order_date DESC, id DESC LIMIT 3
  ) sub
) j;`,
      explanation: 'Nesting a LIMIT subquery inside a LATERAL, then aggregating it to JSON, avoids aggregating the customer\'s entire order history just to keep the top 3 — the LIMIT happens first, per customer.',
      conceptsUsed: ['LATERAL', 'JSONB_AGG'],
    },
  }),
  defineExercise({
    id: 'l9-06',
    level: 9,
    order: 6,
    title: 'Top 3 products per category by revenue share',
    difficultyScore: 8,
    description: "For each category, return its top 3 products by total revenue (quantity × unit_price × (1 - discount_pct/100)), along with `pct_of_category` — what percentage of that category's total revenue each product represents, rounded to 2 decimals.",
    tablesInvolved: ['order_items', 'products'],
    conceptTags: ['window functions', 'top-N per group', 'percentage'],
    hints: [
      { order: 1, text: 'Compute per-product revenue in a CTE first.' },
      { order: 2, text: 'You need two window functions over the same partition: RANK() for the top-3 filter, and SUM() OVER (PARTITION BY category_id) for the category total used in the percentage.' },
    ],
    solution: {
      sql: `WITH product_revenue AS (
  SELECT p.category_id, p.id AS product_id, p.name,
         SUM(oi.quantity * oi.unit_price * (1 - oi.discount_pct / 100.0)) AS revenue
  FROM order_items oi
  JOIN products p ON p.id = oi.product_id
  GROUP BY p.category_id, p.id, p.name
),
ranked AS (
  SELECT category_id, name, revenue,
         RANK() OVER (PARTITION BY category_id ORDER BY revenue DESC) AS rnk,
         ROUND(100.0 * revenue / SUM(revenue) OVER (PARTITION BY category_id), 2) AS pct_of_category
  FROM product_revenue
)
SELECT category_id, name, ROUND(revenue, 2) AS revenue, pct_of_category
FROM ranked
WHERE rnk <= 3;`,
      explanation: 'Two different window functions can share the same PARTITION BY without interfering: one ranks rows, the other computes a partition-wide total used as the denominator for a percentage.',
      conceptsUsed: ['window functions', 'top-N per group'],
    },
    validation: { roundDecimals: 2 },
  }),
  defineExercise({
    id: 'l9-07',
    level: 9,
    order: 7,
    title: "Every employee's top-level manager",
    difficultyScore: 7,
    description: 'For every employee, find the id of the person at the very top of their reporting chain (the manager with no manager of their own — possibly themselves). Return `employee_id` and `top_level_manager_id`.',
    tablesInvolved: ['employees'],
    conceptTags: ['recursive CTE', 'hierarchical data'],
    hints: [
      { order: 1, text: 'Walk upward from each employee through manager_id until you reach a row whose manager_id IS NULL.' },
      { order: 2, text: 'Track the original employee_id unchanged throughout the recursion, while a second column climbs the chain.' },
    ],
    solution: {
      sql: `WITH RECURSIVE chain AS (
  SELECT id AS employee_id, id AS ancestor_id, manager_id FROM employees
  UNION ALL
  SELECT c.employee_id, e.id, e.manager_id
  FROM chain c
  JOIN employees e ON c.manager_id = e.id
)
SELECT employee_id, ancestor_id AS top_level_manager_id FROM chain WHERE manager_id IS NULL;`,
      explanation: 'employee_id stays fixed across every recursive step while ancestor_id climbs the chain one level at a time; the recursion naturally stops contributing new rows for a lineage once it reaches a manager_id IS NULL row.',
      conceptsUsed: ['recursive CTE'],
    },
  }),
  defineExercise({
    id: 'l9-08',
    level: 9,
    order: 8,
    title: 'Ranking membership plans by activity rate',
    difficultyScore: 6,
    description: "For each membership `plan`, compute `total`, `active_count` (status = 'active'), and `activity_rank` — the plan's rank when sorted by active percentage, highest first.",
    tablesInvolved: ['memberships'],
    conceptTags: ['FILTER', 'CTE', 'RANK', 'casting'],
    hints: [{ order: 1, text: 'Compute total and active_count with FILTER in a CTE, then RANK() the ratio in the outer query.' }],
    solution: {
      sql: `WITH plan_stats AS (
  SELECT plan, COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'active') AS active_count
  FROM memberships
  GROUP BY plan
)
SELECT plan, total, active_count,
       RANK() OVER (ORDER BY active_count::numeric / total DESC) AS activity_rank
FROM plan_stats;`,
      explanation: 'Casting active_count to numeric before dividing avoids integer-division truncation, which would otherwise collapse most ratios to 0.',
      conceptsUsed: ['FILTER', 'RANK', 'casting'],
    },
  }),
  defineExercise({
    id: 'l9-09',
    level: 9,
    order: 9,
    title: 'Fastest support agents',
    difficultyScore: 7,
    description: 'For support agents who have resolved more than 10 tickets, return `assigned_employee_id`, `resolved_count`, `avg_resolution_hours` (rounded to 2 decimals), and `speed_rank` — their rank by average resolution time, fastest (lowest) first.',
    tablesInvolved: ['support_tickets'],
    conceptTags: ['HAVING', 'EXTRACT', 'window functions'],
    hints: [{ order: 1, text: 'Compute resolution time in hours per ticket with EXTRACT(EPOCH FROM ...), average and filter it in a CTE, then RANK() in the outer query.' }],
    solution: {
      sql: `WITH agent_stats AS (
  SELECT assigned_employee_id,
         COUNT(*) AS resolved_count,
         AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600.0) AS avg_resolution_hours
  FROM support_tickets
  WHERE resolved_at IS NOT NULL AND assigned_employee_id IS NOT NULL
  GROUP BY assigned_employee_id
  HAVING COUNT(*) > 10
)
SELECT assigned_employee_id, resolved_count,
       ROUND(avg_resolution_hours, 2) AS avg_resolution_hours,
       RANK() OVER (ORDER BY avg_resolution_hours ASC) AS speed_rank
FROM agent_stats;`,
      explanation: 'HAVING filters out low-volume agents before the outer query ranks the remainder — filtering first keeps the ranking meaningful and avoids noisy averages from only 1-2 tickets.',
      conceptsUsed: ['HAVING', 'EXTRACT', 'window functions'],
    },
    validation: { roundDecimals: 2 },
  }),
  defineExercise({
    id: 'l9-10',
    level: 9,
    order: 10,
    title: 'Highest-paid employee within each department subtree',
    difficultyScore: 8,
    description: "For every department, find the single highest-paid employee anywhere within that department OR its sub-departments. Return `department_id`, `first_name`, `last_name`, and `salary`.",
    requirements: ['Break salary ties by employee id, ascending.'],
    tablesInvolved: ['departments', 'employees'],
    conceptTags: ['recursive CTE', 'window functions', 'hierarchical rollup'],
    hints: [{ order: 1, text: 'Combine the (ancestor, descendant) department pairs from a recursive CTE with a RANK() over employee salaries per ancestor.' }],
    solution: {
      sql: `WITH RECURSIVE dept_tree AS (
  SELECT id AS ancestor_id, id AS dept_id FROM departments
  UNION ALL
  SELECT dt.ancestor_id, d.id
  FROM departments d
  JOIN dept_tree dt ON d.parent_department_id = dt.dept_id
),
dept_employees AS (
  SELECT dt.ancestor_id, e.id, e.first_name, e.last_name, e.salary,
         RANK() OVER (PARTITION BY dt.ancestor_id ORDER BY e.salary DESC, e.id) AS r
  FROM dept_tree dt
  JOIN employees e ON e.department_id = dt.dept_id
)
SELECT ancestor_id AS department_id, first_name, last_name, salary
FROM dept_employees
WHERE r = 1;`,
      explanation: 'Once the recursive CTE has expanded every department into its full descendant set, the rest is an ordinary "top 1 per group" ranking problem.',
      conceptsUsed: ['recursive CTE', 'window functions'],
    },
    validation: { roundDecimals: 2 },
  }),
  defineExercise({
    id: 'l9-11',
    level: 9,
    order: 11,
    title: "Average value of each customer's best order, by tier",
    difficultyScore: 8,
    description: "Using a 3-stage CTE pipeline, find each customer's single highest-value order, then return each customer `tier` with the average of those best-order values, as `avg_best_order_value` (rounded to 2 decimals).",
    tablesInvolved: ['orders', 'order_items', 'customers'],
    conceptTags: ['multi-stage CTE pipeline', 'window functions'],
    hints: [
      { order: 1, text: 'Stage 1: compute each order\'s total. Stage 2: rank each customer\'s orders by total and keep rank 1. Stage 3: join to customers and average by tier.' },
    ],
    solution: {
      sql: `WITH order_totals AS (
  SELECT o.customer_id, o.id AS order_id,
         SUM(oi.quantity * oi.unit_price * (1 - oi.discount_pct / 100.0)) AS total
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  GROUP BY o.customer_id, o.id
),
best_order AS (
  SELECT customer_id, total,
         ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY total DESC, order_id) AS rn
  FROM order_totals
)
SELECT c.tier, ROUND(AVG(bo.total), 2) AS avg_best_order_value
FROM best_order bo
JOIN customers c ON c.id = bo.customer_id
WHERE bo.rn = 1
GROUP BY c.tier;`,
      explanation: 'Breaking the problem into named stages — per-order totals, then each customer\'s best order, then the tier-level average — keeps a query this deep understandable and easy to debug stage by stage.',
      conceptsUsed: ['CTE', 'multi-stage CTE pipeline', 'window functions'],
    },
    validation: { roundDecimals: 2 },
  }),
  defineExercise({
    id: 'l9-12',
    level: 9,
    order: 12,
    title: 'Total referral network size',
    difficultyScore: 7,
    description: 'Using `customers.referred_by`, find every customer who has referred at least one other customer (directly or indirectly). Return `referrer_id` and `total_referrals` — the size of their entire downstream referral network.',
    tablesInvolved: ['customers'],
    conceptTags: ['recursive CTE', 'self-referencing'],
    hints: [{ order: 1, text: 'This is the same (ancestor, descendant) pair-building pattern used for the org chart rollup, applied to referred_by instead of manager_id.' }],
    solution: {
      sql: `WITH RECURSIVE referral_tree AS (
  SELECT id AS referrer_id, id AS referred_id FROM customers
  UNION ALL
  SELECT rt.referrer_id, c.id
  FROM customers c
  JOIN referral_tree rt ON c.referred_by = rt.referred_id
)
SELECT referrer_id, COUNT(*) - 1 AS total_referrals
FROM referral_tree
GROUP BY referrer_id
HAVING COUNT(*) - 1 > 0;`,
      explanation: 'The same recursive "expand every ancestor-descendant pair" technique applies to any self-referencing table, whether it models an org chart, a category tree, or — as here — a referral network.',
      conceptsUsed: ['recursive CTE'],
    },
  }),
]
