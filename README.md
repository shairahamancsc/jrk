
# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.
# jrk

## Certificate Generation Feature

This application includes a module for generating "Completion Certificate" PDFs from a form.

### Required Environment Variables

To enable the certificate generation and storage functionality, you must add the following environment variable to your Vercel project's settings:

- `SUPABASE_SERVICE_ROLE_KEY`: This is your Supabase project's service role key. It is required for the backend to upload the generated PDFs to Supabase Storage. You can find this in your Supabase dashboard under `Project Settings` > `API`.

### Required Supabase Setup

1.  **Run Migrations:** A new table `certificates` is required. If you are developing locally with the Supabase CLI, this will be handled automatically. For a hosted Supabase project, you will need to run the migration located at `supabase/migrations/20240726000000_create_certificates_table.sql` in the Supabase SQL Editor.
2.  **Create Storage Bucket:** You must manually create a new Storage bucket in your Supabase project named `certificates`. Ensure that the "Public bucket" option is **checked**.
