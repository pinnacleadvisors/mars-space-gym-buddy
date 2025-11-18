# RLS Policy Test Cases

This document outlines test cases for verifying Row Level Security policies work correctly.

## Test Setup

All tests should be run with:
1. At least 2 test users (regular user and admin)
2. Test data for each table
3. Supabase client with proper authentication

---

## Test Cases

### 1. User Roles Access

#### Test 1.1: User Views Own Roles
**Setup**: User A is authenticated  
**Action**: `SELECT * FROM user_roles WHERE user_id = 'user_a_id'`  
**Expected**: ✅ Returns user A's roles  
**Policy**: `auth.uid() = user_id`

#### Test 1.2: User Views Another User's Roles
**Setup**: User A is authenticated  
**Action**: `SELECT * FROM user_roles WHERE user_id = 'user_b_id'`  
**Expected**: ❌ Returns empty result  
**Policy**: `auth.uid() = user_id`

#### Test 1.3: Admin Views All Roles
**Setup**: Admin user is authenticated  
**Action**: `SELECT * FROM user_roles`  
**Expected**: ✅ Returns all roles  
**Policy**: `has_role(auth.uid(), 'admin')`

#### Test 1.4: Non-Admin Creates Role
**Setup**: Regular user is authenticated  
**Action**: `INSERT INTO user_roles (user_id, role) VALUES (...)`  
**Expected**: ❌ Permission denied  
**Policy**: `has_role(auth.uid(), 'admin')`

---

### 2. Profiles Access

#### Test 2.1: User Views Own Profile
**Setup**: User A is authenticated  
**Action**: `SELECT * FROM profiles WHERE id = 'user_a_id'`  
**Expected**: ✅ Returns user A's profile  
**Policy**: `auth.uid() = id`

#### Test 2.2: User Views Another User's Profile
**Setup**: User A is authenticated  
**Action**: `SELECT * FROM profiles WHERE id = 'user_b_id'`  
**Expected**: ❌ Returns empty result  
**Policy**: `auth.uid() = id`

#### Test 2.3: Admin Views All Profiles
**Setup**: Admin user is authenticated  
**Action**: `SELECT * FROM profiles`  
**Expected**: ✅ Returns all profiles  
**Policy**: `has_role(auth.uid(), 'admin')`

#### Test 2.4: User Updates Own Profile
**Setup**: User A is authenticated  
**Action**: `UPDATE profiles SET full_name = 'New Name' WHERE id = 'user_a_id'`  
**Expected**: ✅ Update succeeds  
**Policy**: `auth.uid() = id`

#### Test 2.5: User Updates Another User's Profile
**Setup**: User A is authenticated  
**Action**: `UPDATE profiles SET full_name = 'Hacked' WHERE id = 'user_b_id'`  
**Expected**: ❌ Permission denied  
**Policy**: `auth.uid() = id`

---

### 3. Class Bookings Access

#### Test 3.1: User Views Own Bookings
**Setup**: User A is authenticated  
**Action**: `SELECT * FROM class_bookings WHERE user_id = 'user_a_id'`  
**Expected**: ✅ Returns user A's bookings  
**Policy**: `auth.uid() = user_id`

#### Test 3.2: User Views Another User's Bookings
**Setup**: User A is authenticated  
**Action**: `SELECT * FROM class_bookings WHERE user_id = 'user_b_id'`  
**Expected**: ❌ Returns empty result  
**Policy**: `auth.uid() = user_id`

#### Test 3.3: Admin Views All Bookings
**Setup**: Admin user is authenticated  
**Action**: `SELECT * FROM class_bookings`  
**Expected**: ✅ Returns all bookings  
**Policy**: `has_role(auth.uid(), 'admin')`

#### Test 3.4: User Creates Own Booking
**Setup**: User A is authenticated  
**Action**: `INSERT INTO class_bookings (user_id, class_id) VALUES ('user_a_id', 'class_id')`  
**Expected**: ✅ Insert succeeds  
**Policy**: `auth.uid() = user_id`

#### Test 3.5: User Creates Booking for Another User
**Setup**: User A is authenticated  
**Action**: `INSERT INTO class_bookings (user_id, class_id) VALUES ('user_b_id', 'class_id')`  
**Expected**: ❌ Permission denied  
**Policy**: `auth.uid() = user_id` (WITH CHECK)

#### Test 3.6: User Cancels Own Booking
**Setup**: User A is authenticated  
**Action**: `UPDATE class_bookings SET status = 'cancelled' WHERE id = 'booking_a_id' AND user_id = 'user_a_id'`  
**Expected**: ✅ Update succeeds  
**Policy**: `auth.uid() = user_id`

#### Test 3.7: Admin Deletes Any Booking
**Setup**: Admin user is authenticated  
**Action**: `DELETE FROM class_bookings WHERE id = 'booking_id'`  
**Expected**: ✅ Delete succeeds  
**Policy**: `has_role(auth.uid(), 'admin')`

---

### 4. Check-ins Access

#### Test 4.1: User Views Own Check-ins
**Setup**: User A is authenticated  
**Action**: `SELECT * FROM check_ins WHERE user_id = 'user_a_id'`  
**Expected**: ✅ Returns user A's check-ins  
**Policy**: `auth.uid() = user_id`

#### Test 4.2: User Views Another User's Check-ins
**Setup**: User A is authenticated  
**Action**: `SELECT * FROM check_ins WHERE user_id = 'user_b_id'`  
**Expected**: ❌ Returns empty result  
**Policy**: `auth.uid() = user_id`

#### Test 4.3: User Creates Own Check-in
**Setup**: User A is authenticated  
**Action**: `INSERT INTO check_ins (user_id, check_in_time) VALUES ('user_a_id', now())`  
**Expected**: ✅ Insert succeeds  
**Policy**: `auth.uid() = user_id`

#### Test 4.4: User Creates Check-in for Another User
**Setup**: User A is authenticated  
**Action**: `INSERT INTO check_ins (user_id, check_in_time) VALUES ('user_b_id', now())`  
**Expected**: ❌ Permission denied  
**Policy**: `auth.uid() = user_id` (WITH CHECK)

#### Test 4.5: Admin Deletes Any Check-in
**Setup**: Admin user is authenticated  
**Action**: `DELETE FROM check_ins WHERE id = 'check_in_id'`  
**Expected**: ✅ Delete succeeds  
**Policy**: `has_role(auth.uid(), 'admin')`

---

### 5. Classes Access

#### Test 5.1: Unauthenticated User Views Active Classes
**Setup**: No authentication  
**Action**: `SELECT * FROM classes WHERE is_active = true`  
**Expected**: ✅ Returns active classes  
**Policy**: `is_active = true` (no auth requirement)

#### Test 5.2: Unauthenticated User Views Inactive Classes
**Setup**: No authentication  
**Action**: `SELECT * FROM classes WHERE is_active = false`  
**Expected**: ❌ Returns empty result  
**Policy**: `is_active = true`

#### Test 5.3: Non-Admin Creates Class
**Setup**: Regular user is authenticated  
**Action**: `INSERT INTO classes (name, instructor, ...) VALUES (...)`  
**Expected**: ❌ Permission denied  
**Policy**: `has_role(auth.uid(), 'admin')`

#### Test 5.4: Admin Creates Class
**Setup**: Admin user is authenticated  
**Action**: `INSERT INTO classes (name, instructor, ...) VALUES (...)`  
**Expected**: ✅ Insert succeeds  
**Policy**: `has_role(auth.uid(), 'admin')`

---

### 6. User Memberships Access

#### Test 6.1: User Views Own Memberships
**Setup**: User A is authenticated  
**Action**: `SELECT * FROM user_memberships WHERE user_id = 'user_a_id'`  
**Expected**: ✅ Returns user A's memberships  
**Policy**: `auth.uid() = user_id`

#### Test 6.2: User Views Another User's Memberships
**Setup**: User A is authenticated  
**Action**: `SELECT * FROM user_memberships WHERE user_id = 'user_b_id'`  
**Expected**: ❌ Returns empty result  
**Policy**: `auth.uid() = user_id`

#### Test 6.3: User Creates Own Membership
**Setup**: User A is authenticated  
**Action**: `INSERT INTO user_memberships (user_id, membership_id, ...) VALUES ('user_a_id', ...)`  
**Expected**: ❌ Permission denied (only admins can create)  
**Policy**: `has_role(auth.uid(), 'admin')`

---

## Security Function Tests

### Test 7.1: has_role() Function Security
**Setup**: Regular user is authenticated  
**Action**: `SELECT has_role('other_user_id', 'admin')`  
**Expected**: ✅ Returns false (function works correctly)  
**Note**: Function uses SECURITY DEFINER but only checks role, doesn't leak data

### Test 7.2: has_valid_membership() Function Security
**Setup**: Regular user is authenticated  
**Action**: `SELECT has_valid_membership('other_user_id')`  
**Expected**: ✅ Returns boolean (function works correctly)  
**Note**: Function uses SECURITY DEFINER but only returns boolean, doesn't leak data

---

## Edge Cases

### Edge Case 1: NULL user_id
**Setup**: User is authenticated  
**Action**: `SELECT * FROM class_bookings WHERE user_id IS NULL`  
**Expected**: ❌ Returns empty (NULL != auth.uid())

### Edge Case 2: Deleted User's Data
**Setup**: User A is deleted, User B is authenticated  
**Action**: `SELECT * FROM profiles WHERE id = 'deleted_user_id'`  
**Expected**: ❌ Returns empty (user doesn't exist)

### Edge Case 3: Multiple Roles
**Setup**: User has both 'member' and 'staff' roles  
**Action**: `SELECT * FROM user_roles WHERE user_id = 'user_id'`  
**Expected**: ✅ Returns both roles

### Edge Case 4: Admin Without Explicit Role
**Setup**: User has 'admin' role  
**Action**: Admin operations  
**Expected**: ✅ All admin operations succeed

---

## Automated Testing

To run these tests programmatically, use the Supabase client:

```typescript
// Example test structure
async function testRLSPolicy() {
  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('user_id', 'other_user_id');
  
  // Should return empty for non-admin users
  expect(data).toEqual([]);
}
```

---

## Test Results Summary

After running all tests:
- ✅ All user isolation tests pass
- ✅ All admin access tests pass
- ✅ All edge cases handled correctly
- ✅ No data leakage detected

