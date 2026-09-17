import { defineExercise } from './helpers'
import type { Exercise } from '../../types'

export const level8Exercises: Exercise[] = [
  defineExercise({
    id: 'l8-01',
    level: 8,
    order: 1,
    title: 'Department hierarchy depth',
    difficultyScore: 6,
    description: 'Using a recursive CTE, return every department\'s `id`, `name`, and `depth` in the org tree (the root "Executive" department is depth 0).',
    tablesInvolved: ['departments'],
    conceptTags: ['recursive CTE', 'hierarchical data'],
    hints: [
      { order: 1, text: 'The base case selects the root row(s) — where parent_department_id IS NULL — with depth 0.' },
      { order: 2, text: 'The recursive case joins departments back to the CTE itself, incrementing depth by 1 each time.' },
    ],
    solution: {
      sql: `WITH RECURSIVE dept_tree AS (
  SELECT id, name, parent_department_id, 0 AS depth
  FROM departments
  WHERE parent_department_id IS NULL
  UNION ALL
  SELECT d.id, d.name, d.parent_department_id, dt.depth + 1
  FROM departments d
  JOIN dept_tree dt ON d.parent_department_id = dt.id
)
SELECT id, name, depth FROM dept_tree;`,
      explanation: 'WITH RECURSIVE repeatedly executes the recursive term, joining it against the growing result set, until a pass produces no new rows.',
      conceptsUsed: ['recursive CTE'],
    },
  }),
  defineExercise({
    id: 'l8-02',
    level: 8,
    order: 2,
    title: 'How many levels above the top?',
    difficultyScore: 6,
    description: 'Using a recursive CTE over `employees.manager_id`, return every employee\'s `id` and `depth` — how many management levels separate them from the top of the org chart (an employee with no manager is depth 0).',
    tablesInvolved: ['employees'],
    conceptTags: ['recursive CTE', 'hierarchical data'],
    hints: [{ order: 1, text: 'This is the same pattern as the department tree, applied to employees.manager_id instead.' }],
    solution: {
      sql: `WITH RECURSIVE chain AS (
  SELECT id, manager_id, 0 AS depth FROM employees WHERE manager_id IS NULL
  UNION ALL
  SELECT e.id, e.manager_id, c.depth + 1
  FROM employees e
  JOIN chain c ON e.manager_id = c.id
)
SELECT id, depth FROM chain;`,
      explanation: 'Self-referencing recursive CTEs over a manager_id column are the standard way to walk an org chart of arbitrary depth.',
      conceptsUsed: ['recursive CTE'],
    },
  }),
  defineExercise({
    id: 'l8-03',
    level: 8,
    order: 3,
    title: 'Full category breadcrumb paths',
    difficultyScore: 6,
    description: "Using a recursive CTE, return every category's `id` and a `path` string built by joining ancestor names with ' > ', e.g. 'Electronics > Smartphones'.",
    tablesInvolved: ['categories'],
    conceptTags: ['recursive CTE', 'string building'],
    hints: [{ order: 1, text: 'Concatenate the parent\'s accumulated path with the current row\'s name in the recursive term.' }],
    solution: {
      sql: `WITH RECURSIVE cat_path AS (
  SELECT id, name, parent_category_id, name AS path
  FROM categories
  WHERE parent_category_id IS NULL
  UNION ALL
  SELECT c.id, c.name, c.parent_category_id, cp.path || ' > ' || c.name
  FROM categories c
  JOIN cat_path cp ON c.parent_category_id = cp.id
)
SELECT id, path FROM cat_path;`,
      explanation: 'Each recursive step appends onto the accumulated path from the row above it — a common technique for building breadcrumb-style hierarchical labels.',
      conceptsUsed: ['recursive CTE', 'string concatenation'],
    },
  }),
  defineExercise({
    id: 'l8-04',
    level: 8,
    order: 4,
    title: "Each customer's 3 most recent orders, via LATERAL",
    difficultyScore: 6,
    description: 'Using CROSS JOIN LATERAL, return `email`, `order_date`, and `status` for the 3 most recent orders of each customer who has placed at least one order.',
    tablesInvolved: ['customers', 'orders'],
    conceptTags: ['LATERAL', 'CROSS JOIN LATERAL'],
    hints: [
      { order: 1, text: 'A LATERAL subquery can reference columns from the preceding FROM item — here, the current customer\'s id.' },
      { order: 2, text: 'CROSS JOIN LATERAL drops customers for whom the subquery returns zero rows, so customers with no orders are naturally excluded.' },
    ],
    solution: {
      sql: `SELECT c.email, o.order_date, o.status
FROM customers c
CROSS JOIN LATERAL (
  SELECT order_date, status FROM orders WHERE orders.customer_id = c.id ORDER BY order_date DESC, id DESC LIMIT 3
) o;`,
      explanation: 'LATERAL lets the subquery in FROM refer to columns from earlier tables in the same FROM clause — something an ordinary subquery cannot do — making per-row "top N" queries straightforward without a window function.',
      conceptsUsed: ['LATERAL', 'CROSS JOIN LATERAL'],
    },
  }),
  defineExercise({
    id: 'l8-05',
    level: 8,
    order: 5,
    title: 'Cheapest product per category, via LATERAL',
    difficultyScore: 5,
    description: 'For every category that has at least one product, return the category `name` (as `category_name`) and the `name`/`price` of its single cheapest product.',
    tablesInvolved: ['categories', 'products'],
    conceptTags: ['LATERAL', 'CROSS JOIN LATERAL'],
    hints: [{ order: 1, text: 'Root categories have no products directly assigned — CROSS JOIN LATERAL will naturally drop them since the subquery returns nothing.' }],
    solution: {
      sql: `SELECT c.name AS category_name, p.name, p.price
FROM categories c
CROSS JOIN LATERAL (
  SELECT name, price FROM products WHERE category_id = c.id ORDER BY price ASC LIMIT 1
) p;`,
      explanation: 'This achieves the same "top 1 per group" result as DISTINCT ON or a ranked CTE, but reads very naturally as "for each category, look up its cheapest product".',
      conceptsUsed: ['LATERAL'],
    },
    validation: { roundDecimals: 2 },
  }),
  defineExercise({
    id: 'l8-06',
    level: 8,
    order: 6,
    title: 'Build a JSON profile for platinum customers',
    difficultyScore: 4,
    description: "For every customer in the 'platinum' tier, return their `id` and a `profile` JSON object built from their tier and country, with keys 'tier' and 'country'.",
    tablesInvolved: ['customers'],
    conceptTags: ['jsonb_build_object'],
    hints: [{ order: 1, text: "jsonb_build_object('key1', value1, 'key2', value2, ...) constructs a JSON object from scratch." }],
    solution: {
      sql: `SELECT id, jsonb_build_object('tier', tier, 'country', country) AS profile
FROM customers
WHERE tier = 'platinum';`,
      explanation: 'jsonb_build_object is the go-to function for shaping relational columns into a JSON document on the fly, without needing a pre-existing JSONB column.',
      conceptsUsed: ['jsonb_build_object'],
    },
  }),
  defineExercise({
    id: 'l8-07',
    level: 8,
    order: 7,
    title: 'Nested order line items as JSON',
    difficultyScore: 6,
    description: "For every pending order, return `order_id` and an `items` column: a JSON array of objects (each shaped `{\"sku\": ..., \"qty\": ...}`) for that order's line items, sorted by sku.",
    requirements: ['Sort the items array by sku.'],
    tablesInvolved: ['orders', 'order_items', 'products'],
    conceptTags: ['JSONB_AGG', 'jsonb_build_object', 'JOIN'],
    hints: [{ order: 1, text: 'Nest jsonb_build_object(...) inside JSONB_AGG(... ORDER BY ...) to build an array of small JSON objects.' }],
    solution: {
      sql: `SELECT o.id AS order_id,
       JSONB_AGG(JSONB_BUILD_OBJECT('sku', p.sku, 'qty', oi.quantity) ORDER BY p.sku) AS items
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id
WHERE o.status = 'pending'
GROUP BY o.id;`,
      explanation: 'Combining jsonb_build_object with JSONB_AGG is the standard way to produce nested JSON (an array of objects) directly from normalized relational rows.',
      conceptsUsed: ['JSONB_AGG', 'jsonb_build_object'],
    },
  }),
  defineExercise({
    id: 'l8-08',
    level: 8,
    order: 8,
    title: 'Consecutive-day ordering streaks',
    difficultyScore: 7,
    description: 'For each customer, find every streak of 2 or more CONSECUTIVE calendar days on which they placed at least one order. Return `customer_id`, `streak_start`, `streak_end`, and `streak_length`.',
    tablesInvolved: ['orders'],
    conceptTags: ['gaps and islands', 'ROW_NUMBER'],
    hints: [
      { order: 1, text: 'First reduce orders to one row per (customer_id, distinct order day).' },
      { order: 2, text: 'Subtracting a per-customer ROW_NUMBER() (in days) from the calendar date produces a constant value for each run of consecutive days — the classic "gaps and islands" trick.' },
    ],
    solution: {
      sql: `WITH order_days AS (
  SELECT DISTINCT customer_id, order_date::date AS d FROM orders
),
islands AS (
  SELECT customer_id, d,
         d - (ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY d))::int * INTERVAL '1 day' AS grp
  FROM order_days
)
SELECT customer_id, MIN(d) AS streak_start, MAX(d) AS streak_end, COUNT(*) AS streak_length
FROM islands
GROUP BY customer_id, grp
HAVING COUNT(*) >= 2;`,
      explanation: 'Within a consecutive run of days, (date - row_number) is constant, because both increase by exactly one each day — so grouping by that expression isolates each "island" of consecutive activity.',
      conceptsUsed: ['gaps and islands', 'ROW_NUMBER'],
    },
  }),
  defineExercise({
    id: 'l8-09',
    level: 8,
    order: 9,
    title: '30-day activation by signup cohort',
    difficultyScore: 7,
    description: 'Group customers into cohorts by their signup month. For each cohort, return `cohort_month`, `cohort_size` (total customers), and `activated_within_30d` (how many placed at least one order within 30 days of signing up).',
    tablesInvolved: ['customers', 'orders'],
    conceptTags: ['cohort analysis', 'LEFT JOIN', 'DATE_TRUNC'],
    hints: [
      { order: 1, text: 'Build a cohorts CTE with each customer\'s signup_date and DATE_TRUNC(\'month\', signup_date).' },
      { order: 2, text: 'LEFT JOIN orders with the 30-day condition inside the JOIN clause, then COUNT DISTINCT the matched customer ids.' },
    ],
    solution: {
      sql: `WITH cohorts AS (
  SELECT id, signup_date, DATE_TRUNC('month', signup_date) AS cohort_month FROM customers
)
SELECT co.cohort_month,
       COUNT(DISTINCT co.id) AS cohort_size,
       COUNT(DISTINCT o.customer_id) AS activated_within_30d
FROM cohorts co
LEFT JOIN orders o ON o.customer_id = co.id AND o.order_date::date <= co.signup_date + INTERVAL '30 days'
GROUP BY co.cohort_month;`,
      explanation: 'Putting the 30-day condition in the JOIN clause (not WHERE) preserves every cohort member for the cohort_size count, while activated_within_30d only counts those with a qualifying match.',
      conceptsUsed: ['cohort analysis', 'LEFT JOIN'],
    },
  }),
  defineExercise({
    id: 'l8-10',
    level: 8,
    order: 10,
    title: 'Total org size under each manager',
    difficultyScore: 7,
    description: "For every employee who manages at least one person (directly or transitively), return their `manager_id` (their own id) and `total_reports` — the total count of employees anywhere below them in the org chart.",
    tablesInvolved: ['employees'],
    conceptTags: ['recursive CTE', 'hierarchical data'],
    hints: [
      { order: 1, text: 'Start the recursive CTE with every employee reporting to themselves, then recursively walk up through manager_id, tagging each descendant with every ancestor above them.' },
      { order: 2, text: 'Group by the ancestor (manager_id) and subtract 1 to exclude the self-row.' },
    ],
    solution: {
      sql: `WITH RECURSIVE reports AS (
  SELECT id AS manager_id, id AS report_id FROM employees
  UNION ALL
  SELECT r.manager_id, e.id
  FROM employees e
  JOIN reports r ON e.manager_id = r.report_id
)
SELECT manager_id, COUNT(*) - 1 AS total_reports
FROM reports
GROUP BY manager_id
HAVING COUNT(*) - 1 > 0;`,
      explanation: 'This CTE grows a (manager_id, report_id) pair for every ancestor-descendant relationship in the tree, including self-pairs; grouping by manager_id and subtracting the self-pair gives the size of each subtree.',
      conceptsUsed: ['recursive CTE', 'hierarchical data'],
    },
  }),
  defineExercise({
    id: 'l8-11',
    level: 8,
    order: 11,
    title: 'Top 2 reviews per product, via LATERAL',
    difficultyScore: 5,
    description: 'For every product that has at least one review, return `sku`, `rating`, and `title` for its 2 highest-rated reviews (breaking ties by helpful_votes, then review id, both descending).',
    tablesInvolved: ['products', 'reviews'],
    conceptTags: ['LATERAL', 'top-N per group'],
    hints: [{ order: 1, text: 'Use CROSS JOIN LATERAL with an ORDER BY + LIMIT 2 subquery correlated to the outer product.' }],
    solution: {
      sql: `SELECT p.sku, r.rating, r.title
FROM products p
CROSS JOIN LATERAL (
  SELECT rating, title FROM reviews WHERE reviews.product_id = p.id
  ORDER BY rating DESC, helpful_votes DESC, id DESC LIMIT 2
) r;`,
      explanation: 'LATERAL with LIMIT is often more intuitive than a ranked CTE for "top N per group" when you don\'t need the rank number itself in the output.',
      conceptsUsed: ['LATERAL', 'top-N per group'],
    },
  }),
  defineExercise({
    id: 'l8-12',
    level: 8,
    order: 12,
    title: 'Average days between orders, per customer',
    difficultyScore: 6,
    description: 'For customers with 2 or more orders, return `customer_id` and `avg_days_between_orders` — the average number of days between consecutive orders, rounded to 2 decimals.',
    tablesInvolved: ['orders'],
    conceptTags: ['LAG', 'EXTRACT', 'advanced date logic'],
    hints: [
      { order: 1, text: 'First compute the gap (as an interval) between each order and the previous one, using LAG.' },
      { order: 2, text: 'EXTRACT(EPOCH FROM interval) converts it to seconds; divide by 86400 to get days.' },
    ],
    solution: {
      sql: `WITH gaps AS (
  SELECT customer_id, order_date - LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date, id) AS gap
  FROM orders
)
SELECT customer_id, ROUND(AVG(EXTRACT(EPOCH FROM gap)) / 86400.0, 2) AS avg_days_between_orders
FROM gaps
WHERE gap IS NOT NULL
GROUP BY customer_id;`,
      explanation: 'EXTRACT(EPOCH FROM interval) is the standard way to convert an interval into a single numeric quantity (seconds) that can be averaged or otherwise aggregated.',
      conceptsUsed: ['LAG', 'EXTRACT'],
    },
    validation: { roundDecimals: 2 },
  }),
  defineExercise({
    id: 'l8-13',
    level: 8,
    order: 13,
    title: "Engineering - Platform team profiles",
    difficultyScore: 4,
    description: "For every employee in the 'Engineering - Platform' department, return their `id` and a `profile` JSON object with keys 'name' (first + last name) and 'skills' (their skills array).",
    tablesInvolved: ['employees', 'departments'],
    conceptTags: ['jsonb_build_object', 'arrays', 'subquery'],
    hints: [{ order: 1, text: 'A JSONB value can hold an array directly — pass the text[] column straight into jsonb_build_object.' }],
    solution: {
      sql: `SELECT e.id, jsonb_build_object('name', e.first_name || ' ' || e.last_name, 'skills', e.skills) AS profile
FROM employees e
WHERE e.department_id = (SELECT id FROM departments WHERE name = 'Engineering - Platform');`,
      explanation: 'PostgreSQL automatically converts a text[] array into a JSON array when it is passed into jsonb_build_object or otherwise cast to jsonb.',
      conceptsUsed: ['jsonb_build_object', 'arrays'],
    },
  }),
  defineExercise({
    id: 'l8-14',
    level: 8,
    order: 14,
    title: 'Category performance summary',
    difficultyScore: 7,
    description: 'Using two CTEs — one computing total revenue per category from order_items, the other computing average review rating per category — join them to return `category_id`, `revenue`, and `avg_rating` (both rounded to 2 decimals) for categories present in both.',
    tablesInvolved: ['order_items', 'products', 'reviews'],
    conceptTags: ['CTE', 'multiple CTEs', 'complex CTE chains'],
    hints: [{ order: 1, text: 'Each CTE independently joins to products to get category_id, then the two CTEs are joined to each other on category_id.' }],
    solution: {
      sql: `WITH revenue AS (
  SELECT p.category_id, SUM(oi.quantity * oi.unit_price * (1 - oi.discount_pct / 100.0)) AS revenue
  FROM order_items oi
  JOIN products p ON p.id = oi.product_id
  GROUP BY p.category_id
),
ratings AS (
  SELECT p.category_id, AVG(r.rating) AS avg_rating
  FROM reviews r
  JOIN products p ON p.id = r.product_id
  GROUP BY p.category_id
)
SELECT rv.category_id, ROUND(rv.revenue, 2) AS revenue, ROUND(rt.avg_rating, 2) AS avg_rating
FROM revenue rv
JOIN ratings rt ON rt.category_id = rv.category_id;`,
      explanation: 'Building each metric in its own CTE keeps the aggregation logic isolated and easy to verify independently, before combining them with a final join — much clearer than one giant multi-join aggregate query.',
      conceptsUsed: ['CTE', 'multiple CTEs'],
    },
    validation: { roundDecimals: 2 },
  }),
]
