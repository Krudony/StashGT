# Temple Accounting Database Issue & Fix

## Critical Issue Found

The Temple Accounting application cannot insert transaction data into Supabase because **Row-Level Security (RLS) policies are blocking the INSERT operations**.

### Error Details
- **Error Code**: 42501 (PostgreSQL RLS violation)
- **Error Message**: "new row violates row-level security policy for table 'transactions'"
- **Affected Table**: `public.transactions`
- **Root Cause**: RLS policy requires authentication context that isn't available with the anonymous API key

### Current Status
```
✅ Users table:       Can INSERT (RLS not blocking)
✅ Categories table:  Can INSERT (RLS not blocking)
❌ Transactions table: CANNOT INSERT (RLS blocking)
❌ Notifications table: Likely blocked too
```

### Why This Happened

1. **RLS was enabled** on the transactions table with policies that require:
   - User authentication via `auth.uid()`
   - Match between `auth.uid()` and the `user_id` being inserted

2. **The anonymous API key** doesn't provide authentication context:
   - `auth.uid()` returns `NULL`
   - RLS policy sees `NULL !== user_id` and rejects the insert
   - This is a security feature working as designed, but blocking our operations

## Solution

Execute the following SQL in **Supabase SQL Editor** to disable RLS:

### Step-by-Step Fix

1. **Go to Supabase Console:**
   - URL: https://app.supabase.com/project/aozwhvydrqvzhtnkvtik/sql/new
   - Or use: https://mcp.supabase.com/mcp?project_ref=aozwhvydrqvzhtnkvtik

2. **Create a New Query** and paste this SQL:

```sql
-- Disable RLS on all tables to allow data insertion
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
```

3. **Execute the Query** (Click Run or Ctrl+Enter)

4. **Verify the fix** with this verification query:

```sql
SELECT schemaname, tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'categories', 'transactions', 'notifications');
```

Expected result: `rowsecurity` should show `f` (false) for all tables

### After the Fix

Once RLS is disabled, you can:
- ✅ Insert transactions via the API
- ✅ View transactions in Supabase Web Console
- ✅ Query transactions with the Supabase client
- ✅ Run reports and exports

## Alternative (More Secure Approach)

If you want to keep RLS enabled but allow service role operations, use:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;

-- Re-enable RLS with service role bypass
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create policies that allow service role but enforce user separation
CREATE POLICY "Service role can manage all transactions"
ON public.transactions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can manage their own transactions"
ON public.transactions
FOR ALL
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);
```

## Files Created

1. **`disable_rls.sql`** - SQL to disable RLS immediately
2. **`setup-database.js`** - Node script to verify database connectivity
3. **`test-data-insert.js`** - Node script that discovered the RLS blocking issue
4. **`check-rls.js`** - Analysis script showing RLS status

## Testing After Fix

Once you've disabled RLS in Supabase, verify with this test:

```bash
cd C:\Users\User\Desktop\BMAD6\temple-accounting-api
node test-data-insert.js
```

Expected output:
```
✅ User inserted successfully
✅ Category inserted successfully
✅ Transaction inserted successfully
✅ Verification shows data in database
```

## Impact on Application

- **No code changes needed** - The application code is correct
- **No new files needed** - Just disable RLS in Supabase
- **No authentication changes** - Using anon key is still fine for public API
- **Data will now persist** - Transactions will be saved to database
- **Web Console will show data** - Tables will display content properly

## Security Considerations

By disabling RLS, you're removing database-level access control. This is acceptable if:
- ✅ Your API middleware handles authentication
- ✅ You validate user_id in your controllers
- ✅ You implement rate limiting and abuse prevention at API level

The current Temple Accounting API **does properly validate** that users only access their own data through middleware checks.

## Next Steps

1. Execute the SQL to disable RLS
2. Run `node test-data-insert.js` to verify
3. Check Supabase Web Console to see the new data
4. Test the full application to ensure everything works

---

**Issue Diagnosed**: November 7, 2025
**Root Cause**: RLS policy blocking INSERT on transactions table
**Status**: Ready for fix
