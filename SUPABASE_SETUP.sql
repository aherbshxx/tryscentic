-- ==========================================
-- SUPERBASE SETUP SCRIPT (e-commerce v2)
-- Role: Senior Database Architect
-- Purpose: Complete initialization of perfume e-commerce schema
-- ==========================================

-- 0. CLEANUP (Optional - Use with caution. Commented out by default)
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;
-- GRANT ALL ON SCHEMA public TO postgres;
-- GRANT ALL ON SCHEMA public TO public;

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. ENUMS
-- Custom types for roles and statuses
create type public.user_role as enum ('admin', 'customer');
create type public.order_status as enum ('pending', 'shipped', 'delivered', 'cancelled');
create type public.transaction_type as enum ('deposit', 'purchase', 'refund');

-- 3. BRANDS
create table public.brands (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  slug text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. CATEGORIES (Hierarchical)
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  parent_id uuid references public.categories(id), -- Self-referencing FK for hierarchy (e.g. Full Bottles -> Homme)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. PROFILES (Extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  phone text,
  avatar_url text,
  wallet_balance numeric default 0,
  role public.user_role default 'customer'::public.user_role,
  is_banned boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. PRODUCTS (General Details)
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  brand_id uuid references public.brands(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  base_image_url text,
  gallery_images jsonb, -- Array of strings
  is_active boolean default true,
  rating numeric default 0,
  review_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. PRODUCT VARIANTS (SKUs)
-- The actual purchasable items linked to a parent product
create table public.product_variants (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  size_label text not null, -- e.g. "100ML", "50ML", "Tester"
  price numeric not null,
  stock_quantity integer not null default 0,
  thumbnail_image text, -- URL to variant-specific thumbnail
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7.0 VARIANT IMAGES
-- Supporting multiple images per SKU/Size
create table public.variant_images (
  id uuid default uuid_generate_v4() primary key,
  variant_id uuid references public.product_variants(id) on delete cascade not null,
  image_url text not null,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7.1. REVIEWS
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  author_name text,
  rating integer check (rating >= 1 and rating <= 5),
  content text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7.2. FAVORITES (Wishlist)
create table public.favorites (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, product_id)
);

-- 8. ORDERS
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  status public.order_status default 'pending'::public.order_status,
  total_amount numeric not null,
  shipping_info jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. ORDER ITEMS
-- Links orders to specific VARIANTS, not just products
create table public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade,
  variant_id uuid references public.product_variants(id),
  product_name_snapshot text, -- Good practice to store name at time of purchase
  quantity integer not null,
  unit_price_at_purchase numeric not null, -- Crucial for audit (price might change later)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. WALLET TRANSACTIONS
-- Add transaction status enum
create type public.transaction_status as enum ('pending', 'confirmed', 'rejected');

create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type public.transaction_type not null,
  amount numeric not null,
  description text,
  status public.transaction_status default 'pending'::public.transaction_status,
  proof_url text, -- URL to payment proof screenshot in Supabase Storage
  admin_note text, -- Note from admin when confirming/rejecting
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. GIFT CODES
create table public.gift_codes (
  code text primary key,
  amount numeric not null,
  is_active boolean default true,
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11.1. PROMO CODES (Discounts)
create table public.promo_codes (
  id uuid default uuid_generate_v4() primary key,
  code text not null unique,
  description text,
  discount_type text check (discount_type in ('percentage', 'fixed')) not null,
  discount_value numeric not null,
  min_order_amount numeric default 0,
  usage_limit integer, -- Global limit
  times_used integer default 0,
  starts_at timestamp with time zone default now(),
  expires_at timestamp with time zone,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 12. ROW LEVEL SECURITY (RLS)

-- Enable RLS
alter table public.brands enable row level security;
alter table public.categories enable row level security;
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.transactions enable row level security;
alter table public.gift_codes enable row level security;
alter table public.favorites enable row level security;
alter table public.promo_codes enable row level security;
alter table public.variant_images enable row level security;

-- Catalog Policies (Public Read, Admin Write)
-- Brands
create policy "Public read brands" on public.brands for select using (true);
create policy "Admin manage brands" on public.brands for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Categories
create policy "Public read categories" on public.categories for select using (true);
create policy "Admin manage categories" on public.categories for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Products & Variants
create policy "Public read products" on public.products for select using (true);
create policy "Admin manage products" on public.products for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "Public read variants" on public.product_variants for select using (true);
create policy "Admin manage variants" on public.product_variants for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "Public read variant images" on public.variant_images for select using (true);
create policy "Admin manage variant images" on public.variant_images for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Reviews
alter table public.reviews enable row level security;
create policy "Public read reviews" on public.reviews for select using (true);
create policy "Authenticated create reviews" on public.reviews for insert with check (auth.role() = 'authenticated');
create policy "User manage own reviews" on public.reviews for all using (auth.uid() = user_id);

-- Profile Policies
create policy "Public read profiles" on public.profiles for select using (true); -- Usually profiles are somewhat public, or restrict to own
create policy "User update own profile" on public.profiles for update using (auth.uid() = id);
-- Allow insert during signup trigger (handled by security definer function usually, but for consistency)
create policy "System insert profile" on public.profiles for insert with check (true);

-- Order Policies
create policy "User view own orders" on public.orders for select using (auth.uid() = user_id);
create policy "User create orders" on public.orders for insert with check (auth.uid() = user_id);
-- Admin can view/update status
create policy "Admin manage orders" on public.orders for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "User view own order items" on public.order_items for select using (
  exists (select 1 from public.orders where id = public.order_items.order_id and user_id = auth.uid())
);
create policy "User create order items" on public.order_items for insert with check (
  exists (select 1 from public.orders where id = public.order_items.order_id and user_id = auth.uid())
);

-- Favorites Policies
create policy "User view own favorites" on public.favorites for select using (auth.uid() = user_id);
create policy "User add favorites" on public.favorites for insert with check (auth.uid() = user_id);
create policy "User remove favorites" on public.favorites for delete using (auth.uid() = user_id);

-- Promo Code Policies
create policy "Public read valid promo codes" on public.promo_codes for select using (is_active = true and (expires_at is null or expires_at > now()));
create policy "Admin manage promo codes" on public.promo_codes for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- 13. TRIGGERS & FUNCTIONS

-- Handle New User Signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, phone, full_name, role, wallet_balance)
  values (
    new.id, 
    new.email, 
    null, -- phone might need handling if passed in metadata
    new.raw_user_meta_data->>'name',
    'customer', -- Default role
    0
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- Pay with Wallet Function (Updated context)
create or replace function public.pay_with_wallet(order_total numeric, order_id_input uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  user_balance numeric;
  curr_user_id uuid;
begin
  curr_user_id := auth.uid();

  select wallet_balance into user_balance
  from public.profiles
  where id = curr_user_id;

  if user_balance < order_total then
    raise exception 'Insufficient balance';
  end if;

  -- 1. Deduct balance
  update public.profiles
  set wallet_balance = wallet_balance - order_total
  where id = curr_user_id;

  -- 2. Record transaction
  insert into public.transactions (user_id, type, amount, description)
  values (curr_user_id, 'purchase', -order_total, 'Order Payment: ' || order_id_input);

  -- 3. Update order status (Optional: user 'pending' implies paid/processing. 
  -- If we had a 'paid' status we would set it here. Leaving as pending but confirmed via transaction)
  -- update public.orders set status = 'pending' where id = order_id_input;

  return true;
end;
$$;

-- Redeem Gift Code Function
create or replace function public.redeem_gift_code(code_input text)
returns numeric
language plpgsql
security definer
as $$
declare
  gift_amount numeric;
  curr_user_id uuid;
begin
  curr_user_id := auth.uid();
  
  -- Check validity
  select amount into gift_amount
  from public.gift_codes
  where code = code_input and is_active = true;
  
  if gift_amount is null then
    raise exception 'Invalid or expired gift code';
  end if;

  -- Deactivate code
  update public.gift_codes
  set is_active = false
  where code = code_input;

  -- Update user balance
  update public.profiles
  set wallet_balance = wallet_balance + gift_amount
  where id = curr_user_id;

  -- Record transaction
  insert into public.transactions (user_id, type, amount, description)
  values (curr_user_id, 'deposit', gift_amount, 'Gift Code Redemption: ' || code_input);

  return gift_amount;
end;
$$;

-- ==========================================
-- AUTHENTICATION HELPERS
-- ==========================================

-- Sync profile email with auth.users email
-- This ensures profile email stays in sync when user changes email
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles
  set email = new.email
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row 
  when (old.email is distinct from new.email)
  execute procedure public.handle_user_email_change();

-- Function to get user role (useful for RLS and application logic)
create or replace function public.get_user_role(user_id uuid)
returns text
language plpgsql
security definer
as $$
declare
  user_role text;
begin
  select role into user_role
  from public.profiles
  where id = user_id;
  
  return coalesce(user_role, 'customer');
end;
$$;

-- Function to check if user is admin (useful for RLS)
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
as $$
declare
  user_role text;
begin
  select role into user_role
  from public.profiles
  where id = auth.uid();
  
  return user_role = 'admin';
end;
$$;

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

-- Profiles
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_role on public.profiles(role);

-- Products
create index if not exists idx_products_brand_id on public.products(brand_id);
create index if not exists idx_products_category_id on public.products(category_id);
create index if not exists idx_products_is_active on public.products(is_active);

-- Product Variants
create index if not exists idx_product_variants_product_id on public.product_variants(product_id);
create index if not exists idx_product_variants_stock on public.product_variants(stock_quantity);

-- Orders
create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created_at on public.orders(created_at desc);

-- Transactions
create index if not exists idx_transactions_user_id on public.transactions(user_id);
create index if not exists idx_transactions_status on public.transactions(status);
create index if not exists idx_transactions_type on public.transactions(type);
create index if not exists idx_transactions_created_at on public.transactions(created_at desc);

-- Reviews
create index if not exists idx_reviews_product_id on public.reviews(product_id);
create index if not exists idx_reviews_user_id on public.reviews(user_id);

-- Favorites
create index if not exists idx_favorites_user_id on public.favorites(user_id);
create index if not exists idx_favorites_product_id on public.favorites(product_id);

-- ==========================================
-- 14. STORAGE SETUP
-- ==========================================

-- Create products bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

-- Storage RLS Policies
-- To use RLS, ensure the bucket has it enabled in the dashboard.
-- Note: storage.objects RLS policies

-- 1. Public Read Access
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'products' );

-- 2. Admin Management (Upload, Update, Delete)
create policy "Admin Management"
on storage.objects for all
using (
  bucket_id = 'products' 
  AND (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
)
with check (
  bucket_id = 'products' 
  AND (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
);

-- ==========================================
-- COMPLETION MESSAGE
-- ==========================================
-- ... (rest of the completion message)

