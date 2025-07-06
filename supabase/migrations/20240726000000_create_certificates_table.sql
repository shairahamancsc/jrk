
-- Create the certificates table
create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  payload jsonb,
  pdf_url text,
  created_at timestamptz default current_timestamp
);

-- Add comments to the table and columns
comment on table public.certificates is 'Stores generated completion certificates.';
comment on column public.certificates.id is 'Unique identifier for the certificate.';
comment on column public.certificates.user_id is 'The user who generated the certificate.';
comment on column public.certificates.payload is 'The JSON data used to generate the certificate.';
comment on column public.certificates.pdf_url is 'Public URL to the generated PDF in Supabase Storage.';
comment on column public.certificates.created_at is 'Timestamp of when the certificate was created.';

-- Enable Row Level Security
alter table public.certificates enable row level security;

-- Create RLS policies
create policy "Users can read their own certificates" 
  on public.certificates for select 
  using (auth.uid() = user_id);

create policy "Users can insert their own certificates" 
  on public.certificates for insert 
  with check (auth.uid() = user_id);

-- Note: Update and Delete policies are omitted as per the initial request scope.
-- If needed, they can be added here.
-- create policy "Users can update their own certificates" on public.certificates for update using (auth.uid() = user_id);
-- create policy "Users can delete their own certificates" on public.certificates for delete using (auth.uid() = user_id);


-- Create the storage bucket for certificates
-- Note: This SQL is for reference. Bucket creation is typically done via the Supabase UI.
-- You need to create a bucket named 'certificates' and set it to public.
-- The RLS policies below are for securing access to the objects within the bucket.

-- insert into storage.buckets (id, name, public)
-- values ('certificates', 'certificates', true);

-- RLS for Storage: Users can only manage files in their own folder (named after their user_id)
-- create policy "Users can view their own certificate files"
--   on storage.objects for select
--   using ( auth.uid()::text = (storage.foldername(name))[1] );

-- create policy "Users can upload certificate files to their folder"
--   on storage.objects for insert
--   with check ( auth.uid()::text = (storage.foldername(name))[1] );
