-- Sonar Audit — Supabase Schema
-- Run this in the Supabase SQL editor to set up the database.

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Audits table: stores every completed audit
create table if not exists audits (
  id text primary key,
  created_at timestamptz default now() not null,
  contract_code text not null,
  contract_address text,
  score integer not null check (score >= 0 and score <= 100),
  findings jsonb not null default '[]'::jsonb,
  summary text,
  source text default 'paste' check (source in ('paste', 'etherscan'))
);

-- Index for listing recent audits
create index if not exists idx_audits_created_at on audits (created_at desc);

-- Row Level Security
alter table audits enable row level security;

-- Public read access (for shareable links)
create policy "Public read access" on audits
  for select using (true);

-- Insert via service role or anon with insert
create policy "Anon insert access" on audits
  for insert with check (true);
