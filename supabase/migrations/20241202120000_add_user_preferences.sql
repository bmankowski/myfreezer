/*
 * Migration: Add User Preferences Table
 * Purpose: Store user preferences including default shelf
 * Created: 2024-12-02 12:00:00 UTC
 * 
 * Tables Created:
 * - user_preferences: User's default shelf and other preferences
 *
 * Features:
 * - One-to-one relationship with auth.users
 * - Foreign key to shelves for default shelf
 * - RLS enabled for data isolation
 */

/*
 * user_preferences table
 * stores user preferences including default shelf
 * one-to-one relationship with auth.users
 */
create table user_preferences (
    user_id uuid primary key references auth.users(id) on delete cascade,
    default_shelf_id uuid references shelves(shelf_id) on delete set null,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);

/*
 * enable row level security on user_preferences table
 */
alter table user_preferences enable row level security;

/*
 * rls policies for user_preferences table
 * only authenticated users can access their own preferences
 */

-- authenticated users can select their own preferences
create policy "authenticated_users_select_own_preferences" on user_preferences
    for select
    to authenticated
    using (user_id = auth.uid());

-- authenticated users can insert their own preferences
create policy "authenticated_users_insert_own_preferences" on user_preferences
    for insert
    to authenticated
    with check (user_id = auth.uid());

-- authenticated users can update their own preferences
create policy "authenticated_users_update_own_preferences" on user_preferences
    for update
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

-- authenticated users can delete their own preferences
create policy "authenticated_users_delete_own_preferences" on user_preferences
    for delete
    to authenticated
    using (user_id = auth.uid());

/*
 * trigger to automatically update updated_at timestamp
 */
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_user_preferences_updated_at
    before update on user_preferences
    for each row
    execute function update_updated_at_column();

/*
 * migration completed successfully
 * 
 * created table: user_preferences
 * enabled rls: user_preferences protected with granular policies
 * added trigger: automatic updated_at timestamp
 * 
 * next steps:
 * - verify schema with sample data
 * - test rls policies with different user accounts
 */ 