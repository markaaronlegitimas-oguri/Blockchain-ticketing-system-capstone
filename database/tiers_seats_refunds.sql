-- Tiered pricing, seat numbers and event cancellation (contract v2)
alter table public.slots   add column if not exists tier smallint;      -- 0 General, 1 Premium, 2 VIP
alter table public.tickets add column if not exists tier smallint;
alter table public.tickets add column if not exists seat int;
alter table public.tickets add column if not exists seat_label text;    -- e.g. VIP-07
alter table public.tickets add column if not exists purchase_tx text;   -- hash of the purchase transaction
alter table public.events  add column if not exists cancelled_at timestamptz;