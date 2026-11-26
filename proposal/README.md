# চিঠি — Vercel-এ চালু করার নিয়ম

1. এই ফোল্ডারটা GitHub repo-তে আপলোড করো।
2. vercel.com → Add New → Project → repo import করো। (Framework: Other, কিছু বদলাতে হবে না।)
3. Project → **Storage** → **Marketplace** → **Upstash Redis** (Free plan) → Create → এই project-এ connect করো।
   (এতে KV_REST_API_URL / KV_REST_API_TOKEN নিজে থেকেই যোগ হয়ে যাবে।)
4. Project → **Settings → Environment Variables** → `ADMIN_PASSWORD` নামে তোমার গোপন পাসওয়ার্ড দাও।
5. **Redeploy** করো।

## ব্যবহার
- তার জন্য লিংক: `https://তোমার-সাইট.vercel.app/`
- তোমার চিঠিঘর: `https://তোমার-সাইট.vercel.app/admin.html` (পাসওয়ার্ড লাগবে)
  - চিঠি লেখো — নিজে থেকেই সংরক্ষিত হয়।
  - "পাওয়া চিঠি" ট্যাবে তার পাঠানো সব চিঠি দেখো।
