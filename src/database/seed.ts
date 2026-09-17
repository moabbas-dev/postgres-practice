import { Rng } from './rng'
import { batchedInserts, bool, dateOnly, insertStatement, intArray, json, num, str, textArray, ts } from './sqlLiterals'
import {
  BRANDS,
  CATEGORY_TREE,
  COUNTRIES,
  DEPARTMENTS,
  EVENT_TYPES,
  FIRST_NAMES,
  LAST_NAMES,
  PRODUCT_ADJECTIVES,
  PRODUCT_NOUNS,
  STREET_NAMES,
  TICKET_SUBJECTS,
} from './wordLists'

const SEED = 42
const DAY = 24 * 60 * 60 * 1000
const NOW = new Date('2026-08-15T00:00:00Z')

function fullName(rng: Rng) {
  return { first: rng.pick(FIRST_NAMES), last: rng.pick(LAST_NAMES) }
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** Generates the entire seed dataset as an ordered list of executable SQL statements. */
export function generateSeedStatements(): string[] {
  const rng = new Rng(SEED)
  const statements: string[] = []

  // ---------------------------------------------------------------- departments
  const deptIdByName = new Map<string, number>()
  const deptRows: string[][] = []
  DEPARTMENTS.forEach((d, i) => {
    const id = i + 1
    deptIdByName.set(d.name, id)
    const parentId = d.parent ? deptIdByName.get(d.parent)! : null
    deptRows.push([num(id), str(d.name), num(parentId), ts(rng.dateBetween(new Date('2015-01-01'), new Date('2018-01-01')))])
  })
  statements.push(insertStatement('departments', ['id', 'name', 'parent_department_id', 'created_at'], deptRows))

  // ---------------------------------------------------------------- warehouses
  const warehouseDefs = [
    { code: 'WH-EAST', name: 'East Coast Fulfillment Center', country: 'United States' },
    { code: 'WH-WEST', name: 'West Coast Fulfillment Center', country: 'United States' },
    { code: 'WH-EU', name: 'European Distribution Hub', country: 'Germany' },
    { code: 'WH-UK', name: 'UK Distribution Center', country: 'United Kingdom' },
    { code: 'WH-APAC', name: 'APAC Fulfillment Center', country: 'Singapore' },
    { code: 'WH-LATAM', name: 'LATAM Distribution Center', country: 'Brazil' },
  ]
  const warehouseRows = warehouseDefs.map((w, i) => [num(i + 1), str(w.code), str(w.name), str(w.country)])
  statements.push(insertStatement('warehouses', ['id', 'code', 'name', 'country'], warehouseRows))

  // ---------------------------------------------------------------- employees
  type Employee = { id: number; departmentId: number; managerId: number | null; title: string; salary: number; isActive: boolean }
  const employees: Employee[] = []
  const deptEmployeeCount: Record<string, number> = {
    Executive: 5,
    Sales: 8,
    'Sales - Enterprise': 12,
    'Sales - SMB': 14,
    Engineering: 10,
    'Engineering - Platform': 18,
    'Engineering - Mobile': 16,
    'Customer Success': 6,
    'Support - Tier 1': 20,
    'Support - Tier 2': 14,
    Marketing: 12,
    Operations: 8,
    'Warehouse Operations': 17,
  }
  const execTitles = ['Chief Executive Officer', 'Chief Financial Officer', 'Chief Technology Officer', 'VP of Operations', 'VP of People']
  const titlesByDept = (deptName: string): { head: string; ic: string[] } => {
    if (deptName === 'Executive') return { head: 'Chief Executive Officer', ic: execTitles }
    if (deptName.startsWith('Sales')) return { head: 'Sales Director', ic: ['Account Executive', 'Sales Development Rep', 'Sales Manager'] }
    if (deptName.startsWith('Engineering')) return { head: 'Engineering Manager', ic: ['Software Engineer', 'Senior Software Engineer', 'Staff Engineer', 'QA Engineer'] }
    if (deptName === 'Customer Success') return { head: 'Director of Customer Success', ic: ['Customer Success Manager'] }
    if (deptName.startsWith('Support')) return { head: 'Support Team Lead', ic: ['Support Agent', 'Senior Support Agent'] }
    if (deptName === 'Marketing') return { head: 'Marketing Director', ic: ['Marketing Specialist', 'Content Strategist', 'SEO Analyst'] }
    if (deptName === 'Operations') return { head: 'Director of Operations', ic: ['Operations Analyst'] }
    return { head: 'Warehouse Supervisor', ic: ['Warehouse Associate', 'Logistics Coordinator'] }
  }
  const deptHead = new Map<string, number>()
  const usedEmails = new Set<string>()
  let empId = 1
  for (const d of DEPARTMENTS) {
    const count = deptEmployeeCount[d.name] ?? 6
    const { head, ic } = titlesByDept(d.name)
    const parentHeadId = d.parent ? (deptHead.get(d.parent) ?? null) : null
    for (let i = 0; i < count; i++) {
      const isHead = i === 0
      const title = isHead ? head : rng.pick(ic)
      const managerId = isHead ? parentHeadId : (deptHead.get(d.name) ?? parentHeadId)
      const baseSalary = isHead ? rng.numeric(105000, 175000) : rng.numeric(52000, 118000)
      employees.push({ id: empId, departmentId: deptIdByName.get(d.name)!, managerId, title, salary: baseSalary, isActive: rng.bool(0.94) })
      if (isHead) deptHead.set(d.name, empId)
      empId++
    }
  }
  const empRows: string[][] = employees.map((e) => {
    const { first, last } = fullName(rng)
    let email = `${first.toLowerCase()}.${last.toLowerCase()}@northstarretail.com`
    let n = 1
    while (usedEmails.has(email)) {
      email = `${first.toLowerCase()}.${last.toLowerCase()}${n}@northstarretail.com`
      n++
    }
    usedEmails.add(email)
    const hireDate = rng.dateBetween(new Date('2016-01-01'), new Date('2025-06-01'))
    const skillsPool = ['excel', 'salesforce', 'sql', 'communication', 'leadership', 'python', 'zendesk', 'figma', 'project-management']
    const skills = rng.pickN(skillsPool, rng.int(1, 4))
    const terminationDate = !e.isActive ? rng.dateBetween(hireDate, NOW) : null
    return [
      num(e.id),
      str(first),
      str(last),
      str(email),
      num(e.departmentId),
      num(e.managerId),
      str(e.title),
      num(e.salary),
      dateOnly(hireDate),
      terminationDate ? dateOnly(terminationDate) : 'NULL',
      bool(e.isActive),
      textArray(skills),
      json({ remote: rng.bool(0.4), level: rng.pick(['junior', 'mid', 'senior', 'lead']) }),
    ]
  })
  for (const stmt of batchedInserts(
    'employees',
    ['id', 'first_name', 'last_name', 'email', 'department_id', 'manager_id', 'title', 'salary', 'hire_date', 'termination_date', 'is_active', 'skills', 'metadata'],
    empRows,
  )) {
    statements.push(stmt)
  }

  // ---------------------------------------------------------------- categories
  const categoryIdByName = new Map<string, number>()
  const catRows: string[][] = []
  let catId = 1
  const leafCategories: { id: number; name: string }[] = []
  const rootCategoryIds: number[] = []
  for (const root of CATEGORY_TREE) {
    const rootId = catId++
    categoryIdByName.set(root.name, rootId)
    rootCategoryIds.push(rootId)
    catRows.push([num(rootId), str(root.name), str(slugify(root.name)), 'NULL'])
    for (const child of root.children) {
      const childId = catId++
      categoryIdByName.set(child, childId)
      leafCategories.push({ id: childId, name: child })
      catRows.push([num(childId), str(child), str(slugify(child)), num(rootId)])
    }
  }
  statements.push(insertStatement('categories', ['id', 'name', 'slug', 'parent_category_id'], catRows))

  // ---------------------------------------------------------------- suppliers
  const supplierCount = 45
  const supplierRows: string[][] = []
  for (let i = 1; i <= supplierCount; i++) {
    const country = rng.pick(COUNTRIES).country
    const name = `${rng.pick(BRANDS)} ${rng.pick(['Manufacturing', 'Goods Co.', 'Industries', 'Supply Co.', 'Trading', 'Group'])}`
    supplierRows.push([
      num(i),
      str(name),
      str(country),
      str(`contact@${slugify(name)}.com`),
      num(rng.numeric(2.5, 5.0, 1)),
    ])
  }
  statements.push(insertStatement('suppliers', ['id', 'name', 'country', 'contact_email', 'rating'], supplierRows))

  // ---------------------------------------------------------------- products
  type Product = { id: string; categoryId: number; categoryName: string; price: number; createdAt: Date; status: string }
  const products: Product[] = []
  const productRows: string[][] = []
  const usedSkus = new Set<string>()
  for (const leaf of leafCategories) {
    const nouns = PRODUCT_NOUNS[leaf.name] ?? ['Item']
    const countForLeaf = rng.int(14, 22)
    for (let i = 0; i < countForLeaf; i++) {
      const brand = rng.pick(BRANDS)
      const adj = rng.pick(PRODUCT_ADJECTIVES)
      const noun = rng.pick(nouns)
      const name = `${brand} ${adj} ${noun}`
      let sku = `${slugify(brand)}-${slugify(noun)}-${rng.int(1000, 9999)}`.toUpperCase()
      while (usedSkus.has(sku)) sku = `${sku}${rng.int(0, 9)}`
      usedSkus.add(sku)
      const cost = rng.numeric(5, 400)
      const price = Math.round(cost * rng.numeric(1.4, 2.6) * 100) / 100
      const createdAt = rng.dateBetween(new Date('2021-01-01'), new Date('2026-06-01'))
      const status = rng.weighted([
        ['active', 88],
        ['discontinued', 8],
        ['draft', 4],
      ] as const)
      const discontinuedAt = status === 'discontinued' ? rng.dateBetween(createdAt, NOW) : null
      const id = rng.uuid()
      products.push({ id, categoryId: leaf.id, categoryName: leaf.name, price, createdAt, status })
      const tagsPool = ['bestseller', 'new-arrival', 'eco-friendly', 'limited-edition', 'staff-pick', 'clearance', 'imported']
      productRows.push([
        str(id),
        str(sku),
        str(name),
        num(leaf.id),
        num(rng.int(1, supplierCount)),
        num(price),
        num(cost),
        num(rng.int(0, 800)),
        str(status),
        textArray(rng.pickN(tagsPool, rng.int(0, 3))),
        json({ weightKg: rng.numeric(0.05, 25, 2), color: rng.pick(['black', 'white', 'silver', 'blue', 'red', 'green', 'natural']), warrantyMonths: rng.pick([0, 6, 12, 24]) }),
        ts(createdAt),
        discontinuedAt ? ts(discontinuedAt) : 'NULL',
      ])
    }
  }
  for (const stmt of batchedInserts(
    'products',
    ['id', 'sku', 'name', 'category_id', 'supplier_id', 'price', 'cost', 'inventory_count', 'status', 'tags', 'attributes', 'created_at', 'discontinued_at'],
    productRows,
  )) {
    statements.push(stmt)
  }

  // ---------------------------------------------------------------- inventory
  const inventoryRows: string[][] = []
  for (const p of products) {
    const warehouseIds = rng.pickN([1, 2, 3, 4, 5, 6], rng.int(1, 4))
    for (const wId of warehouseIds) {
      inventoryRows.push([num(wId), str(p.id), num(rng.int(0, 500))])
    }
  }
  for (const stmt of batchedInserts('inventory', ['warehouse_id', 'product_id', 'quantity'], inventoryRows)) {
    statements.push(stmt)
  }

  // ---------------------------------------------------------------- customers
  type Customer = { id: string; signupDate: Date; country: string; tier: string }
  const customerCount = 2000
  const customers: Customer[] = []
  const customerRows: string[][] = []
  const custUsedEmails = new Set<string>()
  for (let i = 0; i < customerCount; i++) {
    const { first, last } = fullName(rng)
    const countryEntry = rng.pick(COUNTRIES)
    const signupDate = rng.dateBetween(new Date('2022-01-01'), NOW)
    const tier = rng.weighted([
      ['bronze', 50],
      ['silver', 28],
      ['gold', 15],
      ['platinum', 7],
    ] as const)
    let email = `${first.toLowerCase()}.${last.toLowerCase()}${rng.int(1, 999)}@${rng.pick(['gmail.com', 'outlook.com', 'yahoo.com', 'mail.com', 'proton.me'])}`
    while (custUsedEmails.has(email)) email = `${first.toLowerCase()}.${last.toLowerCase()}${rng.int(1000, 9999)}@example.com`
    custUsedEmails.add(email)
    const id = rng.uuid()
    const referredBy = customers.length > 20 && rng.bool(0.12) ? rng.pick(customers).id : null
    const hasBirth = rng.bool(0.75)
    const tagsPool = ['newsletter', 'vip', 'wholesale', 'influencer', 'early-adopter', 'churn-risk']
    customers.push({ id, signupDate, country: countryEntry.country, tier })
    customerRows.push([
      str(id),
      str(email),
      str(first),
      str(last),
      dateOnly(signupDate),
      str(tier),
      str(countryEntry.country),
      hasBirth ? dateOnly(rng.dateBetween(new Date('1955-01-01'), new Date('2007-01-01'))) : 'NULL',
      bool(rng.bool(0.68)),
      referredBy ? str(referredBy) : 'NULL',
      textArray(rng.pickN(tagsPool, rng.int(0, 2))),
      json({ acquisitionChannel: rng.pick(['organic', 'paid-search', 'social', 'referral', 'email', 'affiliate']), lifetimeSupportContacts: rng.int(0, 6) }),
    ])
  }
  for (const stmt of batchedInserts(
    'customers',
    ['id', 'email', 'first_name', 'last_name', 'signup_date', 'tier', 'country', 'birth_date', 'marketing_opt_in', 'referred_by', 'tags', 'metadata'],
    customerRows,
  )) {
    statements.push(stmt)
  }

  // ---------------------------------------------------------------- addresses
  type Address = { id: number; customerId: string; kind: 'billing' | 'shipping' }
  const addresses: Address[] = []
  const addressRows: string[][] = []
  let addrId = 1
  for (const c of customers) {
    const countryEntry = COUNTRIES.find((x) => x.country === c.country)!
    const numAddresses = rng.bool(0.3) ? 2 : 1
    for (let i = 0; i < numAddresses; i++) {
      const kind: 'billing' | 'shipping' = i === 0 ? 'billing' : 'shipping'
      const city = rng.pick(countryEntry.cities)
      addresses.push({ id: addrId, customerId: c.id, kind })
      addressRows.push([
        num(addrId),
        str(c.id),
        str(kind),
        str(`${rng.int(10, 9999)} ${rng.pick(STREET_NAMES)} St.`),
        str(city),
        str(c.country),
        str(String(rng.int(10000, 99999))),
        bool(i === 0),
      ])
      addrId++
    }
  }
  for (const stmt of batchedInserts('addresses', ['id', 'customer_id', 'kind', 'line1', 'city', 'country', 'postal_code', 'is_default'], addressRows)) {
    statements.push(stmt)
  }

  // ---------------------------------------------------------------- memberships
  const membershipRows: string[][] = []
  let memId = 1
  for (const c of customers) {
    if (!rng.bool(0.45)) continue
    const plan = rng.weighted([
      ['basic', 40],
      ['plus', 30],
      ['premium', 20],
      ['elite', 10],
    ] as const)
    const fee = { basic: 4.99, plus: 9.99, premium: 19.99, elite: 39.99 }[plan]
    const startedAt = rng.dateBetween(c.signupDate, NOW)
    const status = rng.weighted([
      ['active', 65],
      ['cancelled', 15],
      ['trialing', 10],
      ['past_due', 10],
    ] as const)
    const endedAt = status === 'cancelled' && startedAt < NOW ? rng.dateBetween(startedAt, NOW) : null
    membershipRows.push([num(memId), str(c.id), str(plan), str(status), num(fee), dateOnly(startedAt), endedAt ? dateOnly(endedAt) : 'NULL'])
    memId++
  }
  for (const stmt of batchedInserts('memberships', ['id', 'customer_id', 'plan', 'status', 'monthly_fee', 'started_at', 'ended_at'], membershipRows)) {
    statements.push(stmt)
  }

  // ---------------------------------------------------------------- coupons
  type Coupon = { id: number; code: string; validFrom: Date; validTo: Date }
  const couponDefs = [
    'WELCOME10', 'SAVE15', 'SUMMER20', 'WINTER25', 'FLASH30', 'VIP10', 'FREESHIP', 'HOLIDAY15',
    'NEWYEAR20', 'SPRING10', 'LOYALTY5', 'BUNDLE15', 'CLEARANCE25', 'MEMBER10', 'FIRSTORDER',
    'BLACKFRIDAY', 'CYBERMON30', 'REFER10', 'BDAY15', 'RESTOCK5', 'ANNIVERSARY20', 'STUDENT10',
    'WEEKEND15', 'GIFT10', 'EXTRA5', 'SAVEBIG25', 'EARLYBIRD', 'FLASH50', 'THANKYOU10', 'RESTART15',
  ]
  const coupons: Coupon[] = []
  const couponRows: string[][] = []
  couponDefs.forEach((code, i) => {
    const id = i + 1
    const validFrom = rng.dateBetween(new Date('2023-01-01'), new Date('2026-01-01'))
    const validTo = new Date(validFrom.getTime() + rng.int(20, 200) * DAY)
    coupons.push({ id, code, validFrom, validTo })
    const applicable = rng.bool(0.4) ? rng.pickN(rootCategoryIds, rng.int(1, 3)) : null
    couponRows.push([
      num(id),
      str(code),
      num(rng.numeric(5, 30, 0)),
      dateOnly(validFrom),
      dateOnly(validTo),
      rng.bool(0.5) ? num(rng.int(50, 5000)) : 'NULL',
      applicable ? intArray(applicable) : 'NULL',
    ])
  })
  statements.push(insertStatement('coupons', ['id', 'code', 'discount_pct', 'valid_from', 'valid_to', 'max_uses', 'applicable_category_ids'], couponRows))

  // ---------------------------------------------------------------- orders + order_items + payments + order_coupons
  const salesRepPool = employees.filter((_e, idx) => employees[idx].departmentId >= 2 && employees[idx].departmentId <= 4).map((e) => e.id)
  const activeProducts = products.filter((p) => p.status !== 'draft')

  const orderCount = 7000
  type OrderRec = { id: number; customerId: string; orderDate: Date; status: string }
  const orders: OrderRec[] = []
  const orderRows: string[][] = []
  const orderItemRows: string[][] = []
  const paymentRows: string[][] = []
  const orderCouponRows: string[][] = []
  const customerAddresses = new Map<string, Address[]>()
  for (const a of addresses) {
    const list = customerAddresses.get(a.customerId) ?? []
    list.push(a)
    customerAddresses.set(a.customerId, list)
  }

  let orderItemId = 1
  let paymentId = 1
  for (let i = 1; i <= orderCount; i++) {
    // Weight toward repeat customers by biasing pick toward earlier-signed-up customers occasionally.
    const customer = rng.pick(customers)
    const orderDate = rng.dateBetween(new Date(Math.max(customer.signupDate.getTime(), new Date('2022-01-01').getTime())), NOW)
    const status = rng.weighted([
      ['delivered', 62],
      ['shipped', 12],
      ['processing', 8],
      ['pending', 6],
      ['cancelled', 7],
      ['refunded', 5],
    ] as const)
    const custAddrs = customerAddresses.get(customer.id)
    const shippingAddr = custAddrs ? rng.pick(custAddrs) : null
    const employeeId = rng.bool(0.55) ? rng.pick(salesRepPool) : null
    orders.push({ id: i, customerId: customer.id, orderDate, status })
    orderRows.push([
      num(i),
      str(`NS-${100000 + i}`),
      str(customer.id),
      employeeId ? num(employeeId) : 'NULL',
      ts(orderDate),
      str(status),
      shippingAddr ? num(shippingAddr.id) : 'NULL',
      rng.bool(0.08) ? str(rng.pick(['Gift wrap requested', 'Leave at front door', 'Call on arrival', 'Fragile items inside'])) : 'NULL',
    ])

    const itemCount = rng.int(1, 5)
    let orderTotal = 0
    const chosenProducts = rng.pickN(activeProducts, Math.min(itemCount, activeProducts.length))
    for (const p of chosenProducts) {
      const quantity = rng.int(1, 4)
      const discountPct = rng.bool(0.2) ? rng.numeric(5, 20, 0) : 0
      const lineTotal = p.price * quantity * (1 - discountPct / 100)
      orderTotal += lineTotal
      orderItemRows.push([num(orderItemId), num(i), str(p.id), num(quantity), num(p.price), num(discountPct)])
      orderItemId++
    }

    if (rng.bool(0.16) && coupons.length > 0) {
      const validCoupons = coupons.filter((c) => orderDate >= c.validFrom && orderDate <= c.validTo)
      if (validCoupons.length > 0) {
        const coupon = rng.pick(validCoupons)
        orderCouponRows.push([num(i), num(coupon.id)])
      }
    }

    const paymentStatus = status === 'refunded' ? 'refunded' : status === 'cancelled' ? (rng.bool(0.5) ? 'failed' : 'refunded') : 'completed'
    const paidAt = new Date(orderDate.getTime() + rng.int(0, 3) * 60 * 60 * 1000)
    paymentRows.push([
      num(paymentId),
      num(i),
      num(Math.round(orderTotal * 100) / 100),
      ts(paidAt),
      str(rng.weighted([
        ['credit_card', 60],
        ['paypal', 25],
        ['bank_transfer', 8],
        ['gift_card', 7],
      ] as const)),
      str(paymentStatus),
    ])
    paymentId++
  }

  for (const stmt of batchedInserts(
    'orders',
    ['id', 'order_number', 'customer_id', 'employee_id', 'order_date', 'status', 'shipping_address_id', 'notes'],
    orderRows,
  )) statements.push(stmt)
  for (const stmt of batchedInserts('order_items', ['id', 'order_id', 'product_id', 'quantity', 'unit_price', 'discount_pct'], orderItemRows)) statements.push(stmt)
  for (const stmt of batchedInserts('payments', ['id', 'order_id', 'amount', 'paid_at', 'method', 'status'], paymentRows)) statements.push(stmt)
  if (orderCouponRows.length > 0) {
    for (const stmt of batchedInserts('order_coupons', ['order_id', 'coupon_id'], orderCouponRows)) statements.push(stmt)
  }

  // ---------------------------------------------------------------- reviews
  const reviewCount = 3500
  const reviewRows: string[][] = []
  const reviewTitlesPositive = ['Exceeded expectations', 'Great value', 'Works perfectly', 'Highly recommend', 'Exactly as described', 'Love it']
  const reviewTitlesNegative = ['Disappointed', 'Not worth it', 'Had issues', 'Would not buy again', 'Below expectations']
  for (let i = 1; i <= reviewCount; i++) {
    const product = rng.pick(products)
    const customer = rng.pick(customers)
    const rating = rng.weighted([
      [5, 42],
      [4, 28],
      [3, 14],
      [2, 9],
      [1, 7],
    ] as const)
    const createdAt = rng.dateBetween(new Date(Math.max(product.createdAt.getTime(), new Date('2022-01-01').getTime())), NOW)
    reviewRows.push([
      num(i),
      str(product.id),
      str(customer.id),
      num(rating),
      str(rng.pick(rating >= 4 ? reviewTitlesPositive : reviewTitlesNegative)),
      str(rng.pick([
        'Does exactly what it says on the box.',
        'Shipping was fast and packaging was solid.',
        'Quality feels a bit lower than expected for the price.',
        'Customer support was helpful when I had a question.',
        'Great addition, would purchase again.',
        'Took a while to arrive but works well.',
        'Not quite what I expected from the photos.',
        'Perfect gift, very happy with this purchase.',
      ])),
      num(rng.int(0, 240)),
      ts(createdAt),
    ])
  }
  for (const stmt of batchedInserts('reviews', ['id', 'product_id', 'customer_id', 'rating', 'title', 'body', 'helpful_votes', 'created_at'], reviewRows)) {
    statements.push(stmt)
  }

  // ---------------------------------------------------------------- support tickets + messages
  const supportEmployeeIds = employees.filter((e) => e.departmentId === deptIdByName.get('Support - Tier 1') || e.departmentId === deptIdByName.get('Support - Tier 2')).map((e) => e.id)
  const ticketCount = 1500
  const ticketRows: string[][] = []
  const ticketMessageRows: string[][] = []
  let msgId = 1
  for (let i = 1; i <= ticketCount; i++) {
    const customer = rng.pick(customers)
    const createdAt = rng.dateBetween(new Date(Math.max(customer.signupDate.getTime(), new Date('2022-06-01').getTime())), NOW)
    const status = rng.weighted([
      ['closed', 55],
      ['resolved', 20],
      ['open', 15],
      ['pending', 10],
    ] as const)
    const priority = rng.weighted([
      ['low', 35],
      ['medium', 40],
      ['high', 18],
      ['urgent', 7],
    ] as const)
    const isDone = status === 'closed' || status === 'resolved'
    const resolvedAt = isDone ? new Date(createdAt.getTime() + rng.int(1, 96) * 60 * 60 * 1000) : null
    const assigned = rng.bool(0.85) ? rng.pick(supportEmployeeIds) : null
    ticketRows.push([
      num(i),
      str(customer.id),
      assigned ? num(assigned) : 'NULL',
      str(rng.pick(TICKET_SUBJECTS)),
      str(status),
      str(priority),
      ts(createdAt),
      resolvedAt ? ts(resolvedAt) : 'NULL',
      isDone && rng.bool(0.7) ? num(rng.int(1, 5)) : 'NULL',
    ])

    const msgCount = rng.int(2, 5)
    let t = createdAt.getTime()
    for (let m = 0; m < msgCount; m++) {
      const sender = m % 2 === 0 ? 'customer' : 'agent'
      t += rng.int(5, 600) * 60 * 1000
      ticketMessageRows.push([
        num(msgId),
        num(i),
        str(sender),
        str(sender === 'customer' ? 'Following up on this issue, please advise.' : 'Thanks for reaching out — looking into this now.'),
        ts(new Date(t)),
      ])
      msgId++
    }
  }
  for (const stmt of batchedInserts(
    'support_tickets',
    ['id', 'customer_id', 'assigned_employee_id', 'subject', 'status', 'priority', 'created_at', 'resolved_at', 'satisfaction_score'],
    ticketRows,
  )) statements.push(stmt)
  for (const stmt of batchedInserts('ticket_messages', ['id', 'ticket_id', 'sender', 'body', 'sent_at'], ticketMessageRows)) statements.push(stmt)

  // ---------------------------------------------------------------- events (sessionized behavioral stream)
  const sessionCount = 9000
  const eventRows: string[][] = []
  let eventId = 1
  const funnel = ['page_view', 'product_view', 'add_to_cart', 'begin_checkout', 'purchase']
  for (let s = 0; s < sessionCount; s++) {
    const sessionId = rng.uuid()
    const isAnonymous = rng.bool(0.22)
    const customer = isAnonymous ? null : rng.pick(customers)
    const sessionStart = rng.dateBetween(new Date('2025-01-01'), NOW)
    const dropoffStage = rng.weighted([
      [1, 30],
      [2, 30],
      [3, 20],
      [4, 10],
      [5, 10],
    ] as const)
    let t = sessionStart.getTime()
    for (let stage = 0; stage < dropoffStage; stage++) {
      t += rng.int(5, 300) * 1000
      eventRows.push([
        num(eventId),
        customer ? str(customer.id) : 'NULL',
        str(sessionId),
        str(funnel[stage]),
        ts(new Date(t)),
        str(`/${rng.pick(['home', 'products', 'category', 'cart', 'checkout', 'search'])}`),
        json({ device: rng.pick(['desktop', 'mobile', 'tablet']), referrer: rng.pick(['direct', 'google', 'facebook', 'email', 'affiliate']) }),
      ])
      eventId++
    }
    // sprinkle a few extra browsing events for realism
    if (rng.bool(0.3)) {
      const extra = rng.int(1, 3)
      for (let e = 0; e < extra; e++) {
        t += rng.int(5, 200) * 1000
        eventRows.push([
          num(eventId),
          customer ? str(customer.id) : 'NULL',
          str(sessionId),
          str(rng.pick(EVENT_TYPES)),
          ts(new Date(t)),
          str(`/${rng.pick(['home', 'products', 'category', 'search', 'account'])}`),
          json({ device: rng.pick(['desktop', 'mobile', 'tablet']), referrer: rng.pick(['direct', 'google', 'facebook', 'email', 'affiliate']) }),
        ])
        eventId++
      }
    }
  }
  for (const stmt of batchedInserts('events', ['id', 'customer_id', 'session_id', 'event_type', 'occurred_at', 'url', 'properties'], eventRows, 500)) {
    statements.push(stmt)
  }

  // ---------------------------------------------------------------- sync sequences
  statements.push(`SELECT setval('departments_id_seq', ${DEPARTMENTS.length});`)
  statements.push(`SELECT setval('employees_id_seq', ${employees.length});`)
  statements.push(`SELECT setval('warehouses_id_seq', ${warehouseDefs.length});`)
  statements.push(`SELECT setval('categories_id_seq', ${catId - 1});`)
  statements.push(`SELECT setval('suppliers_id_seq', ${supplierCount});`)
  statements.push(`SELECT setval('addresses_id_seq', ${addrId - 1});`)
  statements.push(`SELECT setval('memberships_id_seq', ${memId - 1});`)
  statements.push(`SELECT setval('coupons_id_seq', ${couponDefs.length});`)
  statements.push(`SELECT setval('orders_id_seq', ${orderCount});`)
  statements.push(`SELECT setval('order_items_id_seq', ${orderItemId - 1});`)
  statements.push(`SELECT setval('payments_id_seq', ${paymentId - 1});`)
  statements.push(`SELECT setval('reviews_id_seq', ${reviewCount});`)
  statements.push(`SELECT setval('support_tickets_id_seq', ${ticketCount});`)
  statements.push(`SELECT setval('ticket_messages_id_seq', ${msgId - 1});`)
  statements.push(`SELECT setval('events_id_seq', ${eventId - 1});`)

  return statements
}
