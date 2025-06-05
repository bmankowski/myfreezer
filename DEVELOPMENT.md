# Development Guide

This guide explains how to work with both local and cloud Supabase environments in this project.

## Environment Setup

### 1. Create Environment Files

Copy the example files and update them with your actual values:

```bash
# For local Supabase development
cp env.local.example .env.local

# For cloud Supabase development  
cp env.cloud.example .env.cloud
```

### 2. Update Environment Variables

#### Local Environment (`.env.local`)
Get your local Supabase credentials by running:
```bash
supabase status
```

Update `.env.local` with the output from the above command.

#### Cloud Environment (`.env.cloud`)
Get your cloud Supabase credentials from your [Supabase Dashboard](https://supabase.com/dashboard):
- Project URL
- Anon/Public key

## Development Commands

### Local Supabase Development
```bash
# Start local Supabase + Astro dev server
npm run dev:local
```
This will:
1. Copy `.env.local` to `.env`
2. Start local Supabase stack
3. Start Astro dev server
4. Your app will connect to `http://localhost:54321`

### Cloud Supabase Development
```bash
# Start Astro dev server with cloud Supabase
npm run dev:cloud
```
This will:
1. Copy `.env.cloud` to `.env`
2. Start Astro dev server
3. Your app will connect to your cloud Supabase instance

### Netlify Dev (Recommended for Production-like Testing)
```bash
# Use Netlify dev with current environment
npm run dev:netlify
```

## Supabase Management Commands

```bash
# Start local Supabase stack
npm run supabase:start

# Stop local Supabase stack
npm run supabase:stop

# Check local Supabase status
npm run supabase:status
```

## Environment Switching

### Manual Switching
```bash
# Switch to local environment
npm run env:local

# Switch to cloud environment  
npm run env:cloud
```

### Current Active Environment
Check which environment is currently active:
```bash
cat .env | head -1
```

## Database Migrations

### Local Development
```bash
# Reset local database with latest migrations
supabase db reset

# Generate new migration
supabase migration new your_migration_name
```

### Deploy to Cloud
```bash
# Link to your cloud project (one-time setup)
supabase link --project-ref your-project-id

# Deploy local migrations to cloud
supabase db push
```

## Best Practices

1. **Development**: Use `npm run dev:local` for day-to-day development
2. **Testing**: Use `npm run dev:cloud` to test against production data
3. **Demo/Staging**: Use `npm run dev:netlify` for production-like environment
4. **Never commit** `.env` files - they are in `.gitignore`
5. **Keep migrations in sync** between local and cloud environments

## Troubleshooting

### Environment Variables Not Loading
- Ensure you've created the appropriate `.env.local` or `.env.cloud` files
- Check that the current `.env` file has the correct values
- Restart your dev server after changing environments

### Local Supabase Issues
```bash
# Reset local Supabase completely
supabase stop
supabase start

# Check Docker containers
docker ps | grep supabase
```

### Migration Conflicts
```bash
# Pull latest schema from cloud
supabase db pull

# Reset local database
supabase db reset
``` 