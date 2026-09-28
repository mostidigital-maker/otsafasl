# Occupational Therapy Clinic – Website & CRM

Public booking website plus an admin CRM (patients, appointments, treatments, payments, insurance, reminders).

**Stack:** Vite, React, TypeScript, Tailwind, shadcn/ui, Supabase (Postgres, Auth, Storage, Edge Functions). Deployed on Vercel.

## Local development
```sh
npm install
cp .env.example .env   # fill in your Supabase values
npm run dev
```

## Environment variables
`VITE_SUPABASE_URL`, `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key only – never commit the service_role key).

## Database
SQL migrations live in `supabase/migrations`. Apply them with `supabase db push`.

## Edge Functions
`supabase/functions/notify-appointment`, `supabase/functions/send-appointment-reminders`.
Secrets required: `RESEND_API_KEY`, `NOTIFY_FROM_EMAIL`, `NOTIFY_FROM_NAME`.
