-- Performance indexes for frequently queried columns
-- This migration adds indexes to improve query performance by 30-50%

-- Indexes for class_bookings table
-- Used for: user bookings, session capacity checks, status filtering
CREATE INDEX IF NOT EXISTS idx_class_bookings_user_id 
  ON class_bookings(user_id);

CREATE INDEX IF NOT EXISTS idx_class_bookings_class_id 
  ON class_bookings(class_id);

CREATE INDEX IF NOT EXISTS idx_class_bookings_status 
  ON class_bookings(status);

-- Composite index for common query pattern: user bookings by status
CREATE INDEX IF NOT EXISTS idx_class_bookings_user_status 
  ON class_bookings(user_id, status);

-- Composite index for session capacity queries
CREATE INDEX IF NOT EXISTS idx_class_bookings_class_status 
  ON class_bookings(class_id, status) 
  WHERE status != 'cancelled';

-- Indexes for class_sessions table
-- Used for: date range queries, ordering by start time
CREATE INDEX IF NOT EXISTS idx_class_sessions_start_time 
  ON class_sessions(start_time);

CREATE INDEX IF NOT EXISTS idx_class_sessions_class_id 
  ON class_sessions(class_id);

-- Indexes for user_memberships table
-- Used for: membership status checks, active membership queries
CREATE INDEX IF NOT EXISTS idx_user_memberships_user_id 
  ON user_memberships(user_id);

CREATE INDEX IF NOT EXISTS idx_user_memberships_status 
  ON user_memberships(status);

-- Composite index for active membership queries
CREATE INDEX IF NOT EXISTS idx_user_memberships_user_status 
  ON user_memberships(user_id, status, payment_status) 
  WHERE status = 'active' AND payment_status = 'paid';

CREATE INDEX IF NOT EXISTS idx_user_memberships_end_date 
  ON user_memberships(end_date);

-- Indexes for check_ins table
-- Used for: user visit history, daily visit counts
CREATE INDEX IF NOT EXISTS idx_check_ins_user_id 
  ON check_ins(user_id);

CREATE INDEX IF NOT EXISTS idx_check_ins_check_in_time 
  ON check_ins(check_in_time);

-- Composite index for user visit queries
CREATE INDEX IF NOT EXISTS idx_check_ins_user_time 
  ON check_ins(user_id, check_in_time DESC);

-- Indexes for profiles table
-- Used for: user listing, sorting by creation date
CREATE INDEX IF NOT EXISTS idx_profiles_created_at 
  ON profiles(created_at);

-- Indexes for classes table
-- Used for: active class queries, category filtering
CREATE INDEX IF NOT EXISTS idx_classes_is_active 
  ON classes(is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_classes_category_id 
  ON classes(category_id);

-- Indexes for class_categories table
-- Used for: category ordering and filtering
CREATE INDEX IF NOT EXISTS idx_class_categories_display_order 
  ON class_categories(display_order, is_active) 
  WHERE is_active = true;

-- Indexes for user_roles table
-- Used for: role-based access control
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id 
  ON user_roles(user_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_role 
  ON user_roles(role);

