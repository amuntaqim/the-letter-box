# Hemontini — letters (two logins, synced)

## One-time setup on Vercel
1. Deploy this folder (drag it into vercel.com/new, or run `vercel`).
2. In the project: **Storage → Create / Connect → Upstash Redis** (free plan is enough).
   Connect it to this project. It adds the KV_REST_API_URL / KV_REST_API_TOKEN variables.
3. **Settings → Environment Variables**, add these three:
   - `PASSWORD_HE`   your password
   - `PASSWORD_SHE`  her password (give this one to her)
   - `SESSION_SECRET` any long random text (30+ characters)
4. **Deployments → Redeploy** so the variables take effect.

## How it works
- Whoever enters a password gets that side automatically. There is no username.
- "আমার চিঠি" = letters you wrote (drafts + sent). "তোমার চিঠি" = letters the other person sent you.
- A draft stays private. The other person sees a letter only after "পাঠান".
- A sent letter can still be edited by its writer (it is marked "সম্পাদিত" for the reader), but it can never be unsent or deleted.
- Only drafts can be deleted.
- Both sides refresh automatically every 30 seconds.
