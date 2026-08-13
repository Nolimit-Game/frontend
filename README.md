# NoLimit frontend

Next.js App Router starter for a NoLimit clothing-store scavenger hunt. It includes a mobile-first mission pass and Supabase email OTP authentication.

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and add the Supabase project URL and anon key.
3. Add the supplied brand image at `public/logo.png`.
4. Start the development server with `npm run dev`.

The login form uses `supabase.auth.signInWithOtp` and `supabase.auth.verifyOtp` for email-only passwordless login.

## Supabase CLI setup

The CLI is used through `npx`, so it does not need to be installed globally:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Get `YOUR_PROJECT_REF` from the Supabase project URL: it is the subdomain in `https://YOUR_PROJECT_REF.supabase.co`. The login command asks for a Supabase access token. Create one from your Supabase account settings; do not put it in this repository or in `.env.local`.

The migration creates `checkpoints`, `players`, and `scan_logs`, enables RLS, creates a new-user trigger, and adds the quest RPC functions. Do not run the SQL manually if `npx supabase db push` succeeds.

## Environment values

Copy `.env.example` to `.env.local` and fill in:

```text
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Find both values in Supabase Project Settings > API. Only the publishable/anon key belongs in this frontend. Never expose a `service_role` key in Next.js client code, `.env.example`, Git, or a browser.

## Free email OTP setup

For development, use Supabase's built-in email provider. In Authentication > Providers > Email, enable Email and enable Email OTP. In Authentication > Email Templates, edit the Magic Link template so it includes `{{ .Token }}`. The application uses the six-digit token template, not the magic-link URL.

Supabase's default SMTP is suitable for testing but has strict sending limits and may only deliver to project team addresses. For a public launch, configure a free-tier transactional provider such as Resend under Project Settings > Auth > SMTP Settings. Add and verify a sending domain if the provider requires it, then use its SMTP host, port, username, password, and sender address in Supabase. Never put SMTP credentials in this frontend.

## QR prototype

The six test checkpoints are seeded by the `20260813000000_seed_checkpoints.sql` migration. The dashboard currently skips the email login screen and creates an anonymous test player so the existing authenticated scan RPC can still be used.

Before testing, enable **Anonymous Sign-Ins** in Supabase under Authentication > Providers. The local config has this enabled for local Supabase development.

Generate printable QR files after the migration has been pushed:

```bash
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
npm run generate:qrs
```

The script writes six SVG files to `public/generated-qrs`. The service role key is only for this local script and must never be exposed in browser code or committed.

Clicking the active clue on `/dashboard` opens the camera scanner. A successful scan calls the existing `process_qr_scan` RPC and loads the next clue.

## Previous setup and next steps

1. Run the CLI commands above after adding `.env.local`.
2. Configure the email provider and `{{ .Token }}` template.
3. Add checkpoint rows through the Supabase SQL editor or a future seed migration. Each `qr_secret` should be a long random value and should never be exposed to public client queries.
4. Build `/quest` around `supabase.rpc('get_current_quest')`.
5. Add a QR scanner and call `supabase.rpc('process_qr_scan', { p_qr_secret: scannedSecret })`.
6. Replace the placeholder dashboard with the clue, voucher, and cashier flows described in `PROJECT_DOCUMENTATION.md`.
