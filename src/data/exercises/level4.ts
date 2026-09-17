import { defineExercise } from './helpers'
import type { Exercise } from '../../types'

export const level4Exercises: Exercise[] = [
  defineExercise({
    id: 'l4-01',
    level: 4,
    order: 1,
    title: 'Failed payments detail',
    difficultyScore: 3,
    description: "Join `orders` to `payments` and return `order_number`, `amount`, and payment `status` for every payment with status = 'failed'.",
    tablesInvolved: ['orders', 'payments'],
    conceptTags: ['INNER JOIN'],
    hints: [{ order: 1, text: 'INNER JOIN only keeps rows that match on both sides — exactly what we want here.' }],
    solution: {
      sql: "SELECT o.order_number, p.amount, p.status FROM orders o INNER JOIN payments p ON p.order_id = o.id WHERE p.status = 'failed';",
      explanation: 'INNER JOIN (the default JOIN) discards any row from either table that has no match on the join condition.',
      conceptsUsed: ['INNER JOIN'],
    },
    validation: { roundDecimals: 2 },
  }),
  defineExercise({
    id: 'l4-02',
    level: 4,
    order: 2,
    title: 'Order count including zero-order customers',
    difficultyScore: 4,
    description: 'For every customer, return `email` and their total number of orders as `order_count` — customers with no orders should show 0, not be omitted.',
    tablesInvolved: ['customers', 'orders'],
    conceptTags: ['LEFT JOIN', 'GROUP BY', 'COUNT'],
    hints: [
      { order: 1, text: 'An INNER JOIN would silently drop customers with zero orders — use LEFT JOIN to keep them.' },
      { order: 2, text: 'COUNT(o.id) (not COUNT(*)) correctly returns 0 for unmatched rows, since o.id is NULL when there is no match.' },
    ],
    solution: {
      sql: 'SELECT c.email, COUNT(o.id) AS order_count FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.email;',
      explanation: 'LEFT JOIN keeps every row from customers even when there is no matching order; COUNT(o.id) ignores the resulting NULLs, yielding 0 rather than skipping the customer.',
      conceptsUsed: ['LEFT JOIN', 'GROUP BY', 'COUNT'],
    },
  }),
  defineExercise({
    id: 'l4-03',
    level: 4,
    order: 3,
    title: 'Customers who never ordered',
    difficultyScore: 3,
    description: 'Using a LEFT JOIN, list the `email` of customers who have never placed an order.',
    tablesInvolved: ['customers', 'orders'],
    conceptTags: ['LEFT JOIN', 'IS NULL'],
    hints: [{ order: 1, text: 'After a LEFT JOIN, unmatched rows have NULL in every column that came from the right-hand table.' }],
    solution: {
      sql: 'SELECT c.email FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE o.id IS NULL;',
      explanation: 'Filtering for o.id IS NULL after a LEFT JOIN isolates customer rows that found no matching order.',
      conceptsUsed: ['LEFT JOIN', 'IS NULL'],
    },
  }),
  defineExercise({
    id: 'l4-04',
    level: 4,
    order: 4,
    title: 'Every category, even empty ones',
    difficultyScore: 4,
    description: 'Using a RIGHT JOIN from `products` to `categories`, return each category `name` with its `product_count` — including categories that have zero products directly assigned to them.',
    requirements: ['Root categories have no products directly assigned (products only link to leaf categories) and must still appear with a count of 0.'],
    tablesInvolved: ['products', 'categories'],
    conceptTags: ['RIGHT JOIN', 'GROUP BY'],
    hints: [{ order: 1, text: 'RIGHT JOIN keeps every row from the right-hand table (categories), even with no match on the left.' }],
    solution: {
      sql: 'SELECT c.name, COUNT(p.id) AS product_count FROM products p RIGHT JOIN categories c ON p.category_id = c.id GROUP BY c.name;',
      explanation: 'RIGHT JOIN is the mirror image of LEFT JOIN: every categories row is preserved, with NULLs from products when there is no match — root categories fall into this case since products only reference leaf categories.',
      conceptsUsed: ['RIGHT JOIN', 'GROUP BY', 'COUNT'],
    },
  }),
  defineExercise({
    id: 'l4-05',
    level: 4,
    order: 5,
    title: 'Count a FULL JOIN',
    difficultyScore: 4,
    description: 'Perform a FULL JOIN between `employees` and `orders` (matching `orders.employee_id = employees.id`), and return the total number of rows in the joined result as `total_rows`.',
    requirements: ['Some employees (outside Sales) have never handled an order, and some orders have no assigned employee — both must be preserved by the join.'],
    tablesInvolved: ['employees', 'orders'],
    conceptTags: ['FULL JOIN', 'FULL OUTER JOIN'],
    hints: [
      { order: 1, text: 'FULL JOIN (or FULL OUTER JOIN) keeps unmatched rows from both sides, filling the other side with NULLs.' },
      { order: 2, text: 'Wrap the joined query and COUNT(*) it, or just COUNT(*) directly over the FULL JOIN.' },
    ],
    solution: {
      sql: 'SELECT COUNT(*) AS total_rows FROM employees e FULL JOIN orders o ON o.employee_id = e.id;',
      explanation: 'FULL JOIN produces the union of what LEFT JOIN and RIGHT JOIN would each produce — every employee appears at least once, and every order appears at least once, with NULLs filling in unmatched sides.',
      conceptsUsed: ['FULL JOIN'],
    },
  }),
  defineExercise({
    id: 'l4-06',
    level: 4,
    order: 6,
    title: 'Employees and their manager',
    difficultyScore: 3,
    description: 'Using a self join on `employees`, return `first_name`/`last_name` of the employee alongside their manager\'s `first_name`/`last_name` (aliased `manager_first`/`manager_last`), for employees who have a manager.',
    tablesInvolved: ['employees'],
    conceptTags: ['self join'],
    hints: [{ order: 1, text: 'Join the employees table to itself using two different aliases, e.g. `e` and `m`.' }],
    solution: {
      sql: `SELECT e.first_name, e.last_name, m.first_name AS manager_first, m.last_name AS manager_last
FROM employees e
JOIN employees m ON e.manager_id = m.id;`,
      explanation: 'A self join treats the same table as two logical tables via aliases — here `e` for the employee and `m` for their manager — joined on manager_id = id.',
      conceptsUsed: ['self join'],
    },
  }),
  defineExercise({
    id: 'l4-07',
    level: 4,
    order: 7,
    title: 'Every employee, manager or not',
    difficultyScore: 3,
    description: 'Using a self join, list every employee\'s `first_name`/`last_name` and their manager\'s `first_name`/`last_name` (as `manager_first`/`manager_last`) — including the CEO, whose manager fields should be NULL.',
    tablesInvolved: ['employees'],
    conceptTags: ['self join', 'LEFT JOIN'],
    hints: [{ order: 1, text: 'An INNER self join would drop the employee with no manager — use LEFT JOIN instead.' }],
    solution: {
      sql: `SELECT e.first_name, e.last_name, m.first_name AS manager_first, m.last_name AS manager_last
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;`,
      explanation: 'A LEFT self join preserves every row from the left side (e), producing NULLs for manager_first/manager_last when manager_id is NULL.',
      conceptsUsed: ['self join', 'LEFT JOIN'],
    },
  }),
  defineExercise({
    id: 'l4-08',
    level: 4,
    order: 8,
    title: "What's stocked in the EU warehouse?",
    difficultyScore: 3,
    description: "Using the `inventory` many-to-many table, list the product `sku` and `quantity` stocked in the warehouse with code 'WH-EU'.",
    tablesInvolved: ['inventory', 'warehouses', 'products'],
    conceptTags: ['many-to-many', 'JOIN'],
    hints: [{ order: 1, text: 'inventory sits between warehouses and products — join through it.' }],
    solution: {
      sql: `SELECT p.sku, i.quantity
FROM inventory i
JOIN warehouses w ON i.warehouse_id = w.id
JOIN products p ON i.product_id = p.id
WHERE w.code = 'WH-EU';`,
      explanation: 'inventory is a classic many-to-many join table: each row pairs one warehouse with one product, plus the quantity attribute for that pair.',
      conceptsUsed: ['many-to-many', 'JOIN'],
    },
  }),
  defineExercise({
    id: 'l4-09',
    level: 4,
    order: 9,
    title: 'Coupon usage counts',
    difficultyScore: 3,
    description: 'Using the `order_coupons` many-to-many table, return each coupon `code` with how many orders it was applied to, as `uses`.',
    tablesInvolved: ['order_coupons', 'coupons'],
    conceptTags: ['many-to-many', 'JOIN', 'GROUP BY'],
    hints: [{ order: 1, text: 'Join coupons to order_coupons, then GROUP BY the coupon code.' }],
    solution: {
      sql: 'SELECT c.code, COUNT(*) AS uses FROM order_coupons oc JOIN coupons c ON oc.coupon_id = c.id GROUP BY c.code;',
      explanation: 'order_coupons has no natural single-column key of its own — it exists purely to link orders and coupons in a many-to-many relationship.',
      conceptsUsed: ['many-to-many', 'JOIN', 'GROUP BY'],
    },
  }),
  defineExercise({
    id: 'l4-10',
    level: 4,
    order: 10,
    title: 'Above-average priced products',
    difficultyScore: 3,
    description: 'Return `name` and `price` of products priced above the average price across the entire catalog.',
    tablesInvolved: ['products'],
    conceptTags: ['subquery'],
    hints: [{ order: 1, text: 'A scalar subquery in the WHERE clause can compute the overall average first.' }],
    solution: { sql: 'SELECT name, price FROM products WHERE price > (SELECT AVG(price) FROM products);', explanation: 'The subquery runs once, producing a single number that the outer query then compares each row against.', conceptsUsed: ['subquery'] },
    validation: { roundDecimals: 2 },
  }),
  defineExercise({
    id: 'l4-11',
    level: 4,
    order: 11,
    title: 'Customers who have ordered',
    difficultyScore: 3,
    description: 'Using a subquery (not a JOIN), list the `email` of customers who have placed at least one order.',
    tablesInvolved: ['customers', 'orders'],
    conceptTags: ['subquery', 'IN'],
    hints: [{ order: 1, text: 'WHERE id IN (SELECT customer_id FROM orders)' }],
    solution: { sql: 'SELECT email FROM customers WHERE id IN (SELECT customer_id FROM orders);', explanation: 'The subquery produces a list of customer ids that have ordered; IN checks membership in that list.', conceptsUsed: ['subquery', 'IN'] },
  }),
  defineExercise({
    id: 'l4-12',
    level: 4,
    order: 12,
    title: 'Priced above their own category average',
    difficultyScore: 5,
    description: "For each product, return `name`, `category_id`, and `price` — but only for products priced above the average price of products in that same category.",
    tablesInvolved: ['products'],
    conceptTags: ['correlated subquery'],
    hints: [
      { order: 1, text: 'The inner query needs to reference the outer product\'s category_id — that makes it correlated.' },
      { order: 2, text: 'WHERE p.price > (SELECT AVG(p2.price) FROM products p2 WHERE p2.category_id = p.category_id)' },
    ],
    solution: {
      sql: `SELECT p.name, p.category_id, p.price
FROM products p
WHERE p.price > (
  SELECT AVG(p2.price) FROM products p2 WHERE p2.category_id = p.category_id
);`,
      explanation: 'Unlike a plain subquery, a correlated subquery re-executes once per outer row, because it references a column (p.category_id) from the outer query.',
      conceptsUsed: ['correlated subquery'],
    },
    validation: { roundDecimals: 2 },
  }),
  defineExercise({
    id: 'l4-13',
    level: 4,
    order: 13,
    title: 'Customers with an urgent ticket',
    difficultyScore: 4,
    description: "List the `email` of customers who have at least one support ticket with priority = 'urgent'.",
    tablesInvolved: ['customers', 'support_tickets'],
    conceptTags: ['EXISTS'],
    hints: [{ order: 1, text: 'EXISTS checks whether a correlated subquery returns any row at all — it never needs to inspect the actual values.' }],
    solution: {
      sql: `SELECT email FROM customers c
WHERE EXISTS (
  SELECT 1 FROM support_tickets t WHERE t.customer_id = c.id AND t.priority = 'urgent'
);`,
      explanation: 'EXISTS is typically faster than IN for this kind of check, since the database can stop as soon as it finds one matching row.',
      conceptsUsed: ['EXISTS', 'correlated subquery'],
    },
  }),
  defineExercise({
    id: 'l4-14',
    level: 4,
    order: 14,
    title: 'Products that have never sold',
    difficultyScore: 4,
    description: 'List the `sku` and `name` of products that have never appeared in any `order_items` row.',
    tablesInvolved: ['products', 'order_items'],
    conceptTags: ['NOT EXISTS'],
    hints: [{ order: 1, text: 'NOT EXISTS is the negation of EXISTS — it keeps rows where the correlated subquery finds nothing.' }],
    solution: {
      sql: `SELECT sku, name FROM products p
WHERE NOT EXISTS (
  SELECT 1 FROM order_items oi WHERE oi.product_id = p.id
);`,
      explanation: 'NOT EXISTS is generally the safest way to express "has no matching rows" — unlike NOT IN, it is unaffected by NULLs in the subquery.',
      conceptsUsed: ['NOT EXISTS'],
    },
  }),
  defineExercise({
    id: 'l4-15',
    level: 4,
    order: 15,
    title: 'Orders with more than 4 line items',
    difficultyScore: 4,
    description: 'Using a subquery in the FROM clause, compute the number of line items per order, then return only the `order_id` and `item_count` for orders with more than 4 items.',
    tablesInvolved: ['order_items'],
    conceptTags: ['derived table', 'subquery in FROM'],
    hints: [{ order: 1, text: 'A subquery used as a table needs its own alias, e.g. `(...) AS item_counts`.' }],
    solution: {
      sql: `SELECT order_id, item_count FROM (
  SELECT order_id, COUNT(*) AS item_count FROM order_items GROUP BY order_id
) item_counts
WHERE item_count > 4;`,
      explanation: 'A derived table (subquery in FROM) is computed first and then treated like any other table by the outer query — here used to filter on an aggregate without a HAVING clause.',
      conceptsUsed: ['derived table'],
    },
  }),
  defineExercise({
    id: 'l4-16',
    level: 4,
    order: 16,
    title: 'Order count per platinum customer',
    difficultyScore: 4,
    description: "For each customer in the 'platinum' tier, return their `email` and the number of orders they've placed, as `order_count`, computed with a scalar subquery in the SELECT list.",
    tablesInvolved: ['customers', 'orders'],
    conceptTags: ['correlated subquery', 'scalar subquery'],
    hints: [{ order: 1, text: 'A subquery can appear directly in the SELECT list as long as it returns exactly one value per outer row.' }],
    solution: {
      sql: `SELECT c.email, (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) AS order_count
FROM customers c
WHERE c.tier = 'platinum';`,
      explanation: 'This scalar subquery is correlated (it references c.id) and runs once per outer row, similar to a LEFT JOIN + GROUP BY but expressed differently.',
      conceptsUsed: ['correlated subquery'],
    },
  }),
]
