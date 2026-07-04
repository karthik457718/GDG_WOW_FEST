-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query)

create table if not exists incidents (
  id text primary key,
  dept text not null,
  lat double precision not null,
  lng double precision not null,
  count int not null default 1,
  urgent boolean not null default false,
  priority smallint not null default 1,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists complaints (
  id text primary key,
  incident_id text references incidents(id),
  text text not null,
  dept text not null,
  lat double precision not null,
  lng double precision not null,
  photo boolean default false,
  voice boolean default false,
  priority smallint not null,
  status smallint not null default 0,  -- 0 filed, 1 assigned, 2 in progress, 3 resolved
  created_at timestamptz not null default now()
);

create table if not exists users (
  username   text primary key,
  email      text unique not null,
  password   text not null,
  token      text,
  verified   boolean default true,
  created_at double precision,
  last_login double precision
);

create table if not exists otps (
  key        text primary key,
  otp        text not null,
  expires_at double precision not null
);

create index if not exists idx_incidents_dept_status on incidents (dept, status);
create index if not exists idx_complaints_incident on complaints (incident_id);
create index if not exists idx_users_email on users (email);

-- Row Level Security: enable + open read for demo purposes.
-- Tighten this before any real deployment beyond a hackathon.
alter table incidents enable row level security;
alter table complaints enable row level security;
alter table users enable row level security;
alter table otps enable row level security;

create policy "public read incidents" on incidents for select using (true);
create policy "public read complaints" on complaints for select using (true);
create policy "public insert complaints" on complaints for insert with check (true);
create policy "public insert incidents" on incidents for insert with check (true);
create policy "public update incidents" on incidents for update using (true);

create policy "public read users" on users for select using (true);
create policy "public insert users" on users for insert with check (true);
create policy "public update users" on users for update using (true);

create policy "public read otps" on otps for select using (true);
create policy "public insert otps" on otps for insert with check (true);
create policy "public update otps" on otps for update using (true);
create policy "public delete otps" on otps for delete using (true);

