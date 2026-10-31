# Build notes

What's built, where the design and PRD disagree, and what's left open.

## Built so far

| Module | Screens / PRD | Routes |
| --- | --- | --- |
| Shared components | CLAUDE.md list + brief | `src/components/ui`, `src/components/layout` |
| Instructor sign in + reset | `Inst-SignIn`, `Reset-*`; INS-ONB-05, LRN-AUTH | `/instructor/sign-in`, `/instructor/reset-password[/check-email,/new]` |
| Create Course wizard | `Inst-CreateCourse`; INS-CRS 01–10 | `/instructor/courses/new`, `/instructor/courses/[id]/edit` |
| Learner sign up + onboarding | `Main`, `SignUp-*`; LRN-ONB | `/sign-up`, `/sign-up/account`, `/sign-up/verify`, `/verify-email`, `/onboarding/*` |
| Learner sign in + reset | `SignIn`, `Reset-*`; LRN-AUTH | `/sign-in`, `/reset-password/*` |
| Learner dashboard, notifications | `Dashboard-*`, `Notifications`; LRN-DASH | `/dashboard`, bell popover (shared with instructors) |
| Discovery | `Recommended-All`, `Courses-All`, `Search-*`, `SortFilter`, `Filter-Results`; LRN-DISC | `/recommended`, `/courses`, `/courses?filtered=1`, `/search` |
| Details, cart, wishlist, checkout | `CourseDetails*`, `Cart*`, `Wishlist*`, `Checkout-Dialogs`, `Redirect`, `PaymentSuccess`; LRN-BUY | `/courses/[id]`, `/cart`, `/wishlist`, `/checkout/redirect|success|failed` |
| My Courses + lesson player | `MyCourses-*`, `Lesson-*`; LRN-LEARN | `/my-courses`, `/learn/[course]/[lesson]`, `?view=expanded`, `/learn/[course]/quiz` |
| Lesson Q&A | `QA-*`; LRN-QA | `/learn/[course]/[lesson]?tab=qa[&q=id]` |
| Certificates | `Certs-*`, `Cert-Preview`; LRN-CERT | `/certifications`, `/certifications/[id]`, PDF `/api/certificates/[id]/pdf`, public `/verify/[code]` |
| Community, support, settings | `Community*`, `Support`, `Settings*`; LRN-ACC | `/community`, `/community/[id]`, `/support`, `/settings` |

| Instructor sign up + onboarding | `Inst-Onboarding`; INS-ONB | `/instructor/sign-up[/verify]`, `/instructor/verify-email`, `/instructor/onboarding[/profile,/done]` |
| Instructor dashboard, notifications, search | `Inst-Dashboard*`, `Inst-SearchResults`; INS-DASH | `/instructor/dashboard`, `/instructor/search` |
| My Courses + details by status | `Inst-MyCourses`, `Inst-CourseDetails`; INS-MGT | `/instructor/courses`, `/instructor/courses/[id]` |
| Lesson preview | `Inst-LessonPreview`; INS-PRV | `/instructor/courses/[id]/lessons/[lessonId]` |
| Engagement + reply to questions | `Inst-CourseEngagement`, `Inst-ReplyQuestion`; INS-ENG | `/instructor/courses/[id]/engagement`, `/instructor/questions/[id]` |
| Earnings, bank, PIN, withdrawals | `Inst-Earnings`, `Inst-Withdraw`; INS-PAY | `/instructor/earnings` (panels), receipts `/api/instructor/transactions/[id]/receipt` |
| Instructor community | `Inst-Community`; INS-COM | `/instructor/community`, `/instructor/community/[id]` |
| Instructor support + settings | `Inst-Support`, `Inst-Settings`; INS-SET | `/instructor/support`, `/instructor/settings?tab=…` |
| Staff console (no design) | PRD 11 ADM-01…11, PRD 9 staff 2FA | `/admin/sign-in` → `/admin/2fa`, then `/admin` (review queue), `/admin/live`, `/admin/reports`, `/admin/payouts`, `/admin/reconciliation`, `/admin/orders`, `/admin/support[/id]`, `/admin/users[/id]`, `/admin/bonuses`, `/admin/settings` |
| Quiz marking (no design) | PRD 5.3 short answer / upload questions | `/instructor/grading`, `/instructor/grading/[attempt]` |

All 55 learner and 16 instructor screens are built. `Settings-NewPassword` is covered by the reset flow (Settings → Forgot Password → email → `/reset-password/new`).

### Learner-side differences and additions
- Legal credentials: PRD LRN-ONB-04 "Are you a lawyer?" (Yes → call-to-bar year, jurisdictions, practice areas; No/Skip). The design shows only jurisdiction + practice area.
- Verification email screen: the design's "This link will expire in 09:58" timer now counts down to the next allowed resend; links last 24 h (PRD 4.1).
- Wishlist heart added to course details (the empty wishlist says "click the heart icon" but no screen shows one).
- Free courses: "Enrol for Free" instead of Add to cart / Buy (LRN-BUY-07).
- Filter panel: added "New arrivals" and "Offers a certificate" (the Filter-Results chips imply them) and min/max price inputs instead of the drawn slider.
- Lesson completion: checkboxes in the course content panel (as drawn) plus "Mark this lesson as complete" and "Next"; videos complete when they end; resume position saved every 10 s.
- Final quiz screen (`/learn/[course]/quiz`) is not in the designs; built for LRN-CERT-02. MC/TF are auto-marked; short answer and upload count as correct once answered (no instructor grading screen exists). Pass mark 70% (placeholder, open question).
- Certificate (lawyer variant): the design says "valid for CLE credit submission under NBA guidelines". PRD 3 puts CLE accreditation out of scope, so that line is removed; the lawyer closing line remains.
- Certificates also get a server-side PDF and a public verification page (PRD 10).
- Community: delete copy reads "post" (the design reuses "question" copy from Q&A); others' replies can be reported (PRD LRN-ACC-02 / 6.6). Announcements are read-only threads visible to enrolled learners.
- Support attachment: 10 MB (design hint says 500 MB). Contact details are placeholders in `src/lib/support.ts`.
- Settings → "Notifications and Preferences" is a placeholder in the design; built from LRN-ACC-03 (notification toggles, legal credentials, interests).
- No learner rating screen exists in the designs, so ratings aren't collected yet; the `CourseRating` table is ready.

### Instructor-side differences and additions
- Onboarding background: jurisdictions and practice areas are multi-selects (PRD INS-ONB-02); the design has single selects. Profile has four optional `https://` links (LinkedIn, X, website, other; INS-ONB-03); the design has one.
- Status labels use Live / Draft / Under Review / Rejected / Archived everywhere; the dashboard design says "Published" / "Under review".
- Course details: no "Requirement and Materials" section (not in the data model); Objectives come from "What will learners gain?".
- Lesson preview write-up uses the same rich-text editor as the wizard (INS-CRS-06) instead of the drawn heading + textarea.
- Withdrawals go to saved, verified accounts only. The design lets you type in "another bank" on the form, which would bypass the PRD's 24 h hold after a bank change (PRD 7.1/9). New accounts are added through the verify flow and become usable after 24 h.
- Total debit = amount + ₦20 charge and must fit within Available (the PRD says "at most the Available balance").
- Closing the add-bank setup asks "Discard Setup?" (PRD 6.4); editing bank details asks "Leave without saving?" (INS-PAY-10). The design uses the second for both.
- PIN: 3 wrong tries lock for 30 minutes; 0000, 1234 and repeated digits are blocked (PRD 7.1). Forgot PIN and Settings → Transaction PIN both confirm the account password.
- Announcement guidelines: one course per announcement (PRD INS-COM-06 and data model; the guidelines text says multiple) and JPEG/PNG/PDF attachments (PRD 7.1; the guidelines say JPEG/PNG). Announcements expire after 30 days (placeholder for the open question).
- Instructor support categories follow the design (Course Management, Learner Issue, Publishing, Bank Setup) plus Account and Other.
- Settings tabs: Account, Profile, Legal Background, Payout Preference, Transaction PIN, Notifications and Preferences.
- Instructors never see learner email or phone (INS-ENG-05; checked by the end-to-end test).
- Admin console: minimal and unstyled beyond the design system (no designs exist). It covers ADM-01/02 only; the other ADM modules (moderation queue, payouts, refunds, support inbox, user lookup, bonuses, content settings) and staff 2FA are not built.

## Design fidelity pass

Every design file was rendered with its own runtime (extracted from the `Lawdemy.html` canvas export) next to the built page, at 1440 px, and compared screen by screen. Fixed in this pass:

- **Auth:** the design's white-disc arrow on primary buttons (Continue, Sign In, Explore, Browse Courses, Join Community, Submit Request); underlined text links (Sign in/up, Forgot Password?, Resend link, Terms, See all); amber "Can’t find it?" hint with a lightbulb; learner field label "Email address"; "Resend link" copy on Check Your Email.
- **Learner shell:** sidebar highlights My Courses for the catalogue, search, cart, wishlist, course and lesson pages (Dashboard for the dashboard and Recommended); `/courses` gets the back button; the active cart or wishlist icon is tinted; the learner bell shows an unread count (instructor bell keeps the red dot, as drawn).
- **Dashboard and My Courses:** first-time cards rebuilt to the design (cream "No Courses yet" with an outlined icon, community card with the 2×2 avatar grid, primary buttons); the new-user empty state has no box or button.
- **Lesson player:** the expanded reading view gets Previous lesson / Mark as complete (turns green "Completed"); the current lesson row is tinted in Course Content; "Your progress" uses the orange trophy.
- **Certificates:** primary Download buttons; a real QR code linking to `/verify/[code]` on the preview and in the PDF.
- **Settings:** learner and instructor Account tabs rebuilt to the drawn layout (read-only field boxes with filled action buttons; equal-width tabs). The instructor Account tab now holds General, Legal Background, Profile, Payout Preference (bank + PIN), Delete Account and Log out, edited in slide-overs, instead of six tabs. Old `?tab=payout|pin|profile|background` links open Account.
- **Support:** inline "Click to upload" dropzone, outlined contact icons and dark social chips (learner); the instructor variant uses the plain label/value contact list and "Tell Us More About Your Issue".
- **Instructor:** purple "What do these mean?" bars (My Courses, Earnings); the course banner is 220 px; Edit is grey-outline (disabled = lavender fill); Engagement summary is one card with two bars; Reply to question puts "Add your reply" with attach and Send Reply at the bottom of the panel; search results are a card grid with View Course; community tabs are full width with a pen icon on Create Post and flat rows; earnings show green `+` credits, grey `−` debits and unwrapped references.

Still different on purpose:
- The instructor top bar (search + bell) stays on Settings and Support for consistent access to notifications; the design omits it there.
- Password rules follow PRD 7.1 (8+ chars, lowercase, special; plus number/uppercase for instructors), not the design's checklist.
- Support uploads stay at 10 MB (PRD 7.1), not the design's 500 MB.
- Seeded lessons have write-ups but no video, so `Lesson-Video` and `Inst-LessonPreview` can only be compared after uploading one.
- Duplicate/Archive buttons appear on Overview and Content, not under Engagement.

## Where the design and PRD differ (PRD followed)

| Topic | Design | Built (PRD) |
| --- | --- | --- |
| Course Information required fields | Proceed enables with title + category | Also requires **description** (INS-CRS-02, 6.3) |
| Publish Course enabled | When any module has a lesson | Also needs a **valid final quiz when the certificate is on** (INS-CRS-10); every lesson must have a video or write-up |
| Save Draft | Header button on the builder only | Available on **every step** (INS-CRS-09) |
| Cancel / back arrow | Plain link to the dashboard | **Saves the draft first**, then returns (PRD 6.3) |
| Auto-save | Not shown | Every **30 s** when there are changes (INS-CRS-09), with a quiet "All changes saved" status |
| Module reorder | Up/down buttons | Up/down buttons **plus drag** (INS-CRS-05) |
| Password rules | 8+, uppercase, number, special | PRD 7.1: 8+, lowercase, special; instructors also need **uppercase or number**; common passwords blocked |
| Discount | Fixed 25%, end date optional | 1–90% (PRD 7.1), end date required and in the future; "Learners will pay" uses the real values |
| Instructor reset links | Instructor sign-in links to the learner reset screens | Instructor-specific reset routes with the instructor hero (same layout and copy) |

## Back office (PRD 11)

All console pages need a staff session that has passed TOTP 2FA (PRD 9). Staff sign in, then `/admin/2fa` enrols an authenticator on first use (QR + manual key) or asks for the code; 5 tries per 5 minutes. The seeded staff account has the dev-only secret `JBSWY3DPEHPK3PXP`. Another staff member can reset someone’s 2FA from Users.

| Module | What it does |
| --- | --- |
| ADM-01/02 Review queue | Unchanged: oldest first against 48 h, read-only preview, approve or reject (≥ 20-char reason). |
| ADM-03 Live courses | Unpublish a Live course with a reason; tick "legal or safety" to end enrolled learners’ access (checked in the player, quiz and progress APIs). The instructor is notified and emailed and can’t restore it; staff can. |
| ADM-04 Reports | Open reports grouped per post/reply with count, reasons and content. Dismiss, hide, warn (in-app note) or suspend (hide + lock account + sign out). Reporters are never shown to authors. |
| ADM-05 Payouts | Withdrawals by status with provider reference and failure reason. Over `WITHDRAWAL_APPROVAL_KOBO` (₦500,000 default) a withdrawal waits in *Awaiting approval* with funds reserved; approve sends it, decline returns the funds. Failed transfers can be retried (funds re-reserved under the instructor lock). Freeze/unfreeze a wallet from Users. |
| ADM-06 Reconciliation | Compares paid orders and withdrawals with the provider and checks ledger invariants (earning per paid item, debit = amount + fee, matching statuses, transfers stuck > 24 h). Run from the console or nightly via `GET /api/cron/reconcile` with `Authorization: Bearer $CRON_SECRET`. |
| ADM-07 Orders & refunds | Full or partial refund per order item through the provider; reverses the instructor’s share as a `REFUND` ledger entry (pending while the earning is pending); optional access revoke. Learner is notified and emailed. |
| ADM-08 Support inbox | Tickets from both apps by status/category; reply by email (ticket → Pending), reply and close, assign to staff, close/reopen. |
| ADM-09 Users | Search; profile, courses, enrolments, orders, wallet and ledger; clear failed sign-ins, unlock PIN, freeze wallet, deactivate/reactivate, reset staff 2FA. |
| ADM-10 Bonuses | Credit a Promotional Bonus (available immediately) with a description shown to the instructor. |
| ADM-11 Content settings | Course categories, practice areas, jurisdictions, professional titles, interests and report reasons. Add, rename (not categories), reorder, hide. Hidden values stay valid where already used. Both apps read the lists at request time; the server validates against them. |

Every staff action is written to the audit log.

## Functional additions

- **Course ratings:** enrolled learners rate 1–5 stars from "Your progress" in the player (changeable). Averages appear on course cards and course details, and in the instructor dashboard.
- **Quiz marking:** answered short-answer and upload questions are *pending* until the instructor marks them. The attempt waits for review only if it could still pass; otherwise the result is final straight away. Instructors get a notification and a dashboard banner, mark each answer correct/incorrect with an optional comment and see the projected score; saving recalculates the score, can issue the certificate and notifies the learner, who sees the marks and comments on the quiz page.
- **Captions:** lessons with a video accept a WebVTT (`.vtt`) captions file; the player and the instructor preview add an English captions track.
- **Data export:** Settings → "Download my data" (both apps) returns a JSON file of the account’s profile, activity, orders, courses and earnings. Secrets (password/PIN hashes, 2FA secret, full account numbers) are never included. 3 per hour; audited. The PRD allowed "via support" in v1; self-serve is simpler.

## Additions not shown in the designs

- Sign-in error banner: "Incorrect email or password", a lockout message with a reset link, and a not-verified message.
- Reset: "Resend link" with a 60 s cooldown and a "Reset link resent" toast; expired/used-link state (PRD 4.2 acceptance criteria).
- Quiz panel: incomplete questions are outlined in red with the reason (PRD: "the question is flagged").
- Builder: a "Before you can publish" list appears once a lesson exists but publishing is still blocked.
- User card in the sidebar opens a "Log out" menu.

## Decisions and assumptions

- **Stack**: Next.js 15 (App Router) + React 19 + TypeScript + Tailwind 4; Prisma 6 + PostgreSQL; Argon2id (`@node-rs/argon2`); zod. The brief left these as placeholders.
- **Course duration** is stored as `duration_seconds` + format (the PRD says `duration_minutes`) because the design offers a "Minutes and Seconds" option.
- **Drafts** are saved as a whole document (`PUT /api/instructor/courses/:id`); module/lesson/question IDs are generated on the client.
- A draft is created on the **first save**, so opening and abandoning an empty wizard leaves nothing behind.
- Under Review, Live and Archived courses can't be edited or resubmitted (PRD 7.2), and the server enforces this.
- Write-ups are sanitised on the server (`sanitize-html` allowlist).

## Integrations stubbed for local dev

| Area | Local | Production TODO |
| --- | --- | --- |
| Email | `EMAIL_PROVIDER=console` prints emails (with links) to the server log | Add the chosen provider in `src/lib/email` |
| Media | `STORAGE_DRIVER=local` writes to `./uploads`; videos are READY right after upload | S3-compatible signed uploads + video host (transcode, HLS, signed playback, webhook → READY); resumable/chunked uploads for 500 MB files (PRD 9) |
| Video length | Checked in the browser from file metadata | Verify duration server-side from the video host |
| Rate limits | In-memory, shared per process (on `globalThis`) | Move to Redis/DB before running more than one instance |
| Common passwords | ~20-entry sample | Load the 10,000-entry list (PRD 7.1) |
| Orphaned uploads | Not cleaned | Sweeper job for assets no lesson or course references |
| Payments, bank lookup, payouts, refunds | `PAYMENT_PROVIDER=mock`: hosted checkout simulated at `/api/payments/mock/pay` (signed webhook + callback; disabled in production builds); account numbers ending `0000` fail verification; transfers to accounts ending `9` fail; refunds always succeed | Implement `PaymentProvider` (`initialize`, `verify`, `parseWebhook`, banks, account resolve, `transfer`, `transferStatus`, `refund`) for Flutterwave or Paystack (open question) |
| Bank encryption | Dev key derived in code | Set `BANK_ENC_KEY` (required in production) |
| Media access | `/api/media/[id]` checks access and supports range requests | Signed, expiring CDN URLs (PRD 9) |
| Account deletion | Anonymised immediately | 30-day purge job and statutory retention of financial records (PRD 9) |
| Reconciliation schedule | Run from the console | Schedule `GET /api/cron/reconcile` daily with `CRON_SECRET` set |
| Captions | Instructor uploads a `.vtt` file | Auto-generated captions from the video host, if wanted |

Business values the PRD leaves open (commission 20%, pending 7 days, ₦20 withdrawal fee, 70% pass mark, 30-day announcement expiry) are placeholders in `src/lib/config.ts` and can be overridden by env.

## Open PRD questions

Section 13: commission per sale, pending-to-available period, withdrawal fee, refund policy, quiz pass mark, small edits on Live courses, one account for both roles, payment provider (Flutterwave vs Paystack), CLE/CPD accreditation, announcement expiry, support contact details.

## Local database

`npm run db:local` runs real PostgreSQL 17 binaries via `embedded-postgres`, initialised as UTF-8 (Windows would otherwise default to WIN1252, which can't store ₦). Data lives in `.pgdata/`. Stop it with Ctrl+C, or `node_modules/@embedded-postgres/windows-x64/native/bin/pg_ctl stop -D .pgdata -m fast`. To start over: stop it, delete `.pgdata`, then run `db:local`, `db:deploy` and `db:seed`.

## Verification

- `npm test`: 40 unit tests (publish rules, quiz grading incl. pending/marked written answers, TOTP against the RFC 6238/4226 vectors, status matrix, lockout, password policy, money and durations, withdrawal limits, WAT month boundaries).
- `npm run typecheck` and `npm run build` pass.
- Browser end-to-end runs (Playwright with Edge, kept outside the repo), all passing:
  - learner sign-up → verification → onboarding → discovery/filters → cart → mock checkout → lessons → Q&A → quiz (dev server);
  - Create Course wizard; instructor dashboard → reply → duplicate/delete → engagement → withdrawal (wrong/right PIN) → announcement → settings → admin 2FA → approval (production build);
  - staff console: 2FA (wrong/right code) → report warn → approve large withdrawal → retry failed transfer → bonus → partial refund → support reply → wallet freeze → takedown/restore → content settings → reconciliation (production build);
  - quiz marking → learner notified with comments → rating → captions upload → data export (production build).
- Running a production build locally needs `BANK_ENC_KEY` (it refuses the dev key), and the mock checkout is disabled there.
- `npm run db:seed -- --fresh` also resets James’s own courses, withdrawals and bonuses to the demo state.
