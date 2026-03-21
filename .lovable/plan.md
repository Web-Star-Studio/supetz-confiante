

# Fix: Admin page not opening (race condition)

## Root Cause

In `AuthContext.tsx`, `checkAdminRole` is called via `setTimeout(..., 0)` but `setIsLoading(false)` runs immediately after. This creates a race condition:

1. `onAuthStateChange` fires with a session
2. `setIsLoading(false)` runs
3. `AdminRoute` renders, sees `isLoading=false` + `isAdmin=false` → redirects to `/`
4. `checkAdminRole` resolves later, sets `isAdmin=true` — but too late

The same issue exists in the `getSession` path.

## Fix

**File: `src/context/AuthContext.tsx`**

- Remove the `setTimeout` wrapper around `checkAdminRole`
- Make `setIsLoading(false)` run AFTER `checkAdminRole` completes
- In `onAuthStateChange`: `await checkAdminRole(...)` before `setIsLoading(false)`
- In `getSession`: already awaits, just ensure ordering is correct

The key change: `checkAdminRole` must complete before `isLoading` becomes `false`.

## Technical Detail

```text
BEFORE:
  onAuthStateChange → setIsLoading(false) → setTimeout(checkAdminRole)
  
AFTER:
  onAuthStateChange → await checkAdminRole() → setIsLoading(false)
```

Only `src/context/AuthContext.tsx` needs modification. No database or route changes required.

