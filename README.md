# NoLimit frontend

Next.js App Router starter for a NoLimit clothing-store scavenger hunt. It includes a mobile-first mission pass and Supabase OTP delivery scaffolding.

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and add the Supabase project URL and anon key.
3. Add the supplied brand image at `public/logo.png`.
4. Start the development server with `npm run dev`.

The login form uses `supabase.auth.signInWithOtp` for either a phone number or email address. Supabase phone/email providers must be enabled in the project dashboard.

## Demo verification

Until production verification is wired up, the form accepts `123456` as a temporary demo OTP and creates a browser-only demo session. This is intentionally not secure and must be replaced with `supabase.auth.verifyOtp` before launch.
