# Secure Auth App v2

Fresh rebuild - video background on every page, Google sign-in, and
email verification via a 6-digit OTP code (instead of a click-link).

## 1. Create a NEW Supabase project
1. Go to supabase.com -> New Project
2. Name it, set a database password, choose a region, wait ~1 min

## 2. Run the schema
Dashboard -> SQL Editor -> New query -> paste all of `supabase/schema.sql` -> Run

## 3. Turn on email confirmation
Dashboard -> Authentication -> Sign In / Providers -> Email -> turn
**"Confirm email" ON**.

## 4. Make the confirmation email send a CODE, not a link
By default Supabase's email template has a clickable link. To get a
6-digit OTP instead:
1. Dashboard -> Authentication -> Emails -> Templates -> "Confirm signup"
2. In the body, delete the `{{ .ConfirmationURL }}` link and replace it
   with `{{ .Token }}` instead - e.g.:
   ```
   Your confirmation code is: {{ .Token }}
   ```
3. Save. Now every signup email contains a 6-digit code that the
   Verify page in this app asks for.

## 5. Get your API keys
Dashboard -> Project Settings -> API -> copy "Project URL" and the
"anon public" key (or "Publishable key" on newer dashboards).

## 6. Set up the project locally
1. `npm install`
2. Copy `.env.example` to `.env`, paste in your URL + key
3. `npm run dev`

## 7. Set up Google sign-in
1. console.cloud.google.com -> new project -> APIs & Services ->
   OAuth consent screen -> External -> fill basic info -> save
2. APIs & Services -> Credentials -> Create Credentials -> OAuth
   client ID -> Web application
3. Supabase Dashboard -> Authentication -> Providers -> Google ->
   copy the "Callback URL (for OAuth)" shown there
4. Paste that URL into Google Cloud's "Authorized redirect URIs" -> Create
5. Copy the generated Client ID + Client Secret
6. Paste them into Supabase -> Providers -> Google -> enable -> Save

## 8. Add your background video
1. Download a short (5-10s), small (under ~5MB) looping video -
   pexels.com or pixabay.com, NOT sites like "moewalls" (those are
   often H.265/HEVC, which Chrome cannot play - always re-encode or
   pick a source that gives plain H.264 MP4)
2. Put it in the `public` folder, named exactly `bg-video.mp4`

## 9. Before deploying: set your repo name
Open `vite.config.js` and change:
```js
base: '/secure-auth-v2/',
```
to match your actual GitHub repo name exactly, e.g. `/my-repo-name/`.

## 10. Deploy to GitHub Pages
1. Push this project to a new GitHub repo
2. `npm run deploy` (uses the `gh-pages` package, already in package.json)
3. GitHub repo -> Settings -> Pages -> Source: Deploy from a branch ->
   Branch: `gh-pages` -> Save

## How the OTP flow works
1. User signs up (email + password) -> `supabase.auth.signUp()`
2. Supabase emails a 6-digit code (because of the template change in step 4)
3. App redirects to `/verify-otp?email=...`
4. User enters the code -> `supabase.auth.verifyOtp({ email, token, type: 'signup' })`
5. On success, Supabase returns a session -> user goes straight to `/dashboard`
6. "Resend code" calls `supabase.auth.resend({ type: 'signup', email })`

## Security features
- Password hashing + JWT sessions (Supabase Auth)
- Row Level Security on every table - one user can never read another's data
- Private Storage bucket with folder-level RLS for files
- Brute-force lockout after 5 failed logins / 15 min
- Email OTP verification before first login
- Google OAuth sign-in
- 2FA (TOTP) enrollment available on the dashboard
- Password confirmation + show/hide toggle on signup
