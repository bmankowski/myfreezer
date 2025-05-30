# Database Structure - MyFreezer Application

## Overview

The MyFreezer application uses a PostgreSQL database hosted on Supabase with a hierarchical data structure designed to support voice-controlled freezer and fridge management. The schema follows a strict three-level hierarchy: Users → Containers → Shelves → Items.

## Database Design Principles

- **Multi-tenant Architecture**: Each user's data is completely isolated using Row Level Security (RLS)
- **Hierarchical Structure**: Clear parent-child relationships with cascade deletion
- **Voice-First Design**: Optimized for natural language commands and queries
- **Security by Default**: All tables protected with granular RLS policies
- **Performance Optimized**: Strategic indexing for text search and relationship queries

## Table Structure

### 1. Containers Table

Stores user's freezers and fridges with basic metadata.

```sql
CREATE TABLE containers (
    container_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL CHECK (name != ''),
    type VARCHAR(10) NOT NULL DEFAULT 'freezer' CHECK (type IN ('freezer', 'fridge')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

#### Column Details
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `container_id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier for each container |
| `user_id` | UUID | NOT NULL, FK to auth.users(id), CASCADE | Owner of the container |
| `name` | VARCHAR(255) | NOT NULL, CHECK (name != '') | User-defined name (e.g., "Kitchen Freezer") |
| `type` | VARCHAR(10) | NOT NULL, DEFAULT 'freezer', CHECK IN ('freezer', 'fridge') | Container type |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Creation timestamp |

#### Business Rules
- Users can have unlimited containers
- Container names must be non-empty strings
- Default type is 'freezer'
- When user is deleted, all containers are deleted (CASCADE)

### 2. Shelves Table

Organizational shelves within containers for better food organization.

```sql
CREATE TABLE shelves (
    shelf_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    container_id UUID NOT NULL REFERENCES containers(container_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL CHECK (name != ''),
    position INTEGER NOT NULL CHECK (position > 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_shelves_container_position UNIQUE (container_id, position)
);
```

#### Column Details
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `shelf_id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier for each shelf |
| `container_id` | UUID | NOT NULL, FK to containers(container_id), CASCADE | Parent container |
| `name` | VARCHAR(255) | NOT NULL, CHECK (name != '') | User-defined shelf name |
| `position` | INTEGER | NOT NULL, CHECK (position > 0), UNIQUE per container | Shelf position (1, 2, 3...) |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Creation timestamp |

#### Business Rules
- Each container can have unlimited shelves
- Shelf positions must be unique within each container
- Positions start from 1 and must be positive integers
- When container is deleted, all shelves are deleted (CASCADE)
- Application generates default names like "Półka 1", "Półka 2"

### 3. Items Table

Food items stored on shelves with quantity tracking.

```sql
CREATE TABLE items (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shelf_id UUID NOT NULL REFERENCES shelves(shelf_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL CHECK (name != ''),
    quantity DECIMAL(10,3) NOT NULL DEFAULT 1 CHECK (quantity >= 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

#### Column Details
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `item_id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier for each item |
| `shelf_id` | UUID | NOT NULL, FK to shelves(shelf_id), CASCADE | Parent shelf |
| `name` | VARCHAR(255) | NOT NULL, CHECK (name != '') | Food item name (normalized by AI) |
| `quantity` | DECIMAL(10,3) | NOT NULL, DEFAULT 1, CHECK (quantity >= 0) | Item quantity with high precision |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Creation timestamp |

#### Business Rules
- Each shelf can have unlimited items
- Quantity supports decimal precision (e.g., 2.500 kg)
- Quantity cannot be negative
- When shelf is deleted, all items are deleted (CASCADE)
- AI normalizes item names to singular form in Polish

## Relationships

### Entity Relationship Diagram
```
auth.users (Supabase)
    │
    │ 1:N
    ▼
containers (freezers/fridges)
    │
    │ 1:N
    ▼
shelves (organizational levels)
    │
    │ 1:N
    ▼
items (food products)
```

### Relationship Details

1. **Users → Containers** (One-to-Many)
   - Each user can own multiple containers
   - Foreign Key: `containers.user_id → auth.users(id)`
   - Deletion: CASCADE (user deletion removes all containers)

2. **Containers → Shelves** (One-to-Many)
   - Each container can have multiple shelves
   - Foreign Key: `shelves.container_id → containers(container_id)`
   - Deletion: CASCADE (container deletion removes all shelves)
   - Constraint: Unique shelf positions per container

3. **Shelves → Items** (One-to-Many)
   - Each shelf can store multiple items
   - Foreign Key: `items.shelf_id → shelves(shelf_id)`
   - Deletion: CASCADE (shelf deletion removes all items)

## Indexes

### Performance Indexes

```sql
-- Text search optimization for voice commands
CREATE INDEX idx_items_name ON items(name);
```

### Automatic Indexes
PostgreSQL automatically creates indexes for:
- All PRIMARY KEY constraints
- All FOREIGN KEY constraints  
- All UNIQUE constraints

### Index Usage Patterns
- **Text Search**: `idx_items_name` supports voice queries like "czy mam pomidory?"
- **Foreign Keys**: Automatic indexes optimize JOIN operations in RLS policies
- **Unique Constraints**: Position uniqueness enforced efficiently

## Row Level Security (RLS)

### Security Model
All tables use Row Level Security to ensure complete user data isolation. The security model follows the hierarchical structure:

- **Direct Access**: Users access only their own containers
- **Inherited Access**: Shelves and items inherit access through container ownership
- **No Anonymous Access**: Only authenticated users can access any data

### RLS Policies

#### Containers Table Policies
```sql
-- SELECT: Users can view their own containers
CREATE POLICY "authenticated_users_select_own_containers" ON containers
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- INSERT: Users can create containers for themselves
CREATE POLICY "authenticated_users_insert_own_containers" ON containers
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can modify their own containers
CREATE POLICY "authenticated_users_update_own_containers" ON containers
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- DELETE: Users can delete their own containers
CREATE POLICY "authenticated_users_delete_own_containers" ON containers
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());
```

#### Shelves Table Policies
```sql
-- All operations check container ownership through EXISTS clause
CREATE POLICY "authenticated_users_select_own_shelves" ON shelves
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM containers 
        WHERE containers.container_id = shelves.container_id 
        AND containers.user_id = auth.uid()
    ));
-- ... similar policies for INSERT, UPDATE, DELETE
```

#### Items Table Policies
```sql
-- All operations traverse the full hierarchy with JOIN
CREATE POLICY "authenticated_users_select_own_items" ON items
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM shelves 
        JOIN containers ON containers.container_id = shelves.container_id
        WHERE shelves.shelf_id = items.shelf_id 
        AND containers.user_id = auth.uid()
    ));
-- ... similar policies for INSERT, UPDATE, DELETE
```

## Data Types and Constraints

### UUID Strategy
- **Primary Keys**: All tables use UUID for global uniqueness and security
- **Generation**: `gen_random_uuid()` for better performance than `uuid_generate_v4()`
- **Security**: UUIDs prevent enumeration attacks

### Text Handling
- **Length**: All text fields limited to 255 characters
- **Validation**: Empty strings not allowed (`CHECK (name != '')`)
- **Collation**: Database configured for Polish text support
- **Normalization**: AI handles synonym resolution and singular forms

### Numeric Precision
- **Quantity**: `DECIMAL(10,3)` supports up to 9,999,999.999
- **Position**: `INTEGER` for shelf ordering
- **Constraints**: Non-negative quantities, positive positions

### Timestamps
- **Type**: `TIMESTAMP WITH TIME ZONE` for global compatibility
- **Default**: `NOW()` function for automatic timestamping
- **Purpose**: Creation tracking (no update timestamps in MVP)

## Voice Command Support

### Text Search Optimization
```sql
-- Search items across all user's containers
SELECT 
    i.name,
    i.quantity,
    s.name as shelf_name,
    c.name as container_name
FROM items i
JOIN shelves s ON s.shelf_id = i.shelf_id
JOIN containers c ON c.container_id = s.container_id
WHERE c.user_id = auth.uid()
AND i.name ILIKE '%pomidor%';
```

### Quantity Management
```sql
-- Add items (voice: "dodaj 2 kartony mleka")
INSERT INTO items (shelf_id, name, quantity)
VALUES ($1, 'mleko', 2)
ON CONFLICT (shelf_id, name) 
DO UPDATE SET quantity = items.quantity + EXCLUDED.quantity;
```

### Hierarchy Queries
```sql
-- List everything in a container (voice: "co mam w zamrażarce?")
SELECT 
    c.name as container,
    s.name as shelf,
    s.position,
    i.name as item,
    i.quantity
FROM containers c
LEFT JOIN shelves s ON s.container_id = c.container_id
LEFT JOIN items i ON i.shelf_id = s.shelf_id
WHERE c.user_id = auth.uid()
AND c.name ILIKE '%zamrażarka%'
ORDER BY s.position, i.name;
```

## Performance Considerations

### Query Optimization
- **RLS Policies**: Use EXISTS with JOINs for efficient hierarchical security
- **Indexes**: Strategic B-tree indexes on foreign keys and search fields
- **Pagination**: UUID-based pagination for large datasets

### Scaling Characteristics
- **Horizontal**: Users completely isolated, easy to shard by user_id
- **Vertical**: Decimal precision allows for precise quantity tracking
- **Caching**: Fresh data policy - no application-level caching

## Migration History

### Initial Migration: `20241201120000_create_myfreezer_schema.sql`
- Created all three tables with full constraints
- Enabled RLS with granular policies
- Added performance indexes
- Configured UUID extension

### Future Migration Considerations
- **Soft Delete**: Could add `deleted_at` columns if needed
- **Audit Trail**: Could add change tracking tables
- **Metadata**: Could add item categories, expiration dates
- **Sharing**: Could add family/household sharing features

## Development Guidelines

### Testing RLS Policies
```sql
-- Test as specific user
SET request.jwt.claims = '{"sub": "user-uuid-here"}';
SELECT * FROM containers; -- Should only show user's data
```

### Data Seeding
```sql
-- Create test container
INSERT INTO containers (user_id, name, type) 
VALUES (auth.uid(), 'Test Freezer', 'freezer');

-- Create test shelf
INSERT INTO shelves (container_id, name, position)
VALUES ((SELECT container_id FROM containers WHERE name = 'Test Freezer'), 'Górna półka', 1);

-- Create test item
INSERT INTO items (shelf_id, name, quantity)
VALUES ((SELECT shelf_id FROM shelves WHERE name = 'Górna półka'), 'mleko', 2);
```

### Common Queries
1. **User's Containers**: `SELECT * FROM containers WHERE user_id = auth.uid()`
2. **Container Contents**: `SELECT * FROM items i JOIN shelves s ON s.shelf_id = i.shelf_id WHERE s.container_id = $1`
3. **Search Items**: `SELECT * FROM items WHERE name ILIKE '%query%'`
4. **Add Quantity**: `UPDATE items SET quantity = quantity + $1 WHERE item_id = $2`

## Security Best Practices

1. **Always Use RLS**: Never disable Row Level Security
2. **Validate Input**: Check constraints prevent invalid data
3. **Use Service Role Carefully**: Only for admin operations
4. **Audit Regularly**: Monitor for policy violations
5. **Test Isolation**: Verify users can't access others' data

This database structure provides a solid foundation for the MyFreezer voice-controlled application while maintaining security, performance, and scalability. 