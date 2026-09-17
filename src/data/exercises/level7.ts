import { defineExercise } from './helpers'
import type { Exercise } from '../../types'

export const level7Exercises: Exercise[] = [
  defineExercise({
    id: 'l7-01',
    level: 7,
    order: 1,
    title: 'Number every product by price',
    difficultyScore: 4,
    description: 'Return `name`, `price`, and a `rank_num` column numbering every product from 1 (most expensive) downward.',
    requirements: ['Break ties by name, ascending, so the numbering is fully deterministic.'],
    tablesInvolved: ['products'],
    conceptTags: ['ROW_NUMBER', 'OVER', 'ORDER BY (window)'],
    hints: [
      { order: 1, text: 'ROW_NUMBER() OVER (ORDER BY ...) assigns 1, 2, 3, ... in the specified order.' },
      { order: 2, text: 'Without a tiebreaker, rows with equal price could be numbered inconsistently between runs.' },
    ],
    solution: {
      sql: 'SELECT name, price, ROW_NUMBER() OVER (ORDER BY price DESC, name ASC) AS rank_num FROM products;',
      explanation: 'ROW_NUMBER() always assigns a unique, sequential number — even to tied rows — so a fully deterministic ORDER BY (here, price then name) is required for a reproducible result.',
      conceptsUsed: ['ROW_NUMBER', 'OVER'],
    },
    validation: { roundDecimals: 2 },
  }),
  defineExercise({
    id: 'l7-02',
    level: 7,
    order: 2,
    title: 'Rank products within their category',
    difficultyScore: 4,
    description: 'For every product, return `category_id`, `name`, `price`, and `price_rank` — its rank by price (1 = most expensive) computed separately within each category.',
    tablesInvolved: ['products'],
    conceptTags: ['RANK', 'PARTITION BY'],
    hints: [{ order: 1, text: 'PARTITION BY restarts the ranking for each category, independently of the others.' }],
    solution: {
      sql: 'SELECT category_id, name, price, RANK() OVER (PARTITION BY category_id ORDER BY price DESC) AS price_rank FROM products;',
      explanation: 'RANK() gives tied rows the same rank and then skips the following rank(s) — e.g. two products tied for rank 1 means the next product is ranked 3, not 2.',
      conceptsUsed: ['RANK', 'PARTITION BY'],
    },
    validation: { roundDecimals: 2 },
  }),
  defineExercise({
    id: 'l7-03',
    level: 7,
    order: 3,
    title: 'Dense-rank customers by order count',
    difficultyScore: 4,
    description: 'For every customer, return `customer_id`, their total `order_count`, and a `rank_num` ranking them from most to fewest orders — tied customers must share the same rank with NO gap in the numbering afterward.',
    tablesInvolved: ['orders'],
    conceptTags: ['DENSE_RANK'],
    hints: [{ order: 1, text: 'DENSE_RANK() is like RANK() but never skips numbers after a tie.' }],
    solution: {
      sql: `SELECT customer_id, COUNT(*) AS order_count,
       DENSE_RANK() OVER (ORDER BY COUNT(*) DESC) AS rank_num
FROM orders
GROUP BY customer_id;`,
      explanation: 'Window functions can be combined with GROUP BY: the aggregation happens first, then DENSE_RANK() ranks the resulting grouped rows.',
      conceptsUsed: ['DENSE_RANK', 'GROUP BY'],
    },
  }),
  defineExercise({
    id: 'l7-04',
    level: 7,
    order: 4,
    title: 'Top 3 products per category',
    difficultyScore: 5,
    description: 'Return `category_id`, `name`, and `price` for only the 3 most expensive products in each category.',
    requirements: ['Break ties by name, ascending.'],
    tablesInvolved: ['products'],
    conceptTags: ['ROW_NUMBER', 'top-N per group', 'CTE'],
    hints: [
      { order: 1, text: 'You cannot filter directly on a window function in WHERE — compute it in a CTE first, then filter the CTE.' },
    ],
    solution: {
      sql: `WITH ranked AS (
  SELECT category_id, name, price,
         ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY price DESC, name ASC) AS rn
  FROM products
)
SELECT category_id, name, price FROM ranked WHERE rn <= 3;`,
      explanation: 'This is the canonical "top-N per group" pattern: rank rows within each partition, then keep only ranks 1..N in an outer query, since window functions cannot be referenced directly in WHERE.',
      conceptsUsed: ['ROW_NUMBER', 'top-N per group'],
    },
    validation: { roundDecimals: 2 },
  }),
  defineExercise({
    id: 'l7-05',
    level: 7,
    order: 5,
    title: "Each order's previous order date, per customer",
    difficultyScore: 4,
    description: 'For every order, return `customer_id`, `order_date`, and `prev_order_date` — the date of that same customer\'s immediately preceding order (NULL for their first order).',
    requirements: ['Within each customer, break ties in order_date by the order id, ascending.'],
    tablesInvolved: ['orders'],
    conceptTags: ['LAG', 'PARTITION BY'],
    hints: [{ order: 1, text: 'LAG(column) OVER (PARTITION BY ... ORDER BY ...) looks at the previous row within the same partition.' }],
    solution: {
      sql: 'SELECT customer_id, order_date, LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date, id) AS prev_order_date FROM orders;',
      explanation: 'LAG defaults to looking 1 row back and returns NULL when there is no such row — here, a customer\'s very first order.',
      conceptsUsed: ['LAG', 'PARTITION BY'],
    },
  }),
  defineExercise({
    id: 'l7-06',
    level: 7,
    order: 6,
    title: "Each order's next order date, per customer",
    difficultyScore: 4,
    description: 'For every order, return `customer_id`, `order_date`, and `next_order_date` — the date of that same customer\'s next order (NULL for their most recent order).',
    requirements: ['Within each customer, break ties in order_date by the order id, ascending.'],
    tablesInvolved: ['orders'],
    conceptTags: ['LEAD', 'PARTITION BY'],
    hints: [{ order: 1, text: 'LEAD is the mirror image of LAG — it looks forward instead of backward.' }],
    solution: {
      sql: 'SELECT customer_id, order_date, LEAD(order_date) OVER (PARTITION BY customer_id ORDER BY order_date, id) AS next_order_date FROM orders;',
      explanation: 'LEAD(column) fetches the value from the following row in the ordered partition.',
      conceptsUsed: ['LEAD', 'PARTITION BY'],
    },
  }),
  defineExercise({
    id: 'l7-07',
    level: 7,
    order: 7,
    title: 'Running total of completed revenue',
    difficultyScore: 4,
    description: 'For every completed payment, return `id`, `paid_at`, `amount`, and `running_total` — the cumulative sum of amount up through that row, ordered by payment time.',
    requirements: ['Break ties in paid_at by the payment id, ascending.'],
    tablesInvolved: ['payments'],
    conceptTags: ['running totals', 'SUM() OVER'],
    hints: [{ order: 1, text: 'SUM(amount) OVER (ORDER BY paid_at, id) accumulates by default from the start of the partition through the current row.' }],
    solution: {
      sql: `SELECT id, paid_at, amount, SUM(amount) OVER (ORDER BY paid_at, id) AS running_total
FROM payments
WHERE status = 'completed';`,
      explanation: 'With ORDER BY but no explicit frame, the default window frame is "everything from the start up to and including the current row" — exactly what a running total needs.',
      conceptsUsed: ['SUM() OVER', 'running totals'],
    },
    validation: { roundDecimals: 2 },
  }),
  defineExercise({
    id: 'l7-08',
    level: 7,
    order: 8,
    title: '3-row moving average of price',
    difficultyScore: 5,
    description: 'Order products by price ascending. For every product, return `name`, `price`, and `moving_avg_3` — the average price of the current product and the two preceding it in that order.',
    requirements: ['Break ties in price by product id, ascending.'],
    tablesInvolved: ['products'],
    conceptTags: ['moving averages', 'window frame', 'ROWS BETWEEN'],
    hints: [{ order: 1, text: 'ROWS BETWEEN 2 PRECEDING AND CURRENT ROW defines an explicit 3-row window frame.' }],
    solution: {
      sql: `SELECT name, price,
       AVG(price) OVER (ORDER BY price ASC, id ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS moving_avg_3
FROM products;`,
      explanation: 'The ROWS BETWEEN clause overrides the default frame, letting you compute a fixed-size moving average instead of a running total from the very start.',
      conceptsUsed: ['moving averages', 'ROWS BETWEEN'],
    },
    validation: { roundDecimals: 2 },
  }),
  defineExercise({
    id: 'l7-09',
    level: 7,
    order: 9,
    title: "Each customer's first order date, repeated on every row",
    difficultyScore: 4,
    description: 'For every order, return `customer_id`, `order_date`, and `first_order_date` — the date of that customer\'s very first order.',
    requirements: ['Within each customer, break ties in order_date by the order id, ascending.'],
    tablesInvolved: ['orders'],
    conceptTags: ['FIRST_VALUE'],
    hints: [{ order: 1, text: 'FIRST_VALUE(column) OVER (PARTITION BY ... ORDER BY ...) returns the first row\'s value within each partition, on every row.' }],
    solution: {
      sql: 'SELECT customer_id, order_date, FIRST_VALUE(order_date) OVER (PARTITION BY customer_id ORDER BY order_date, id) AS first_order_date FROM orders;',
      explanation: 'Unlike LAG, FIRST_VALUE always looks at the very first row of the partition (given the default frame, which for ORDER BY without an explicit frame ends at the current row — but starts at the partition\'s beginning either way).',
      conceptsUsed: ['FIRST_VALUE'],
    },
  }),
  defineExercise({
    id: 'l7-10',
    level: 7,
    order: 10,
    title: "Each customer's most recent order date, repeated on every row",
    difficultyScore: 5,
    description: 'For every order, return `customer_id`, `order_date`, and `most_recent_order_date` — the date of that customer\'s single most recent order, shown on every one of their rows.',
    requirements: ['Within each customer, break ties in order_date by the order id, ascending.'],
    tablesInvolved: ['orders'],
    conceptTags: ['LAST_VALUE', 'window frame'],
    hints: [
      { order: 1, text: 'LAST_VALUE with the default frame only sees up to the CURRENT ROW, so it will just return the current row\'s own value — not what you want.' },
      { order: 2, text: 'Use an explicit frame that spans the whole partition: ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING.' },
    ],
    solution: {
      sql: `SELECT customer_id, order_date,
       LAST_VALUE(order_date) OVER (
         PARTITION BY customer_id ORDER BY order_date, id
         ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
       ) AS most_recent_order_date
FROM orders;`,
      explanation: 'This is a classic gotcha: LAST_VALUE needs the frame widened to the entire partition, otherwise it degenerates into "the current row\'s own value" because the default frame ends at CURRENT ROW.',
      conceptsUsed: ['LAST_VALUE', 'window frame'],
    },
  }),
  defineExercise({
    id: 'l7-11',
    level: 7,
    order: 11,
    title: 'Inventory share by category',
    difficultyScore: 5,
    description: 'For every category, return `category_id`, its total `inventory_count` (as `cat_inventory`), and `pct_of_total` — the percentage of the entire catalog\'s inventory held by that category, rounded to 2 decimals.',
    tablesInvolved: ['products'],
    conceptTags: ['window function over aggregate', 'percentage'],
    hints: [
      { order: 1, text: 'A window function can be applied on top of an already-grouped result: SUM(...) OVER () with no PARTITION BY sums across all groups.' },
      { order: 2, text: 'Multiply by 100.0 (not 100) before dividing, to force a fractional result.' },
    ],
    solution: {
      sql: `SELECT category_id,
       SUM(inventory_count) AS cat_inventory,
       ROUND(100.0 * SUM(inventory_count) / SUM(SUM(inventory_count)) OVER (), 2) AS pct_of_total
FROM products
GROUP BY category_id;`,
      explanation: 'SUM(SUM(inventory_count)) OVER () first aggregates per category (the inner SUM, from GROUP BY), then the window SUM adds up those per-category totals across every group to get the grand total.',
      conceptsUsed: ['window function over aggregate', 'GROUP BY'],
    },
    validation: { roundDecimals: 2 },
  }),
  defineExercise({
    id: 'l7-12',
    level: 7,
    order: 12,
    title: 'Month-over-month order growth',
    difficultyScore: 5,
    description: 'Using a CTE of monthly order counts, return `month`, `order_count`, and `change_from_prev_month` — the difference from the previous month\'s count (NULL for the first month).',
    tablesInvolved: ['orders'],
    conceptTags: ['LAG', 'CTE', 'DATE_TRUNC'],
    hints: [{ order: 1, text: 'Build the monthly totals first in a CTE, then apply LAG() OVER (ORDER BY month) on top of it.' }],
    solution: {
      sql: `WITH monthly AS (
  SELECT DATE_TRUNC('month', order_date) AS month, COUNT(*) AS order_count
  FROM orders
  GROUP BY DATE_TRUNC('month', order_date)
)
SELECT month, order_count, order_count - LAG(order_count) OVER (ORDER BY month) AS change_from_prev_month
FROM monthly;`,
      explanation: 'Layering a window function on top of a CTE\'s pre-aggregated rows is a common and readable pattern for period-over-period comparisons.',
      conceptsUsed: ['LAG', 'CTE'],
    },
  }),
  defineExercise({
    id: 'l7-13',
    level: 7,
    order: 13,
    title: 'The priciest product(s) in every category',
    difficultyScore: 5,
    description: 'Return `category_id`, `name`, and `price` for the most expensive product in each category — including EVERY product if there is a tie for first place.',
    tablesInvolved: ['products'],
    conceptTags: ['RANK', 'top-N per group'],
    hints: [{ order: 1, text: 'Unlike ROW_NUMBER, RANK() lets multiple rows share rank 1 when they are tied.' }],
    solution: {
      sql: `WITH ranked AS (
  SELECT category_id, name, price, RANK() OVER (PARTITION BY category_id ORDER BY price DESC) AS r
  FROM products
)
SELECT category_id, name, price FROM ranked WHERE r = 1;`,
      explanation: 'Using RANK() instead of ROW_NUMBER() here is a deliberate choice: it correctly returns every tied top product rather than arbitrarily picking one.',
      conceptsUsed: ['RANK', 'top-N per group'],
    },
    validation: { roundDecimals: 2 },
  }),
  defineExercise({
    id: 'l7-14',
    level: 7,
    order: 14,
    title: 'Split products into 4 price quartiles',
    difficultyScore: 4,
    description: 'Order products by price ascending and divide them into 4 equally-sized groups. Return `name`, `price`, and `price_quartile` (1 = cheapest quartile, 4 = most expensive).',
    requirements: ['Break ties in price by product id, ascending.'],
    tablesInvolved: ['products'],
    conceptTags: ['NTILE'],
    hints: [{ order: 1, text: 'NTILE(n) OVER (ORDER BY ...) distributes rows as evenly as possible into n numbered buckets.' }],
    solution: {
      sql: 'SELECT name, price, NTILE(4) OVER (ORDER BY price ASC, id) AS price_quartile FROM products;',
      explanation: 'NTILE splits the ordered rows into the requested number of roughly-equal buckets — bucket sizes can differ by at most 1 row when the total doesn\'t divide evenly.',
      conceptsUsed: ['NTILE'],
    },
    validation: { roundDecimals: 2 },
  }),
  defineExercise({
    id: 'l7-15',
    level: 7,
    order: 15,
    title: 'Salary rank within department',
    difficultyScore: 4,
    description: 'For every employee, return `department_id`, `first_name`, `last_name`, `salary`, and `salary_rank` — their salary rank within their own department (1 = highest paid), with no gaps for ties.',
    tablesInvolved: ['employees'],
    conceptTags: ['DENSE_RANK', 'PARTITION BY'],
    hints: [{ order: 1, text: 'PARTITION BY department_id resets the ranking at each department boundary.' }],
    solution: {
      sql: 'SELECT department_id, first_name, last_name, salary, DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS salary_rank FROM employees;',
      explanation: 'DENSE_RANK is often preferred over RANK for "leaderboard"-style rankings, since it avoids confusing gaps after ties.',
      conceptsUsed: ['DENSE_RANK', 'PARTITION BY'],
    },
    validation: { roundDecimals: 2 },
  }),
  defineExercise({
    id: 'l7-16',
    level: 7,
    order: 16,
    title: "Each customer's 2 most recent orders",
    difficultyScore: 5,
    description: 'Return `customer_id`, `order_date`, and `status` for only the 2 most recent orders of every customer.',
    requirements: ['Within each customer, break ties in order_date by the order id, descending (so the higher id counts as more recent).'],
    tablesInvolved: ['orders'],
    conceptTags: ['ROW_NUMBER', 'top-N per group'],
    hints: [{ order: 1, text: 'Rank each customer\'s orders most-recent-first, then keep only rank 1 and 2.' }],
    solution: {
      sql: `WITH ranked AS (
  SELECT customer_id, order_date, status,
         ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC, id DESC) AS rn
  FROM orders
)
SELECT customer_id, order_date, status FROM ranked WHERE rn <= 2;`,
      explanation: 'The same top-N-per-group pattern as Level 7 Exercise 4, just with the sort direction reversed and N = 2.',
      conceptsUsed: ['ROW_NUMBER', 'top-N per group'],
    },
  }),
]
