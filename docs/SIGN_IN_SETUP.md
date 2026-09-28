# Enable email sign-in for GharKa

The guest/setup experience works now. Live sign-in requires a Supabase project and email delivery setup. The blank settings are intentional; they are not working credentials.

## 1. Create the project

1. Open [Supabase](https://supabase.com/dashboard) and create an account.
2. Create a project named **GharKa**, choosing the region appropriate for your users.
3. Keep the database password private. GharKa's frontend does not need it.
4. Find the **Project URL** and **publishable key** in the project's connection/API settings. The key begins `sb_publishable_`. Copy these into `url` and `publishableKey` in `src/auth-config.js`, or provide these two public values to the developer.

Never put a secret key, service-role key, database password or SMTP password in this repository. No tables, database policies or cloud meal storage are needed for this sign-in-only integration.

## 2. Configure email links

Under Authentication, keep email sign-in enabled with the default magic-link email template. Set the Site URL to the actual deployed app URL. For the planned GitHub Pages address this is:

`https://gharka18.github.io/gharka/`

Allow that exact redirect URL and the local development address:

`http://127.0.0.1:5173/`

Add `http://localhost:5173/` only if used for testing. The app preserves its directory when constructing the return URL. Avoid broad production redirect wildcards. See [email-link authentication](https://supabase.com/docs/guides/auth/auth-email-passwordless) and [redirect configuration](https://supabase.com/docs/guides/auth/redirect-urls).

## 3. Enable delivery to real users

Supabase's default email sender only delivers to project team addresses and is for testing. Configure an SMTP email provider in the Supabase dashboard before offering public email login. Provider secrets belong in that dashboard, not in frontend files. See [Supabase's SMTP instructions](https://supabase.com/docs/guides/auth/auth-smtp).

## 4. Verify before release

- Open GharKa, select **Sign in**, and enter an email you control.
- Confirm receipt, follow the link, and check that **My account** shows the correct email.
- Confirm first-time account setup precedes meals; reload and verify the account and its local plan persist.
- Sign out and confirm the guest household is restored separately. Try a second account and confirm it does not receive the first account's plan.
- Check expired/reused links, network errors, resend limits and sign-out failures.
- Test both localhost and the deployed `/gharka/` URL, including email links opened on a phone.
- Run `/tests/` and `/tests/browser.html` again after configuration.

Current automated auth checks use a fake provider to exercise success/error contracts without sending mail. They do not establish live email delivery, CDN availability, real callback handling or production readiness.

## What signing in saves

Supabase handles the account and session. Meal preferences, pantry selections and plans remain on the current browser. Guest and account records are separate; no automatic guest-plan copying or cross-device synchronisation is implemented. Clearing browser data removes local meals. Guests can always use the planner without an account.
