# Database Planning Notes - MyFreezer MVP

## Przegląd Sesji Planowania

**Data:** Sesja planowania bazy danych PostgreSQL dla aplikacji MyFreezer MVP  
**Cel:** Określenie schematu bazy danych, relationships, constraints i RLS policies  
**Źródła:** PRD (.ai/documents/3-prd.md) i Tech Stack (.ai/documents/4-tech-stack.md)

## Kluczowe Ustalenia

### Struktura Tabel
- **Użytkownicy:** Brak własnej tabeli users - korzystamy z auth.users z Supabase
- **Hierarchia:** auth.users → containers → shelves → items
- **Nazewnictwo:** Plural form (containers, shelves, items)
- **Primary Keys:** UUID z suffix _id (container_id, shelf_id, item_id)

### Ustalenia Techniczne
- **UUID Generation:** gen_random_uuid()
- **Collation:** Polish (pl_PL.UTF-8) na poziomie database
- **Delete Strategy:** Hard delete z CASCADE
- **RLS:** Enabled od razu w schema
- **Timestamps:** Tylko created_at (bez updated_at)

## Odpowiedzi na Pytania Planowania

### Pierwsze Pytania i Odpowiedzi:
1. **Własna tabela users?** NIE - używamy auth.users z Supabase
2. **Usuwanie użytkowników?** Hard delete
3. **Tabela audit/log?** NIE
4. **Normalizacja nazw produktów?** NIE
5. **Indeksy dla search?** NIE (zwykły B-tree)
6. **Quantity type?** DECIMAL
7. **Position constraint?** UNIQUE per container
8. **Atomic updates?** TAK

### Drugie Pytania i Odpowiedzi:
1. **Position uniqueness?** Unique per container
2. **Max length text fields?** 255 znaków
3. **Decimal precision?** DECIMAL(10,3)
4. **Index type for names?** Zwykły B-tree
5. **User delete behavior?** ON DELETE CASCADE
6. **Quantity constraints?** TAK (>= 0)
7. **Default type containers?** 'freezer'
8. **Index (user_id, created_at)?** NIE
9. **Description field?** NIE
10. **Constraint naming?** Prefix fk_

### Trzecie Pytania i Odpowiedzi:
1. **RLS policy type?** FOR ALL USING
2. **Updated_at trigger?** NIE (bez updated_at)
3. **Table naming?** Plural
4. **PK field naming?** Z suffix _id
5. **Index na shelf_id?** NIE
6. **Foreign key naming?** user_id (nie auth_user_id)
7. **Position data type?** INTEGER
8. **Database comments?** NIE
9. **Database functions?** NIE - application layer
10. **Rollback strategy?** Supabase backup

### Finalne Pytania i Odpowiedzi:
1. **RLS enable timing?** Od razu
2. **Polish collation?** TAK na poziomie database
3. **Table creation order?** containers → shelves → items
4. **FK constraints style?** Inline z CREATE TABLE
5. **UUID function?** gen_random_uuid()
6. **RLS policies location?** W tym samym migration file
7. **Schema qualification?** Default public schema
8. **Quantity default?** DEFAULT 1
9. **Position default?** Explicit (bez default)
10. **Name validation?** TAK - name != ''

## Finalne Schema DDL

### Extensions
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Containers Table
```sql
CREATE TABLE containers (
    container_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL CHECK (name != ''),
    type VARCHAR(10) NOT NULL DEFAULT 'freezer' CHECK (type IN ('freezer', 'fridge')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### Shelves Table
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

### Items Table
```sql
CREATE TABLE items (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shelf_id UUID NOT NULL REFERENCES shelves(shelf_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL CHECK (name != ''),
    quantity DECIMAL(10,3) NOT NULL DEFAULT 1 CHECK (quantity >= 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### Row Level Security
```sql
-- Enable RLS
ALTER TABLE containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shelves ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users see own containers" ON containers 
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users see own shelves" ON shelves 
    FOR ALL USING (EXISTS (
        SELECT 1 FROM containers 
        WHERE containers.container_id = shelves.container_id 
        AND containers.user_id = auth.uid()
    ));

CREATE POLICY "Users see own items" ON items 
    FOR ALL USING (EXISTS (
        SELECT 1 FROM shelves 
        JOIN containers ON containers.container_id = shelves.container_id
        WHERE shelves.shelf_id = items.shelf_id 
        AND containers.user_id = auth.uid()
    ));
```

### Indexes
```sql
CREATE INDEX idx_items_name ON items(name);
```

## Constraints i Validations

### Check Constraints:
- **containers.name:** `name != ''` (nie może być pusty string)
- **containers.type:** `type IN ('freezer', 'fridge')`
- **shelves.name:** `name != ''`
- **shelves.position:** `position > 0`
- **items.name:** `name != ''`
- **items.quantity:** `quantity >= 0`

### Unique Constraints:
- **shelves:** `(container_id, position)` - pozycja półki unikalna per kontener

### Foreign Key Constraints:
- **containers.user_id** → `auth.users(id) ON DELETE CASCADE`
- **shelves.container_id** → `containers(container_id) ON DELETE CASCADE`
- **items.shelf_id** → `shelves(shelf_id) ON DELETE CASCADE`

## Założenia i Ograniczenia

### Data Types:
- **UUIDs:** Wszystkie primary keys
- **Text Fields:** VARCHAR(255) z Polish collation
- **Quantity:** DECIMAL(10,3) dla dokładności
- **Position:** INTEGER
- **Timestamps:** TIMESTAMP WITH TIME ZONE

### Defaults:
- **containers.type:** 'freezer'
- **items.quantity:** 1
- **created_at:** NOW() na wszystkich tabelach

### Business Logic:
- Aplikacja będzie generować domyślne nazwy półek typu "Półka 1", "Półka 2"
- Brak soft delete - wszystko hard delete z CASCADE
- Brak audit trail w MVP
- Wyszukiwanie przez simple B-tree index na name fields

## Migration Strategy

### Kolejność Tworzenia:
1. Extensions
2. Tables (containers → shelves → items)
3. Constraints (inline z CREATE TABLE)
4. Indexes
5. RLS policies

### File Organization:
- Wszystko w jednym migration file
- Używać Supabase migrations (`supabase db push`)
- Polegać na Supabase backup dla rollback

## Performance Considerations

### Indexes:
- **idx_items_name:** B-tree na items.name dla wyszukiwania tekstowego
- Automatyczne indexes na foreign keys
- Automatyczne indexes na unique constraints

### RLS Performance:
- Policies używają EXISTS z JOIN dla wydajności
- Nested queries optimized przez PostgreSQL planner

## Security

### Row Level Security:
- Wszystkie tabele zabezpieczone RLS
- User isolation przez auth.uid()
- Hierarchical access control (user → containers → shelves → items)

### Data Integrity:
- Proper foreign key constraints z CASCADE
- Check constraints dla business rules
- NOT NULL constraints na required fields
