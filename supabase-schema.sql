-- Petron Creative Studio — Schema
-- Execute este SQL no Supabase SQL Editor

-- Clientes
create table if not exists clients (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  segment text,
  cnpj text,
  contact text,
  address text,
  whatsapp_link text,
  created_at timestamptz default now()
);

-- Configuração de marca (cores, fontes, logo)
create table if not exists brand_configs (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) on delete cascade not null,
  logo_url text,
  colors jsonb default '[]'::jsonb,
  fonts jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Produtos
create table if not exists products (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) on delete cascade,
  name text not null,
  description text,
  category text,
  brand text,
  image_url text,
  image_treated_url text,
  created_at timestamptz default now()
);

-- Promoções
create table if not exists promotions (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) on delete cascade,
  name text not null,
  start_date date,
  end_date date,
  subtitle text,
  seal_url text,
  created_at timestamptz default now()
);

-- Itens da promoção (produtos com preço)
create table if not exists promotion_items (
  id uuid default gen_random_uuid() primary key,
  promotion_id uuid references promotions(id) on delete cascade not null,
  product_name text not null,
  price_type text not null,
  price numeric(10,2) not null,
  previous_price numeric(10,2),
  unit text,
  payment_condition text,
  created_at timestamptz default now()
);

-- Criativos gerados
create table if not exists creatives (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) on delete cascade,
  promotion_id uuid references promotions(id) on delete set null,
  format text,
  image_url text,
  created_at timestamptz default now()
);

-- RLS: desabilitar por enquanto (uso interno)
alter table clients enable row level security;
alter table brand_configs enable row level security;
alter table products enable row level security;
alter table promotions enable row level security;
alter table promotion_items enable row level security;
alter table creatives enable row level security;

-- Policies: permitir tudo (uso interno da agência)
create policy "Allow all on clients" on clients for all using (true) with check (true);
create policy "Allow all on brand_configs" on brand_configs for all using (true) with check (true);
create policy "Allow all on products" on products for all using (true) with check (true);
create policy "Allow all on promotions" on promotions for all using (true) with check (true);
create policy "Allow all on promotion_items" on promotion_items for all using (true) with check (true);
create policy "Allow all on creatives" on creatives for all using (true) with check (true);

-- Storage buckets
insert into storage.buckets (id, name, public) values ('logos', 'logos', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('products', 'products', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('seals', 'seals', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('creatives', 'creatives', true) on conflict do nothing;

-- Storage policies: permitir tudo (uso interno)
create policy "Allow public read logos" on storage.objects for select using (bucket_id = 'logos');
create policy "Allow upload logos" on storage.objects for insert with check (bucket_id = 'logos');
create policy "Allow public read products" on storage.objects for select using (bucket_id = 'products');
create policy "Allow upload products" on storage.objects for insert with check (bucket_id = 'products');
create policy "Allow public read seals" on storage.objects for select using (bucket_id = 'seals');
create policy "Allow upload seals" on storage.objects for insert with check (bucket_id = 'seals');
create policy "Allow public read creatives" on storage.objects for select using (bucket_id = 'creatives');
create policy "Allow upload creatives" on storage.objects for insert with check (bucket_id = 'creatives');
