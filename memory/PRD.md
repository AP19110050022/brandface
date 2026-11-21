# HireAvatar — PRD

## Original problem statement
"this is the project iam working on. it is a plaform where people can get hire as creators or presenters to be a face of a business for promotion on social media. and also people/businesses can give offers. it is very naive stage, there are many confusions regarding plans, payments, login setup, ui features and placement, designs,etc. can you make it in to a complete workable app and make changes where ever possible, you can chnage the placements, theme, etc. (also how about people login to it normally and then they can decide whether to become creator or business people who hire by pressing + icon in the home page). also the total placements, names, features seems so confusing and also i think there are feature to delete or re arrange and features to add. U are expert in it. look at any existing apps and remake this app. but include that violet or blue or purple color theme, you can add more attracting icons,etc in the pages including signup or login page. also the signup or login page should be like any other login page in instagram or snapchat or likedin,etc where people can login using email or gmaul whcih supports you. also tehre are confusion in filter,creator filling page, business filling page etc. so make a complete app with all encessary changes and website which can be deployable. also reduce the consfusion in plans by simply three plans like per video (price starts from), parttime, fulltime."
Follow-up: "follow that theme (zip file), look like a social media app, not a job portal/blog". Edit: replace top-bar chat icon with Saved (creators or businesses).

## Architecture
- FastAPI + MongoDB (`/app/backend/server.py`, `clerk_auth.py`, `seed.py`), React + Tailwind + shadcn.
- Auth: Emergent-managed Clerk (Google + email/password). Roles admin/member in `users` collection; first admin via ADMIN_EMAIL (not set yet).
- Payments: Razorpay orders + signature verify; falls back to simulated TEST mode while RAZORPAY_KEY_ID/SECRET are missing.
- Theme: dark indigo→violet gradient, glass UI, white floating pill bottom nav with "+" FAB, Instagram-style creator profile (reference: user's zip "presenta").

## Personas
Creators/presenters, businesses (Free / Pro ₹999 per 30 days), admin.

## Core requirements
One account, + chooser (creator 3 steps / business 2 steps); 3 plans Per Video / Part-time (≤8 videos+1 shoot day) / Full-time (≤20 videos, category exclusive); discover + filters; offers with accept/decline/counter; deal pipeline pending→accepted→paid→delivered→completed; chat per deal with contact masking until paid; Free = 2 offers/month, no chat/pay; 10% fee from creator payout; admin approves creators and releases payouts; ratings; notifications; saved creators & businesses.

## Implemented (2026-10-28)
- All of the above end-to-end; iteration_1 test: backend 26/26, frontend all flows passed.
- Fixes after test: atomic/idempotent payment verify (deal must be accepted), date not masked as phone, name/photo change re-queues approval, saved validates target, sample creators show no fake ratings, logout → landing, specific deal toasts.
- Saved now supports creators and businesses; top bar: Search, Saved, Notifications.

- Location (OLX-style): 6,413 Indian cities/towns (GeoNames ≥5k pop, incl. tier 2/3) in backend/data/in_cities.json; picker with All India / state / city / GPS; distance chips (only city, 10–250 km); 2dsphere geo search, "X km" on cards, nearest-first; used for creators, businesses and setup forms.
- Razorpay keys requested via secure card (real payments turn on once added).

- Iteration 3 (zip parity): plans shown on tiles; Sort (not price band) in filters; multi-category creators; creators offer 1–3 plans; photo uploads as posts (/app/posts, max 12); zip-style Profile (hero, metrics, Live/Offline for creator & business, tools rows); Settings page (notification prefs, payouts, privacy, help, terms, logout/delete); businesses multi-plan + description; Jobs: businesses post jobs, only open jobs of live businesses show in Discover "Jobs by businesses"; creators "I'm interested"; business manages interests (shortlist/decline/send offer); business public profile. Offline creators can't get new offers. iteration_2: backend 47/47, frontend all flows passed.
- Razorpay: user skipped keys → payments still MOCKED test mode.

- Iteration 4 (Admin panel, /admin): owner = OWNER_EMAIL (ganeshreddypittu111@gmail.com), helper admins added by email (or invite consumed at sign-up). Dashboard (today/7d/30d/all, money, needs-attention), creator approvals with rejection reason, users search/filters/detail, block/unblock (403 account_blocked + Clerk session revoke, content hidden, deals paused), jobs/posts removal, deals & payouts (auto payout on business approval, failed→retry/auto-retry on UPI save), reports (creator/business/job/deal) & disputes (release/refund), team (owner only), activity log. Payouts/refunds TEST MODE (MOCKED). iteration_3: backend 18/19 → fixed (admin chat impersonation), frontend all flows passed.

- Iteration 5: real chat threads (Message → /app/chat, status "chat", Send offer inside chat converts same thread); free businesses contact up to N creators (default 3, chats free), Pro unlimited; public profile visit counts; admin Prices page (owner edits Pro price/days, fee %, free contacts); Growth charts (users, profiles & deals, earnings; 30/90/365 days); User journey (pages reached, where people stop with exit rate & avg time, setup-step tracking, account funnel). iteration_4: backend 100%, frontend flows passed; follow-up fixes for funnel display, dynamic price copy, track whitelist/dedupe.

- Iteration 6 (live sign-in loop on www.hireavatar.co): Clerk fallback redirect now /app; "We couldn't finish signing you in" screen with Try again / Sign out (app + admin); sign-in-unavailable screen with Try again; apex hireavatar.co → www redirect in index.html. Production RCA requested from deployer (Clerk domain/allowed origins, backend URL on custom domain). Needs re-publish; not yet verified live.

- Iteration 7: Sign-in health check (auth_events: login page, signed in, couldn't finish, sent back to login, blocked; per day in IST and per web address; red alert when today's failure rate ≥20%). Live loop root cause (deployer): Emergent-managed production Clerk instance still bound to brandface.emergent.host — needs Emergent support (support@emergent.sh) to add www.hireavatar.co/hireavatar.co; user should enable root domain redirect in Deployment → Domains.

- Iteration 8 (native companion auth, 2026-11-21): Android and iPhone Capacitor shells use app ID `co.hireavatar.app`, register the `co.hireavatar.app://auth/callback` scheme, and enable CapacitorHttp. Added the `capacitor-clerk` secure-storage bridge: native users have Google SSO through the system browser plus email/password sign-in, email sign-up verification, and email second-factor verification. Browser auth remains on Clerk's prebuilt screens and returns to `/app`, never the native callback. Native projects synchronized; web build passed; browser auth was visually checked at desktop/mobile; Android Gradle reached SDK resolution after Kotlin configuration but cannot assemble in this container because no Android SDK is installed. The managed production Clerk allowlist still requires a platform-side addition of the callback URL.

- Iteration 9 (APK layout/performance correction, 2026-11-21): Addressed APK report of status-bar overlap, zoom drift, generic native login, and slow/stuck discovery. The native shell now uses Capacitor safe-area variables with Android minimums and iOS env fallbacks, raises the header/dock above system bars, locks native-only viewport scaling, and constrains horizontal overflow. Native sign-in was simplified to compact social-app styling. Discover uses public creator data without waiting on a Clerk token, shows six immediate shimmer cards, exposes retry on request failure, and API calls time out after 12 seconds. Route-level splitting reduced the initial JavaScript bundle from 942.61 kB to 804.06 kB gzip. Startup now shows a branded shell rather than a blank/lone spinner. Iteration_7 testing: 8/8 requested static/web checks passed; final build and Capacitor sync passed. Physical Android/iPhone verification remains unavailable in this container.

## Backlog
- P2 (admin): growth charts, spreadsheet export, broadcast announcements, verified-badge control
- P3 (admin): finer helper roles, auto-flagging, daily admin email summary
- P0: Add Razorpay keys (payments currently MOCKED test mode); set ADMIN_EMAIL.
- P0: Platform-side Clerk allowlist: add `co.hireavatar.app://auth/callback` for the native app; separately complete the pending `www.hireavatar.co` custom-domain rebind.
- P1: Phone OTP login, automatic payouts (Razorpay Route), email alerts, calendar date picker in offer dialog.
- P2: Featured boost, AI matching, PDF contracts/invoices, multi-currency.
- P2: Produce signed Android/iOS binaries on a workstation with Android SDK/Xcode; iOS also needs the capacitor-clerk Swift package linked in Xcode.
- P1: Rebuild and test the APK on a real Android 15+ device and iPhone, checking system insets, signed-in Discover loading, and native Clerk return handling.
- P0: User chose a React Native/Expo companion instead of Capacitor. This requires a separate Mobile App project; retain the existing web product and reuse its FastAPI/MongoDB APIs from the new app once created.
