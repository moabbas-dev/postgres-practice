-- ============================================================================
-- Postgres Arena practice database — "NorthStar Retail"
-- A mid-size e-commerce retailer: catalog, orders, payments, memberships,
-- support, HR org chart, and a behavioral event stream.
-- ============================================================================

-- ---------- Enum types --------------------------------------------------

create type product_status as enum ('active', 'discontinued', 'draft');
create type customer_tier as enum ('bronze', 'silver', 'gold', 'platinum');
create type order_status as enum ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
create type payment_method as enum ('credit_card', 'paypal', 'bank_transfer', 'gift_card');
create type payment_status as enum ('pending', 'completed', 'failed', 'refunded');
create type membership_plan as enum ('basic', 'plus', 'premium', 'elite');
create type membership_status as enum ('active', 'trialing', 'cancelled', 'past_due');
create type ticket_status as enum ('open', 'pending', 'resolved', 'closed');
create type ticket_priority as enum ('low', 'medium', 'high', 'urgent');
create type message_sender as enum ('customer', 'agent');
create type address_kind as enum ('billing', 'shipping');

-- ---------- Reference / org tables --------------------------------------

create table departments (
  id serial primary key,
  name text not null,
  parent_department_id integer references departments(id),
  created_at timestamptz not null default now()
);

create table employees (
  id serial primary key,
  first_name text not null,
  last_name text not null,
  email text not null unique,
  department_id integer not null references departments(id),
  manager_id integer references employees(id),
  title text not null,
  salary numeric(10, 2) not null,
  hire_date date not null,
  termination_date date,
  is_active boolean not null default true,
  skills text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb
);

create table warehouses (
  id serial primary key,
  code text not null unique,
  name text not null,
  country text not null
);

-- ---------- Catalog -------------------------------------------------------

create table categories (
  id serial primary key,
  name text not null,
  slug text not null unique,
  parent_category_id integer references categories(id)
);

create table suppliers (
  id serial primary key,
  name text not null,
  country text not null,
  contact_email text not null,
  rating numeric(2, 1) not null check (rating between 0 and 5)
);

create table products (
  id uuid primary key,
  sku text not null unique,
  name text not null,
  category_id integer not null references categories(id),
  supplier_id integer not null references suppliers(id),
  price numeric(10, 2) not null,
  cost numeric(10, 2) not null,
  inventory_count integer not null default 0,
  status product_status not null default 'active',
  tags text[] not null default '{}',
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  discontinued_at timestamptz
);

create table inventory (
  warehouse_id integer not null references warehouses(id),
  product_id uuid not null references products(id),
  quantity integer not null default 0,
  primary key (warehouse_id, product_id)
);

-- ---------- Customers ------------------------------------------------------

create table customers (
  id uuid primary key,
  email text not null unique,
  first_name text not null,
  last_name text not null,
  signup_date date not null,
  tier customer_tier not null default 'bronze',
  country text not null,
  birth_date date,
  marketing_opt_in boolean not null default true,
  referred_by uuid references customers(id),
  tags text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb
);

create table addresses (
  id serial primary key,
  customer_id uuid not null references customers(id),
  kind address_kind not null,
  line1 text not null,
  city text not null,
  country text not null,
  postal_code text not null,
  is_default boolean not null default false
);

create table memberships (
  id serial primary key,
  customer_id uuid not null references customers(id),
  plan membership_plan not null,
  status membership_status not null,
  monthly_fee numeric(6, 2) not null,
  started_at date not null,
  ended_at date
);

-- ---------- Commerce -------------------------------------------------------

create table coupons (
  id serial primary key,
  code text not null unique,
  discount_pct numeric(5, 2) not null,
  valid_from date not null,
  valid_to date not null,
  max_uses integer,
  applicable_category_ids integer[]
);

create table orders (
  id serial primary key,
  order_number text not null unique,
  customer_id uuid not null references customers(id),
  employee_id integer references employees(id),
  order_date timestamptz not null,
  status order_status not null default 'pending',
  shipping_address_id integer references addresses(id),
  notes text
);

create table order_items (
  id serial primary key,
  order_id integer not null references orders(id),
  product_id uuid not null references products(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null,
  discount_pct numeric(4, 2) not null default 0
);

create table order_coupons (
  order_id integer not null references orders(id),
  coupon_id integer not null references coupons(id),
  primary key (order_id, coupon_id)
);

create table payments (
  id serial primary key,
  order_id integer not null references orders(id),
  amount numeric(10, 2) not null,
  paid_at timestamptz not null,
  method payment_method not null,
  status payment_status not null default 'completed'
);

create table reviews (
  id serial primary key,
  product_id uuid not null references products(id),
  customer_id uuid not null references customers(id),
  rating integer not null check (rating between 1 and 5),
  title text,
  body text,
  helpful_votes integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- Support ---------------------------------------------------------

create table support_tickets (
  id serial primary key,
  customer_id uuid not null references customers(id),
  assigned_employee_id integer references employees(id),
  subject text not null,
  status ticket_status not null default 'open',
  priority ticket_priority not null default 'medium',
  created_at timestamptz not null,
  resolved_at timestamptz,
  satisfaction_score integer check (satisfaction_score between 1 and 5)
);

create table ticket_messages (
  id serial primary key,
  ticket_id integer not null references support_tickets(id),
  sender message_sender not null,
  body text not null,
  sent_at timestamptz not null
);

-- ---------- Behavioral events -------------------------------------------

create table events (
  id bigserial primary key,
  customer_id uuid references customers(id),
  session_id uuid not null,
  event_type text not null,
  occurred_at timestamptz not null,
  url text,
  properties jsonb not null default '{}'::jsonb
);

-- ---------- Indexes ----------------------------------------------------

create index idx_employees_department on employees(department_id);
create index idx_employees_manager on employees(manager_id);
create index idx_products_category on products(category_id);
create index idx_products_supplier on products(supplier_id);
create index idx_addresses_customer on addresses(customer_id);
create index idx_orders_customer on orders(customer_id);
create index idx_orders_employee on orders(employee_id);
create index idx_orders_date on orders(order_date);
create index idx_order_items_order on order_items(order_id);
create index idx_order_items_product on order_items(product_id);
create index idx_payments_order on payments(order_id);
create index idx_reviews_product on reviews(product_id);
create index idx_reviews_customer on reviews(customer_id);
create index idx_tickets_customer on support_tickets(customer_id);
create index idx_ticket_messages_ticket on ticket_messages(ticket_id);
create index idx_events_customer on events(customer_id);
create index idx_events_session on events(session_id);
create index idx_events_occurred on events(occurred_at);
create index idx_memberships_customer on memberships(customer_id);
