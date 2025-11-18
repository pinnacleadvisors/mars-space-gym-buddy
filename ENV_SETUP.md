# Environment Variables Setup Guide

This guide explains how to set up environment variables for cloud-based development (GitHub Codespaces, Cursor Cloud, etc.) without using local `.env` files.

## Required Environment Variables

### 1. Frontend (Vite) Variables - For Your React App
**Where to set:** GitHub Codespaces Secrets (for cloud development)

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous/public key (safe to expose client-side)

**Why GitHub Codespaces Secrets?**
- These are used by your React app running in Codespaces/Cursor Cloud
- Your frontend code needs these to connect to Supabase
- They're automatically available as environment variables when you run `npm run dev`

---

### 2. Supabase Edge Functions Variables - For Functions Running on Supabase
**Where to set:** Supabase Dashboard (NOT GitHub Secrets!)

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Public anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (keep secret!)
- `STRIPE_SECRET_KEY` - Stripe secret API key (keep secret!)

**Why Supabase Dashboard, NOT GitHub Secrets?**
- These Edge Functions run on **Supabase's servers**, not in your Codespace
- They're deployed to Supabase and execute there
- You configure them in: **Supabase Dashboard → Project Settings → Edge Functions → Secrets**
- GitHub Secrets won't help here because the functions don't run in GitHub

**How to set them:**
1. Go to your Supabase project dashboard
2. Navigate to: Project Settings → Edge Functions → Secrets
3. Add each secret there
4. They'll be available to your Edge Functions via `Deno.env.get("KEY_NAME")`

---

### 3. GitHub Actions CI/CD Variables - For Automated Workflows
**Where to set:** Repository Secrets (Settings → Secrets and variables → Actions)

- `SUPABASE_ACCESS_TOKEN` - Supabase CLI access token
- `SUPABASE_PROJECT_ID` - Supabase project ID

**Why Repository Secrets, NOT Codespaces Secrets?**
- These are used by **GitHub Actions workflows** (like `.github/workflows/github-actions-demo.yml`)
- GitHub Actions runs in GitHub's CI/CD environment, not in your Codespace
- Repository Secrets are specifically designed for GitHub Actions
- They're accessed in workflows via `${{ secrets.SECRET_NAME }}`

**When you'd use them:**
- When GitHub Actions automatically generates database types
- When CI/CD pipelines deploy your app
- When automated tests run in GitHub Actions

---

## Option 1: GitHub Codespaces Secrets (Recommended)

GitHub Codespaces automatically makes secrets available as environment variables. This is the best option for cloud development.

### Setting Up Codespaces Secrets

1. **Go to GitHub Settings:**
   - Navigate to: https://github.com/settings/codespaces
   - Or: Your repository → Settings → Secrets and variables → Codespaces

2. **Add Secrets:**
   - Click "New secret"
   - Add each required variable:
     - Name: `VITE_SUPABASE_URL`
     - Value: `https://your-project-id.supabase.co`
   - Repeat for `VITE_SUPABASE_ANON_KEY`

3. **Access in Codespaces:**
   - Secrets are automatically available as environment variables
   - They're accessible via `process.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_URL`
   - No `.env` file needed!

### Using Codespaces Secrets

The environment variables will be automatically available when you:
- Start a new Codespace
- Run `npm run dev` or `npm run build`
- Access them via `import.meta.env.VITE_*` in your Vite app

**Note:** Codespaces secrets are scoped to:
- **User secrets**: Available in all your Codespaces (personal)
- **Repository secrets**: Available in Codespaces for that specific repository
- **Organization secrets**: Available to all members of the organization

---

## Option 2: Repository Secrets (For CI/CD Only)

**⚠️ Important:** Repository Secrets are primarily for GitHub Actions workflows, NOT for development.

### Setting Up Repository Secrets for CI/CD

1. **Go to Repository Settings:**
   - Navigate to: Your repository → Settings → Secrets and variables → Actions

2. **Add Secrets for GitHub Actions:**
   - Click "New repository secret"
   - Add: `SUPABASE_ACCESS_TOKEN` (for Supabase CLI in workflows)
   - Add: `SUPABASE_PROJECT_ID` (for Supabase CLI in workflows)
   - **Do NOT add `VITE_*` variables here** - use Codespaces Secrets instead!

3. **Why separate?**
   - Repository Secrets are for automated workflows (CI/CD)
   - Codespaces Secrets are for your development environment
   - They serve different purposes and run in different environments

---

## Option 3: Dev Container Configuration

You can also set up environment variables in a `.devcontainer` configuration file.

### Create `.devcontainer/devcontainer.json`

```json
{
  "name": "Mars Space Gym Buddy",
  "image": "mcr.microsoft.com/devcontainers/javascript-node:18",
  "features": {},
  "postCreateCommand": "npm install",
  "remoteEnv": {
    "VITE_SUPABASE_URL": "${localEnv:VITE_SUPABASE_URL}",
    "VITE_SUPABASE_ANON_KEY": "${localEnv:VITE_SUPABASE_ANON_KEY}"
  }
}
```

However, this still requires the variables to be set somewhere. Better to use Codespaces Secrets.

---

## Option 4: Cursor Cloud / Other Cloud IDEs

For Cursor Cloud and similar cloud IDEs:

1. **Check Platform Documentation:**
   - Most cloud IDEs have a settings/configuration section for environment variables
   - Look for "Environment Variables", "Secrets", or "Configuration" in the platform settings

2. **Set Variables in Platform:**
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the platform's environment variable settings
   - These will be available when the development server starts

3. **Alternative: Use a Setup Script:**
   - Create a script that reads from the platform's secret store
   - Export variables before starting the dev server

---

## Verification

To verify your environment variables are set correctly:

1. **In Codespaces Terminal:**
   ```bash
   echo $VITE_SUPABASE_URL
   echo $VITE_SUPABASE_ANON_KEY
   ```

2. **In Your Code:**
   ```typescript
   console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
   console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY);
   ```

3. **Check Vite Dev Server:**
   - Start dev server: `npm run dev`
   - Check browser console for any missing variable errors
   - The app should connect to Supabase without errors

---

## Summary: Where to Put Each Secret

| Secret Type | Where to Set | Used By | Why |
|------------|--------------|---------|-----|
| `VITE_SUPABASE_URL` | **GitHub Codespaces Secrets** | Your React app in Codespaces | Frontend needs it to connect to Supabase |
| `VITE_SUPABASE_ANON_KEY` | **GitHub Codespaces Secrets** | Your React app in Codespaces | Frontend needs it to connect to Supabase |
| `SUPABASE_URL` (Edge Functions) | **Supabase Dashboard** | Edge Functions on Supabase servers | Functions run on Supabase, not GitHub |
| `SUPABASE_SERVICE_ROLE_KEY` | **Supabase Dashboard** | Edge Functions on Supabase servers | Functions run on Supabase, not GitHub |
| `STRIPE_SECRET_KEY` | **Supabase Dashboard** | Edge Functions on Supabase servers | Functions run on Supabase, not GitHub |
| `SUPABASE_ACCESS_TOKEN` | **Repository Secrets** | GitHub Actions workflows | CI/CD runs in GitHub Actions |
| `SUPABASE_PROJECT_ID` | **Repository Secrets** | GitHub Actions workflows | CI/CD runs in GitHub Actions |

## Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use Codespaces Secrets** for frontend development (VITE_* variables)
3. **Use Supabase Dashboard** for Edge Function secrets (they run on Supabase)
4. **Use Repository Secrets** for CI/CD workflows only
5. **Keep service role keys secret** - Never expose `SUPABASE_SERVICE_ROLE_KEY` or `STRIPE_SECRET_KEY` client-side
6. **Rotate keys regularly** - Update secrets if compromised

---

## Troubleshooting

### Variables not available in Codespaces
- Ensure secrets are set in GitHub Settings → Codespaces
- Restart your Codespace after adding secrets
- Check secret names match exactly (case-sensitive)

### Variables not available in Vite
- Vite only exposes variables prefixed with `VITE_`
- Restart dev server after changing environment variables
- Check `import.meta.env` instead of `process.env` in Vite

### Build fails with missing variables
- Ensure all required secrets are set
- Check that variable names are correct
- Verify secrets are available in the Codespace environment

---

## Current Fallback Values

The code currently has fallback values in `src/integrations/supabase/client.ts`:
- URL: `https://yggvabrltcxvkiyjixdv.supabase.co`
- Anon Key: (hardcoded fallback)

**Note:** These fallbacks are for development convenience but should be replaced with proper environment variable management for production.

