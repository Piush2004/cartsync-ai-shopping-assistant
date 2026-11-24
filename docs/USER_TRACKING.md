# Keeping track of users

Every account now records **how it was made**, **when it last signed in**, and
**how many times it has signed in**. Two ways to read it.

## What is stored (per user)

| Field | Meaning |
|---|---|
| `signup_method` | `password` or `google`. Set once, never changes |
| `created_at` | When the account was made (UTC) |
| `last_login_at` | Last successful sign-in (UTC). Empty = none since tracking began |
| `last_login_method` | `password` or `google` for that last sign-in |
| `login_count` | Successful sign-ins. Wrong passwords and refused Google tokens are not counted |

Not stored: IP address, device, location. Registering is not a sign-in, so a
new password account shows 0 until its first sign-in. A Google sign-up counts
as 1 (it signs in at once).

"Last sign-in" is not "last seen". A login token lasts 7 days, so someone using
the app daily on one token shows one sign-in. Counting every request would need
a heavier design; this is deliberately light.

Accounts made before tracking began were filled in by the migration:
`signup_method` from whether they have a Google id, `login_count` 0, no last
sign-in. Their real past sign-ins were never recorded.

## 1. On this laptop, no login needed

```bash
cd apps/api
venv/Scripts/python users_report.py
venv/Scripts/python users_report.py --limit 20
```

It reads the same database the backend uses and prints totals (by method, new
this week, active this week) plus one line per user. It never prints password
hashes. This works today, before Google is set up.

## 2. Over the network: `GET /api/v1/admin/users`

Returns `summary` (total users, count by sign-up method, new in 7 days, signed in
during 7 days) and `users` (newest first). `?limit=` (1 to 200, default 50) and
`?offset=` page through them. The summary always counts everyone.

Only an **admin** may call it. To be one, an account needs both:

1. its email in `ADMIN_EMAILS` (comma-separated) in `apps/api/.env`:
   ```
   ADMIN_EMAILS=you@gmail.com
   ```
   then restart the backend, and
2. to have signed in **with Google**.

Rule 2 is on purpose. A password account's email is never checked, so anyone
could register an admin's address before the admin does. Google has checked
that email, so Google accounts are trusted. Everyone else gets 403 (401 when
not signed in), and with `ADMIN_EMAILS` empty nobody is an admin.

**Heads up:** an email that already has a password account (for example the
Gmail you registered with first) is refused by Google sign-in (409), so it
cannot be an admin. Use a different Gmail for the admin, or use the report
above. Linking Google to an existing password account is not built yet.

Example, once signed in as the admin (token from the Google sign-in response):

```bash
curl -H "Authorization: Bearer <token>" "https://<your tunnel>/api/v1/admin/users?limit=20"
```

## Not done

- A page in the website or app that shows this list (the endpoint is ready for one).
- Banning: `account_status` exists (`active`, `inactive`, `banned`) but sign-in
  does not check it yet, so setting `banned` does not lock anyone out.
- Last-seen tracking on every request.
