import { defineExercise } from './helpers'
import type { Exercise } from '../../types'

export const level5Exercises: Exercise[] = [
  defineExercise({
    id: 'l5-01',
    level: 5,
    order: 1,
    title: 'Your first CTE',
    difficultyScore: 3,
    description: "Using a CTE named `active_products` that selects all active products, return the `name` and `price` of active products priced above $300.",
    tablesInvolved: ['products'],
    conceptTags: ['CTE', 'WITH'],
    hints: [{ order: 1, text: 'WITH active_products AS (SELECT * FROM products WHERE status = \'active\') SELECT ... FROM active_products ...' }],
    solution: {
      sql: `WITH active_products AS (
  SELECT * FROM products WHERE status = 'active'
)
SELECT name, price FROM active_products WHERE price > 300;`,
      explanation: 'A CTE (Common Table Expression) is a named, temporary result set defined with WITH, usable like a table in the query that follows.',
      conceptsUsed: ['CTE'],
    },
    validation: { roundDecimals: 2 },
  }),
  defineExercise({
    id: 'l5-02',
    level: 5,
    order: 2,
    title: 'Categories priced above $150 on average',
    difficultyScore: 4,
    description: 'Using a CTE that computes the average price per category, return `category_id` and `avg_price` (rounded to 2 decimals) only for categories averaging above $150.',
    tablesInvolved: ['products'],
    conceptTags: ['CTE', 'GROUP BY', 'HAVING'],
    hints: [{ order: 1, text: 'Compute the per-category average inside the CTE, then filter the CTE\'s result in the outer query.' }],
    solution: {
      sql: `WITH category_avg AS (
  SELECT category_id, AVG(price) AS avg_price FROM products GROUP BY category_id
)
SELECT category_id, ROUND(avg_price, 2) AS avg_price FROM category_avg WHERE avg_price > 150;`,
      explanation: 'Filtering could also be done with HAVING inside the CTE — using WHERE on the outer query is equivalent here and often more readable in longer pipelines.',
      conceptsUsed: ['CTE', 'GROUP BY'],
    },
    validation: { roundDecimals: 2 },
  }),
  defineExercise({
    id: 'l5-03',
    level: 5,
    order: 3,
    title: 'Above-average spenders',
    difficultyScore: 5,
    description: 'Using two CTEs — one computing each customer\'s total spend (quantity × unit_price × (1 - discount_pct/100)) across all their order_items, and another computing the overall average spend — return `customer_id` and `total_spend` for customers who spent more than the average.',
    tablesInvolved: ['orders', 'order_items'],
    conceptTags: ['CTE', 'multiple CTEs'],
    hints: [
      { order: 1, text: 'The first CTE joins orders to order_items and groups by customer_id.' },
      { order: 2, text: 'The second CTE aggregates the first CTE down to a single average value.' },
      { order: 3, text: 'You can reference the second (single-row) CTE without an explicit join condition — it only ever contributes one row.' },
    ],
    solution: {
      sql: `WITH customer_spend AS (
  SELECT o.customer_id, SUM(oi.quantity * oi.unit_price * (1 - oi.discount_pct / 100.0)) AS total_spend
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  GROUP BY o.customer_id
),
avg_spend AS (
  SELECT AVG(total_spend) AS avg_spend FROM customer_spend
)
SELECT cs.customer_id, cs.total_spend
FROM customer_spend cs, avg_spend a
WHERE cs.total_spend > a.avg_spend;`,
      explanation: 'Multiple CTEs can be chained (and later ones can reference earlier ones) in a single WITH clause, separated by commas — a readable alternative to deeply nested subqueries.',
      conceptsUsed: ['CTE', 'multiple CTEs'],
    },
    validation: { roundDecimals: 2 },
  }),
  defineExercise({
    id: 'l5-04',
    level: 5,
    order: 4,
    title: 'VIP or urgent: combined contact list',
    difficultyScore: 3,
    description: "Return a deduplicated list of `email` for customers who are either in the 'platinum' tier, OR have at least one 'urgent' priority support ticket.",
    tablesInvolved: ['customers', 'support_tickets'],
    conceptTags: ['UNION'],
    hints: [{ order: 1, text: 'UNION combines two result sets and automatically removes duplicate rows.' }],
    solution: {
      sql: `SELECT email FROM customers WHERE tier = 'platinum'
UNION
SELECT c.email FROM customers c JOIN support_tickets t ON t.customer_id = c.id WHERE t.priority = 'urgent';`,
      explanation: 'UNION requires both SELECTs to have the same number of columns with compatible types, and deduplicates the combined result — a customer matching both conditions appears only once.',
      conceptsUsed: ['UNION'],
    },
  }),
  defineExercise({
    id: 'l5-05',
    level: 5,
    order: 5,
    title: 'Cart adds and purchases in March 2025',
    difficultyScore: 3,
    description: "For events during March 2025, return a `source` label ('cart' for add_to_cart events, 'purchase' for purchase events) and `occurred_at`, keeping duplicates — a customer's cart add and purchase should both appear.",
    tablesInvolved: ['events'],
    conceptTags: ['UNION ALL'],
    hints: [{ order: 1, text: 'UNION ALL keeps every row from both SELECTs, including duplicates — unlike UNION.' }],
    solution: {
      sql: `SELECT 'cart' AS source, occurred_at FROM events
WHERE event_type = 'add_to_cart' AND occurred_at >= '2025-03-01' AND occurred_at < '2025-04-01'
UNION ALL
SELECT 'purchase' AS source, occurred_at FROM events
WHERE event_type = 'purchase' AND occurred_at >= '2025-03-01' AND occurred_at < '2025-04-01';`,
      explanation: 'UNION ALL skips the deduplication step that UNION performs, which is both faster and necessary here since two genuinely different events could otherwise look identical after a naive UNION.',
      conceptsUsed: ['UNION ALL'],
    },
  }),
  defineExercise({
    id: 'l5-06',
    level: 5,
    order: 6,
    title: 'Platinum customers with an elite membership',
    difficultyScore: 3,
    description: "Return the `id` of customers who are BOTH in the 'platinum' tier AND have an 'elite' plan membership, using INTERSECT.",
    tablesInvolved: ['customers', 'memberships'],
    conceptTags: ['INTERSECT'],
    hints: [{ order: 1, text: 'INTERSECT returns only rows present in both result sets.' }],
    solution: {
      sql: `SELECT id FROM customers WHERE tier = 'platinum'
INTERSECT
SELECT customer_id FROM memberships WHERE plan = 'elite';`,
      explanation: 'INTERSECT is the set-theoretic AND of two queries — a row must appear in both SELECTs to survive.',
      conceptsUsed: ['INTERSECT'],
    },
  }),
  defineExercise({
    id: 'l5-07',
    level: 5,
    order: 7,
    title: 'Platinum customers without an elite membership',
    difficultyScore: 3,
    description: "Return the `id` of customers who are in the 'platinum' tier but do NOT have an 'elite' plan membership, using EXCEPT.",
    tablesInvolved: ['customers', 'memberships'],
    conceptTags: ['EXCEPT'],
    hints: [{ order: 1, text: 'EXCEPT returns rows from the first query that do not appear in the second.' }],
    solution: {
      sql: `SELECT id FROM customers WHERE tier = 'platinum'
EXCEPT
SELECT customer_id FROM memberships WHERE plan = 'elite';`,
      explanation: 'EXCEPT subtracts the second result set from the first — think of it as set difference (A minus B).',
      conceptsUsed: ['EXCEPT'],
    },
  }),
  defineExercise({
    id: 'l5-08',
    level: 5,
    order: 8,
    title: 'Highly rated products',
    difficultyScore: 4,
    description: 'Using a derived table that computes the average rating per product, return the `name` and `avg_rating` (rounded to 2 decimals) of products with an average rating of 4.5 or higher.',
    tablesInvolved: ['reviews', 'products'],
    conceptTags: ['derived table', 'subquery in FROM'],
    hints: [{ order: 1, text: 'Compute AVG(rating) grouped by product_id inside the derived table, then join it back to products for the name.' }],
    solution: {
      sql: `SELECT p.name, ROUND(r.avg_rating, 2) AS avg_rating
FROM (
  SELECT product_id, AVG(rating) AS avg_rating FROM reviews GROUP BY product_id
) r
JOIN products p ON p.id = r.product_id
WHERE r.avg_rating >= 4.5;`,
      explanation: 'This could equally be written as a CTE — a derived table (subquery in FROM) and a CTE are interchangeable in cases like this one.',
      conceptsUsed: ['derived table', 'JOIN'],
    },
    validation: { roundDecimals: 2 },
  }),
  defineExercise({
    id: 'l5-09',
    level: 5,
    order: 9,
    title: 'Active vs. inactive headcount, side by side',
    difficultyScore: 4,
    description: 'For each `department_id`, return `active_count` and `inactive_count` — the number of active and inactive employees, computed with conditional aggregation (no separate rows per status).',
    tablesInvolved: ['employees'],
    conceptTags: ['conditional aggregation', 'CASE'],
    hints: [{ order: 1, text: 'SUM(CASE WHEN condition THEN 1 ELSE 0 END) counts rows matching a condition within a single aggregation pass.' }],
    solution: {
      sql: `SELECT department_id,
       SUM(CASE WHEN is_active THEN 1 ELSE 0 END) AS active_count,
       SUM(CASE WHEN NOT is_active THEN 1 ELSE 0 END) AS inactive_count
FROM employees
GROUP BY department_id;`,
      explanation: 'Conditional aggregation folds what would otherwise require multiple GROUP BY passes (or a self-join) into a single scan, by summing 1s and 0s produced by a CASE expression.',
      conceptsUsed: ['CASE', 'conditional aggregation'],
    },
  }),
  defineExercise({
    id: 'l5-10',
    level: 5,
    order: 10,
    title: 'The same headcount split, with FILTER',
    difficultyScore: 4,
    description: 'Repeat the previous exercise — `department_id`, `active_count`, `inactive_count` — but this time use PostgreSQL\'s FILTER clause instead of CASE.',
    tablesInvolved: ['employees'],
    conceptTags: ['FILTER'],
    hints: [{ order: 1, text: 'COUNT(*) FILTER (WHERE condition) counts only the rows matching the condition.' }],
    solution: {
      sql: `SELECT department_id,
       COUNT(*) FILTER (WHERE is_active) AS active_count,
       COUNT(*) FILTER (WHERE NOT is_active) AS inactive_count
FROM employees
GROUP BY department_id;`,
      explanation: 'FILTER is PostgreSQL-specific sugar for conditional aggregation — often clearer than CASE, and it works with any aggregate function, not just COUNT.',
      conceptsUsed: ['FILTER'],
    },
  }),
  defineExercise({
    id: 'l5-11',
    level: 5,
    order: 11,
    title: 'Default unset satisfaction scores to 0',
    difficultyScore: 2,
    description: 'For every support ticket, return `id` and `satisfaction_score`, replacing NULL scores with 0.',
    tablesInvolved: ['support_tickets'],
    conceptTags: ['COALESCE'],
    hints: [{ order: 1, text: 'COALESCE(value, fallback) returns the first non-null argument.' }],
    solution: { sql: 'SELECT id, COALESCE(satisfaction_score, 0) AS satisfaction_score FROM support_tickets;', explanation: 'COALESCE evaluates its arguments left to right and returns the first one that is not NULL.', conceptsUsed: ['COALESCE'] },
  }),
  defineExercise({
    id: 'l5-12',
    level: 5,
    order: 12,
    title: 'Average discount, ignoring undiscounted items',
    difficultyScore: 3,
    description: 'Return the average `discount_pct` across `order_items`, rounded to 2 decimals as `avg_nonzero_discount` — but only counting line items that actually had a discount (treat 0 as "not discounted" and exclude it from the average).',
    tablesInvolved: ['order_items'],
    conceptTags: ['NULLIF'],
    hints: [
      { order: 1, text: 'AVG() already ignores NULLs — the trick is converting 0 into NULL before averaging.' },
      { order: 2, text: 'NULLIF(value, 0) returns NULL when value equals 0, and value otherwise.' },
    ],
    solution: {
      sql: 'SELECT ROUND(AVG(NULLIF(discount_pct, 0)), 2) AS avg_nonzero_discount FROM order_items;',
      explanation: 'NULLIF(a, b) returns NULL if a = b, otherwise it returns a. Wrapping discount_pct this way makes AVG() silently skip the undiscounted rows.',
      conceptsUsed: ['NULLIF', 'AVG'],
    },
    validation: { roundDecimals: 2 },
  }),
  defineExercise({
    id: 'l5-13',
    level: 5,
    order: 13,
    title: 'Average membership value per tier, including non-members',
    difficultyScore: 4,
    description: 'For every customer `tier`, return the average active membership `monthly_fee` (as `avg_fee`, rounded to 2 decimals) — customers with no active membership should count as $0, not be excluded.',
    tablesInvolved: ['customers', 'memberships'],
    conceptTags: ['LEFT JOIN', 'COALESCE', 'GROUP BY'],
    hints: [
      { order: 1, text: 'LEFT JOIN memberships, restricting to status = \'active\' in the JOIN condition (not WHERE) so non-members are still kept.' },
      { order: 2, text: 'COALESCE the joined fee to 0 before averaging.' },
    ],
    solution: {
      sql: `SELECT c.tier, ROUND(AVG(COALESCE(m.monthly_fee, 0)), 2) AS avg_fee
FROM customers c
LEFT JOIN memberships m ON m.customer_id = c.id AND m.status = 'active'
GROUP BY c.tier;`,
      explanation: 'Putting the status filter inside the JOIN condition (rather than a WHERE clause) preserves customers with no active membership as LEFT JOIN NULLs, which COALESCE then turns into 0 for the average.',
      conceptsUsed: ['LEFT JOIN', 'COALESCE', 'GROUP BY'],
    },
    validation: { roundDecimals: 2 },
  }),
  defineExercise({
    id: 'l5-14',
    level: 5,
    order: 14,
    title: 'Categories with a high discontinued rate',
    difficultyScore: 5,
    description: 'Using a CTE that computes, per category, the total product count and the discontinued product count (via FILTER), return `category_id`, `total`, and `discontinued` for categories where discontinued products make up more than 10% of the category.',
    tablesInvolved: ['products'],
    conceptTags: ['CTE', 'FILTER', 'conditional aggregation'],
    hints: [{ order: 1, text: 'Cast to numeric before dividing so you get a fraction rather than integer division truncating to 0.' }],
    solution: {
      sql: `WITH stats AS (
  SELECT category_id,
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE status = 'discontinued') AS discontinued
  FROM products
  GROUP BY category_id
)
SELECT category_id, total, discontinued
FROM stats
WHERE discontinued::numeric / total > 0.1;`,
      explanation: 'Integer division in SQL truncates, so discontinued / total would almost always yield 0 — casting one side to numeric forces a proper fractional result.',
      conceptsUsed: ['CTE', 'FILTER', 'casting'],
    },
  }),
  defineExercise({
    id: 'l5-15',
    level: 5,
    order: 15,
    title: 'Above-average-sized departments',
    difficultyScore: 4,
    description: 'Using two CTEs — one counting employees per department, another averaging those counts — return `department_id` and `emp_count` for departments with more employees than the company-wide average department size.',
    tablesInvolved: ['employees'],
    conceptTags: ['CTE', 'multiple CTEs'],
    hints: [{ order: 1, text: 'The second CTE has exactly one row; it can be referenced without an explicit JOIN condition, since it only ever contributes that single row to every match.' }],
    solution: {
      sql: `WITH dept_counts AS (
  SELECT department_id, COUNT(*) AS emp_count FROM employees GROUP BY department_id
),
overall_avg AS (
  SELECT AVG(emp_count) AS avg_count FROM dept_counts
)
SELECT dc.department_id, dc.emp_count
FROM dept_counts dc, overall_avg oa
WHERE dc.emp_count > oa.avg_count;`,
      explanation: 'Listing two CTEs separated by a comma in the FROM clause cross-joins them — harmless here since overall_avg is always exactly one row, so it just attaches the same average to every dept_counts row.',
      conceptsUsed: ['CTE', 'multiple CTEs'],
    },
  }),
  defineExercise({
    id: 'l5-16',
    level: 5,
    order: 16,
    title: 'Loyal gold-tier customers',
    difficultyScore: 4,
    description: "Using INTERSECT, return the `id` of customers who are BOTH in the 'gold' tier AND have placed 5 or more orders.",
    tablesInvolved: ['customers', 'orders'],
    conceptTags: ['INTERSECT', 'HAVING'],
    hints: [{ order: 1, text: 'The second SELECT can use its own GROUP BY / HAVING before INTERSECT compares the two result sets.' }],
    solution: {
      sql: `SELECT id FROM customers WHERE tier = 'gold'
INTERSECT
SELECT customer_id FROM orders GROUP BY customer_id HAVING COUNT(*) >= 5;`,
      explanation: 'Each side of INTERSECT can be an arbitrarily complex query on its own — here the second side is itself a GROUP BY/HAVING query — as long as both sides produce the same column shape.',
      conceptsUsed: ['INTERSECT', 'HAVING'],
    },
  }),
  defineExercise({
    id: 'l5-17',
    level: 5,
    order: 17,
    title: 'Suppliers with nothing discontinued',
    difficultyScore: 4,
    description: 'Using EXCEPT, return the `id` of suppliers who supply at least one product, but have never had one of their products discontinued.',
    tablesInvolved: ['suppliers', 'products'],
    conceptTags: ['EXCEPT', 'subquery'],
    hints: [{ order: 1, text: 'Start from suppliers who supply at least one product, then subtract off any supplier that appears among discontinued products.' }],
    solution: {
      sql: `SELECT id FROM suppliers WHERE id IN (SELECT supplier_id FROM products)
EXCEPT
SELECT supplier_id FROM products WHERE status = 'discontinued';`,
      explanation: 'Starting from "suppliers with at least one product" (rather than all suppliers) matters here — without it, a supplier with zero products would incorrectly pass through EXCEPT too, since it also never appears among discontinued products.',
      conceptsUsed: ['EXCEPT', 'subquery'],
    },
  }),
  defineExercise({
    id: 'l5-18',
    level: 5,
    order: 18,
    title: 'Ticket urgency split by status',
    difficultyScore: 3,
    description: "For every ticket `status`, return `urgent_tickets` (priority 'high' or 'urgent') and `normal_tickets` (any other priority), computed with FILTER.",
    tablesInvolved: ['support_tickets'],
    conceptTags: ['FILTER', 'conditional aggregation'],
    hints: [{ order: 1, text: 'Two separate COUNT(*) FILTER (WHERE ...) expressions, with complementary conditions, sit side by side in the same SELECT.' }],
    solution: {
      sql: `SELECT status,
       COUNT(*) FILTER (WHERE priority IN ('high', 'urgent')) AS urgent_tickets,
       COUNT(*) FILTER (WHERE priority NOT IN ('high', 'urgent')) AS normal_tickets
FROM support_tickets
GROUP BY status;`,
      explanation: 'Because the two FILTER conditions are exact complements of each other, every row is counted in exactly one of the two columns, and urgent_tickets + normal_tickets always equals the total for that status.',
      conceptsUsed: ['FILTER', 'conditional aggregation'],
    },
  }),
  defineExercise({
    id: 'l5-19',
    level: 5,
    order: 19,
    title: 'Every product, rated or not',
    difficultyScore: 4,
    description: 'For every product, return its `id`, `name`, and `avg_rating` (rounded to 2 decimals) — products with no reviews should show 0, not be excluded.',
    tablesInvolved: ['products', 'reviews'],
    conceptTags: ['LEFT JOIN', 'COALESCE', 'GROUP BY'],
    hints: [{ order: 1, text: 'LEFT JOIN reviews onto products, then COALESCE the averaged rating to 0 for products with no matching reviews.' }],
    solution: {
      sql: `SELECT p.id, p.name, ROUND(COALESCE(AVG(r.rating), 0), 2) AS avg_rating
FROM products p
LEFT JOIN reviews r ON r.product_id = p.id
GROUP BY p.id, p.name;`,
      explanation: 'AVG() over zero rows (an unmatched LEFT JOIN) produces NULL, not 0 — COALESCE is what turns that NULL into the 0 the exercise asks for.',
      conceptsUsed: ['LEFT JOIN', 'COALESCE', 'GROUP BY'],
    },
    validation: { roundDecimals: 2 },
  }),
  defineExercise({
    id: 'l5-20',
    level: 5,
    order: 20,
    title: "Birth date, or 'Unknown'",
    difficultyScore: 2,
    description: "Return every customer's `email` and `birth_date` — but show the text 'Unknown' wherever birth_date is NULL, instead of leaving it blank.",
    tablesInvolved: ['customers'],
    conceptTags: ['COALESCE', 'casting'],
    hints: [{ order: 1, text: "COALESCE requires both arguments to share a type — cast birth_date to text before combining it with the string 'Unknown'." }],
    solution: {
      sql: `SELECT email, COALESCE(birth_date::text, 'Unknown') AS birth_date FROM customers;`,
      explanation: 'COALESCE(birth_date, \'Unknown\') would fail outright, since a date column and a text literal are not directly compatible — casting birth_date to text first makes both arguments the same type.',
      conceptsUsed: ['COALESCE', 'casting'],
    },
  }),
  defineExercise({
    id: 'l5-21',
    level: 5,
    order: 21,
    title: 'Payment success rate by method',
    difficultyScore: 5,
    description: 'Using a CTE that computes, per payment `method`, the total number of payments and the number with status = \'completed\' (via FILTER), return `method` and `success_rate_pct` (rounded to 2 decimals).',
    tablesInvolved: ['payments'],
    conceptTags: ['CTE', 'FILTER', 'NULLIF'],
    hints: [{ order: 1, text: 'NULLIF(total, 0) guards the division in case a method somehow had zero payments.' }],
    solution: {
      sql: `WITH method_stats AS (
  SELECT method, COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'completed') AS completed
  FROM payments
  GROUP BY method
)
SELECT method, ROUND(100.0 * completed / NULLIF(total, 0), 2) AS success_rate_pct
FROM method_stats;`,
      explanation: 'NULLIF(total, 0) turns a would-be division-by-zero into a NULL result instead of an error — defensive, even when the current data happens to make every total positive.',
      conceptsUsed: ['CTE', 'FILTER', 'NULLIF'],
    },
    validation: { roundDecimals: 2 },
  }),
]
