-- In-app notifications (objective 1h). Run once in the Supabase SQL editor.
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null,            -- ticket_confirmation | check_in | transfer | event_reminder | schedule_update
  title text not null,
  message text not null,
  dedupe_key text unique,        -- stops an automated reminder from being sent twice
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on notifications (user_id, created_at desc);

-- The backend reads and writes this table with its server key.
alter table notifications disable row level security;
