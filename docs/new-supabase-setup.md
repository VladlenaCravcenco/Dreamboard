# New Dreamboard backend

Project: `tbtzzpnshhsmpvyjjiyf`
URL: `https://tbtzzpnshhsmpvyjjiyf.supabase.co`

The public browser config now points to this project. Existing browser caches and sessions for the old project have not been erased or migrated.

## Required dashboard steps

1. Run `supabase/setup-new-project.sql` in the new project's SQL Editor. It installs the repository migrations in one transaction, including explicit grants and per-user RLS policies. Alternatively apply the migrations using the Supabase CLI; do not run both workflows unless migration history is reconciled.
2. Google Cloud OAuth client: set the authorized redirect URI to `https://tbtzzpnshhsmpvyjjiyf.supabase.co/auth/v1/callback`. Use the replacement secret if the original was disclosed.
3. Supabase Authentication → Google: enable the provider and enter the Google client ID and secret directly in the dashboard.
4. Supabase Authentication → URL Configuration: set the deployed Site URL when known; allow `http://localhost:5185/` and `http://localhost:5185/reset-password` for local testing, plus deployed equivalents.
5. If Google OAuth remains in testing, add the intended Google account as a test user.
6. Deploy the existing account backend with `supabase functions deploy make-server-92c819cc --project-ref tbtzzpnshhsmpvyjjiyf` from an authenticated CLI. The config specifies the existing server entrypoint. Account deletion requires this function and must be tested with a disposable account. No service-role key belongs in browser code.

## Verification

The public auth settings endpoint accepted the supplied publishable key. At connection time Google was disabled and the dreams table was absent. After setup, verify two test users cannot read or modify each other's dreams, refresh persists edits, and account deletion removes the correct user and their data. Browser requests now send the publishable key in `apikey` and the signed-in user's JWT in `Authorization`.
