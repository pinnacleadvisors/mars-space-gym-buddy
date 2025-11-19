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
│   │   │   ├── AppLayout.tsx      # Main app layout wrapper
│   │   │   ├── AppSidebar.tsx     # Sidebar navigation
│   │   │   ├── BottomNav.tsx      # Mobile bottom navigation
│   │   │   └── TopBar.tsx         # Top navigation bar
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
│   ├── hooks/                     # Custom React hooks
│   │   ├── useAuth.ts             # Authentication hook (✅ implemented)
│   │   ├── useAdminAuth.ts        # Admin authentication hook
│   │   ├── useSessionManager.ts   # Session management hook (✅ implemented)
│   │   ├── useBookings.ts         # Bookings hook (✅ implemented)
│   │   ├── useAnalytics.ts        # Analytics hook (✅ implemented)
│   │   ├── useErrorHandler.ts     # Error handling hook (✅ implemented)
│   │   ├── useNavigationLoading.ts # Navigation loading hook (✅ implemented)
│   │   ├── use-mobile.tsx         # Mobile detection hook
│   │   └── use-toast.ts           # Toast notification hook
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts          # Supabase client configuration
│   │       └── types.ts            # Auto-generated types (empty, use database.ts)
│   ├── lib/
│   │   ├── types.ts               # Auto-generated database types
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
│   │       └── toastHelpers.ts    # Toast notification helpers
│   ├── lib/
│   │   └── validations/          # Zod validation schemas
│   │       ├── auth.ts            # Authentication form schemas
│   │       ├── class.ts           # Class and session schemas
│   │       └── membership.ts      # Membership schemas
│   ├── pages/                     # Page components
│   │   ├── Landing.tsx            # Landing page
│   │   ├── Login.tsx              # User login
│   │   ├── Register.tsx           # User registration
│   │   ├── ForgotPassword.tsx      # Password reset request
│   │   ├── ResetPassword.tsx      # Password reset
│   │   ├── EmailVerificationRequired.tsx # Email verification required page
│   │   ├── Dashboard.tsx          # User dashboard
│   │   ├── Classes.tsx            # Class listings (✅ fully implemented with booking, filters, search)
│   │   ├── Bookings.tsx           # User bookings (✅ fully implemented with list/calendar views, cancel functionality)
│   │   ├── ManageMemberships.tsx  # Membership management
│   │   ├── QREntry.tsx            # QR code check-in
│   │   ├── QRExitPage.tsx         # QR code check-out
│   │   ├── AdminLogin.tsx         # Admin login
│   │   ├── AdminDashboard.tsx     # Admin dashboard
│   │   ├── AdminUsers.tsx         # User management
│   │   ├── AdminAnalytics.tsx     # Analytics dashboard (✅ fully implemented with charts, date filtering, export)
│   │   ├── AdminManageClasses.tsx # Class management (✅ includes session creation from templates)
│   │   ├── AdminManageMemberships.tsx # Membership management
│   │   ├── AdminUserMemberships.tsx   # User membership management
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
│   └── migrations/                # Database migrations (10 files, includes RLS policies)
├── docs/                          # Documentation
│   ├── RLS_POLICY_AUDIT.md       # Comprehensive RLS policy audit
│   └── RLS_TEST_CASES.md         # RLS policy test cases
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

### Tables

#### `user_roles`
- **Purpose**: Role-based access control
- **Columns**:
  - `id` (uuid, PK)
  - `user_id` (uuid, FK → auth.users)
  - `role` (app_role enum: 'admin', 'staff', 'member')
  - `created_at` (timestamptz)
- **RLS**: 
  - Users can view own roles (`auth.uid() = user_id`)
  - Admins can view all roles (`has_role(auth.uid(), 'admin')`)
  - Admins can insert/update/delete all roles

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
- **RLS**: Users can view/update own profile, admins can view/update all
- **Trigger**: Auto-creates profile on user signup

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
  - `category` (text)
  - `image_url` (text)
  - `is_active` (boolean, default true)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
- **RLS**: Anyone can view active classes, admins can manage all

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
  - `class_id` (uuid, FK → class_sessions)
  - `status` (text, default 'booked')
  - `created_at` (timestamptz)
- **RLS**: 
  - Users can view/insert/update/delete own bookings (`auth.uid() = user_id`)
  - Admins can view/update/delete all bookings (`has_role(auth.uid(), 'admin')`)

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
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
- **RLS**: Users can view own, admins can manage all

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

### Database Functions

#### `has_role(_user_id uuid, _role app_role) → boolean`
- **Purpose**: Check if user has specific role
- **Security**: SECURITY DEFINER
- **Usage**: Used in RLS policies and application code

#### `has_valid_membership(_user_id uuid) → boolean`
- **Purpose**: Check if user has active paid membership
- **Security**: SECURITY DEFINER
- **Logic**: Checks for active status, paid payment, and valid end_date

#### `update_updated_at_column()`
- **Purpose**: Trigger function to update `updated_at` timestamp
- **Applied to**: profiles, classes, user_memberships

#### `calculate_check_in_duration()`
- **Purpose**: Calculate visit duration in minutes
- **Applied to**: check_ins table

#### `handle_new_user()`
- **Purpose**: Auto-create profile and assign 'member' role on signup
- **Trigger**: After INSERT on auth.users

### Database Enums

- **`app_role`**: 'admin', 'staff', 'member'

## 🔐 Environment Variables & Secrets

### Frontend Environment Variables (Vite)
Located in `.env` files (not in repo, use GitHub Secrets for CI/CD):
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous/public key

**Current fallback values** (in `src/integrations/supabase/client.ts`):
- URL: `https://yggvabrltcxvkiyjixdv.supabase.co`
- Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (hardcoded fallback)

### Supabase Edge Functions Environment Variables
Set in Supabase Dashboard → Project Settings → Edge Functions:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Public anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (admin access)
- `STRIPE_SECRET_KEY` - Stripe secret API key

### GitHub Secrets (for CI/CD)
Used in `.github/workflows/github-actions-demo.yml`:
- `SUPABASE_ACCESS_TOKEN` - Supabase CLI access token
- `SUPABASE_PROJECT_ID` - Supabase project ID (`yggvabrltcxvkiyjixdv`)

## 🔄 Supabase Edge Functions

### `create-checkout`
- **Purpose**: Create Stripe checkout session for membership subscription
- **Method**: POST
- **Auth**: Requires Bearer token
- **Returns**: Stripe checkout URL
- **Price ID**: `price_1STEriRpTziRf7OxCPXLGPLw` (£150/month)
- **Success URL**: `/managememberships?success=true&session_id={CHECKOUT_SESSION_ID}`
- **Cancel URL**: `/managememberships?canceled=true`
- **Validation**: Server-side email validation and rate limiting (5 requests per minute per IP)

### `check-subscription`
- **Purpose**: Check Stripe subscription status and sync with database
- **Method**: POST
- **Auth**: Requires Bearer token (uses SERVICE_ROLE_KEY)
- **Returns**: Subscription status and updates `user_memberships` table
- **Logic**: Creates or updates membership record based on Stripe subscription

### `cancel-subscription`
- **Purpose**: Cancel Stripe subscription at period end
- **Method**: POST
- **Auth**: Requires Bearer token (uses SERVICE_ROLE_KEY)
- **Returns**: Cancellation confirmation
- **Logic**: Sets `cancel_at_period_end: true` in Stripe, updates status to 'cancelled'

## 🛣️ Application Routes

### Public Routes
- `/` - Landing page
- `/login` - User login
- `/register` - User registration
- `/forgot-password` - Password reset request
- `/reset-password` - Password reset form

### Authenticated User Routes (Protected by `ProtectedRoute`)
- `/dashboard` - User dashboard
- `/classes` - Browse classes
- `/bookings` - View/manage bookings
- `/managememberships` - Membership management
- `/qr/entry` - QR check-in (requires valid membership + location)
- `/qr/exit` - QR check-out (requires active check-in + location)

**Note**: All authenticated routes are wrapped with `ProtectedRoute` component which:
- Checks if user is authenticated
- Redirects to `/login` if not authenticated
- Preserves attempted location for redirect after login

### Admin Routes (Protected by `AdminRoute`)
- `/admin` - Admin dashboard
- `/admin/users` - User management
- `/admin/analytics` - Analytics dashboard
- `/admin/manageclasses` - Class management
- `/admin/memberships` - Membership plan management
- `/admin/usermemberships` - User membership management

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
- **Base Path**: `/mars-space-gym-buddy/` (for GitHub Pages)
- **Port**: 8080
- **Alias**: `@` → `./src`
- **Plugins**: React SWC, lovable-tagger (dev only)

### `tsconfig.json`
- **Path Alias**: `@/*` → `./src/*`
- **Strict Mode**: Disabled (noImplicitAny: false, strictNullChecks: false)
- **Allow JS**: true

### `package.json` Scripts
- `dev` - Start development server
- `build` - Build for production
- `preview` - Preview production build
- `deploy` - Deploy to GitHub Pages
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
- **Primary**: `src/types/database.ts` - Main database types (auto-generated)
- **Secondary**: `src/lib/types.ts` - Also contains database types (legacy?)
- **DO NOT USE**: `src/integrations/supabase/types.ts` - Empty file

### Authentication Flow
1. User signs up → `handle_new_user()` trigger creates profile and assigns 'member' role
2. Email verification code sent → User must verify email before accessing protected routes
3. Admin login checks `has_role()` RPC function
4. `useAdminAuth` hook manages admin state and redirects
5. `useAuth` hook manages user authentication and session
6. `useSessionManager` hook monitors session expiration and shows warnings
7. Session automatically refreshes on app load if expired
8. Session warnings shown at 15 minutes and 5 minutes before expiration
9. Email verification enforced via `ProtectedRoute` component
10. Account lockout after 5 failed login attempts (15 minute lockout duration)

### Membership Flow
1. User clicks "Register Membership" → `create-checkout` function
2. Redirected to Stripe checkout
3. On success → `check-subscription` syncs with database
4. `has_valid_membership()` RPC checks active membership for check-ins

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

### Classes Page Features
The Classes page (`src/pages/Classes.tsx`) includes:
- **Real-time availability**: Shows available spots vs capacity for each class session
- **Booking integration**: Uses `useBookings` hook for booking functionality
- **User bookings display**: Shows which classes the user has already booked
- **Booking confirmation**: Dialog confirms booking details before creating
- **Search functionality**: Search classes by name or instructor
- **Filters**: Filter by instructor, date (today, this week, upcoming, my bookings)
- **Visual indicators**: Badges show "Full", "Few Spots Left", or "Booked" status
- **Error handling**: Toast notifications for booking success/failure
- **Date formatting**: Uses `date-fns` for readable date/time display

### Bookings Page Features
The Bookings page (`src/pages/Bookings.tsx`) includes:
- **Real bookings data**: Uses `useBookings` hook to fetch and display user's actual bookings
- **List and Calendar views**: Toggle between list view and calendar view
- **Upcoming vs Past tabs**: Separate tabs for upcoming and past bookings
- **Booking status display**: Shows status badges (Booked, Cancelled, Attended, No Show)
- **Cancel booking**: Full cancel functionality with 24-hour policy validation
- **Booking details dialog**: View complete booking information
- **Date filtering**: Calendar view allows selecting dates to filter bookings
- **Smart sorting**: Upcoming sorted by earliest first, past sorted by most recent first
- **Cancel validation**: Only shows cancel button when cancellation is allowed (24+ hours before class)
- **Error handling**: Toast notifications for all booking operations

### Class Sessions Management
The AdminManageClasses page (`src/pages/AdminManageClasses.tsx`) includes:
- **Link classes to sessions**: Database migration adds `class_id` column to `class_sessions` table
- **Create sessions from templates**: Admins can create sessions from class templates with one click
- **Recurring session creation**: Create multiple sessions at once (daily, weekly, monthly)
- **Session scheduling UI**: Full dialog with date picker, time inputs, and capacity settings
- **Smart defaults**: Pre-fills session details from class template (name, instructor, capacity, duration)
- **Bulk creation**: Can create up to 52 recurring sessions at once
- **Database relationship**: Sessions linked to classes via `class_id` foreign key (nullable for standalone sessions)

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
    // total_bookings, popular_classes, visit_trends, membership_breakdown
    // revenueData contains: period, revenue, new_members, renewals
    // memberGrowth contains: totalMembers, activeMembers, growthThisMonth, growthPercentage
  };
  ```

### Admin Analytics Page Features
The AdminAnalytics page (`src/pages/AdminAnalytics.tsx`) includes:
- **Real-time metrics**: Total members, member growth, class attendance, visits today
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
- Comprehensive audit completed (see `docs/RLS_POLICY_AUDIT.md`)
- All edge cases tested (see `docs/RLS_TEST_CASES.md`)
- Missing policies added via migration `20250115000001_add_missing_rls_policies.sql`
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
- OTP verification during registration
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

## 📚 Additional Resources

- **Supabase Project ID**: `yggvabrltcxvkiyjixdv`
- **Stripe Price ID**: `price_1STEriRpTziRf7OxCPXLGPLw` (£150/month)
- **Target Location**: SE16 2RW, London (51.4981, -0.0544)
- **Max Distance**: 100 meters for check-in/check-out
- **GitHub Pages**: `https://pinnacleadvisors.github.io/mars-space-gym-buddy/`

