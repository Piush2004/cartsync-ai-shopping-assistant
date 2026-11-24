# Google sign-in: what is built, and what only you can do

## What is built

| Part | State |
|---|---|
| Backend `POST /api/v1/auth/google` | Done. Checks Google's token itself (signature, app, issuer, expiry, verified email) |
| Backend `GET /api/v1/auth/config` | Done. Tells the app the Google client ID, so the app needs no rebuild |
| Database | `users.google_sub` added (migration `9c1d2e3f4a5b`, already applied to your local DB) |
| Android app | "Continue with Google" on Sign in and Create account. Hidden until the server has a client ID |
| Tests | 25 backend tests (forged, expired, wrong app, unverified email, account takeover...), 10 app tests |

It does nothing until you do the steps below. Without a client ID the button is
hidden and the server answers "Google sign-in is not set up".

## Only you can do this (about 10 minutes)

You need a Google account. Nothing here costs money.

1. Open <https://console.cloud.google.com/> and create a project (for example "CartSync").
2. **Google Auth Platform** (or "APIs & Services", then "OAuth consent screen"):
   - User type **External**, app name `CartSync`, your email as support email.
   - Leave the scopes as they are (email, profile, openid).
   - Keep the app in **Testing**. Under **Test users**, add your Gmail and your
     friend's Gmail. While in Testing, only listed people can sign in, up to 100.
3. **Credentials**, **Create credentials**, **OAuth client ID**, type **Web application**,
   name `CartSync server`. No redirect addresses are needed. Copy the **Client ID**
   (it ends in `.apps.googleusercontent.com`).
4. **Create credentials**, **OAuth client ID** again, type **Android**:
   - Package name: `ai.cartsync.cartsync`
   - SHA-1 certificate fingerprint: `4B:36:D6:72:58:6B:3C:4E:1B:6E:BC:C7:A3:65:40:2F:52:8D:2C:59`

   That is the debug key on this laptop. Both the debug build and the release
   APK are signed with it. It is not a secret. If the APK is ever built on
   another computer or signed with a real release key, add that key's SHA-1 as
   another Android client.
5. Create the file `apps/api/.env` (it is gitignored) with one line, using the
   **Web** client ID from step 3:
   ```
   GOOGLE_CLIENT_IDS=1234567890-abcdefg.apps.googleusercontent.com
   ```
6. Restart the backend. Check `https://<your tunnel>/api/v1/auth/config` shows the ID.
   The app picks it up the next time its sign-in screen opens. No new APK.

Optional, to see who signs in: add `ADMIN_EMAILS=<a Gmail>` to the same `.env`.
See `docs/USER_TRACKING.md`.

## Trying it

The phone needs a Google account signed in (on the emulator: Settings, Passwords
& accounts, Add account, Google). Open the app, sign out, tap **Continue with Google**.

## What users will see, and why

- **New person:** an account is made from their Google email and name. It has no
  password, so only Google can open it.
- **Same person again:** same account, found by Google's stable id, even if their
  Google email changed.
- **Email already registered with a password:** Google sign-in is refused with
  "An account with this email already exists. Sign in with your email and
  password instead." This is on purpose. Passwords here are not email-verified,
  so someone could have registered a stranger's email in advance. Merging
  automatically would hand that stranger the account.
- **Closed Google's picker:** nothing happens, no error.

## If it fails

The app prints Google's own reason in the debug log. Common ones:

| Google says | Cause |
|---|---|
| `[16] Cannot find matching credential` or `clientConfigurationError` | The Android client (step 4) is missing, has the wrong package or SHA-1, or is in a different project than the Web client. New clients can take a few minutes |
| Sign-in screen says the app is not verified or access is blocked | The Gmail is not in **Test users** (step 2) |
| Server says "Token was made for a different app" | `.env` has a different Web client ID than the one the app was given, or an old server is running |
| Server says "Google sign-in is not set up" | `.env` missing or the backend was not restarted |

## Not done

- **Website:** the same endpoint works for it. Adding the button to the Next.js
  site needs a Google "Authorized JavaScript origin" for the site's address.
- **Google's official logo:** the button uses a plain "G". Swap in Google's
  asset and follow their branding rules before any store release.
- **Password reset, and linking Google to an existing password account:** neither
  exists yet.
