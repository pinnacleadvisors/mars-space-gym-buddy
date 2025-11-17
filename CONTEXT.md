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
│   ├── hooks/                     # Custom React hooks
│   │   ├── useAuth.ts             # Authentication hook (TODO: implement)
│   │   ├── useAdminAuth.ts        # Admin authentication hook
│   │   ├── useBookings.ts         # Bookings hook (TODO: implement)
│   │   ├── useAnalytics.ts        # Analytics hook (TODO: implement)
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
│   │       └── dateUtils.ts       # Date utility functions
│   ├── pages/                     # Page components
│   │   ├── Landing.tsx            # Landing page
│   │   ├── Login.tsx              # User login
│   │   ├── Register.tsx           # User registration
│   │   ├── ForgotPassword.tsx      # Password reset request
│   │   ├── ResetPassword.tsx      # Password reset
│   │   ├── Dashboard.tsx          # User dashboard
│   │   ├── Classes.tsx            # Class listings
│   │   ├── Bookings.tsx           # User bookings
│   │   ├── ManageMemberships.tsx  # Membership management
│   │   ├── QREntry.tsx            # QR code check-in
│   │   ├── QRExitPage.tsx         # QR code check-out
│   │   ├── AdminLogin.tsx         # Admin login
│   │   ├── AdminDashboard.tsx     # Admin dashboard
│   │   ├── AdminUsers.tsx         # User management
│   │   ├── AdminAnalytics.tsx     # Analytics dashboard
│   │   ├── AdminManageClasses.tsx # Class management
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
│   │   ├── create-checkout/       # Stripe checkout creation
│   │   ├── check-subscription/    # Subscription status check
│   │   └── cancel-subscription/   # Subscription cancellation
│   └── migrations/                # Database migrations (8 files)
├── public/                        # Static public assets
├── .github/
│   └── workflows/
│       └── github-actions-demo.yml # CI/CD for type generation
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
- **RLS**: Users can view own roles, admins can manage all

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
  - `name` (text)
  - `instructor` (text)
  - `start_time` (timestamptz)
  - `end_time` (timestamptz)
  - `capacity` (integer)
  - `created_at` (timestamptz)
- **RLS**: Anyone can view, admins can manage

#### `class_bookings`
- **Purpose**: User class reservations
- **Columns**:
  - `id` (uuid, PK)
  - `user_id` (uuid, FK → profiles)
  - `class_id` (uuid, FK → class_sessions)
  - `status` (text, default 'booked')
  - `created_at` (timestamptz)
- **RLS**: Users can manage own bookings, admins can view/update all

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
- **RLS**: Users can manage own check-ins, admins can view/update all
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

### Authenticated User Routes
- `/dashboard` - User dashboard
- `/classes` - Browse classes
- `/bookings` - View/manage bookings
- `/managememberships` - Membership management
- `/qr/entry` - QR check-in (requires valid membership + location)
- `/qr/exit` - QR check-out (requires active check-in + location)

### Admin Routes
- `/admin` - Admin dashboard
- `/admin/users` - User management
- `/admin/analytics` - Analytics dashboard
- `/admin/manageclasses` - Class management
- `/admin/memberships` - Membership plan management
- `/admin/usermemberships` - User membership management

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
- `gen:types` - Generate Supabase TypeScript types

## 📝 Important Notes

### Type Definitions
- **Primary**: `src/types/database.ts` - Main database types (auto-generated)
- **Secondary**: `src/lib/types.ts` - Also contains database types (legacy?)
- **DO NOT USE**: `src/integrations/supabase/types.ts` - Empty file

### Authentication Flow
1. User signs up → `handle_new_user()` trigger creates profile and assigns 'member' role
2. Admin login checks `has_role()` RPC function
3. `useAdminAuth` hook manages admin state and redirects

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
- `useAuth.ts` - Authentication logic not implemented
- `useBookings.ts` - Booking fetching not implemented
- `useAnalytics.ts` - Analytics fetching not implemented

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

## 📚 Additional Resources

- **Supabase Project ID**: `yggvabrltcxvkiyjixdv`
- **Stripe Price ID**: `price_1STEriRpTziRf7OxCPXLGPLw` (£150/month)
- **Target Location**: SE16 2RW, London (51.4981, -0.0544)
- **Max Distance**: 100 meters for check-in/check-out
- **GitHub Pages**: `https://pinnacleadvisors.github.io/mars-space-gym-buddy/`

