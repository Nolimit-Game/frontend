```markdown
# Mall Quest — PWA Gamified Scavenger Hunt (QR Code Edition)

## 1. Executive Summary & Overview
**Mall Quest** is a lightweight, zero-install Progressive Web App (PWA) built for a retail clothing store grand opening. 

Shoppers scan a promotional QR code outside the store to launch the app directly in their mobile web browser. To earn an exclusive discount voucher, players solve interactive clues that guide them across 5 to 7 physical locations throughout the mall. At each location, they locate a physical placard and scan a unique **QR code** in a strict, predefined sequence to unlock the next clue.

### Primary Goals
1. **Zero Friction:** Runs directly in standard mobile browsers (iOS Safari & Android Chrome) via camera QR scanning—no App Store download required.
2. **Strict Sequence Verification:** Enforces scanning in exact order ($1 \rightarrow 2 \rightarrow 3 \rightarrow \dots$) to prevent cheating or skipping checkpoints.
3. **Lead Capture:** Collects participant name, phone number, and optional email during onboarding.
4. **Instant Redemption:** Issues a single-use voucher code upon final completion for in-store cashier verification.

---

## 2. Tech Stack & Infrastructure

- **Frontend:** Next.js (App Router), React, Tailwind CSS, Framer Motion.
- **UI & Animation:** Lucide Icons, `canvas-confetti` (for victory screen).
- **QR Scanning Engine:** `html5-qrcode` or `@zxing/library` (In-browser camera QR code reader).
- **Backend & Database:** Supabase (PostgreSQL, Stored Procedures/RPC, RLS Policies).
- **Hosting:** Vercel (Frontend) + Supabase Free Tier (Database).
- **Hardware:** Physical placards with high-visibility printed QR codes placed around the mall.

---

## 3. Core User Experience & System Workflow


```

[ Promo QR Poster ] ──> [ Onboarding / Lead Form ] ──> [ Active Quest Page ]
│
[ Store Cashier Screen ] <── [ Unlocks Voucher ] <── [ Scans Checkpoint QR ]

```

1. **Onboarding (`/`):** Player submits Name, Phone Number, and optional Email. Session ID (`player_id`) is persisted in browser `localStorage`.
2. **Active Quest (`/quest`):** Player views their active clue and total progress. Tapping "Scan Checkpoint QR" opens an in-app camera modal.
3. **QR Code Scanning Mechanics:**
   - **In-App Scanner:** The user opens the camera modal within the PWA to scan the checkpoint QR code.
   - **Native Camera Scanning:** Alternatively, if a user opens their standard phone camera and scans the QR code placard, the QR code redirects them to `https://quest.app/scan?token=SECRET`, which processes the step and returns them to `/quest`.
4. **Scan Processing (`/scan?token=SECRET`):** App extracts `token` and calls the atomic Supabase RPC function `process_qr_scan(player_id, qr_secret)`.
   - **Correct QR:** Unlocks next clue and advances `current_step`.
   - **Wrong Order / Invalid QR:** Displays error modal with a reminder to follow the active clue.
5. **Completion (`/voucher`):** Upon completing the final step, the app displays a single-use voucher code with a barcode/QR display.
6. **Redemption (`/cashier` or inline modal):** Cashier inputs a 4-digit PIN to mark `is_redeemed = true`.

---

## 4. Database Schema (Supabase PostgreSQL)

Execute the following SQL script in the Supabase SQL Editor:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. CHECKPOINTS (Static Configuration)
create table public.checkpoints (
  id uuid primary key default uuid_generate_v4(),
  sequence_order int not null unique,        -- Order: 1, 2, 3, 4, 5
  qr_secret text not null unique,             -- Encoded token inside QR code URL (e.g., "qr_sec_99a")
  title text not null,                        -- Internal name (e.g., "Level 2 Fountain")
  clue_text text not null,                    -- Riddle guiding player to THIS checkpoint
  created_at timestamptz default now()
);

-- 2. PLAYERS (User Sessions & Progress)
create table public.players (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  phone_number text not null unique,          -- Unique constraint prevents re-registration
  email text,
  current_step int not null default 1,        -- Active step player is searching for
  is_completed boolean not null default false,
  voucher_code text unique,                   -- Generated upon completing final step
  is_redeemed boolean not null default false,  -- Staff redemption status
  redeemed_at timestamptz,
  created_at timestamptz default now()
);

-- 3. SCAN LOGS (Audit Trail)
create table public.scan_logs (
  id uuid primary key default uuid_generate_v4(),
  player_id uuid not null references public.players(id) on delete cascade,
  checkpoint_id uuid not null references public.checkpoints(id),
  scanned_step int not null,
  created_at timestamptz default now()
);

-- Indexes
create index idx_players_phone on public.players(phone_number);
create index idx_checkpoints_secret on public.checkpoints(qr_secret);

```

---

## 5. Backend Logic: Stored Procedures (RPC)

### Game Engine Logic (`process_qr_scan`)

```sql
create or replace function public.process_qr_scan(
  p_player_id uuid,
  p_qr_secret text
)
returns jsonb
language plpgsql
security definer
as $$ declare   v_player record;   v_checkpoint record;   v_total_steps int;   v_voucher text;   v_next_clue text; begin   -- 1. Fetch Player   select * into v_player from public.players where id = p_player_id;   if not found then     return jsonb_build_object('success', false, 'error_code', 'PLAYER_NOT_FOUND', 'message', 'Player session not found.');   end if;    -- 2. Handle Already Completed State   if v_player.is_completed then     return jsonb_build_object(       'success', true,        'completed', true,        'voucher_code', v_player.voucher_code,       'message', 'You have already completed the quest!'     );   end if;    -- 3. Fetch Checkpoint by QR Secret   select * into v_checkpoint from public.checkpoints where qr_secret = p_qr_secret;   if not found then     return jsonb_build_object('success', false, 'error_code', 'INVALID_QR', 'message', 'Unrecognized QR code scanned.');   end if;    -- 4. Check Sequence Order Match   if v_checkpoint.sequence_order != v_player.current_step then     return jsonb_build_object(       'success', false,        'error_code', 'OUT_OF_SEQUENCE',       'message', 'Wrong checkpoint! Follow your active clue.',       'expected_step', v_player.current_step     );   end if;    -- 5. Log Valid Scan   insert into public.scan_logs (player_id, checkpoint_id, scanned_step)   values (v_player.id, v_checkpoint.id, v_player.current_step);    -- 6. Check Total Steps Count   select count(*) into v_total_steps from public.checkpoints;    -- 7. Logic for Final Checkpoint   if v_player.current_step >= v_total_steps then     v_voucher := 'MQ-' \vert{}\vert{} upper(substring(md5(random()::text) from 1 for 6));      update public.players      set is_completed = true,          voucher_code = v_voucher      where id = v_player.id;      return jsonb_build_object(       'success', true,       'completed', true,       'voucher_code', v_voucher,       'message', 'Quest Completed! Show this voucher at the counter.'     );      -- 8. Logic for Intermediate Checkpoints   else     select clue_text into v_next_clue      from public.checkpoints      where sequence_order = v_player.current_step + 1;      update public.players      set current_step = v_player.current_step + 1      where id = v_player.id;      return jsonb_build_object(       'success', true,       'completed', false,       'next_step', v_player.current_step + 1,       'next_clue', v_next_clue,       'message', 'Correct! Next clue unlocked.'     );   end if; end; $$;

```

### Cashier Redemption Function (`redeem_voucher`)

```sql
create or replace function public.redeem_voucher(
  p_voucher_code text,
  p_pin text
)
returns jsonb
language plpgsql
security definer
as $$ declare   v_player record; begin   if p_pin != '1234' then -- Replace with store PIN logic     return jsonb_build_object('success', false, 'message', 'Invalid staff PIN.');   end if;    select * into v_player from public.players where voucher_code = upper(p_voucher_code);    if not found then     return jsonb_build_object('success', false, 'message', 'Voucher not found.');   end if;    if v_player.is_redeemed then     return jsonb_build_object('success', false, 'message', 'Voucher was already redeemed.');   end if;    update public.players    set is_redeemed = true, redeemed_at = now()    where id = v_player.id;    return jsonb_build_object('success', true, 'message', 'Voucher successfully redeemed!'); end; $$;

```

---

## 6. Security & Row-Level Security (RLS)

* Enable RLS on all tables.
* Public users can `SELECT` from `checkpoints` **excluding `qr_secret**` so users cannot inspect network requests to preview hidden tokens.
* Players can only update/view their own records matching the `player_id` stored in `localStorage`.
* All sequence updates MUST be executed through `process_qr_scan` (`SECURITY DEFINER`).

---

## 7. Implementation Checklist

* [ ] **Step 1:** Initialize Next.js project with Tailwind CSS, Lucide Icons, and `@supabase/supabase-js`.
* [ ] **Step 2:** Run SQL schema and RPC function setup in Supabase SQL Editor.
* [ ] **Step 3:** Build onboarding page (`/`) with registration form and `localStorage` session handling.
* [ ] **Step 4:** Build active quest page (`/quest`) displaying current step, progress bar, and active riddle card.
* [ ] **Step 5:** Implement camera QR scanner modal using `html5-qrcode`.
* [ ] **Step 6:** Build URL redirect handler (`/scan?token=SECRET`) for native camera app scans.
* [ ] **Step 7:** Create victory screen (`/voucher`) with confetti animation and generated voucher display.
* [ ] **Step 8:** Build staff cashier redemption UI (`/cashier`) with PIN entry.
