# Verifyd — Scam Message Checker

A free tool that lets anyone paste a suspicious message and instantly see if it
shows signs of being a scam or manipulation attempt — plus a built-in
free/premium tier ready to take real payments via Paystack.

---

## What's already working

- Real scam-pattern detection (12 rules covering urgency, fake prizes,
  phishing links, payment-method red flags, emotional manipulation, etc.)
- Free plan: 3 checks per day per visitor
- Premium upsell modal with a real Paystack checkout connection
- Site-wide usage counters (today / risky / all-time) stored in Vercel KV
  so they're real and shared across every visitor, not just one browser

## What you need to do before going live

### 1. Install dependencies
```
npm install
```

### 2. Get your Paystack API keys
Log into your Paystack dashboard → Settings → API Keys & Webhooks.
Copy:
- **Public Key** (starts with `pk_test_...`)
- **Secret Key** (starts with `sk_test_...`)

Use the **test** keys while setting up — they let you test the entire
payment flow with Paystack's test cards before any real money moves.
Switch to **live** keys only when ready for real customers.

### 3. Set your price
Open `app/api/paystack-init/route.js` and change this line to match your
real price, in the smallest currency unit (kobo for NGN, cents for ZAR):
```js
const PRICE_IN_SMALLEST_UNIT = 200000; // example: ₦2,000
```

### 4. Fill in your environment variables
Copy `.env.local.example` to a new file called `.env.local` and paste in
your real values:
```
PAYSTACK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
`.env.local` is already excluded from version control — never share this
file or upload it anywhere public.

### 5. Test it locally
```
npm run dev
```
Open http://localhost:3000, paste a scammy-sounding message in 4 times in a
row to trigger the upgrade modal, and confirm Paystack checkout opens
correctly. Use Paystack's test card numbers (found in their docs) to
simulate a successful payment.

### 6. Deploy to Vercel (free)
- Push this folder to GitHub (already done if you're reading this from
  your repo)
- Go to https://vercel.com → Add New → Project → import your repo
- In the Vercel project's Environment Variables section, add the same
  variables from step 4 (use your **live** Paystack keys once ready for
  real payments)
- Update `NEXT_PUBLIC_SITE_URL` to your real Vercel URL once deployed
  (e.g. `https://verifyd.vercel.app`)
- Click Deploy

### 7. Connect Vercel KV (for real, site-wide usage tracking)
In your Vercel project → Storage tab → Create Database → KV → connect it to
this project. Vercel automatically fills in the `KV_*` environment
variables for you — no code changes needed. Without this step, the tool
still works perfectly, it just won't show real shared usage numbers across
all visitors.

---

## Project structure

```
/app
  layout.js              → page wrapper, loads icon font
  globals.css             → site-wide styles
  page.js                 → the entire tool UI and logic
  /api
    /paystack-init/route.js     → starts a real Paystack payment
    /paystack-verify/route.js   → confirms payment succeeded, marks user premium
    /usage/route.js             → reads/writes site-wide usage stats
/lib
  scamDetector.js          → the actual scam-detection rules and scoring
  paystack.js               → Paystack server connection helpers
.env.local.example         → template for your secret keys (copy to .env.local)
package.json               → dependencies
```

## Changing the price

Edit `PRICE_IN_SMALLEST_UNIT` in `app/api/paystack-init/route.js`, AND
update the `$4.99` display text in `app/page.js` (search for `priceNum`)
to match what customers will actually be charged.

## Changing the free daily limit

In `app/page.js`, change the constant at the top:
```js
const FREE_DAILY_LIMIT = 3;
```
