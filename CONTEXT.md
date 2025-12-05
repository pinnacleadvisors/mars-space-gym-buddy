# Mars Space Gym Buddy - Codebase Context

This document provides comprehensive context about the repository structure, tools, database schema, and configuration to help with code editing and bug fixing.

## 📁 Repository Structure

```
mars-space-gym-buddy/
├── src/
│   ├── App.tsx                    # Main app component with routing
│   ├── main.tsx                   # React entry point
│   ├── index.css                  # Global styles
│   ├── App.css                    # App-specific styles
│   ├── assets/                    # Static assets (images, etc.)
│   ├── components/
│   │   ├── layout/                # Layout components
│   │   │   ├── AppLayout.tsx      # Main app layout wrapper (conditionally shows navigation for authenticated users)
│   │   │   ├── AppSidebar.tsx     # Sidebar navigation (desktop: fixed sidebar, mobile: slide-out drawer)
│   │   │   ├── BottomNav.tsx      # Mobile bottom navigation (deprecated, replaced by mobile sidebar)
│   │   │   └── TopBar.tsx         # Top navigation bar (shows for authenticated users)
│   │   └── ui/                    # shadcn/ui components (40+ components)
│   ├── components/
│   │   └── auth/                  # Authentication components
│   │       ├── ProtectedRoute.tsx # Route protection for authenticated users
│   │       └── AdminRoute.tsx     # Route protection for admin users
│   │   └── error/                 # Error handling components
│   │       └── ErrorBoundary.tsx  # React error boundary component
│   │   └── loading/               # Loading state components
│   │       ├── PageSkeleton.tsx   # Full page skeleton loader
│   │       ├── ClassCardSkeleton.tsx # Class card skeleton
│   │       ├── BookingCardSkeleton.tsx # Booking card skeleton
│   │       ├── TableSkeleton.tsx  # Table skeleton loader
│   │       ├── ChartSkeleton.tsx   # Chart skeleton loader
│   │       ├── LoadingSpinner.tsx  # Reusable loading spinner
│   │       └── ProgressIndicator.tsx # Progress indicator component
│   │   └── qr/                    # QR code components
│   │       ├── QRCodeDisplay.tsx  # QR code display component
│   │       └── QRCodeScanner.tsx  # QR code scanner component
│   │   └── calendar/              # Calendar components
│   │       ├── ClassCalendarView.tsx  # Calendar view for classes (member view)
│   │       ├── AdminCalendarView.tsx  # Calendar view for admin session management
│   │       └── BookingsCalendarView.tsx  # Calendar view for user bookings
│   ├── hooks/                     # Custom React hooks
│   │   ├── useAuth.ts             # Authentication hook (✅ implemented)
│   │   ├── useAdminAuth.ts        # Admin authentication hook
│   │   ├── useSessionManager.ts   # Session management hook (✅ implemented)
│   │   ├── useBookings.ts         # Bookings hook (✅ implemented)
│   │   ├── useAnalytics.ts        # Analytics hook (✅ implemented)
│   │   ├── useErrorHandler.ts     # Error handling hook (✅ implemented)
│   │   ├── useNavigationLoading.tsx # Navigation loading hook (✅ implemented)
│   │   ├── use-mobile.tsx         # Mobile detection hook
│   │   └── use-toast.ts           # Toast notification hook
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts          # Supabase client configuration
│   │       └── types.ts            # Auto-generated types (empty, use database.ts)
│   ├── lib/
│   │   ├── utils.ts               # Utility functions
│   │   └── utils/
│   │       ├── dateUtils.ts       # Date utility functions
│   │       ├── sessionUtils.ts    # Session error handling utilities
│   │       ├── sanitize.ts        # Input sanitization utilities
│   │       ├── rateLimit.ts       # Client-side rate limiting utilities
│   │       ├── accountLockout.ts  # Account lockout tracking utilities
│   │       ├── errorLogger.ts     # Error logging utility
│   │       ├── errorHandler.ts    # Global error handling utility
│   │       ├── networkErrorHandler.ts # Network error handling utility
│   │       ├── toastHelpers.ts    # Toast notification helpers
│   │       ├── qrCode.ts          # QR code generation utilities
│   │       ├── rewardClaim.ts     # Reward claim utility functions
│   │       ├── pathUtils.ts       # Path utilities for base path handling (GitHub Pages)
│   │       └── imageUpload.ts    # Image upload utilities for classes and categories (Supabase Storage)
│   ├── lib/
│   │   └── validations/          # Zod validation schemas
│   │       ├── auth.ts            # Authentication form schemas
│   │       ├── class.ts           # Class and session schemas
│   │       ├── membership.ts      # Membership schemas
│   │       └── coupon.ts         # Coupon code validation schemas
│   ├── pages/                     # Page components
│   │   ├── Landing.tsx            # Landing page (high-end welcome/onboarding screen with hero background, logo, premium typography)
│   │   ├── Login.tsx              # User login
│   │   ├── Register.tsx           # User registration
│   │   ├── ForgotPassword.tsx      # Password reset request
│   │   ├── ResetPassword.tsx      # Password reset
│   │   ├── EmailVerificationRequired.tsx # Email verification required page
│   │   ├── AuthCallback.tsx       # OAuth and email verification callback handler (Google OAuth, email links)
│   │   ├── Dashboard.tsx          # User dashboard (✅ fully implemented with membership status, quick actions, statistics, activity feed)
│   │   ├── Classes.tsx            # Class listings (✅ fully implemented with booking, filters, search)
│   │   ├── Bookings.tsx           # User bookings (✅ fully implemented with list/calendar views, cancel functionality)
│   │   ├── ManageMemberships.tsx  # Membership management
│   │   ├── Profile.tsx            # User profile management (✅ fully implemented with profile editing, avatar upload, membership/booking history)
│   │   ├── EntryExit.tsx          # Combined QR code check-in/check-out
│   │   ├── Rewards.tsx            # Rewards page (✅ tracks gym hours and classes, displays QR code when goals reached)
│   │   ├── Settings.tsx           # Settings page (✅ password change, 2FA placeholder, email preferences, account settings)
│   │   ├── AdminLogin.tsx         # Admin login
│   │   ├── AdminDashboard.tsx     # Admin dashboard
│   │   ├── AdminUsers.tsx         # User management (✅ fully implemented with search, filtering, bulk actions, role management, activity history)
│   │   ├── AdminAnalytics.tsx     # Analytics dashboard (✅ fully implemented with charts, date filtering, export)
│   │   ├── AdminManageClasses.tsx # Class management (✅ fully implemented with improved UI, bulk creation, capacity management, instructor management)
│   │   ├── AdminManageMemberships.tsx # Membership management (✅ fully implemented with plan creation/editing, statistics, renewal reminders)
│   │   ├── AdminUserMemberships.tsx   # User membership management
│   │   ├── AdminManageDeals.tsx       # Deals & Referrals management (✅ fully implemented with coupon code CRUD, usage tracking, statistics)
│   │   ├── AdminRewardClaim.tsx       # Reward claim scanner (✅ for staff to scan member QR codes)
│   │   └── NotFound.tsx           # 404 page
│   └── types/                     # TypeScript type definitions
│       ├── database.ts            # Database schema types (PRIMARY)
│       ├── user.ts                # User types
│       ├── booking.ts             # Booking types
│       ├── class.ts               # Class types
│       ├── analytics.ts           # Analytics types
│       └── visit.ts               # Visit/check-in types
├── supabase/
│   ├── config.toml                # Supabase project config
│   ├── functions/                 # Edge Functions (Deno)
│   │   ├── _shared/               # Shared utilities
│   │   │   └── validation.ts     # Server-side validation utilities
│   │   ├── create-checkout/       # Stripe checkout creation
│   │   ├── check-subscription/    # Subscription status check
│   │   └── cancel-subscription/   # Subscription cancellation
│   └── migrations/                # Database migrations (run in Supabase Dashboard SQL Editor)
│       ├── RESET_DATABASE.sql     # Resets database (drops all tables, functions, types, and policies)
│       ├── COMPLETE_SCHEMA_SETUP.sql # Complete database schema setup from scratch
│       ├── ADD_REWARD_CLAIMS.sql  # Adds reward_claims table and claim_reward() function
│       ├── ADD_COUPON_CODES.sql   # Adds coupon_codes and coupon_usage tables with validation functions
│       ├── ADD_PAYMENT_METHOD_TO_USER_MEMBERSHIPS.sql  # Adds payment_method and stripe_subscription_id columns
│       └── ADD_CLASS_CATEGORIES.sql  # Adds class_categories table and category_id column to classes table
├── scripts/                       # Utility scripts
│   ├── sync-database-types.sh    # Script to sync database types from GitHub
│   └── watch-database-types.sh   # Watch script for auto-pulling type updates
├── public/                        # Static public assets
├── .github/
│   └── workflows/
│       └── github-actions-demo.yml # CI/CD for type generation (auto-updates src/types/database.ts on main branch commits)
├── package.json                   # Dependencies and scripts
├── vite.config.ts                # Vite configuration
├── tsconfig.json                  # TypeScript configuration
├── tailwind.config.ts            # Tailwind CSS configuration
└── components.json                # shadcn/ui configuration
```

## 🛠️ Main Tools & Technologies

### Frontend Stack
- **React 18.3.1** - UI framework
- **TypeScript 5.8.3** - Type safety
- **Vite 7.2.2** - Build tool and dev server
- **React Router DOM 6.30.1** - Client-side routing
- **TanStack Query 5.83.0** - Data fetching and caching

### UI Framework
- **shadcn/ui** - Component library (Radix UI primitives)
- **Tailwind CSS 3.4.17** - Utility-first CSS
- **Radix UI** - Headless UI components (40+ components)
- **Lucide React** - Icon library
- **class-variance-authority** - Component variants
- **tailwind-merge** - Tailwind class merging

### Backend & Database
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication
  - Row Level Security (RLS)
  - Edge Functions (Deno runtime)
- **Stripe 19.3.1** - Payment processing

### Development Tools
- **ESLint 9.32.0** - Code linting
- **TypeScript ESLint** - TypeScript linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes
- **lovable-tagger** - Component tagging (dev only)

### Build & Deploy
- **gh-pages** - GitHub Pages deployment
- **GitHub Actions** - CI/CD pipeline

## 🗄️ Supabase Database Schema

**📋 Source of Truth**: The database schema is automatically synced from Supabase and defined in `src/types/database.ts`. This file is auto-generated by GitHub Actions on every commit to the `main` branch, ensuring it always reflects the current database state.

**🔧 Schema Management**:
- **Schema Definition**: Manually set up in Supabase Dashboard following the guide in `docs/DATABASE_SCHEMA_SETUP.md`
- **TypeScript Types**: Auto-generated to `src/types/database.ts` via GitHub Actions workflow
- **Type Sync**: Run `npm run sync:types` or `npm run watch:types` to pull latest schema changes
- **Migration Files**: Migration files available in `supabase/migrations/`:
  - `RESET_DATABASE.sql`: Drops all tables, functions, types, and policies (use with caution)
  - `COMPLETE_SCHEMA_SETUP.sql`: Complete database schema setup from scratch (run after RESET_DATABASE.sql or for fresh setup)
  - `ADD_REWARD_CLAIMS.sql`: Adds reward_claims table and claim_reward() function
  - `ADD_COUPON_CODES.sql`: Adds coupon_codes and coupon_usage tables with validation functions
  - `ADD_PAYMENT_METHOD_TO_USER_MEMBERSHIPS.sql`: Adds payment_method and stripe_subscription_id columns to user_memberships table
  - `ADD_CLASS_CATEGORIES.sql`: Adds class_categories table and category_id column to classes table
- **Reference**: Always check `src/types/database.ts` for the current database schema state

**📖 Reading the Schema**:
- Check `src/types/database.ts` for the current table structure, relationships, and column types
- The `Database` type contains all table definitions, RLS policies are inferred from table access patterns
- Foreign key relationships are shown in the `Relationships` arrays for each table

### Tables

**Note**: All table definitions below are derived from `src/types/database.ts`. For the most up-to-date schema, always refer to that file.

#### `user_roles`
- **Purpose**: Role-based access control
- **Columns**:
  - `id` (uuid, PK)
  - `user_id` (uuid, FK → auth.users)
  - `role` (app_role enum: 'admin', 'staff', 'member')
  - `created_at` (timestamptz)
- **RLS**: 
  - Users can view own roles (`auth.uid() = user_id`)
  - Users can insert their own 'member' role (`auth.uid() = user_id AND role = 'member'`) - fallback if trigger fails
  - Admins can view all roles (`has_role(auth.uid(), 'admin')`)
  - Admins can insert/update/delete all roles
- **Trigger**: Auto-creates 'member' role on user signup via `handle_new_user()` trigger
- **Fallback**: Client-side creation in `Register.tsx` if trigger fails

#### `profiles`
- **Purpose**: Extended user profile data
- **Columns**:
  - `id` (uuid, PK, FK → auth.users)
  - `full_name` (text)
  - `avatar_url` (text)
  - `phone` (text)
  - `emergency_contact` (text)
  - `emergency_contact_phone` (text)
  - `date_of_birth` (date)
  - `address` (text)
  - `health_notes` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
- **RLS**: 
  - Users can view/update own profile (`auth.uid() = id`)
  - Users can insert their own profile (`auth.uid() = id`) - fallback if trigger fails
  - Admins can view/update/insert/delete all profiles
- **Trigger**: Auto-creates profile on user signup via `handle_new_user()` trigger
- **Fallback**: Client-side creation in `Register.tsx` if trigger fails

#### `classes`
- **Purpose**: Gym class definitions
- **Columns**:
  - `id` (uuid, PK)
  - `name` (text)
  - `description` (text)
  - `instructor` (text)
  - `schedule` (text)
  - `duration` (integer, minutes)
  - `capacity` (integer, default 20)
  - `category` (text) - Legacy category field (text)
  - `category_id` (uuid, FK → class_categories, nullable) - References class_categories table
  - `image_url` (text)
  - `is_active` (boolean, default true)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
- **RLS**: Anyone can view active classes, admins can manage all
- **Migration**: `category_id` column added in `supabase/migrations/ADD_CLASS_CATEGORIES.sql`

#### `class_categories`
- **Purpose**: Class category definitions with images and descriptions
- **Columns**:
  - `id` (uuid, PK)
  - `name` (text, unique)
  - `description` (text, nullable)
  - `image_url` (text, nullable)
  - `is_active` (boolean, default true)
  - `display_order` (integer, default 0)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
- **RLS**: 
  - Anyone can view active categories (`is_active = true`)
  - Admins can view all categories (including inactive) (`has_role(auth.uid(), 'admin'::app_role)`)
  - Admins can insert/update/delete categories (`has_role(auth.uid(), 'admin'::app_role)`)
  - All admin policies use `TO authenticated` for proper RLS evaluation
- **Migration**: Created in `supabase/migrations/ADD_CLASS_CATEGORIES.sql`
- **Indexes**: 
  - `idx_class_categories_name` on `name`
  - `idx_class_categories_is_active` on `is_active`
  - `idx_class_categories_display_order` on `display_order`

#### `class_sessions`
- **Purpose**: Scheduled class instances
- **Columns**:
  - `id` (uuid, PK)
  - `class_id` (uuid, FK → classes, nullable) - Links session to class template
  - `name` (text)
  - `instructor` (text)
  - `start_time` (timestamptz)
  - `end_time` (timestamptz)
  - `capacity` (integer)
  - `created_at` (timestamptz)
- **RLS**: Anyone can view, admins can manage
- **Relationship**: Sessions can be linked to class templates via `class_id` (nullable for standalone sessions)

#### `class_bookings`
- **Purpose**: User class reservations
- **Columns**:
  - `id` (uuid, PK)
  - `user_id` (uuid, FK → profiles)
  - `class_id` (uuid, FK → class_sessions) **Important**: References `class_sessions`, not `classes`
  - `status` (text, default 'booked')
  - `created_at` (timestamptz)
- **RLS**: 
  - Users can view/insert/update/delete own bookings (`auth.uid() = user_id`)
  - Admins can view/update/delete all bookings (`has_role(auth.uid(), 'admin')`)
- **Migration**: Foreign key relationship fixed in `supabase/migrations/COMPLETE_SCHEMA_SETUP.sql` to reference `class_sessions`

#### `memberships`
- **Purpose**: Membership plan definitions
- **Columns**:
  - `id` (uuid, PK)
  - `name` (text, unique)
  - `price` (numeric(10,2))
  - `duration_days` (integer)
  - `access_level` (text)
  - `created_at` (timestamptz)
- **RLS**: Anyone can view, admins can manage
- **Note**: Primary membership is £150/month

#### `user_memberships`
- **Purpose**: User membership subscriptions
- **Columns**:
  - `id` (uuid, PK)
  - `user_id` (uuid, FK → profiles)
  - `membership_id` (uuid, FK → memberships)
  - `start_date` (timestamptz)
  - `end_date` (timestamptz)
  - `status` (text: 'active', 'expired', 'cancelled')
  - `payment_status` (text: 'paid', 'pending', 'failed')
  - `payment_method` (text, nullable) - Payment method: 'stripe', 'cash', 'staff', 'family', 'other', or NULL for legacy records
  - `stripe_subscription_id` (text, nullable) - Stripe subscription ID for Stripe-paid memberships. NULL for non-Stripe memberships
  - `cancelled_at` (timestamptz, nullable) - Timestamp when user requested cancellation. Used for non-Stripe payment methods to track cancellation requests for manual processing (direct debit, invoice, cash)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
- **RLS**: Users can view own, admins can manage all
- **Payment Tracking**: 
  - Stripe memberships: `payment_method = 'stripe'` and `stripe_subscription_id` contains the Stripe subscription ID
  - Admin-created memberships: `payment_method` set to 'cash', 'staff', 'family', or 'other' (no `stripe_subscription_id`)
  - Legacy records may have NULL `payment_method` (before migration)
- **Cancellation Tracking**: 
  - For Stripe memberships: Cancellation handled automatically via Stripe API (`cancel_at_period_end`)
  - For non-Stripe memberships: `cancelled_at` timestamp is set when user cancels, allowing admins to see cancellation requests and manually process (stop direct debit, skip invoice, etc.)
- **Migrations**: 
  - Run `ADD_PAYMENT_METHOD_TO_USER_MEMBERSHIPS.sql` to add `payment_method` and `stripe_subscription_id` columns
  - Run `ADD_CANCELLED_AT_TO_USER_MEMBERSHIPS.sql` to add `cancelled_at` column

#### `check_ins`
- **Purpose**: Gym visit tracking
- **Columns**:
  - `id` (uuid, PK)
  - `user_id` (uuid, FK → profiles)
  - `check_in_time` (timestamptz)
  - `check_out_time` (timestamptz, nullable)
  - `duration_minutes` (integer, nullable, auto-calculated)
  - `location` (text)
  - `created_at` (timestamptz)
- **RLS**: 
  - Users can view/insert/update own check-ins (`auth.uid() = user_id`)
  - Admins can view/update/delete all check-ins (`has_role(auth.uid(), 'admin')`)
- **Trigger**: Auto-calculates duration on checkout

#### `reward_claims`
- **Purpose**: Track reward claims via QR codes
- **Columns**:
  - `id` (uuid, PK)
  - `user_id` (uuid, FK → profiles)
  - `claimed_at` (timestamptz, default now())
  - `qr_code_data` (jsonb) - Stores the QR code data that was used
  - `qr_timestamp` (bigint) - Timestamp from QR code
  - `qr_session_id` (text) - Session ID from QR code
  - `reward_type` (text, default 'free_drink', CHECK: 'free_drink' or 'other')
  - `created_at` (timestamptz)
- **RLS**: 
  - Users can view/insert own reward claims (`auth.uid() = user_id`)
  - Admins can view/insert all reward claims (`has_role(auth.uid(), 'admin')`)
- **Indexes**: 
  - `idx_reward_claims_user_id` on `user_id`
  - `idx_reward_claims_claimed_at` on `claimed_at`
  - `idx_reward_claims_qr_timestamp_session` on `qr_timestamp, qr_session_id` (prevents duplicate claims)

#### `coupon_codes`
- **Purpose**: Discount and referral coupon code definitions
- **Columns**:
  - `id` (uuid, PK)
  - `code` (text, unique) - Coupon code (uppercase, alphanumeric with hyphens/underscores)
  - `type` (coupon_type enum: 'percentage', 'money_off') - Discount type
  - `value` (numeric(10,2)) - Percentage (0-100) or amount in pounds
  - `description` (text, nullable) - Optional description
  - `is_active` (boolean, default true) - Whether coupon is active
  - `usage_limit` (integer, nullable) - Maximum number of uses (NULL = unlimited)
  - `valid_from` (timestamptz, default now()) - Start date for validity
  - `valid_until` (timestamptz, nullable) - End date for validity (NULL = no expiration)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())
  - `created_by` (uuid, FK → profiles, nullable) - Admin who created the coupon
- **RLS**: 
  - Anyone can view active coupons (for public use)
  - Admins can view/insert/update/delete all coupons (`has_role(auth.uid(), 'admin')`)
- **Indexes**: 
  - `idx_coupon_codes_code` on `code`
  - `idx_coupon_codes_is_active` on `is_active`
  - `idx_coupon_codes_valid_dates` on `valid_from, valid_until`
  - `idx_coupon_codes_created_by` on `created_by`
- **Trigger**: Auto-updates `updated_at` on update

#### `coupon_usage`
- **Purpose**: Track when and by whom coupons are used
- **Columns**:
  - `id` (uuid, PK)
  - `coupon_id` (uuid, FK → coupon_codes, ON DELETE CASCADE)
  - `user_id` (uuid, FK → profiles, ON DELETE CASCADE)
  - `used_at` (timestamptz, default now()) - Timestamp when coupon was used
  - `order_id` (text, nullable) - For future Stripe integration
  - `created_at` (timestamptz, default now())
- **RLS**: 
  - Users can view/insert own coupon usage (`auth.uid() = user_id`)
  - Admins can view/insert all coupon usage (`has_role(auth.uid(), 'admin')`)
- **Indexes**: 
  - `idx_coupon_usage_coupon_id` on `coupon_id`
  - `idx_coupon_usage_user_id` on `user_id`
  - `idx_coupon_usage_used_at` on `used_at`

### Database Functions

#### `has_role(_user_id uuid, _role app_role) → boolean`
- **Purpose**: Check if user has specific role
- **Security**: SECURITY DEFINER (bypasses RLS to prevent infinite recursion)
- **Usage**: Used in RLS policies and application code
- **RLS Bypass**: Function runs with postgres role privileges (which has BYPASSRLS), preventing infinite recursion when called from RLS policies on `user_roles` table
- **Implementation**: Function uses `SECURITY DEFINER` to bypass RLS when querying `user_roles`, preventing infinite recursion
- **Migration**: Defined in `supabase/migrations/COMPLETE_SCHEMA_SETUP.sql` with proper SECURITY DEFINER and BYPASSRLS to fix infinite recursion

#### `has_valid_membership(_user_id uuid) → boolean`
- **Purpose**: Check if user has active paid membership
- **Security**: SECURITY DEFINER
- **Logic**: Checks for active status, paid payment, and valid end_date

#### `claim_reward(_user_id uuid, _qr_timestamp bigint, _qr_session_id text, _reward_type text) → jsonb`
- **Purpose**: Validates and records a reward claim via QR code
- **Security**: SECURITY DEFINER
- **Logic**: 
  - Validates QR code expiration (5 minutes)
  - Prevents duplicate claims (checks if QR code already used)
  - Inserts reward claim record
  - Returns success/error result
- **Returns**: JSON object with `success`, `message`, `error`, and `claimed_at` fields

#### `get_coupon_usage_count(_coupon_id uuid) → integer`
- **Purpose**: Returns the number of times a coupon has been used
- **Security**: SECURITY DEFINER
- **Usage**: Used in admin interface to display usage statistics

#### `is_coupon_valid(_code text) → boolean`
- **Purpose**: Checks if a coupon code is valid (active, within date range, not exceeded usage limit)
- **Security**: SECURITY DEFINER
- **Logic**: 
  - Checks if coupon exists
  - Validates coupon is active
  - Validates current date is within valid_from and valid_until range
  - Checks if usage limit has been reached
- **Returns**: true if coupon is valid and can be used, false otherwise

#### `update_updated_at_column()`
- **Purpose**: Trigger function to update `updated_at` timestamp
- **Applied to**: profiles, classes, user_memberships

#### `calculate_check_in_duration()`
- **Purpose**: Calculate visit duration in minutes
- **Applied to**: check_ins table

#### `handle_new_user()`
- **Purpose**: Auto-create profile and assign 'member' role on signup
- **Trigger**: After INSERT on auth.users
- **Security**: SECURITY DEFINER function (bypasses RLS)
- **Error Handling**: Uses `ON CONFLICT DO NOTHING` to prevent failures if profile/role already exists
- **Graceful Failure**: Catches all exceptions and logs warnings without failing the auth.users insert
- **Fallback**: Client-side `ensureProfileAndRole()` function in `Register.tsx` creates profile/role if trigger fails

### Database Enums

- **`app_role`**: 'admin', 'staff', 'member'
- **`coupon_type`**: 'percentage', 'money_off'

## 🔐 Environment Variables & Secrets

### Frontend Environment Variables (Vite)
Located in `.env` files (not in repo, use GitHub Secrets for CI/CD):
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous/public key

**Current fallback values** (in `src/integrations/supabase/client.ts`):
- URL: `https://yggvabrltcxvkiyjixdv.supabase.co` (trailing slash removed automatically)
- Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (hardcoded fallback)
- **Client Configuration**: 
  - Auth: Uses localStorage, auto-refresh enabled, persist session
  - URL is cleaned to remove trailing slashes before creating client
  - Uses default schema (no explicit schema specification needed)

### Supabase API Settings (Dashboard Configuration)
Located in Supabase Dashboard → Settings → API:
- **Exposed schemas**: Must include `public` (required for application to work)
  - Tables, views, and stored procedures in exposed schemas get API endpoints
  - Default should include: `api`, `public`
  - **Note**: Even if `public` schema is not exposed, it's still accessible via GraphQL endpoints, but not via REST API (supabase-js uses REST API)
- **Extra search path**: Should include `public`, `extensions`
  - Adds these schemas to the search path of every request
- **Max rows**: Maximum rows returned from views/tables/stored procedures (prevents large payloads)

### Supabase Edge Functions Environment Variables
Set in Supabase Dashboard → Project Settings → Edge Functions:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Public anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (admin access)
- `STRIPE_SECRET_KEY` - Stripe secret API key
- `STRIPE_PRODUCT_ID` - Stripe Product ID for membership subscriptions (required for dynamic pricing)

### GitHub Secrets (for CI/CD)
Used in `.github/workflows/github-actions-demo.yml`:
- `SUPABASE_ACCESS_TOKEN` - Supabase CLI access token
- `SUPABASE_PROJECT_ID` - Supabase project ID (`yggvabrltcxvkiyjixdv`)

## 🔄 Supabase Edge Functions

### `create-checkout`
- **Purpose**: Create Stripe checkout session for membership subscription with dynamic pricing
- **Method**: POST
- **Auth**: Requires Bearer token
- **Request Body**: Optional `{ membership_id: string }` - If provided, uses the membership's price to create/find a Stripe price
- **Returns**: Stripe checkout URL
- **Dynamic Pricing**: 
  - If `membership_id` is provided, fetches membership from database and uses its price
  - Searches for existing Stripe price with matching amount (in GBP, monthly recurring)
  - Creates new Stripe price if none exists (requires `STRIPE_PRODUCT_ID` environment variable)
  - Falls back to default `price_1STEriRpTziRf7OxCPXLGPLw` (£150/month) if no membership or price found
- **Price Matching**: Matches prices by amount (in pence), currency (GBP), and interval (month)
- **Price Creation**: Automatically creates new Stripe prices when needed, using membership name as nickname
- **Success URL**: `/mars-space-gym-buddy/managememberships?success=true&session_id={CHECKOUT_SESSION_ID}` (includes base path for GitHub Pages)
- **Cancel URL**: `/mars-space-gym-buddy/managememberships?canceled=true` (includes base path for GitHub Pages)
- **Validation**: Server-side email validation and rate limiting (5 requests per minute per IP)
- **Metadata**: Includes `supabase_user_id` and `membership_id` in checkout session metadata

### `check-subscription`
- **Purpose**: Check Stripe subscription status and sync with database
- **Method**: POST
- **Auth**: Requires Bearer token (uses SERVICE_ROLE_KEY)
- **Returns**: Subscription status and updates `user_memberships` table
- **Logic**: Creates or updates membership record based on Stripe subscription
- **Payment Tracking**: Automatically sets `payment_method = 'stripe'` and `stripe_subscription_id` when syncing Stripe subscriptions

### `cancel-subscription`
- **Purpose**: Cancel Stripe subscription at period end or cancel non-Stripe memberships
- **Method**: POST
- **Auth**: Requires Bearer token (uses SERVICE_ROLE_KEY)
- **Returns**: Cancellation confirmation
- **Logic**: 
  - **Membership Type Detection**: 
    - Checks `payment_method` column first - if explicitly set to non-Stripe value (staff, family, cash, other), treats as non-Stripe regardless of Stripe customer status
    - Only treats as Stripe if `payment_method = 'stripe'` OR `stripe_subscription_id` is present
    - Prevents non-Stripe memberships from entering Stripe cancellation path even if user's email exists in Stripe
  - **For Stripe memberships**: 
    - Sets `cancel_at_period_end: true` in Stripe (stops recurring payments at period end)
    - Keeps status as 'active' until period end (membership benefits continue)
    - Stripe handles the actual cancellation at period end
  - **For non-Stripe memberships** (cash, staff, family, other, direct debit, invoice): 
    - Sets `cancelled_at` timestamp to track cancellation request
    - Keeps status as 'active' until `end_date` (membership benefits continue)
    - Skips all Stripe API calls
    - Returns success immediately after database update
    - **Admin Visibility**: `cancelled_at` timestamp allows admins to see cancellation requests in `/admin/usermemberships` and manually process (stop direct debit, skip invoice, etc.)
  - **Error Handling**: Comprehensive logging and error messages for debugging

## 🛣️ Application Routes

**Note**: All routes below are relative to the base path `/mars-space-gym-buddy` on GitHub Pages. In development, they work at `http://localhost:8080/`. In production, they work at `https://pinnacleadvisors.github.io/mars-space-gym-buddy/`.

### Public Routes
- `/` - Landing page
- `/login` - User login (supports email/password and Google OAuth)
- `/register` - User registration (supports email/password and Google OAuth)
- `/forgot-password` - Password reset request
- `/reset-password` - Password reset form
- `/auth/callback` - OAuth and email verification callback handler (processes tokens from Google OAuth, email verification links)

### Email Verification Route
- `/verify-email` - Email verification required page (requires authentication but not email verification)
  - Shown automatically after user signup
  - User must click verification link in email before accessing protected routes
  - Provides resend verification email functionality

### Authenticated User Routes (Protected by `ProtectedRoute`)
- `/dashboard` - User dashboard
- `/classes` - Browse classes
- `/bookings` - View/manage bookings
- `/managememberships` - Membership management
- `/profile` - User profile management (view/edit profile, membership history, booking history)
- `/qr/entry-exit` - QR check-in/check-out (requires valid membership + location, toggles between entry and exit based on active check-in status)
- `/rewards` - Rewards page (tracks gym hours and classes, displays QR code when goals reached)
- `/settings` - Settings page (change password, 2FA placeholder, email preferences, account settings)
- `/rewards` - Rewards page (tracks gym hours and classes, displays QR code when goals reached)

**Note**: All authenticated routes are wrapped with `ProtectedRoute` component which:
- Checks if user is authenticated
- Redirects to `/login` if not authenticated
- Shows `EmailVerificationRequired` page if email is not verified (when `requireEmailVerification` is true, default)
- Preserves attempted location for redirect after login

### Admin Routes (Protected by `AdminRoute`)
- `/admin` - Admin dashboard
- `/admin/users` - User management
- `/admin/analytics` - Analytics dashboard
- `/admin/manageclasses` - Class management
- `/admin/memberships` - Membership plan management
- `/admin/usermemberships` - User membership management
- `/admin/managedeals` - Deals & Referrals management (coupon code CRUD, usage tracking)
- `/admin/reward-claim` - Reward claim scanner (for staff to scan member QR codes)

**Note**: All admin routes are wrapped with `AdminRoute` component which:
- Checks if user is authenticated and has admin role
- Shows `AdminLogin` page if not authenticated or not admin
- Uses `useAdminAuth` hook to verify admin status

## 🎨 Styling & Theming

### Tailwind Configuration
- **Theme**: Custom color system with CSS variables
- **Colors**: Primary, secondary, accent, destructive, muted, success
- **Gradients**: Custom gradient utilities (primary, secondary, accent, hero)
- **Shadows**: Custom shadow utilities including glow effect
- **Border Radius**: Custom radius system
- **Dark Mode**: Class-based dark mode support

### CSS Variables
Defined in `src/index.css`:
- Color tokens (HSL format)
- Gradient definitions
- Shadow definitions
- Border radius variables
- Transition properties

## 🔧 Key Configuration Files

### `vite.config.ts`
- **Base Path**: 
  - Development: `/` (for seamless local preview at `http://localhost:8080/`)
  - Production: `/mars-space-gym-buddy/` (for GitHub Pages deployment)
  - Automatically switches based on build mode (`mode === "production"`)
- **Port**: 8080
- **Alias**: `@` → `./src`
- **Plugins**: React SWC, lovable-tagger (dev only)
- **Note**: Base path handles asset paths (images, CSS, JS) automatically. Use `import.meta.env.BASE_URL` for static assets (images in `public/` folder) to ensure correct paths in both dev and production

### React Router Configuration
- **Base Path**: Conditionally set via `BrowserRouter basename` prop
  - Development: `undefined` or `''` (routes work at `http://localhost:8080/`)
  - Production: `/mars-space-gym-buddy` (routes work at `https://pinnacleadvisors.github.io/mars-space-gym-buddy/`)
- **Base Path Detection**: `pathUtils.ts` provides `getBasePath()` which:
  - Returns `/mars-space-gym-buddy` when hostname is `pinnacleadvisors.github.io`
  - Returns `''` (empty string) for localhost/127.0.0.1 (development)
  - Used in `App.tsx` to set `BrowserRouter basename` prop
- **Navigation**: All `navigate()` calls use relative paths (e.g., `/login`, `/dashboard`) and automatically account for base path
- **Utilities**: `pathUtils.ts` provides `getFullPath()` and `getFullRedirectUrl()` for external redirects (Supabase emailRedirectTo, OAuth, etc.)

### Layout & Navigation Configuration
- **AppLayout**: Conditionally renders navigation (TopBar, Sidebar) only for authenticated users on protected routes
- **Public Routes**: Landing, Login, Register, ForgotPassword, and ResetPassword pages render without navigation
- **Protected Routes**: Navigation is shown automatically when user is authenticated
- **Sidebar**: 
  - Desktop: Fixed sidebar on the left with collapsible icon mode
  - Mobile: Slide-out drawer (Sheet component) accessible via trigger button in TopBar
  - Auto-closes on mobile after navigation
  - Shows main menu items (Classes, Bookings, Membership, Rewards, Dashboard, Profile)
  - Shows admin menu items when user is admin
  - Shows quick actions (Entry/Exit QR)
  - Responsive design with mobile-optimized layout
- **TopBar**: 
  - Contains sidebar trigger button for mobile
  - Shows "Book Class" button and user avatar menu
  - Sticky header with backdrop blur
- **Image Paths**: Use `import.meta.env.BASE_URL` for public folder assets to handle GitHub Pages base path correctly

### `tsconfig.json`
- **Path Alias**: `@/*` → `./src/*`
- **Strict Mode**: Disabled (noImplicitAny: false, strictNullChecks: false)
- **Allow JS**: true

### `package.json` Scripts
- `dev` - Start development server at `http://localhost:8080/` (base path: `/`)
- `build` - Build for production with base path `/mars-space-gym-buddy/` (for GitHub Pages)
- `preview` - Preview production build locally (uses production base path)
- `deploy` - Deploy to GitHub Pages (builds and pushes `dist/` to `gh-pages` branch)
- `gen:types` - Generate Supabase TypeScript types (updates `src/types/database.ts`)
- `sync:types` - Sync database types from GitHub (pulls latest changes)
- `watch:types` - Watch for database type updates and auto-pull (runs in background)

### Local Development Setup
1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```
   - Server runs at `http://localhost:8080/`
   - Base path is automatically set to `/` (no `/mars-space-gym-buddy/` prefix)
   - Hot module replacement (HMR) enabled for instant updates
   - Source maps enabled for debugging
   - Access routes at `http://localhost:8080/`, `http://localhost:8080/login`, etc.

3. **Preview Production Build Locally**:
   ```bash
   npm run build
   npm run preview
   ```
   - Builds with production base path `/mars-space-gym-buddy/`
   - Preview server runs locally to test production build
   - Useful for testing before deploying to GitHub Pages

4. **Deploy to GitHub Pages**:
   ```bash
   npm run deploy
   ```
   - Builds with production base path
   - Deploys to `https://pinnacleadvisors.github.io/mars-space-gym-buddy/`

**Important Notes**: 
- In development, access routes at `http://localhost:8080/` (no base path prefix)
- Static assets (images in `public/` folder) should use `import.meta.env.BASE_URL` which automatically adjusts for dev vs production
- The `pathUtils.ts` utilities handle base path detection automatically based on hostname
- The `vite.config.ts` uses conditional base path: `/` in dev, `/mars-space-gym-buddy/` in production

### `package.json` Scripts
- `dev` - Start development server at `http://localhost:8080/` (base path: `/`)
- `build` - Build for production with base path `/mars-space-gym-buddy/` (for GitHub Pages)
- `preview` - Preview production build locally (uses production base path)
- `deploy` - Deploy to GitHub Pages (builds and pushes `dist/` to `gh-pages` branch)
- `gen:types` - Generate Supabase TypeScript types (updates `src/types/database.ts`)
- `sync:types` - Sync database types from GitHub (pulls latest changes)
- `watch:types` - Watch for database type updates and auto-pull (runs in background)

### GitHub Actions Workflow
- **File**: `.github/workflows/github-actions-demo.yml`
- **Trigger**: Runs on every push to `main` branch
- **Purpose**: Automatically generates and commits updated Supabase types to `src/types/database.ts`
- **Requirements**: 
  - `SUPABASE_ACCESS_TOKEN` secret must be set in repository settings
  - `SUPABASE_PROJECT_ID` secret must be set (value: `yggvabrltcxvkiyjixdv`)
- **Process**: 
  1. Installs Supabase CLI
  2. Generates types using `supabase gen types typescript`
  3. Checks if `src/types/database.ts` has changes
  4. Commits and pushes changes if types were updated
  5. Uses `[skip ci]` in commit message to prevent infinite loops
  6. Creates a summary in GitHub Actions UI with instructions to pull latest changes
- **Local Sync**: After the workflow runs, sync the latest changes using one of these methods:
  
  **Option 1: Manual sync (recommended)**
  ```bash
  npm run sync:types
  ```
  This script checks for remote changes and pulls them safely, handling local modifications.
  
  **Option 2: Automatic watch mode**
  ```bash
  npm run watch:types
  ```
  This runs in the background and automatically pulls database type updates every 30 seconds.
  Press Ctrl+C to stop watching.
  
  **Option 3: Manual git pull**
  ```bash
  git pull origin main
  ```
  
  The workflow summary in GitHub Actions will remind you when types are updated.

## 📝 Important Notes

### Type Definitions
- **Primary**: `src/types/database.ts` - **Source of truth** for database schema (auto-generated, updated on every commit to `main`)
  - This file is automatically synced from Supabase via GitHub Actions
  - Always refer to this file for the current database structure
  - Run `npm run sync:types` to pull the latest schema changes locally
  - **Migration Files**: Schema is defined in `supabase/migrations/COMPLETE_SCHEMA_SETUP.sql`; run it in Supabase Dashboard SQL Editor to set up the database
  - **TypeScript Types**: `database.ts` reflects the current state after migrations are run

### Authentication Flow
1. **User Signup (Email/Password)**:
   - User submits registration form with email, password, and full name
   - `supabase.auth.signUp()` creates auth user and triggers `handle_new_user()` database function
   - `handle_new_user()` trigger (SECURITY DEFINER) automatically:
     - Creates row in `profiles` table with user ID and full name
     - Creates row in `user_roles` table with user ID and 'member' role
   - **Fallback Mechanism**: If trigger fails or doesn't fire, `Register.tsx` includes `ensureProfileAndRole()` function that:
     - Checks if profile exists, creates it if missing
     - Checks if 'member' role exists, creates it if missing
     - Runs after signup to ensure data exists
   - **RLS Policies**: Users can insert their own profile and 'member' role as fallback (defined in Supabase Dashboard)
   - **Email Verification**: 
     - Verification email sent with a link (via `emailRedirectTo` option)
     - After signup, user is redirected to `/verify-email` page (not dashboard)
     - User must click the verification link in the email before accessing protected routes
     - **Future Implementation**: OTP code verification can be added in the future if needed (see `Register.tsx` for TODO comment)
2. **Google OAuth Signup/Login**:
   - User clicks "Sign in with Google" or "Sign up with Google" button
   - `supabase.auth.signInWithOAuth()` redirects user to Google's OAuth consent page
   - User authenticates with Google and grants permissions
   - Google redirects back to `/auth/callback` with auth tokens in the URL hash
   - `AuthCallback.tsx` processes the tokens and establishes the session
   - **Profile/Role Creation**: `AuthCallback.tsx` calls `ensureProfileAndRole()` to:
     - Create profile with `full_name` from Google (using `user_metadata.name` or `user_metadata.full_name`)
     - Set `avatar_url` from Google profile picture (using `user_metadata.picture`)
     - Assign 'member' role to the user
   - User is redirected to `/dashboard` after successful authentication
   - **Note**: Google OAuth users skip email verification since Google already verified the email
3. **Apple OAuth (Future Implementation)**:
   - Apple Sign In is commented out but saved for future implementation
   - See `Login.tsx` and `Register.tsx` for TODO comments with Apple OAuth code
4. **Email Verification Flow**:
   - After email/password signup, user is automatically redirected to `/verify-email` page
   - User receives verification email with link
   - User must click the link in the email to verify their account
   - Clicking the verification link verifies email and redirects to dashboard
   - If user tries to access protected routes without verification, `ProtectedRoute` shows `EmailVerificationRequired` page
   - User can resend verification email from `EmailVerificationRequired` page
   - **Route**: `/verify-email` - Dedicated route for email verification (requires authentication but not email verification)
   - **Note**: OAuth users (Google) are considered email-verified by default
5. Admin login checks `has_role()` RPC function
6. `useAdminAuth` hook manages admin state and redirects
7. `useAuth` hook manages user authentication and session
   - **Fallback User Creation**: If profile/role queries fail, creates minimal user from auth user data to prevent redirect loops
   - **Auth State Listener**: Automatically updates user data on SIGNED_IN, TOKEN_REFRESHED, and USER_UPDATED events
   - **Immediate Fallback User**: On SIGNED_IN event, immediately sets fallback user from session data before fetching full profile data
   - **Error Handling**: Always creates user object even if database queries fail, ensuring login completes successfully
8. `useSessionManager` hook monitors session expiration and shows warnings
9. Session automatically refreshes on app load if expired
10. Session warnings shown at 15 minutes and 5 minutes before expiration
11. Email verification enforced via `ProtectedRoute` component (users verify via link in email, not OTP code)
12. Account lockout after 5 failed login attempts (15 minute lockout duration)
13. **Login Flow**: After successful login, waits 1 second before navigation to ensure auth state listener has processed and set user in useAuth hook

### Google OAuth Setup (Supabase Dashboard)
To enable Google Sign In, configure the following in Supabase Dashboard:

1. **Enable Google Provider**:
   - Go to Supabase Dashboard → Authentication → Providers
   - Find "Google" and click to enable it
   - You'll need Client ID and Client Secret from Google Cloud Console

2. **Google Cloud Console Setup**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Navigate to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Add Authorized JavaScript origins:
     - `https://yggvabrltcxvkiyjixdv.supabase.co` (your Supabase project URL)
     - `http://localhost:8080` (for local development)
   - Add Authorized redirect URIs:
     - `https://yggvabrltcxvkiyjixdv.supabase.co/auth/v1/callback` (Supabase callback)
   - Copy the Client ID and Client Secret

3. **Configure in Supabase**:
   - Paste the Google Client ID and Client Secret in Supabase Dashboard
   - Save the configuration

4. **Redirect URLs Configuration**:
   - The app uses `getFullRedirectUrl('/auth/callback')` for OAuth redirects
   - Development: `http://localhost:8080/auth/callback`
   - Production: `https://pinnacleadvisors.github.io/mars-space-gym-buddy/auth/callback`

5. **OAuth Query Parameters**:
   - `access_type: 'offline'` - Requests refresh token for longer sessions
   - `prompt: 'consent'` - Always shows consent screen (useful for testing)

**Note**: Apple Sign In is saved for future implementation. See commented code in `Login.tsx` and `Register.tsx`.

### Membership Flow
1. User clicks "Start Membership" or "Renew Membership" → `create-checkout` function
   - Frontend passes `membership_id` in request body
   - Function fetches membership from database to get price
2. **Dynamic Price Resolution**:
   - Function searches for existing Stripe price matching the membership price (GBP, monthly)
   - If found, uses existing price ID
   - If not found, creates new Stripe price (requires `STRIPE_PRODUCT_ID` environment variable)
   - Falls back to default £150 price if no membership or price found
3. Redirected to Stripe checkout with correct price
4. On success → `check-subscription` syncs with database
   - Sets `payment_method = 'stripe'` and `stripe_subscription_id` automatically
5. `has_valid_membership()` RPC checks active membership for check-ins
6. **Admin-created memberships**: Admins can manually create memberships with `payment_method` set to 'cash', 'staff', 'family', or 'other' (no Stripe subscription)
7. **Cancellation**: 
   - **Stripe memberships**: Cancelled via Stripe API (sets `cancel_at_period_end: true`), which stops recurring payments at period end. Membership remains active until period end.
   - **Non-Stripe memberships**: When user cancels, `cancelled_at` timestamp is set in database. Membership remains active until `end_date`. Admins can view cancelled memberships in `/admin/usermemberships` to manually process (stop direct debit, skip invoice, etc.)
   - **Membership Type Detection**: The `cancel-subscription` function uses `payment_method` as the source of truth - if `payment_method` is explicitly set to a non-Stripe value (staff, family, cash, other), it will never attempt Stripe cancellation, even if the user's email exists in Stripe from previous transactions

### Check-in/Check-out Flow
1. User must have valid membership (`has_valid_membership()`)
2. Location must be within 100m of target coordinates (51.4981, -0.0544)
3. Check-in creates record in `check_ins` table
4. Check-out updates `check_out_time` and calculates duration

### Known TODOs
- ✅ `useAuth.ts` - Authentication logic implemented
- ✅ `useBookings.ts` - Booking fetching implemented
- ✅ `useAnalytics.ts` - Analytics fetching implemented

## 🐛 Common Issues & Solutions

### Route 404 Errors in Local Development
- **Issue**: Accessing `/mars-space-gym-buddy/` locally causes 404
- **Solution**: The `NotFound.tsx` component automatically redirects `/mars-space-gym-buddy/` to `/` in development
- **Note**: Always access routes at `http://localhost:8080/` (not `/mars-space-gym-buddy/`) when running locally
- **Cause**: Base path is set to `/mars-space-gym-buddy/` in production but `/` in development

### Infinite Recursion in RLS Policies
- **Issue**: Error "infinite recursion detected in policy for relation 'user_roles'"
- **Cause**: `has_role()` function queries `user_roles` table, but RLS policies on `user_roles` call `has_role()`, creating infinite loop
- **Solution**: `has_role()` function uses `SECURITY DEFINER` with postgres role (which has BYPASSRLS) to bypass RLS checks
- **Migration**: Fixed in `supabase/migrations/COMPLETE_SCHEMA_SETUP.sql` - `has_role()` function is created with `SECURITY DEFINER` and `BYPASSRLS` to prevent infinite recursion
- **Status**: Run `COMPLETE_SCHEMA_SETUP.sql` migration to fix this issue

### Foreign Key Relationship Errors in Supabase Queries
- **Issue**: "Could not find a relationship between 'class_bookings' and 'class_sessions'"
- **Cause**: `class_bookings.class_id` was referencing `classes` instead of `class_sessions` in the database
- **Solution**: Migration `supabase/migrations/COMPLETE_SCHEMA_SETUP.sql` fixes the foreign key to reference `class_sessions`
- **Migration**: The migration creates the correct foreign key relationship when setting up the schema
- **Note**: After running the migration, use `class_sessions(...)` syntax in select queries: `.select('*, class_sessions(id, name, instructor, ...)')`

### Import Path Issues
- Always use `@/` alias for imports from `src/`
- Toast hook: Use `@/hooks/use-toast`, NOT `@/components/ui/use-toast`

### Database Type Issues
- Use `@/types/database.ts` for Database type
- Import: `import type { Database } from '@/types/database'`

### Environment Variables
- Frontend: Use `import.meta.env.VITE_*`
- Edge Functions: Use `Deno.env.get()`

### RLS Policy Issues
- All tables have RLS enabled
- Use `has_role()` function for admin checks
- Users can only access their own data unless admin
- **Infinite Recursion Fix**: The `has_role()` function uses SECURITY DEFINER with postgres role (which has BYPASSRLS) to prevent infinite recursion when checking roles from RLS policies

### Supabase API Configuration (Critical)
- **Exposed Schemas**: Must include `public` in the exposed schemas list
  - Location: Supabase Dashboard → Settings → API → Exposed schemas
  - Required: Add `public` to the list (should have both `api` and `public`)
  - Why: All database tables are in the `public` schema, so it must be exposed for queries to work
  - Security: Exposing `public` schema is safe because RLS policies protect all data
  - Without this: All queries will fail with 406 error "The schema must be one of the following: api"
- **Extra Search Path**: Should include `public` and `extensions`
  - This allows queries to work without explicitly specifying the schema
- **Max Rows**: Recommended limit (default is usually 1000) to prevent large payload responses

### Supabase Client Configuration Issues
- **406 Error "The schema must be one of the following: api"**: 
  - **Primary Cause**: `public` schema is not in the "Exposed schemas" list in Supabase Dashboard
  - **Solution**: Add `public` to Exposed schemas in Dashboard → Settings → API
  - **Secondary checks if issue persists**:
    - Ensure the Supabase URL doesn't have a trailing slash (automatically cleaned in client.ts)
    - Verify environment variables are set correctly (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
    - Check that the Supabase project is active and accessible
    - Ensure the anon key matches the project's public anon key from Supabase Dashboard
  - **Security Note**: Exposing `public` schema is secure because RLS policies enforce row-level access control

### Login Loading Loop Issues
- **Symptom**: Login button shows loading spinner indefinitely after successful login
- **Causes**:
  1. `fetchUserData` queries are failing or hanging (e.g., 406 schema errors)
  2. Auth state change listener sets loading but never completes
  3. Race condition between login navigation and auth state updates
- **Fixes Implemented**:
  1. **Fallback User Creation**: `useAuth` hook now creates minimal user object from auth user data if `fetchUserData` fails, preventing redirect loops
  2. **Error Handling**: Always ensures loading state is set to false, even when queries fail
  3. **Navigation Delay**: Login page waits 100ms before navigation to allow auth state to propagate
  4. **Graceful Degradation**: User can log in even if profile/role/membership queries fail temporarily
- **Note**: After exposing `public` schema, these issues should resolve, but fallback handling ensures robust operation

## 🔍 Code Patterns

### Authentication with useAuth Hook
```typescript
import { useAuth } from "@/hooks/useAuth";

const MyComponent = () => {
  const { user, loading, login, logout, register, getUser } = useAuth();

  // User is automatically fetched and updated on auth state changes
  // Includes profile, role, and membership data
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in</div>;
  
  return <div>Welcome, {user.full_name}!</div>;
};
```

### Route Protection
```typescript
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";

// Protect authenticated routes
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>

// Protect admin routes
<Route
  path="/admin"
  element={
    <AdminRoute>
      <AdminDashboard />
    </AdminRoute>
  }
/>
```

### Path Utilities (GitHub Pages Base Path)
```typescript
import { getBasePath, getFullPath, getFullRedirectUrl } from '@/lib/utils/pathUtils';

// Get base path (only returns '/mars-space-gym-buddy' in production)
const basePath = getBasePath(); // Returns '/mars-space-gym-buddy' or ''

// Get full path with base path (for internal redirects)
const fullPath = getFullPath('/dashboard'); // Returns '/mars-space-gym-buddy/dashboard' or '/dashboard'

// Get full redirect URL with origin (for Supabase emailRedirectTo, OAuth redirects)
const redirectUrl = getFullRedirectUrl('/dashboard'); 
// Returns 'https://pinnacleadvisors.github.io/mars-space-gym-buddy/dashboard' in production
// Returns 'http://localhost:8080/dashboard' in development

// Usage in Supabase auth
await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: getFullRedirectUrl('/dashboard'),
  },
});
```

### Session Management
```typescript
import { useSessionManager } from "@/hooks/useSessionManager";
import { useAuth } from "@/hooks/useAuth";
import { withSessionHandling } from "@/lib/utils/sessionUtils";

// Session monitoring (automatically initialized in AppLayout)
useSessionManager(); // Monitors session and shows warnings

// Manual session refresh
const { refreshSession } = useAuth();
await refreshSession();

// Handle session errors in API calls
const { data, error } = await withSessionHandling(() =>
  supabase.from('table').select('*')
);
```

### Bookings Management with useBookings Hook
```typescript
import { useBookings } from "@/hooks/useBookings";

const MyComponent = () => {
  const { bookings, loading, error, createBooking, cancelBooking, refreshBookings } = useBookings();

  // Bookings are automatically fetched and updated in real-time
  // Includes class session details (name, instructor, start_time, etc.)
  
  const handleBook = async (classId: string) => {
    const result = await createBooking(classId);
    if (result.success) {
      // Booking created successfully
    } else {
      // Show error: result.error
    }
  };

  const handleCancel = async (bookingId: string) => {
    const result = await cancelBooking(bookingId);
    if (result.success) {
      // Booking cancelled successfully
    } else {
      // Show error: result.error
    }
  };
};
```

### Landing Page Features
The Landing page (`src/pages/Landing.tsx`) includes:
- **High-end welcome/onboarding screen**: Premium design with full-screen hero background image
- **Full-screen hero background**: Uses `hero-background.jpg` as fixed background with overlay for readability
  - Image path uses `import.meta.env.BASE_URL` for proper GitHub Pages base path handling
- **Centered logo**: Displays `earth-space-logo-9.webp` near the top of the page
  - Image path uses `import.meta.env.BASE_URL` for proper GitHub Pages base path handling
- **Premium typography**: 
  - Large serif headline "Welcome to Earth Space" in white (5xl to 7xl responsive sizing)
  - Sans-serif body text in white describing features (class timetable, class booking, membership management)
- **Pill-shaped action buttons**: Two horizontally aligned buttons at the bottom:
  - Primary button: Solid white background with black text, labeled "LOG IN"
  - Secondary button: White outline with white text, labeled "JOIN EARTH SPACE"
- **Design principles**: Generous spacing, strong visual hierarchy, premium typography, clean layout, muted luxury color palette
- **Responsive design**: Adapts to mobile, tablet, and desktop screen sizes
- **Navigation**: Log in button navigates to `/login`, Join button navigates to `/register`
- **No App Navigation**: Renders without TopBar, BottomNav, or Sidebar (public route)

### Classes Page Features
The Classes page (`src/pages/Classes.tsx`) includes:
- **Hero Section**: Large headline "Award-winning classes led by the best instructors" with tagline
- **Category Filter Buttons**: Horizontal pill-shaped buttons at top (All, Combat, Cycle, Mind & Body, etc.) matching Third Space design
- **Dual View Modes**: 
  - Grid view: Card-based layout showing all available sessions (default view)
  - Calendar view: Monthly calendar grid with day view for detailed scheduling
- **Enhanced Class Cards**: 
  - Large category/class image at top with hover effects
  - Class name as prominent heading
  - Description text (truncated with line-clamp)
  - Instructor name
  - Time, duration, and availability information
  - "Book Class" button with large size
  - Visual status badges (Full, Few Spots Left, Booked)
- **Calendar View Features**:
  - Monthly 30-day calendar grid showing available classes
  - Pill-shaped session labels in date cells showing class name
  - Click date to view detailed day agenda
  - Day view with vertical timeline showing all sessions for selected day
  - Week strip navigation for easy date selection
  - Session details include: class name, instructor, time, duration, availability
- **Real-time availability**: Shows available spots vs capacity for each class session
- **Booking integration**: Uses `useBookings` hook for booking functionality
- **User bookings display**: Shows which classes the user has already booked
- **Booking confirmation**: Dialog confirms booking details before creating
- **Advanced Filtering**: 
  - Search by class name, instructor, or class template name
  - Filter by class name (from class templates)
  - Filter by fitness category (using category buttons or dropdown)
  - Filter by instructor
  - Filter by date (today, this week, upcoming, my bookings)
- **Category Integration**: 
  - Fetches categories from `class_categories` table
  - Displays category images when filtering
  - Uses category_id for filtering (with fallback to legacy category text)
- **Visual indicators**: Badges show "Full", "Few Spots Left", or "Booked" status
- **Error handling**: Toast notifications for booking success/failure
- **Date formatting**: Uses `date-fns` for readable date/time display

### Dashboard Features
The Dashboard page (`src/pages/Dashboard.tsx`) includes:
- **Quick Actions**: Large buttons for Check In/Out, Book a Class, and My Bookings
- **Statistics Cards**: 
  - Visits this month (with total visits trend)
  - Classes attended this month (with total attended trend)
  - Active bookings count (with upcoming count)
  - Membership status (Active/Expired/None with days remaining)
- **Membership Status Widget**: 
  - Shows current membership name, status, and expiration date
  - Displays days remaining for active memberships
  - Renew button for expired/inactive memberships
  - Status badges (Active, Expired, Inactive)
- **Upcoming Class Reminders**:
  - Shows next 3 upcoming classes
  - Highlights classes within 24 hours with badges
  - Displays time until class (hours/minutes)
  - Quick navigation to bookings page
- **QR Code Display**: 
  - Shows entry QR code when no active check-in
  - Shows exit QR code when active check-in exists
  - Download and refresh functionality
- **Recent Activity Feed**:
  - Combines check-ins and class attendance
  - Shows last 5 activities sorted by date
  - Visual indicators for completed activities
  - Displays location and timestamps
- **Class Schedule Summary**:
  - Quick view of upcoming classes
  - Links to full bookings page
  - Browse classes button when no bookings
- **Real-time Data**: Fetches latest bookings, check-ins, and membership status
- **Loading States**: Uses LoadingSpinner component during data fetch
- **Error Handling**: Toast notifications for errors

### Profile Management Features
The Profile page (`src/pages/Profile.tsx`) includes:
- **Profile Information Tab**:
  - View and edit personal information (name, phone, address, date of birth)
  - Emergency contact information
  - Health notes (confidential)
  - Profile picture upload with avatar display
  - Form validation using Zod schemas
  - Input sanitization for security
- **Profile Picture Upload**:
  - Upload images to Supabase Storage (`avatars` bucket)
  - File type validation (images only)
  - File size validation (max 5MB)
  - Automatic URL generation and profile update
  - Avatar display with fallback initials
- **Membership History Tab**:
  - Complete membership subscription history
  - Shows membership name, price, dates, and status
  - Status badges (Active, Expired, Inactive)
  - Payment status display
  - Quick link to membership plans
- **Booking History Tab**:
  - Complete class booking history (last 50 bookings)
  - Shows class name, instructor, date/time
  - Booking status badges (Booked, Attended, Cancelled, No Show)
  - Booking date information
  - Quick link to browse classes
- **Tabbed Interface**: Organized into Profile, Membership History, and Booking History
- **Edit Mode**: Toggle between view and edit modes for profile information
- **Real-time Updates**: Fetches latest data on page load
- **Error Handling**: Toast notifications for all operations
- **Loading States**: Loading spinner during data fetch

**Note**: The `avatars` storage bucket must be created in Supabase Storage for profile picture uploads to work. The bucket should be public or have appropriate RLS policies.

### Settings Page Features
The Settings page (`src/pages/Settings.tsx`) includes:
- **Change Password**:
  - Requires current password verification
  - Validates new password strength (8+ chars, uppercase, lowercase, number)
  - Prevents reusing current password
  - Password visibility toggles for all fields
  - Form validation using Zod schemas
- **Two-Factor Authentication (2FA)**:
  - Toggle switch for enabling/disabling 2FA
  - Placeholder implementation with "Coming Soon" message
  - Ready for future 2FA integration
- **Email Preferences**:
  - Email notifications toggle (account and security updates)
  - Booking reminders toggle
  - Marketing emails toggle
  - Save preferences functionality
- **Account Settings**:
  - Display current email address (read-only)
  - Account creation date
  - Email change requires support contact (placeholder)
- **Danger Zone**:
  - Sign out button with logout functionality
  - Destructive styling for irreversible actions
- **Security Features**:
  - Current password verification before allowing password change
  - Password strength validation
  - Secure password update via Supabase Auth
- **User Experience**:
  - Clear section organization with cards
  - Loading states for all actions
  - Toast notifications for success/error feedback
  - Responsive design for all screen sizes

### Bookings Page Features
The Bookings page (`src/pages/Bookings.tsx`) includes:
- **Real bookings data**: Uses `useBookings` hook to fetch and display user's actual bookings
- **List and Calendar views**: Toggle between list view and calendar view (calendar view is default)
- **Calendar View Features**:
  - Monthly 30-day calendar grid showing all user bookings
  - Pill-shaped booking labels in date cells showing class name
  - Click date to view detailed day agenda
  - Day view with vertical timeline (6 AM - 10 PM) showing all bookings for selected day
  - Week strip navigation for easy date selection
  - Booking details include: class name, instructor, time, duration, capacity, status
  - Visual status indicators (Booked, Cancelled, Attended, No Show)
  - Cancelled bookings shown with strikethrough and reduced opacity
- **List View Features**:
  - **Upcoming vs Past tabs**: Separate tabs for upcoming and past bookings
  - **Smart sorting**: Upcoming sorted by earliest first, past sorted by most recent first
  - **Booking cards**: Display booking details with status badges
- **Booking Management**:
  - **Cancel booking**: Full cancel functionality with 24-hour policy validation
  - **Booking details dialog**: View complete booking information
  - **Cancel validation**: Only shows cancel button when cancellation is allowed (24+ hours before class)
- **Error handling**: Toast notifications for all booking operations
- **Click interactions**: Click bookings in calendar to view details or cancel

### Admin User Management Features
The AdminUsers page (`src/pages/AdminUsers.tsx`) includes:
- **User Search and Filtering**:
  - Search by name, user ID, or phone number
  - Filter by role (Admin, Staff, Member, All)
  - Filter by membership status (Active, Expired, None, All)
  - Real-time filtering as you type
- **Bulk Actions**:
  - Select multiple users with checkboxes
  - Select all / deselect all functionality
  - Bulk role changes (set multiple users to admin/staff/member)
  - Clear selection button
- **User Activity History**:
  - View detailed activity for each user
  - Shows recent check-ins and bookings
  - Displays activity type, description, and timestamp
  - Last activity date shown in main table
- **User Role Management**:
  - Edit individual user roles via dialog
  - Role badges with icons (Admin, Staff, Member)
  - Bulk role assignment for multiple users
  - Role changes saved to `user_roles` table
- **User Statistics**:
  - Total visits count per user
  - Total bookings count per user
  - Membership status display
  - Member since date (from created_at)
- **User Table**:
  - Sortable table with all user information
  - User name, ID, phone number
  - Role and membership status badges
  - Last activity timestamp
  - Quick actions dropdown menu
- **Actions Menu**:
  - View Activity: Opens activity history dialog
  - Edit Role: Opens role edit dialog
  - View Profile: Navigate to user profile
  - Suspend User: Placeholder for suspension (requires additional database fields)
- **Real-time Data**: Fetches latest user data, roles, memberships, and activity
- **Loading States**: Loading spinner during data fetch
- **Error Handling**: Toast notifications for all operations

**Note**: User suspension/activation requires additional database fields (e.g., `suspended` boolean in profiles table or a status field). Currently implemented as a placeholder.

### Admin Membership Management Features
The AdminManageMemberships page (`src/pages/AdminManageMemberships.tsx`) includes:
- **Membership Plan Creation/Editing**:
  - Create new membership plans with name, price, duration, and access level
  - Edit existing membership plans
  - Form validation using Zod schemas
  - Delete membership plans (with validation to prevent deletion if assigned to users)
  - Confirmation dialog for deletions
- **Membership Assignment to Users**:
  - Quick link to AdminUserMemberships page for assigning memberships
  - Integration with user membership management
- **Membership Statistics**:
  - Total memberships count
  - Active memberships count
  - Expired memberships count
  - Total revenue from paid memberships
  - Membership plans available count
  - Renewals due soon count
- **Renewal Reminders**:
  - Shows memberships expiring in the next 30 days
  - Displays user name, membership name, expiration date, and days remaining
  - Color-coded alerts (red for ≤7 days, orange for ≤14 days)
  - Quick link to manage user membership
  - Sorted by expiration date (soonest first)
- **Tabbed Interface**: Organized into Plans, Statistics, and Renewal Reminders
- **Real-time Data**: Fetches latest membership data and statistics
- **Loading States**: Loading spinner during data fetch
- **Error Handling**: Toast notifications for all operations
- **Form Validation**: Comprehensive validation with helpful error messages

**Note**: Membership assignment to users is handled via the AdminUserMemberships page (`/admin/usermemberships`), which provides full CRUD functionality for user memberships.

### Admin User Memberships Management Features
The AdminUserMemberships page (`src/pages/AdminUserMemberships.tsx`) includes:
- **User Membership CRUD**:
  - Create new user memberships with payment method selection
  - Edit existing user memberships (dates, status, payment method)
  - Delete user memberships
  - Auto-calculates end date (1 month after start date for monthly recurring)
- **Cancellation Tracking**:
  - **Cancelled At Column**: Shows timestamp when user requested cancellation (for non-Stripe payment methods)
  - **Filter Toggle**: "Show Cancelled Only" button to filter and view only cancelled memberships
  - **Visual Highlighting**: Cancelled memberships are highlighted with yellow background
  - **Admin Workflow**: Allows admins to see cancellation requests and manually process:
    - Stop direct debit payments
    - Skip invoice generation
    - Avoid requesting cash payment next month
- **Payment Method Display**:
  - Shows payment method for each membership (Stripe, Cash, Card, Bank Transfer, Staff, Other)
  - Helps identify which memberships require manual payment processing
- **User Membership Table**:
  - Displays all user memberships with user name, membership plan, dates, status, payment status, and payment method
  - Shows cancellation timestamp when available
  - Edit and delete actions for each membership
- **Real-time Data**: Fetches latest user memberships, users, and membership plans
- **Loading States**: Loading spinner during data fetch
- **Error Handling**: Toast notifications for all operations

### Admin Deals & Referrals Management Features
The AdminManageDeals page (`src/pages/AdminManageDeals.tsx`) includes:
- **Coupon Code Creation/Editing**:
  - Create and edit discount/referral coupon codes
  - Two coupon types: percentage off (0-100%) and money off (fixed amount in pounds)
  - Form validation using Zod schemas with helpful error messages
  - Delete coupons (with confirmation)
  - Unique coupon codes (uppercase, alphanumeric with hyphens/underscores)
- **Coupon Configuration**:
  - Active/inactive toggle for enabling/disabling coupons
  - Usage limit (optional, leave empty for unlimited uses)
  - Valid from/until date range (optional expiration)
  - Description field for internal notes
  - Created by tracking (admin who created the coupon)
- **Usage Tracking**:
  - Real-time usage count per coupon (shows X / limit or ∞)
  - Click coupon row to filter usage history
  - Usage history table showing:
    - Coupon code used
    - User who used it
    - Discount amount/percentage
    - Timestamp when used
    - Order ID (for future Stripe integration)
- **Statistics Dashboard**:
  - Total coupons count
  - Active coupons count
  - Inactive coupons count
  - Total uses across all coupons
  - Unique users who have used coupons
- **Status Indicators**:
  - Active: Green badge (coupon is active and valid)
  - Inactive: Red badge (manually disabled)
  - Expired: Red badge (past valid_until date)
  - Not Started: Gray badge (before valid_from date)
  - Limit Reached: Red badge (usage limit exceeded)
- **Tabbed Interface**: Organized into Coupon Codes, Statistics, and Usage History
- **Real-time Data**: Fetches latest coupon data, usage statistics, and usage history
- **Loading States**: Loading spinner during data fetch
- **Error Handling**: Toast notifications for all operations
- **Form Validation**: Comprehensive validation with helpful error messages
  - Percentage values must be 0-100
  - Money off values must be positive
  - Valid until date must be after valid from date
  - Coupon code format validation (uppercase, alphanumeric, hyphens, underscores)

**Database Integration:**
- `coupon_codes` table stores all coupon definitions
- `coupon_usage` table tracks each time a coupon is used
- `get_coupon_usage_count()` function returns usage count per coupon
- `is_coupon_valid()` function validates coupon eligibility (active, within date range, not exceeded limit)

**Migration File:**
- `supabase/migrations/ADD_COUPON_CODES.sql`: Creates `coupon_codes` and `coupon_usage` tables with validation functions
- Run this migration in Supabase Dashboard SQL Editor to enable coupon management

### Admin Class Management Features
The AdminManageClasses page (`src/pages/AdminManageClasses.tsx`) includes:
- **Class Creation/Editing**:
  - Create and edit class templates with comprehensive form validation
  - Fields: name, description, instructor, category (dropdown), category_id, duration, capacity, image upload/URL, active status
  - **Category Dropdown**: Select from active categories in `class_categories` table
  - **Image Upload**: Upload class images to Supabase Storage (`class-images` bucket) with preview
  - **Legacy Support**: Maintains backward compatibility with category text field
  - Form validation using Zod schemas with helpful error messages
  - Delete classes (with confirmation)
- **Category Management Tab**:
  - **CRUD Operations**: Create, edit, and delete categories
  - **Category Form**: Name, description, image upload, display order, active toggle
  - **Image Upload**: Upload category images to Supabase Storage (`category-images` bucket) with preview
  - **Category List**: Grid view showing category cards with images, descriptions, and statistics
  - **Usage Tracking**: Shows number of classes using each category
  - **Deletion Protection**: Prevents deletion of categories in use by classes
  - **Display Order**: Manage category display order for UI sorting
  - **Active/Inactive Toggle**: Control category visibility
- **Improved Class Session Creation UI**:
  - Enhanced dialog with better layout and organization
  - Form validation using react-hook-form and Zod
  - Date picker for start date selection
  - Time inputs for start and end times
  - Capacity input with validation
  - Recurring session toggle with expanded options
- **Bulk Session Creation**:
  - Create multiple sessions at once with recurring options
  - Daily, weekly, or monthly recurrence patterns
  - Configurable number of sessions (1-52)
  - Pre-fills session details from class template (name, instructor, capacity)
  - Smart end time calculation based on duration
- **Calendar View for Session Management**:
  - Monthly calendar grid showing all scheduled sessions
  - Week separators: Horizontal lines between weeks in the calendar grid
  - No day borders: Clean design without borders around individual day cells
  - Click date to view detailed day agenda
  - Day view with vertical timeline (6 AM - 10 PM)
  - Add new sessions directly from calendar day view
  - Edit sessions inline with quick actions (edit/delete buttons)
  - Delete sessions with confirmation dialog
  - Week strip navigation for easy date selection
  - Visual session blocks showing class name, instructor, time, duration, capacity
  - Category badges for easy identification
  - Link sessions to class templates (optional)
  - Filter calendar view by instructor, class, and category
- **Class Capacity Management**:
  - View all sessions with capacity information
  - See booked vs available spots for each session
  - Edit session capacity individually
  - Visual indicators for capacity status (color-coded badges)
  - Real-time booking counts from `class_bookings` table
  - Capacity update dialog with current status display
- **Instructor Management**:
  - View all instructors with statistics
  - Shows number of classes per instructor
  - Shows number of sessions per instructor
  - Instructor cards with visual statistics
  - Automatically extracted from classes and sessions
- **Search and Filtering**:
  - Search classes by name, instructor, or category
  - Filter by category
  - Filter by instructor
  - Real-time filtering as you type
- **Tabbed Interface**: Organized into Classes, Sessions, Calendar, Instructors, and Categories tabs
- **Database relationship**: Sessions linked to classes via `class_id` foreign key (nullable for standalone sessions)
- **Real-time Data**: Fetches latest classes, sessions, bookings, instructor, and category data
- **Loading States**: Loading spinner during data fetch
- **Error Handling**: Toast notifications for all operations
- **Form Validation**: Comprehensive validation with helpful error messages

### Class Session Booking Logic
The booking system (`useBookings` hook and Classes page) correctly uses `class_sessions`:
- **Uses `class_sessions` table**: All bookings reference `class_sessions.id` (not `classes.id`)
- **Session-specific availability**: Each session shows its own availability (X of Y spots)
- **Real-time capacity checking**: Checks current bookings vs session capacity before allowing booking
- **Capacity limits enforced**: Prevents booking when session is full
- **Session-based booking**: Users book specific session instances, not class templates
- **Availability calculation**: Calculates available spots per session by counting active bookings
- **Visual indicators**: Shows "Full", "Few Spots Left", or "Booked" status per session

### Analytics with useAnalytics Hook
The `useAnalytics` hook (`src/hooks/useAnalytics.ts`) provides comprehensive analytics data:
- **Member growth statistics**: Total members, active members, growth percentage vs last month
- **Class attendance rates**: Calculates attendance rate based on completed sessions and attended bookings
- **Active user counts**: This week, this month, and total active members
- **Visit trends**: Daily visit counts and unique visitors over time (with date range filtering)
- **Class popularity metrics**: Most booked classes with attendance rates and categories
- **Revenue metrics**: Monthly revenue breakdown with new members and renewals
- **Membership breakdown**: Active, inactive, and cancelled memberships
- **Rewards claimed**: Total number of rewards claimed by all members
- **Date range filtering**: Supports custom date ranges (defaults to last 30 days)
- **Data aggregation**: Efficient queries with parallel fetching for optimal performance
- **Usage example**:
  ```typescript
  import { useAnalytics } from "@/hooks/useAnalytics";
  
  const MyComponent = () => {
    const { data, revenueData, memberGrowth, loading, error, refresh } = useAnalytics({
      dateRange: {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      },
    });
    
    // data contains: total_members, active_members, total_visits_today,
    // total_bookings, total_rewards_claimed, popular_classes, visit_trends, membership_breakdown
    // revenueData contains: period, revenue, new_members, renewals
    // memberGrowth contains: totalMembers, activeMembers, growthThisMonth, growthPercentage
  };
  ```

### Admin Analytics Page Features
The AdminAnalytics page (`src/pages/AdminAnalytics.tsx`) includes:
- **Real-time metrics**: Total members, member growth, class attendance, visits today, rewards claimed
- **Visit trends chart**: Area chart showing daily visits and unique visitors over time (Recharts)
- **Class popularity chart**: Bar chart showing most booked classes (Recharts)
- **Revenue trends chart**: Line chart showing monthly revenue and new members (Recharts)
- **Membership breakdown**: Pie chart showing active, inactive, and cancelled memberships (Recharts)
- **Top classes list**: Table showing top 5 classes by attendance rate
- **Date range picker**: Preset options (7 days, 30 days, 90 days, this month) and custom range selector
- **Export functionality**: CSV export (includes all data) and PDF export (print dialog)
- **Refresh button**: Manual data refresh with loading states
- **Loading states**: Skeleton loaders and spinners during data fetch
- **Error handling**: Error display with retry functionality
- **Responsive design**: Grid layouts that adapt to screen size

### Supabase Client Usage
```typescript
import { supabase } from "@/integrations/supabase/client";

// Query
const { data, error } = await supabase
  .from("table_name")
  .select("*")
  .eq("column", "value");

// RPC Call
const { data, error } = await supabase.rpc('function_name', {
  _param: value
});
```

### Toast Notifications
```typescript
import { useToast } from "@/hooks/use-toast";

const { toast } = useToast();
toast({
  title: "Success",
  description: "Operation completed",
  variant: "destructive" // optional
});
```

### Authentication Check
```typescript
// Using useAuth hook (recommended)
import { useAuth } from "@/hooks/useAuth";

const { user, loading, login, logout, register } = useAuth();

// Or direct Supabase check
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  // Handle unauthenticated
}
```

### Admin Check
```typescript
const { data: isAdmin } = await supabase.rpc('has_role', {
  _user_id: user.id,
  _role: 'admin'
});
```

### Form Validation with Zod and react-hook-form
All forms use Zod schemas for validation and react-hook-form for form management:
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth";
import { sanitizeEmail, sanitizeString } from "@/lib/utils/sanitize";

const form = useForm<RegisterFormData>({
  resolver: zodResolver(registerSchema),
  defaultValues: { /* ... */ },
});

const handleSubmit = async (data: RegisterFormData) => {
  // Sanitize inputs before sending
  const sanitizedEmail = sanitizeEmail(data.email);
  const sanitizedName = sanitizeString(data.fullName);
  // ... rest of submission logic
};
```

**Validation Schemas:**
- `src/lib/validations/auth.ts`: Login, Register, ForgotPassword, ResetPassword schemas
- `src/lib/validations/class.ts`: Class and session creation schemas
- `src/lib/validations/membership.ts`: Membership creation schemas
- `src/lib/validations/coupon.ts`: Coupon code creation/update schemas

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

**Input Sanitization:**
- `sanitizeString()`: Removes null bytes and control characters
- `sanitizeEmail()`: Normalizes and cleans email addresses
- `sanitizeUrl()`: Validates and sanitizes URLs
- `escapeHtml()`: Escapes HTML special characters

**Rate Limiting:**
- Client-side rate limiting utility (`src/lib/utils/rateLimit.ts`)
- Server-side rate limiting in Edge Functions (5 requests per minute per IP)
- Configurable limits per action type

### Row Level Security (RLS) Policies
All tables have RLS enabled with comprehensive policies:

**Policy Patterns:**
- **User Isolation**: Users can only access their own data (`auth.uid() = user_id` or `auth.uid() = id`)
- **Admin Access**: Admins can access all data (`has_role(auth.uid(), 'admin')`)
- **Public Read**: Some tables allow public read access (e.g., active classes, memberships)
- **Admin Management**: Only admins can insert/update/delete management data

**Security Functions:**
- `has_role(_user_id uuid, _role app_role)`: SECURITY DEFINER function to check user roles
- `has_valid_membership(_user_id uuid)`: SECURITY DEFINER function to check active memberships
- Both functions use `SET search_path = public` to prevent search path attacks

**RLS Audit:**
- Comprehensive audit completed
- All edge cases tested
- Missing policies added directly in Supabase Dashboard (see `src/types/database.ts` for current schema)
- All admin functions verified as secure (SECURITY DEFINER with proper search_path)

**Key Security Features:**
- ✅ Users cannot access other users' data
- ✅ Admins have full access for management
- ✅ Public read access limited to appropriate data
- ✅ All SECURITY DEFINER functions properly secured
- ✅ No data leakage through function returns

### Authentication Security Features
The application implements comprehensive authentication security:

**Password Strength Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Maximum 128 characters
- Enforced via Zod validation schema (`passwordSchema`)

**Email Verification Enforcement:**
- Email verification required before accessing protected routes
- `ProtectedRoute` component checks `user.email_verified` status
- Shows `EmailVerificationRequired` page if email not verified
- Resend verification email functionality
- Email verification via link in email (click link to verify)
- **Future Implementation**: OTP code verification can be added if needed (currently not implemented)
- Email verification status tracked in `useAuth` hook

**Account Lockout Protection:**
- Tracks failed login attempts per email address
- Locks account after 5 failed attempts
- 15-minute lockout duration
- Automatic unlock after lockout period expires
- Attempt counter resets after 15 minutes of inactivity
- Visual warnings showing remaining attempts
- Lockout status displayed in login form
- Client-side implementation using localStorage (for production, consider server-side)

**Account Lockout Utility (`src/lib/utils/accountLockout.ts`):**
- `recordFailedAttempt()`: Records failed login and checks for lockout
- `clearLockout()`: Clears lockout on successful login
- `isAccountLocked()`: Checks if account is currently locked
- `getRemainingAttempts()`: Gets remaining attempts before lockout
- `formatLockoutTime()`: Formats remaining lockout time as human-readable string

**Security Implementation:**
- All password inputs use `passwordSchema` validation
- Email verification enforced at route level
- Account lockout prevents brute force attacks
- Failed attempt tracking per email address
- User-friendly error messages and warnings

### Global Error Handling
The application implements comprehensive error handling:

**Error Boundary Component (`src/components/error/ErrorBoundary.tsx`):**
- Catches React component errors and prevents app crashes
- Displays user-friendly error page with recovery options
- Shows detailed error information in development mode
- Provides "Try Again", "Reload Page", and "Go to Home" options
- Logs errors automatically

**Error Handler Utility (`src/lib/utils/errorHandler.ts`):**
- Standardizes error types (NETWORK, SUPABASE, VALIDATION, AUTHENTICATION, AUTHORIZATION, UNKNOWN)
- Normalizes errors to consistent `AppError` interface
- Maps Supabase error codes to user-friendly messages
- Handles session errors automatically with refresh logic
- Provides retryable error detection

**Error Logger (`src/lib/utils/errorLogger.ts`):**
- Centralized error logging service
- Stores error context (timestamp, URL, user agent, stack trace)
- Stores last 10 errors in localStorage for debugging
- Ready for integration with error tracking services (Sentry, LogRocket)
- Provides functions for logging warnings and info messages

**Network Error Handler (`src/lib/utils/networkErrorHandler.ts`):**
- Detects network errors (offline, timeout, connection failures)
- Implements automatic retry logic with exponential backoff
- Monitors online/offline status
- Provides network status event listeners

**Error Handling Hook (`src/hooks/useErrorHandler.ts`):**
- React hook for consistent error handling across components
- Integrates with toast notifications
- Handles automatic redirects for authentication errors
- Wraps async functions with error handling
- Provides success/error callbacks

**Error Handling Features:**
- ✅ Error boundary catches React component errors
- ✅ Global error handler normalizes all error types
- ✅ User-friendly error messages for all error types
- ✅ Automatic session error handling and refresh
- ✅ Network error detection and retry logic
- ✅ Supabase error code mapping to user messages
- ✅ Error logging with context information
- ✅ Development mode shows detailed error information
- ✅ Production mode shows user-friendly messages only

**Usage Example:**
```typescript
import { useErrorHandler } from '@/hooks/useErrorHandler';

const MyComponent = () => {
  const { withErrorHandling } = useErrorHandler();

  const handleAction = async () => {
    const { data, error, success } = await withErrorHandling(
      async () => {
        const { data, error } = await supabase.from('table').select('*');
        if (error) throw error;
        return data;
      },
      {
        showToast: true,
        toastTitle: 'Error',
        successMessage: 'Action completed successfully',
      }
    );

    if (success && data) {
      // Handle success
    }
  };
};
```

### Loading States
The application implements comprehensive loading states for better user experience:

**Loading Skeleton Components:**
- `PageSkeleton`: Full page skeleton loader with grid layout
- `ClassCardSkeleton`: Skeleton for class cards (single and multiple)
- `BookingCardSkeleton`: Skeleton for booking cards (single and multiple)
- `TableSkeleton`: Skeleton for data tables with configurable columns/rows
- `ChartSkeleton`: Skeleton for charts (single and multiple)
- `LoadingSpinner`: Reusable loading spinner with size variants (sm, md, lg)
- `ProgressIndicator`: Progress indicator for long-running operations

**Loading Spinner Variants:**
- `PageLoadingSpinner`: Full page centered spinner
- `InlineLoadingSpinner`: Small inline spinner
- `LoadingSpinner`: Configurable spinner with text

**Progress Indicators:**
- `ProgressIndicator`: Card-based progress indicator with percentage
- `PageProgressIndicator`: Full page progress indicator
- Supports progress percentage, messages, and spinner

**Navigation Loading:**
- `useNavigationLoading`: Hook to detect navigation state
- `NavigationLoadingIndicator`: Top bar loading indicator during route changes
- Integrated into `AppLayout` for automatic navigation loading states

**Loading State Features:**
- ✅ Skeleton loaders for all major data fetches (Classes, Bookings, Analytics)
- ✅ Optimistic UI updates in booking operations (immediate feedback)
- ✅ Progress indicators for long operations
- ✅ Navigation loading indicator at top of page
- ✅ Consistent loading patterns across all pages
- ✅ Smooth transitions between loading and loaded states
- ✅ Loading states match actual content layout

**Usage Examples:**
```typescript
// Using skeleton loaders
import { ClassCardSkeletons } from '@/components/loading/ClassCardSkeleton';

if (loading) {
  return <ClassCardSkeletons count={6} />;
}

// Using loading spinner
import { LoadingSpinner } from '@/components/loading/LoadingSpinner';

<LoadingSpinner size="md" text="Loading data..." />

// Using progress indicator
import { ProgressIndicator } from '@/components/loading/ProgressIndicator';

<ProgressIndicator 
  progress={75} 
  message="Processing your request..." 
  title="Uploading"
/>
```

**Pages with Loading States:**
- ✅ Classes page: Class card skeletons
- ✅ Bookings page: Booking card skeletons
- ✅ Admin Analytics: Chart and metric card skeletons
- ✅ All protected routes: Navigation loading indicator
- ✅ All forms: Button loading states during submission

### Toast Notifications
The application implements standardized toast notifications with queue management and auto-dismiss:

**Toast Variants:**
- `default`: Standard toast with default styling
- `destructive`: Error toast with red styling (7 second duration)
- `success`: Success toast with green styling (3 second duration)
- `info`: Info toast with primary color styling (5 second duration)

**Toast Configuration:**
- Maximum 5 toasts displayed at once (queue management)
- Auto-dismiss timers based on variant:
  - Success: 3 seconds
  - Error: 7 seconds
  - Info: 5 seconds
  - Default: 5 seconds
- Custom duration can be specified per toast
- Toast removal delay: 1 second after dismiss

**Toast Helper Functions (`src/lib/utils/toastHelpers.ts`):**
- `showSuccessToast()`: Shows success toast with green styling
- `showErrorToast()`: Shows error toast with red styling
- `showInfoToast()`: Shows info toast with primary styling
- `showToast()`: Shows default toast
- `toastMessages`: Pre-defined toast messages for common actions

**Standardized Toast Messages:**
- `bookingCreated()`: Booking confirmation message
- `bookingCancelled()`: Booking cancellation confirmation
- `bookingFailed()`: Booking error message
- `loginSuccess()`: Login success message
- `registrationSuccess()`: Registration success message
- `passwordReset()`: Password reset success message
- `accountLocked()`: Account lockout message
- `emailVerificationRequired()`: Email verification reminder
- `classFull()`: Class full error message
- `alreadyBooked()`: Already booked info message
- And more...

**Toast Queue Management:**
- Maximum 5 toasts in queue
- New toasts push old ones out when limit reached
- Automatic cleanup of dismissed toasts
- Prevents toast overflow and UI clutter

**Auto-Dismiss Timers:**
- All toasts auto-dismiss based on variant
- Timers cleared when toast is manually dismissed
- Duration can be customized per toast
- Prevents toasts from staying indefinitely

**Usage Examples:**
```typescript
// Using helper functions
import { showSuccessToast, showErrorToast, showInfoToast } from '@/lib/utils/toastHelpers';

showSuccessToast("Operation completed successfully!");
showErrorToast("Something went wrong");
showInfoToast("Please check your email");

// Using pre-defined messages
import { toastMessages } from '@/lib/utils/toastHelpers';
import { toast } from '@/hooks/use-toast';

toast(toastMessages.bookingCreated("Yoga Class"));
toast(toastMessages.loginSuccess());

// Custom toast with duration
toast({
  variant: "success",
  title: "Custom Success",
  description: "This will dismiss in 5 seconds",
  duration: 5000,
});
```

**Pages Using Standardized Toasts:**
- ✅ Classes page: Booking success/error messages
- ✅ Bookings page: Cancellation success/error messages
- ✅ Login page: Login success/error, account locked messages
- ✅ Register page: Registration success/error, verification messages
- ✅ Reset Password page: Password reset success/error messages
- ✅ All error handling: Uses standardized error toasts

### Form Validation Feedback
The application implements comprehensive form validation feedback for better user experience:

**Inline Validation Errors:**
- `FormMessage` component displays error messages below each field
- Errors are shown in red text with destructive styling
- Errors appear automatically when validation fails
- Uses Zod schema validation messages

**Visual Field Highlighting:**
- Invalid fields show red border (`border-destructive`)
- Error state detected via `data-error` attribute from `FormControl`
- Focus ring changes to red for invalid fields
- Labels turn red when field has error (`text-destructive`)
- Smooth transitions for visual feedback

**Helpful Error Messages:**
- Zod schemas provide descriptive error messages:
  - Email: "Please enter a valid email address"
  - Password: "Password must be at least 8 characters long" and "Password must contain at least one uppercase letter, one lowercase letter, and one number"
  - Full name: "Full name can only contain letters, spaces, hyphens, and apostrophes"
- `FormDescription` component provides helpful hints (e.g., password requirements)
- Error messages are context-aware and specific

**Submit Button State:**
- Submit buttons are disabled when:
  - Form has validation errors (`Object.keys(form.formState.errors).length > 0`)
  - Form is submitting (`isLoading === true`)
  - Account is locked (for login form)
- Button text changes to show loading state (e.g., "Signing in...", "Creating Account...")
- Prevents submission of invalid forms

**Validation Timing:**
- Forms use `mode: "onBlur"` for validation
- Validates when user leaves a field (better UX than on every keystroke)
- Immediate feedback when field loses focus
- Prevents showing errors before user has finished typing

**Form Components:**
- `Form`: Wraps form with react-hook-form provider
- `FormField`: Connects field to form state
- `FormItem`: Container for field with spacing
- `FormLabel`: Label that turns red on error
- `FormControl`: Wraps input and sets error attributes
- `FormMessage`: Displays validation error messages
- `FormDescription`: Shows helpful hints and requirements

**Enhanced Input Component:**
- `Input` component automatically detects error state
- Shows red border when `data-error="true"` or `aria-invalid="true"`
- Red focus ring for invalid fields
- Smooth color transitions

**Usage Example:**
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const form = useForm<FormData>({
  resolver: zodResolver(validationSchema),
  mode: "onBlur", // Validate on blur
  defaultValues: { /* ... */ },
});

<Form {...form}>
  <form onSubmit={form.handleSubmit(handleSubmit)}>
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input type="email" {...field} />
          </FormControl>
          <FormDescription>Enter your email address</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
    <Button 
      type="submit" 
      disabled={isLoading || Object.keys(form.formState.errors).length > 0}
    >
      Submit
    </Button>
  </form>
</Form>
```

**Pages with Form Validation Feedback:**
- ✅ Login page: Email and password validation with error highlighting
- ✅ Register page: Full name, email, password, and confirm password validation with helpful descriptions
- ✅ All forms: Submit buttons disabled when form has errors or is submitting

### QR Code Generation
The application implements comprehensive QR code generation and scanning functionality:

**QR Code Utilities (`src/lib/utils/qrCode.ts`):**
- `generateQRCodeData()`: Creates QR code data object with user ID, timestamp, and action
- `encodeQRCodeData()`: Converts QR code data to JSON string
- `decodeQRCodeData()`: Parses JSON string back to QR code data
- `generateQRCodeImage()`: Generates QR code as data URL (PNG image)
- `generateQRCodeSVG()`: Generates QR code as SVG string
- `isQRCodeValid()`: Validates QR code expiration (default: 5 minutes)

**QR Code Data Structure:**
```typescript
interface QRCodeData {
  userId: string;
  timestamp: number;
  action: 'entry' | 'exit' | 'reward';
  sessionId?: string; // Optional for unique QR codes
}
```

**QR Code Display Component (`src/components/qr/QRCodeDisplay.tsx`):**
- Displays QR code image with user-specific data
- Supports entry and exit QR codes
- Download functionality for saving QR codes
- Refresh functionality to generate new QR codes
- Loading and error states
- Configurable size and styling

**QR Code Scanner Component (`src/components/qr/QRCodeScanner.tsx`):**
- Uses `html5-qrcode` library for camera-based scanning
- Automatic QR code detection and validation
- Camera permission handling
- Manual entry fallback option
- Validates QR code expiration and action type
- Error handling for camera access issues

**QR Code Features:**
- ✅ Unique QR codes per user with timestamp
- ✅ Optional session ID for unique QR codes per session
- ✅ QR code expiration validation (5 minutes default)
- ✅ Action-specific QR codes (entry, exit, or reward)
- ✅ Camera-based scanning with html5-qrcode library
- ✅ Manual entry fallback for QR code data
- ✅ Download QR codes as PNG images
- ✅ Refresh to generate new QR codes
- ✅ Reward QR codes auto-refresh every 5 minutes

**QR Code Usage:**
```typescript
import { QRCodeDisplay } from '@/components/qr/QRCodeDisplay';
import { QRCodeScanner } from '@/components/qr/QRCodeScanner';
import { generateQRCodeData, generateQRCodeImage } from '@/lib/utils/qrCode';

// Display QR code
<QRCodeDisplay
  userId={user.id}
  action="entry"
  title="Your Check-In QR Code"
  size={250}
/>

// Scan QR code
<QRCodeScanner
  onScan={(qrData) => {
    // Handle scanned QR code
    if (qrData.action === 'entry') {
      // Process check-in
    }
  }}
  onError={(error) => {
    // Handle scanning errors
  }}
/>

// Generate QR code programmatically
const qrData = generateQRCodeData(userId, 'entry');
const qrImageUrl = await generateQRCodeImage(qrData);
```

**Pages with QR Code Functionality:**
- ✅ Dashboard: Displays user's check-in QR code
- ✅ EntryExit page (`/qr/entry-exit`): Combined check-in/check-out page that:
  - Shows entry QR code when user has no active check-in
  - Shows exit QR code when user has an active check-in
  - Automatically toggles between entry and exit based on check-in status
  - Includes QR scanner for both entry and exit actions
  - Validates location (Grinstead Rd, London SE8 5FE, United Kingdom)
- ✅ Rewards page (`/rewards`): Displays reward QR code when goals are reached
- ✅ AdminRewardClaim page (`/admin/reward-claim`): Staff scanner for member reward QR codes
- ✅ All QR codes are user-specific and time-limited

**QR Code Security:**
- QR codes include user ID and timestamp
- QR codes expire after 5 minutes (configurable)
- QR codes are validated before processing
- Action type (entry/exit/reward) is validated
- Manual entry option for accessibility
- Reward QR codes prevent duplicate claims via timestamp + session ID validation

### Rewards System
The application implements a comprehensive rewards system that tracks member progress and allows claiming rewards via QR codes:

**Rewards Page (`src/pages/Rewards.tsx`):**
- **Progress Tracking**: 
  - Tracks hours in gym (calculated from `check_ins` table, difference between check-in and check-out times)
  - Tracks classes attended (counts from `class_bookings` where `status = 'attended'`)
  - Displays progress bars showing current progress vs targets (15 hours and 15 classes)
- **Reset Logic**: 
  - Progress resets after claiming a reward
  - Only counts check-ins and classes AFTER the last reward claim
  - Fetches last claim time from `reward_claims` table
  - Calculates progress from `claimed_at` timestamp onwards
- **QR Code Display**: 
  - Shows reward QR code when both goals are reached (15 hours AND 15 classes)
  - QR code uses 'reward' action type
  - Auto-refreshes every 5 minutes for security
  - Unique per generation (userId + timestamp + sessionId)
- **Dashboard Widget**: 
  - Displays rewards progress on main dashboard
  - Shows both progress bars (hours and classes)
  - Clickable widget that redirects to `/rewards` page

**Reward Claim Utility (`src/lib/utils/rewardClaim.ts`):**
- `claimReward()`: Validates and processes reward claims via QR codes
- Validates QR code action type ('reward')
- Validates QR code belongs to user
- Calls `claim_reward()` database function
- Returns success/error result

**Admin Reward Claim Page (`src/pages/AdminRewardClaim.tsx`):**
- Staff-facing page for scanning member reward QR codes
- Uses QR code scanner to scan member QR codes
- Validates QR code expiration and action type
- Processes reward claim via `claimReward()` utility
- Shows success/error feedback
- Protected by `AdminRoute` (admin access required)

**Database Integration:**
- `reward_claims` table stores all reward claims with:
  - User ID, claim timestamp, QR code data
  - QR timestamp and session ID (for duplicate prevention)
  - Reward type (default: 'free_drink')
- `claim_reward()` database function:
  - Validates QR code expiration (5 minutes)
  - Prevents duplicate claims (checks timestamp + session ID)
  - Inserts claim record
  - Returns success/error result

**Rewards System Features:**
- ✅ Progress tracking for gym hours and classes
- ✅ Automatic reset after claiming reward
- ✅ QR code generation when goals reached
- ✅ 5-minute auto-refresh for QR codes
- ✅ Duplicate claim prevention
- ✅ Staff scanning interface
- ✅ Dashboard widget integration
- ✅ Secure QR code validation

**Usage Example:**
```typescript
import { claimReward } from '@/lib/utils/rewardClaim';
import { decodeQRCodeData } from '@/lib/utils/qrCode';

// Scan QR code and claim reward
const qrData = decodeQRCodeData(scannedQRString);
if (qrData && qrData.action === 'reward') {
  const result = await claimReward(qrData, 'free_drink');
  if (result.success) {
    // Reward claimed successfully
    // Progress will reset on next page load
  }
}
```

**Migration File:**
- `supabase/migrations/ADD_REWARD_CLAIMS.sql`: Creates `reward_claims` table and `claim_reward()` function
- Run this migration in Supabase Dashboard SQL Editor to enable reward claims

### Image Upload Utilities
The application implements image upload functionality for classes and categories:

**Image Upload Utility (`src/lib/utils/imageUpload.ts`):**
- `uploadClassImage(file: File, classId: string): Promise<string>` - Uploads class images to `class-images` bucket
- `uploadCategoryImage(file: File, categoryId: string): Promise<string>` - Uploads category images to `category-images` bucket
- `deleteImage(url: string, bucket: string): Promise<void>` - Deletes images from Supabase Storage
- `extractFilePathFromUrl(url: string, bucket: string): string | null` - Extracts file path from public URL

**Storage Buckets:**
- `class-images`: Stores class images organized by class ID
- `category-images`: Stores category images organized by category ID
- **RLS Policies**: Public read access, admin write access
- **File Validation**: 
  - Image files only (validates MIME type)
  - Maximum file size: 5MB
  - Automatic file naming: `{id}-{timestamp}.{ext}`

**Usage:**
- Class images: Uploaded when creating/editing classes in AdminManageClasses
- Category images: Uploaded when creating/editing categories in AdminManageClasses
- Images are automatically deleted when replaced or when entity is deleted
- Supports both file upload and URL input (for external images)

## 📚 Additional Resources

- **Supabase Project ID**: `yggvabrltcxvkiyjixdv`
- **Stripe Default Price ID**: `price_1STEriRpTziRf7OxCPXLGPLw` (£150/month) - Used as fallback
- **Stripe Product ID**: Required environment variable `STRIPE_PRODUCT_ID` for dynamic price creation
- **Target Location**: Grinstead Rd, London SE8 5FE, United Kingdom (51.4881, -0.0300)
- **Max Distance**: 100 meters for check-in/check-out
- **GitHub Pages**: `https://pinnacleadvisors.github.io/mars-space-gym-buddy/`

## 🔧 Dynamic Stripe Pricing Setup

The application now supports dynamic Stripe pricing based on membership plan prices. Here's how to set it up:

### Required Setup Steps

1. **Get Your Stripe Product ID**:
   - Go to [Stripe Dashboard](https://dashboard.stripe.com/products)
   - Find or create a product for your gym memberships
   - Copy the Product ID (starts with `prod_`)

2. **Set Environment Variable in Supabase**:
   - Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets
   - Add a new secret: `STRIPE_PRODUCT_ID`
   - Value: Your Stripe Product ID (e.g., `prod_xxxxxxxxxxxxx`)
   - Click "Save"

3. **How It Works**:
   - When a user clicks "Start Membership" with a specific membership plan, the frontend sends `membership_id` to the `create-checkout` function
   - The function fetches the membership from the database to get its price
   - It searches Stripe for an existing price with that exact amount (GBP, monthly recurring)
   - If found, it uses the existing price
   - If not found, it creates a new Stripe price using your `STRIPE_PRODUCT_ID`
   - The checkout session uses the correct price for that membership plan

4. **Fallback Behavior**:
   - If no `membership_id` is provided, uses default £150 price
   - If membership has no price or price is 0, uses default £150 price
   - If `STRIPE_PRODUCT_ID` is not set, the function will attempt to find an existing product with "membership" or "gym" in the name, or use the first available product

5. **Price Matching Logic**:
   - Prices are matched by: amount (in pence), currency (GBP), and interval (month)
   - This prevents duplicate prices for the same amount
   - New prices are created with the membership name as the nickname for easy identification in Stripe Dashboard

### Testing

1. Create a membership plan in `/admin/memberships` with a different price (e.g., £99/month)
2. Go to `/managememberships` and click "Start Membership" for that plan
3. You should be redirected to Stripe checkout with the correct price
4. Check Stripe Dashboard → Products → Prices to see the newly created price (if it didn't exist)

### Troubleshooting

- **Error: "STRIPE_PRODUCT_ID environment variable is required"**: 
  - Make sure you've set `STRIPE_PRODUCT_ID` in Supabase Dashboard → Edge Functions → Secrets
  - The function will try to find an existing product as fallback, but it's recommended to set this explicitly

- **Prices not matching correctly**:
  - Check that membership prices are set correctly in the database
  - Verify the price is in pounds (not pence) - the function converts to pence automatically
  - Check Stripe Dashboard logs for detailed error messages

- **Default price always used**:
  - Verify `membership_id` is being passed in the request body
  - Check that the membership exists in the database and has a price set
  - Review Edge Function logs in Supabase Dashboard for detailed information

