# Fix for "Unknown" Member Names Issue

## Problem
Community members are showing as "Unknown" instead of displaying their actual names because the Row Level Security (RLS) policy on the `profiles` table is too restrictive.

## Solution
The `fix_profiles_rls.sql` migration adds a new RLS policy that allows users to view profiles of other members in the same communities.

## How to Apply This Fix

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Open and run the `fix_profiles_rls.sql` file
4. Verify the fix by refreshing your members page

### Option 2: Using Supabase CLI
If you have the Supabase CLI installed:
```bash
supabase db execute --file supabase/fix_profiles_rls.sql
```

### What the Migration Does
The migration:
1. Creates a new RLS policy "Users can view profiles of community members" that allows:
   - Viewing your own profile
   - Viewing profiles of users in the same communities as you
   - Viewing profiles of users in communities you own
2. Drops the old restrictive policy "Users can view their own profile"

### After Applying
After running the migration, member names should display correctly in the members list instead of showing "Unknown".

## Verification
To verify the fix worked:
1. Go to your community's members page
2. Check that member names are now displayed instead of "Unknown"
3. Verify that email addresses are also visible for community members
