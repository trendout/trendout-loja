-- ============================================================
-- TRENDOUT STORE — Supabase schema
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------
-- ADMIN ROLE (Supabase Auth) — tabela de perfil ligada a auth.users
-- Criada logo no início porque várias políticas RLS mais abaixo
-- referenciam esta tabela.
-- ---------------------------------------------------------------
create table if not exists admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'admin', -- 'admin' | 'staff'
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------
-- PRODUCTS
-- ---------------------------------------------------------------
-- ---------------------------------------------------------------
-- CATEGORIES (categorias e subcategorias geridas no backoffice)
-- ---------------------------------------------------------------
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  parent_id uuid references categories(id) on delete cascade, -- null = categoria de topo (menu)
  position int not null default 0,
  created_at timestamptz default now()
);

create index if not exists idx_categories_parent on categories(parent_id);

create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  reference text,                   -- 'TRD-TS-0142' (visível como "Ref." na ficha de produto)
  brand text,                        -- 'Trendout' | 'Anidriz' | 'REPX' | 'RSB' (marca distribuída pela RSC)
  ean text,                          -- código de barras base (se o produto não tiver variantes com EAN próprio)
  description text,
  weight_grams int,                 -- peso para cálculo de portes/transportadora
  top_category_id uuid references categories(id),
  category_id uuid references categories(id),
  top_category text not null,       -- desnormalizado para leitura rápida na loja: 'Vestuário'...
  category text not null,           -- desnormalizado: 'T-shirts técnicas'...
  base_price numeric(10,2) not null,
  compare_at_price numeric(10,2),   -- preço riscado, se em promoção (ex: €24.90 → €22.41)
  coupon_code text,                 -- cupão em destaque na ficha do produto (ex: 'TREINO10')
  availability text not null default 'available', -- 'available' | 'unavailable' | 'out_of_stock'
  features jsonb default '[]'::jsonb, -- lista de bullets: composição, corte, lavagem, produção
  images jsonb default '[]'::jsonb, -- array of Supabase Storage URLs
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_products_category on products(category);
create index if not exists idx_products_active on products(is_active);

-- ---------------------------------------------------------------
-- PRODUCT VARIANTS (size / color combinations, individual stock)
-- ---------------------------------------------------------------
create table if not exists product_variants (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade,
  size text,                        -- 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | null
  color text,                       -- 'Bege Areia', 'Preto', etc. — null if not applicable
  sku text unique not null,
  ean text,                         -- código de barras específico desta variante (tamanho/cor)
  price_override numeric(10,2),     -- null = use products.base_price
  stock integer not null default 0,
  sold_recently integer default 0,  -- para o selo "vendidas X unidades nos últimos minutos"
  created_at timestamptz default now()
);

create index if not exists idx_variants_product on product_variants(product_id);
create unique index if not exists idx_variants_unique on product_variants(product_id, size, color);

-- ---------------------------------------------------------------
-- SHIPPING RATES (simulador de portes por país, igual ao checkout)
-- ---------------------------------------------------------------
create table if not exists shipping_rates (
  id uuid primary key default uuid_generate_v4(),
  country_code text unique not null,  -- 'PT' | 'PT-ILHAS' | 'ES' | 'FR' | 'DE' | 'EU' | 'ROW'
  label text not null,
  standard_price numeric(10,2) not null,
  express_price numeric(10,2) not null,
  standard_eta text not null,          -- '2-4 dias úteis'
  express_eta text not null,           -- '1-2 dias úteis'
  free_eligible boolean default false, -- se o standard pode ficar grátis acima do limiar
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------
-- COUPONS
-- ---------------------------------------------------------------
create table if not exists coupons (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,          -- 'TREINO10', 'BEMVINDO5'
  type text not null,                 -- 'percent' | 'fixed'
  value numeric(10,2) not null,
  label text,                         -- '10% de desconto'
  product_id uuid references products(id), -- null = aplicável a toda a loja
  active boolean default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------
-- STORE SETTINGS (linha única com a configuração da loja)
-- ---------------------------------------------------------------
create table if not exists store_settings (
  id int primary key default 1,
  store_name text not null default 'Trendout Store',
  domain text not null default 'loja.trendout.pt',
  currency text not null default 'EUR',
  free_shipping_threshold numeric(10,2) not null default 40,
  company_address text,
  company_phone text,
  company_email text,
  company_nif text,
  show_company_info_footer boolean not null default true,
  analytics_scripts text,            -- HTML/JS bruto (Google Analytics, Meta Pixel, etc.) injetado em todas as páginas
  payment_methods_accepted jsonb default '["visa","mastercard","amex","transfer"]'::jsonb,
  theme jsonb default '{"accentColor":"#c9ff3f","bgColor":"#0f1210","textColor":"#eef0ec","headingFont":"Bebas Neue","bodyFont":"Inter"}'::jsonb,
  constraint single_row check (id = 1)
);

insert into store_settings (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------
-- ---------------------------------------------------------------
-- COLLECTIONS (coleções curadas: "Novidades", "Mais vendidos"...)
-- ---------------------------------------------------------------
create table if not exists collections (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  description text,
  image text,
  is_active boolean default true,
  position int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists collection_products (
  id uuid primary key default uuid_generate_v4(),
  collection_id uuid references collections(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  position int not null default 0,
  unique (collection_id, product_id)
);

create index if not exists idx_collection_products_collection on collection_products(collection_id);

-- ---------------------------------------------------------------
-- NAVIGATION / MENUS (menu principal, colunas do rodapé, etc.)
-- ---------------------------------------------------------------
create table if not exists menus (
  id uuid primary key default uuid_generate_v4(),
  key text unique not null,
  label text not null,
  created_at timestamptz default now()
);

create table if not exists menu_items (
  id uuid primary key default uuid_generate_v4(),
  menu_id uuid references menus(id) on delete cascade,
  parent_id uuid references menu_items(id) on delete cascade,
  label text not null,
  link_type text not null default 'custom',
  category text,
  collection_id uuid references collections(id),
  custom_url text,
  position int not null default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

create index if not exists idx_menu_items_menu on menu_items(menu_id);
create index if not exists idx_menu_items_position on menu_items(menu_id, position);

-- ---------------------------------------------------------------
-- PAGES (construtor de páginas -- conteúdo institucional/legal)
-- ---------------------------------------------------------------
create table if not exists pages (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text unique not null,
  content text,
  featured_image text,
  meta_description text,
  status text not null default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_pages_status on pages(status);

-- ---------------------------------------------------------------
-- VISITOR SESSIONS (analytics em tempo real)
-- Alimentada por um heartbeat enviado pelo frontoffice a cada ~10s
-- ---------------------------------------------------------------
create table if not exists visitor_sessions (
  id uuid primary key default uuid_generate_v4(),
  session_id text unique not null,
  city text,
  country text,
  country_code text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  current_page text,
  page_title text,
  cart_status text default 'browsing',
  cart_value numeric(10,2),
  last_seen timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists idx_visitor_last_seen on visitor_sessions(last_seen desc);

alter table pages enable row level security;
alter table visitor_sessions enable row level security;

create policy "public read published pages" on pages for select using (status = 'published');
create policy "admin full access pages" on pages
  for all using (exists (select 1 from admin_profiles where id = auth.uid()));

create policy "public upsert own session" on visitor_sessions for insert with check (true);
create policy "public update own session" on visitor_sessions for update using (true);
create policy "admin read visitor sessions" on visitor_sessions
  for select using (exists (select 1 from admin_profiles where id = auth.uid()));

create or replace function purge_stale_sessions()
returns void as $$
begin
  delete from visitor_sessions where last_seen < now() - interval '5 minutes';
end;
$$ language plpgsql;

-- ---------------------------------------------------------------
-- STORAGE — bucket "product-images" (criar manualmente em Storage -> New bucket,
-- marcado como público, antes de correr estas políticas)
-- ---------------------------------------------------------------
create policy "Public read product images"
on storage.objects for select
using (bucket_id = 'product-images');

create policy "Authenticated upload product images"
on storage.objects for insert
with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

create policy "Authenticated update product images"
on storage.objects for update
using (bucket_id = 'product-images' and auth.role() = 'authenticated');

create policy "Authenticated delete product images"
on storage.objects for delete
using (bucket_id = 'product-images' and auth.role() = 'authenticated');

-- ---------------------------------------------------------------
-- CUSTOMER ADDRESSES (moradas guardadas na conta do cliente,
-- reutilizaveis entre encomendas)
-- ---------------------------------------------------------------
create table if not exists customer_addresses (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references auth.users(id) on delete cascade not null,
  label text,
  full_name text not null,
  phone text,
  address_line1 text not null,
  postal_code text not null,
  city text not null,
  country text not null default 'Portugal',
  nif text,
  is_default_shipping boolean default false,
  is_default_billing boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_customer_addresses_customer on customer_addresses(customer_id);

alter table customer_addresses enable row level security;

create policy "customers manage own addresses" on customer_addresses
  for all using (customer_id = auth.uid());

-- SHIPPING ADDRESSES
--------------------------------------------------------------- 
create table if not exists shipping_addresses (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  phone text,
  email text,
  address_line1 text not null,
  address_line2 text,
  postal_code text not null,
  city text not null,
  country text not null default 'Portugal',
  nif text,                         -- optional tax number for invoicing
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------
-- ORDERS
-- ---------------------------------------------------------------
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text unique not null,      -- formato do site: 'TRD-00042'
  customer_email text not null,
  customer_name text,
  shipping_address_id uuid references shipping_addresses(id),
  shipping_country text,                  -- código usado no simulador: 'PT', 'ES', 'FR'...
  shipping_speed text default 'standard', -- 'standard' | 'express'
  status text not null default 'pending', -- 'pending' | 'confirmed' | 'production' | 'shipped' | 'delivered' | 'cancelled'
  payment_method text,                    -- 'card' | 'bank_transfer'
  payment_status text default 'unpaid',   -- 'unpaid' | 'paid' | 'refunded'
  card_last4 text,                        -- 'Cartão terminado em •••• 4242'
  stripe_session_id text,
  stripe_payment_intent_id text,
  coupon_code text,
  discount_amount numeric(10,2) not null default 0,
  customer_id uuid references auth.users(id), -- ligação à conta do cliente (opcional — compra como convidado se vazio)
  subtotal numeric(10,2) not null default 0,
  shipping_cost numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  estimated_delivery date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_email on orders(customer_email);
create index if not exists idx_orders_created on orders(created_at desc);

-- ---------------------------------------------------------------
-- ORDER ITEMS
-- ---------------------------------------------------------------
create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  variant_id uuid references product_variants(id),
  product_name text not null,       -- snapshot at time of purchase
  size text,
  color text,
  unit_price numeric(10,2) not null,
  quantity integer not null default 1,
  line_total numeric(10,2) not null
);

create index if not exists idx_order_items_order on order_items(order_id);

-- ---------------------------------------------------------------
-- RLS (Row Level Security)
-- ---------------------------------------------------------------
alter table products enable row level security;
alter table product_variants enable row level security;
alter table categories enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table shipping_addresses enable row level security;
alter table admin_profiles enable row level security;
alter table shipping_rates enable row level security;
alter table coupons enable row level security;
alter table store_settings enable row level security;
alter table menus enable row level security;
alter table menu_items enable row level security;
alter table collections enable row level security;
alter table collection_products enable row level security;

-- Público (loja): pode ler menus ativos e coleções ativas
create policy "public read menus" on menus for select using (true);
create policy "public read menu items" on menu_items for select using (is_active = true);
create policy "public read active collections" on collections for select using (is_active = true);
create policy "public read collection products" on collection_products for select using (true);

-- Público (loja): pode ler tarifas de envio, cupões ativos e definições da loja
create policy "public read shipping rates" on shipping_rates for select using (true);
create policy "public read active coupons" on coupons for select using (active = true);
create policy "public read store settings" on store_settings for select using (true);

create policy "admin full access shipping rates" on shipping_rates
  for all using (exists (select 1 from admin_profiles where id = auth.uid()));
create policy "admin full access coupons" on coupons
  for all using (exists (select 1 from admin_profiles where id = auth.uid()));
create policy "admin full access store settings" on store_settings
  for all using (exists (select 1 from admin_profiles where id = auth.uid()));
create policy "admin full access menus" on menus
  for all using (exists (select 1 from admin_profiles where id = auth.uid()));
create policy "admin full access menu items" on menu_items
  for all using (exists (select 1 from admin_profiles where id = auth.uid()));
create policy "admin full access collections" on collections
  for all using (exists (select 1 from admin_profiles where id = auth.uid()));
create policy "admin full access collection products" on collection_products
  for all using (exists (select 1 from admin_profiles where id = auth.uid()));

-- Public (loja): pode ler produtos ativos e variantes
create policy "public read active products" on products
  for select using (is_active = true);

create policy "public read variants" on product_variants
  for select using (true);

create policy "public read categories" on categories for select using (true);
create policy "admin full access categories" on categories
  for all using (exists (select 1 from admin_profiles where id = auth.uid()));

-- Público pode criar encomendas (via checkout) e moradas
create policy "public insert shipping address" on shipping_addresses
  for insert with check (true);

create policy "public insert orders" on orders
  for insert with check (true);

create policy "customers read own orders" on orders
  for select using (
    customer_id = auth.uid()
    or customer_email = (auth.jwt() ->> 'email')
  );

create policy "public insert order items" on order_items
  for insert with check (true);

create policy "customers read own order items" on order_items
  for select using (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id
      and (o.customer_id = auth.uid() or o.customer_email = (auth.jwt() ->> 'email'))
    )
  );

-- Admin (autenticado + presente em admin_profiles): acesso total
create policy "admin full access products" on products
  for all using (exists (select 1 from admin_profiles where id = auth.uid()));

create policy "admin full access variants" on product_variants
  for all using (exists (select 1 from admin_profiles where id = auth.uid()));

create policy "admin full access orders" on orders
  for all using (exists (select 1 from admin_profiles where id = auth.uid()));

create policy "admin full access order items" on order_items
  for all using (exists (select 1 from admin_profiles where id = auth.uid()));

create policy "admin full access shipping" on shipping_addresses
  for all using (exists (select 1 from admin_profiles where id = auth.uid()));

create policy "admin read own profile" on admin_profiles
  for select using (id = auth.uid());

-- ---------------------------------------------------------------
-- TRIGGER: decrementar stock automaticamente ao inserir order_items
-- (chamado a partir do webhook do Stripe após pagamento confirmado)
-- ---------------------------------------------------------------
create or replace function decrement_variant_stock()
returns trigger as $$
begin
  update product_variants
  set stock = stock - new.quantity
  where id = new.variant_id;
  return new;
end;
$$ language plpgsql;

create trigger trg_decrement_stock
  after insert on order_items
  for each row execute function decrement_variant_stock();

-- ---------------------------------------------------------------
-- TRIGGER: updated_at automático
-- ---------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_products_updated_at before update on products
  for each row execute function set_updated_at();

create trigger trg_orders_updated_at before update on orders
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------
-- SEED: tarifas de envio e cupões (valores usados no protótipo do checkout)
-- ---------------------------------------------------------------
insert into shipping_rates (country_code, label, standard_price, express_price, standard_eta, express_eta, free_eligible) values
  ('PT',       'Portugal (Continente)',        3.90,  6.90, '2-4 dias úteis', '1-2 dias úteis', true),
  ('PT-ILHAS', 'Portugal (Açores / Madeira)',  6.90, 11.90, '4-7 dias úteis', '2-3 dias úteis', true),
  ('ES',       'Espanha',                       5.90,  9.90, '3-5 dias úteis', '2-3 dias úteis', true),
  ('FR',       'França',                        7.90, 12.90, '4-6 dias úteis', '3-4 dias úteis', false),
  ('DE',       'Alemanha',                      7.90, 12.90, '4-6 dias úteis', '3-4 dias úteis', false),
  ('EU',       'Outro país da UE',              8.90, 13.90, '5-7 dias úteis', '3-5 dias úteis', false),
  ('ROW',      'Resto do mundo',               14.90, 22.90, '7-14 dias úteis','5-8 dias úteis', false)
on conflict (country_code) do nothing;

insert into coupons (code, type, value, label) values
  ('TREINO10',  'percent', 10, '10% de desconto'),
  ('BEMVINDO5', 'fixed',    5, '5€ de desconto')
on conflict (code) do nothing;

-- ---------------------------------------------------------------
-- SEED: menus (estrutura vista na homepage) e coleções base
-- ---------------------------------------------------------------
insert into menus (key, label) values
  ('main_nav', 'Menu principal'),
  ('footer_loja', 'Rodapé — Loja'),
  ('footer_ajuda', 'Rodapé — Ajuda'),
  ('footer_legal', 'Rodapé — Legal')
on conflict (key) do nothing;

insert into menu_items (menu_id, label, link_type, category, position)
select id, v.label, 'category', v.category, v.position
from menus, (values
  ('Vestuário', 'Vestuário', 1),
  ('Garrafas & Acessórios', 'Garrafas & Acessórios', 2),
  ('Equipamento', 'Equipamento', 3),
  ('Outlet', 'Outlet', 4)
) as v(label, category, position)
where menus.key = 'footer_loja';

insert into menu_items (menu_id, label, link_type, custom_url, position)
select id, v.label, 'custom', v.url, v.position
from menus, (values
  ('Envios e prazos', '/ajuda/envios', 1),
  ('Trocas e devoluções', '/ajuda/trocas', 2),
  ('Guia de tamanhos', '/ajuda/tamanhos', 3),
  ('Contactos', '/ajuda/contactos', 4)
) as v(label, url, position)
where menus.key = 'footer_ajuda';

insert into menu_items (menu_id, label, link_type, custom_url, position)
select id, v.label, 'custom', v.url, v.position
from menus, (values
  ('Termos e condições', '/legal/termos', 1),
  ('Política de privacidade', '/legal/privacidade', 2),
  ('Política de cookies', '/legal/cookies', 3),
  ('Livro de reclamações', '/legal/reclamacoes', 4)
) as v(label, url, position)
where menus.key = 'footer_legal';

insert into collections (name, slug, description, position) values
  ('Novidades', 'novidades', 'Os lançamentos mais recentes da Trendout.', 1),
  ('Mais vendidos', 'mais-vendidos', 'As peças preferidas da comunidade Trendout.', 2)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------
-- SEED: categorias (topo = menu principal, subcategorias = breadcrumb)
-- ---------------------------------------------------------------
insert into categories (name, slug, parent_id, position) values
  ('Vestuário', 'vestuario', null, 1),
  ('Garrafas & Acessórios', 'garrafas-acessorios', null, 2),
  ('Equipamento', 'equipamento', null, 3),
  ('Outlet', 'outlet', null, 4)
on conflict (slug) do nothing;

insert into categories (name, slug, parent_id, position)
select v.name, v.slug, c.id, v.position
from categories c, (values
  ('Treino', 'treino', 1),
  ('Running', 'running', 2),
  ('T-shirts técnicas', 't-shirts-tecnicas', 3),
  ('Sweatshirts', 'sweatshirts', 4),
  ('Leggings', 'leggings', 5)
) as v(name, slug, position)
where c.slug = 'vestuario'
on conflict (slug) do nothing;
