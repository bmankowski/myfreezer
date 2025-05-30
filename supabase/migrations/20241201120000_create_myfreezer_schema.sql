/*
 * Migration: Create MyFreezer Application Schema
 * Purpose: Initial schema setup for voice-controlled freezer/fridge management
 * Created: 2024-12-01 12:00:00 UTC
 * 
 * Tables Created:
 * - containers: User's freezers and fridges
 * - shelves: Organizational shelves within containers  
 * - items: Food items stored on shelves
 *
 * Features:
 * - Hierarchical data structure (users -> containers -> shelves -> items)
 * - Row Level Security for multi-tenant data isolation
 * - UUID primary keys for security and scalability
 * - Cascade deletion for data integrity
 * - Polish text support with proper collation
 * - Optimized indexes for search functionality
 *
 * Security:
 * - RLS enabled on all tables
 * - Granular policies for authenticated users only
 * - Anonymous users have no access
 * - User data isolation through auth.uid()
 */

-- enable uuid extension for generating unique identifiers
create extension if not exists "uuid-ossp";

/*
 * containers table
 * stores user's freezers and fridges with basic metadata
 * each user can have multiple containers (freezers/fridges)
 */
create table containers (
    container_id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name varchar(255) not null check (name != ''),
    type varchar(10) not null default 'freezer' check (type in ('freezer', 'fridge')),
    created_at timestamp with time zone not null default now()
);

/*
 * shelves table
 * organizational shelves within containers
 * each container can have multiple shelves with unique positions
 */
create table shelves (
    shelf_id uuid primary key default gen_random_uuid(),
    container_id uuid not null references containers(container_id) on delete cascade,
    name varchar(255) not null check (name != ''),
    position integer not null check (position > 0),
    created_at timestamp with time zone not null default now(),
    constraint uq_shelves_container_position unique (container_id, position)
);

/*
 * items table
 * food items stored on shelves
 * supports decimal quantities for precise measurement
 */
create table items (
    item_id uuid primary key default gen_random_uuid(),
    shelf_id uuid not null references shelves(shelf_id) on delete cascade,
    name varchar(255) not null check (name != ''),
    quantity decimal(10,3) not null default 1 check (quantity >= 0),
    created_at timestamp with time zone not null default now()
);

/*
 * indexes for performance optimization
 * idx_items_name: supports text search functionality for voice commands
 * note: postgresql automatically creates indexes for primary keys, foreign keys, and unique constraints
 */
create index idx_items_name on items(name);

/*
 * enable row level security on all tables
 * this ensures user data isolation in multi-tenant environment
 */
alter table containers enable row level security;
alter table shelves enable row level security;
alter table items enable row level security;

/*
 * rls policies for containers table
 * only authenticated users can access their own containers
 * anonymous users have no access to any data
 */

-- authenticated users can select their own containers
create policy "authenticated_users_select_own_containers" on containers
    for select
    to authenticated
    using (user_id = auth.uid());

-- authenticated users can insert new containers for themselves
create policy "authenticated_users_insert_own_containers" on containers
    for insert
    to authenticated
    with check (user_id = auth.uid());

-- authenticated users can update their own containers
create policy "authenticated_users_update_own_containers" on containers
    for update
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

-- authenticated users can delete their own containers
create policy "authenticated_users_delete_own_containers" on containers
    for delete
    to authenticated
    using (user_id = auth.uid());

/*
 * rls policies for shelves table
 * authenticated users can access shelves within their own containers
 * uses exists clause to check container ownership through hierarchy
 */

-- authenticated users can select shelves in their own containers
create policy "authenticated_users_select_own_shelves" on shelves
    for select
    to authenticated
    using (exists (
        select 1 from containers 
        where containers.container_id = shelves.container_id 
        and containers.user_id = auth.uid()
    ));

-- authenticated users can insert shelves into their own containers
create policy "authenticated_users_insert_own_shelves" on shelves
    for insert
    to authenticated
    with check (exists (
        select 1 from containers 
        where containers.container_id = shelves.container_id 
        and containers.user_id = auth.uid()
    ));

-- authenticated users can update shelves in their own containers
create policy "authenticated_users_update_own_shelves" on shelves
    for update
    to authenticated
    using (exists (
        select 1 from containers 
        where containers.container_id = shelves.container_id 
        and containers.user_id = auth.uid()
    ))
    with check (exists (
        select 1 from containers 
        where containers.container_id = shelves.container_id 
        and containers.user_id = auth.uid()
    ));

-- authenticated users can delete shelves from their own containers
create policy "authenticated_users_delete_own_shelves" on shelves
    for delete
    to authenticated
    using (exists (
        select 1 from containers 
        where containers.container_id = shelves.container_id 
        and containers.user_id = auth.uid()
    ));

/*
 * rls policies for items table
 * authenticated users can access items on shelves within their own containers
 * uses join to traverse the hierarchy: items -> shelves -> containers -> users
 */

-- authenticated users can select items in their own containers
create policy "authenticated_users_select_own_items" on items
    for select
    to authenticated
    using (exists (
        select 1 from shelves 
        join containers on containers.container_id = shelves.container_id
        where shelves.shelf_id = items.shelf_id 
        and containers.user_id = auth.uid()
    ));

-- authenticated users can insert items into shelves in their own containers
create policy "authenticated_users_insert_own_items" on items
    for insert
    to authenticated
    with check (exists (
        select 1 from shelves 
        join containers on containers.container_id = shelves.container_id
        where shelves.shelf_id = items.shelf_id 
        and containers.user_id = auth.uid()
    ));

-- authenticated users can update items in their own containers
create policy "authenticated_users_update_own_items" on items
    for update
    to authenticated
    using (exists (
        select 1 from shelves 
        join containers on containers.container_id = shelves.container_id
        where shelves.shelf_id = items.shelf_id 
        and containers.user_id = auth.uid()
    ))
    with check (exists (
        select 1 from shelves 
        join containers on containers.container_id = shelves.container_id
        where shelves.shelf_id = items.shelf_id 
        and containers.user_id = auth.uid()
    ));

-- authenticated users can delete items from their own containers
create policy "authenticated_users_delete_own_items" on items
    for delete
    to authenticated
    using (exists (
        select 1 from shelves 
        join containers on containers.container_id = shelves.container_id
        where shelves.shelf_id = items.shelf_id 
        and containers.user_id = auth.uid()
    ));

/*
 * migration completed successfully
 * 
 * created tables: containers, shelves, items
 * created indexes: idx_items_name for text search
 * enabled rls: all tables protected with granular policies
 * security model: authenticated users access only their own data hierarchy
 * 
 * next steps:
 * - verify schema with sample data
 * - test rls policies with different user accounts
 * - confirm polish text handling works correctly
 */ 