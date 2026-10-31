# Lawdemy PRD v1 (text export)

> Plain-text extract of `Lawdemy PRD v1.pdf` (Oct 24, 2026). Tables are flattened; check the PDF when a table reads oddly.

Lawdemy PRD v1

Lawdemy: Product Requirements Document (v1)
Oct 24, 2026 · @Thanks · Status: Draft for review

1. Overview
Lawdemy v1 is a two-sided web platform where African legal professionals publish paid and free courses, and lawyers and non-lawyers buy, take and get certified on them. This PRD covers both apps as they appear in the v1 design canvas (Learners page and Instructors page), plus the admin capabilities those designs imply.
Problem
Lawyers need accessible, locally relevant continuing education, and proof of it (certificates, CLE/CPD credit), without travelling to in-person sessions. Non-lawyers (founders, compliance staff, students, the public) need plain-language legal knowledge that fits African jurisdictions, not US/UK-centric material. Experienced legal practitioners have no simple way to package their expertise, reach learners across Africa, and get paid in naira to a local bank account.
Vision
Become the default place in Africa to learn law and to teach it: trusted course quality (every course is reviewed before it goes live), learning that fits a busy schedule, and instructor payouts that are fast and safe.
Target users

User
Learner (Lawyer)
Learner (Nonlawyer)

Who they are Practising lawyer, Nigeria first
Founder, compliance officer, student, curious public

Primary job
Earn credentials and upskill in a practice area
Understand the law relevant to their work or life

Page 1 of 38

Lawdemy PRD v1
User Instructor
Admin / Reviewer

Who they are
Senior lawyer, lecturer, consultant, retired judge Lawdemy staff

Primary job
Create courses, engage learners, earn and withdraw income
Review courses, moderate community, process payouts, answer support

Page 2 of 38

Lawdemy PRD v1

Success metrics (KPIs)

Area Learner acquisition Learner activation
Conversion Learning
Learning Engagement
Instructor supply
Instructor quality
Instructor engagement Payouts
Revenue
Trust

KPI
Sign-up to email-verified rate
Verified learners who start a lesson within 7 days
Course detail view to purchase
Course completion rate (enrolled to completed)
Certificates issued per month
Learners who post a question or community reply per month
Instructor sign-up to first course submitted
First-review approval rate; median review time under 48 hours
Median time for an instructor to answer a learner question
Withdrawal success rate; median time to bank
Gross merchandise value (GMV) and Lawdemy take per month
Reports per 1,000 community posts; reports actioned within 24 h

v1 target [TARGET, e.g. 70%] [TARGET]
[TARGET] [TARGET]
[TARGET] [TARGET]
[TARGET]
[TARGET] / 48 h
[TARGET, e.g. under 48 h] [TARGET, e.g. 98%] / [TARGET] [TARGET]
[TARGET]

2. Personas
Four personas drive v1. The first three use the product directly; the fourth runs the back office the designs depend on.

Page 3 of 38

Lawdemy PRD v1

Persona
Adaeze, Learner (Lawyer)
Tunde, Learner (Nonlawyer)
James, Instructor
Ngozi, Admin / Reviewer

Profile
32, corporate associate in Lagos, 6 years' call
29, startup founder in Abuja
48, Senior Advocate, part-time lecturer
Lawdemy content and operations staff

Goals
Keep current in M&A and compliance; earn certificates that count toward professional development
Understand contracts, company formation, data protection
Share expertise, build a reputation, earn extra income
Keep quality high and the community safe; pay instructors correctly

Pain points
No time for inperson seminars; foreign courses ignore Nigerian law

What v1 must do for them
Course search by practice area, short lessons, verifiable certificates marked for lawyers

Legal jargon; doesn't know what to ask a lawyer
Building and hosting a course is technical; slow, unreliable payouts
No tools yet (no admin screens in the designs)

Plain-language courses, preview lessons before buying, lesson Q&A with the instructor
Guided Create Course wizard, quick review, engagement data, withdrawals in two minutes with a PIN
Review queue with approve/reject plus reason, report queue, payout monitoring, support inbox

3. Scope
v1 ships every screen in the Learners and Instructors canvas pages on responsive web, plus a minimum admin console for review, moderation, payouts and support.
In scope for v1
Learner web app: onboarding, sign in and password reset, dashboard, notifications, discovery (search, filter, sort), course details, cart, wishlist, checkout through the payment provider, My Courses, lesson player (video and text), lesson Q&A,
Page 4 of 38

Lawdemy PRD v1
certificates, community, support, settings. Instructor web app: onboarding, dashboard, Create Course wizard (information, price, builder with lessons and final quiz), My Courses, course details for every status, lesson preview, engagement analytics, replying to learner questions, earnings, bank setup and transaction PIN, withdrawals, community (discussions and announcements), support, settings. Admin console (minimum): course review queue, report moderation queue, payout monitoring and retries, support inbox, user lookup. In-app notifications and transactional email (verification, password reset, purchase receipt, course review outcome, withdrawal receipt, support acknowledgement).
Out of scope for v1
Native mobile apps (the web app must be fully responsive instead). Live classes, webinars and off-platform events (announcement guidelines forbid them). Learner-to-learner direct messages. Multi-currency pricing and payouts outside Nigeria. Course bundles, subscriptions and coupons beyond the per-course discount. Email delivery of announcements (in-app only, per the guidelines). Formal CLE/CPD accreditation integration with bar associations (certificates only state completion). Instructor co-authoring or teams.
Assumptions
Nigeria launches first: prices in naira (), payouts to Nigerian bank accounts, English only. One account holds one role. A person who wants both roles signs up twice with different emails, unless the open question in section 13 decides otherwise. Lawdemy staff review every course before it goes live and every rejection includes a written reason. The payment provider handles card data; Lawdemy never stores card numbers. Copy and figures in the designs are placeholders where marked: support contact details, course images, instructor photos, certificate artwork.
Page 5 of 38

Lawdemy PRD v1

4. Learner app requirements
Requirement IDs use the pattern LRN-<module>-<number>. Each module lists its stories, its requirements, Given/When/Then acceptance criteria, and its states and notifications. Shared rules (password policy, file limits) live in section 7.
4.1 Onboarding and sign up (LRN-ONB)
Stories As a new learner, I want to sign up with my email so that I can buy and take courses. As a lawyer, I want to add my legal credentials so that my certificates and recommendations reflect my profession. As any learner, I want to pick areas of interest so that my dashboard recommends relevant courses.

ID LRN-ONB-01 LRN-ONB-02 LRN-ONB-03 LRN-ONB-04
LRN-ONB-05 LRN-ONB-06

Requirement
Account information step collects full name, email, password and confirm password, with a live password strength meter and rule checklist.
On submit, send a verification email and show the "Verification email sent" screen with Resend (ratelimited to once per 60 s).
The email link verifies the account and opens the "Email verified" screen. Links expire after 24 h.
Legal credentials step asks whether the learner is a lawyer. If yes, an expandable form collects call-tobar year, jurisdiction and practice areas; if no, the step can be skipped.
Areas of interest step offers multi-select chips (at least 1 required).
"You're all set" screen leads to the first-time dashboard.

Acceptance criteria

Page 6 of 38

Lawdemy PRD v1

Given a password that fails any rule, when I submit, then Continue stays disabled and the failing rule shows in red. Given an email already registered, when I submit, then I see "An account with this email already exists" and a Sign in link. Given an expired verification link, when I open it, then I see an expired state with a button to send a new link.
States and notifications: loading on submit; error banner on network failure; toast "Verification email resent" on resend.
4.2 Sign in and password reset (LRN-AUTH)
Stories
As a learner, I want to sign in and reset a forgotten password so that I never lose access to my courses.

ID LRN-AUTH-01 LRN-AUTH-02 LRN-AUTH-03
LRN-AUTH-04

Requirement
Sign in with email and password; Sign In stays disabled until both are filled.
After 5 failed attempts in 15 minutes, lock sign-in for 15 minutes and show a message with a reset link.
Reset flow: request (email)  "Check your email"  set new password (same rules, confirm must match)  success  sign in. Reset links expire after 1 h and work once.
The request screen always shows the same confirmation, whether or not the email exists (no account enumeration).

Acceptance criteria
Given wrong credentials, when I sign in, then I see "Incorrect email or password" without saying which. Given a used reset link, when I open it again, then I see the expired state.

Page 7 of 38

Lawdemy PRD v1

4.3 Dashboard and notifications (LRN-DASH)

ID LRN-DASH-01
LRN-DASH-02 LRN-DASH-03 LRN-DASH-04

Requirement
First-time dashboard shows a welcome, recommended courses based on areas of interest, and empty My Learning with a Browse courses call to action.
Returning dashboard shows continue-learning cards with progress, recent certificates and recommendations.
Recommended "See all" opens a full list of recommended courses.
Notifications list shows unread state, time, and type (purchase, Q&A reply, announcement, certificate); opening one marks it read; "Mark all as read" clears all.

Acceptance criteria Given an instructor replies to my question, when I open notifications, then I see the reply notification and it links to the thread.
4.4 Course discovery (LRN-DISC)

ID LRN-DISC-01
LRN-DISC-02
LRN-DISC-03

Requirement
Courses page lists all live courses with image, title, instructor, level, price (, with discount when set) and rating.
Search shows suggestions in a dropdown after 2 characters, a results page, and a no-results state with suggestions.
Sort (newest, most popular, price low to high, price high to low) and filter (category, level, price free/paid, duration) with removable filter chips and a results count.

Page 8 of 38

Lawdemy PRD v1

ID LRN-DISC-04

Requirement
Wishlist add/remove from any course card; wishlist page with empty state.

Acceptance criteria
Given filters that match nothing, when I apply them, then I see the no-results state and a Clear filters button.

4.5 Course details, cart and checkout (LRN-BUY)
Stories As a learner, I want to see what a course covers, watch preview lessons and pay securely so that I can decide and buy with confidence.

ID LRN-BUY-01
LRN-BUY-02 LRN-BUY-03 LRN-BUY-04
LRN-BUY-05 LRN-BUY-06
LRN-BUY-07

Requirement
Course details shows overview (description, outcomes, requirements, instructor bio), content (modules and lessons with durations; preview lessons playable), price and certificate availability.
Add to cart and Buy now; cart page lists items with remove, subtotal and total; empty cart state.
Free courses enrol directly without checkout.
Checkout shows an order summary and confirmation dialogs, then redirects to the payment provider.
Enrolment is granted only after the provider's server-side webhook confirms payment (not on the browser redirect alone).
Payment success screen links to the course; the course appears in My Courses as newly bought. A receipt email is sent.
Payment failure or cancel returns to the cart with an error message; nothing is charged twice (idempotent order reference).

Page 9 of 38

Lawdemy PRD v1

ID LRN-BUY-08

Requirement
A learner cannot buy a course they already own; the button shows Go to course.

Acceptance criteria Given the webhook confirms payment, when I return from the provider, then the course is in My Courses within 10 s, and the instructor's pending earnings increase. Given I close the provider page, when I return, then the cart is unchanged and I can retry.
4.6 My Courses and learning (LRN-LEARN)

ID LRN-LEARN-01 LRN-LEARN-02 LRN-LEARN-03 LRN-LEARN-04
LRN-LEARN-05

Requirement
My Courses has a new-learner empty state and an existing-learner list with progress and Continue.
Video lessons stream adaptively, remember the last position, and show the module and lesson list.
Text lessons render the instructor's write-up, with an expanded reading mode.
A lesson is marked complete when the video reaches 90% or the learner scrolls to the end of the text and taps Mark complete.
The final quiz unlocks when all lessons are complete; results show per-question feedback written by the instructor.

4.7 Lesson Q&A (LRN-QA)

ID LRN-QA-01

Requirement
Each lesson has a Q&A tab with an empty state, Ask a question (title, details, optional file up to 10 MB with progress), and a list of questions with activity.

Page 10 of 38

Lawdemy PRD v1

ID LRN-QA-02 LRN-QA-03
LRN-QA-04

Requirement
A question thread shows replies, with the instructor's replies badged.
Learners can edit or delete their own questions and replies (confirm dialog), and report others' posts (reason + details).
The instructor is notified of every new question; the learner is notified of every reply.

States and notifications: toasts for posted, edited, deleted and reported; upload error for files over the limit or the wrong type.
4.8 Certificates (LRN-CERT)

ID LRN-CERT-01
LRN-CERT-02 LRN-CERT-03
LRN-CERT-04

Requirement
A certificate is issued automatically when a learner completes all lessons and passes the final quiz (pass mark in section 7), for courses that offer certificates.
Certificates page has an empty state and a list; each opens a preview with Download (PDF) and Share link.
The certificate shows the learner's name, course, instructor, completion date and a unique verification ID; the lawyer variant also shows callto-bar details.
A public verification page confirms a certificate ID is genuine.

Page 11 of 38

Lawdemy PRD v1

4.9 Community, support and settings (LRN-ACC)

ID LRN-ACC-01
LRN-ACC-02
LRN-ACC-03

Requirement
Community lists discussions (title, excerpt, author, replies, upvotes) with a thread view; learners can post, reply, upvote and report.
Support form: category, message (required), optional attachment; success message and acknowledgement email; contact details shown.
Settings: profile (name, photo), email (change via support), change password (current + new + confirm, same rules), legal credentials, interests, notification preferences, delete account.

Acceptance criteria
Given I change my password, when it saves, then all other sessions are signed out and I see "Password changed successfully".

5. Instructor app requirements
Requirement IDs use INS-<module>-<number>. The instructor app has its own sign-up, sidebar (Dashboard, My Courses, Earnings, Community, Support, Settings) and an "Instructor" tag.
5.1 Onboarding and sign in (INS-ONB)
Stories As a legal professional, I want to sign up as an instructor and set up a public profile so that learners trust my courses.

ID INS-ONB-01

Requirement
Account information (name, email, password with strength rules)  verification link sent  email verified.

Page 12 of 38

Lawdemy PRD v1

ID INS-ONB-02
INS-ONB-03
INS-ONB-04 INS-ONB-05

Requirement
"Tell Us About Your Legal Background": professional title (select), years of experience (number), jurisdictions (multi-select), practice areas (multi-select). All required.
"Set Up Your Instructor Profile": photo (optional), professional bio (required, max 500 characters, live counter), LinkedIn, X, website and other links (optional, https:// prefixed, valid URL).
"You're all set" leads to the first-time dashboard.
Instructor sign in mirrors LRN-AUTH, including lockout and reset.

5.2 Dashboard, notifications and search (INS-DASH)

ID INS-DASH-01 INS-DASH-02
INS-DASH-03 INS-DASH-04

Requirement
First-time dashboard: "Welcome, <first name>", Create Course button, stat tiles at zero, "Complete your instructor profile" banner (until bio and photo are set), empty My Courses and Recent Questions.
Active dashboard: stat tiles (total courses, total learners, total earnings, average rating, open questions); My Courses table with search, status and date filters; Recent Questions from Learners with Reply.
Notifications panel: course review outcomes, new questions, enrolments, payout results; unread dots; Mark all as read.
Global search across the instructor's own courses; "See all results" opens the results page with a noresults state.

Page 13 of 38

Lawdemy PRD v1

5.3 Create Course wizard (INS-CRS)
Stories
As an instructor, I want a step-by-step builder so that I can turn my expertise into a structured course without technical help. As an instructor, I want a final quiz with feedback so that learners can prove what they learned and earn a certificate.

ID INS-CRS-01 INS-CRS-02
INS-CRS-03 INS-CRS-04 INS-CRS-05
INS-CRS-06

Requirement
Three-step stepper: Course Information, Price Information, Course Builder. Completed steps are clickable; later steps unlock in order.
Course Information: title (required, max 120), subtitle (max 160), description (required), learning outcomes, estimated duration (hours and minutes or minutes and seconds), category (required, 5 options), skill level, thumbnail (JPEG/PNG, 1280×720 recommended).
Price Information: Free or Paid; price in  (required when Paid, above 0); optional discount percent and end date, showing what learners will pay; certificate of completion toggle.
Course Builder: add, rename, reorder (drag and keyboard), collapse and delete modules; deleting asks "Delete Module and its Content?".
Add/Edit Lesson panel: title (required), video upload (MP4, max 500 MB) with progress and remove, write-up editor (bold, italic, headings, quote, link, lists), lesson duration, Mark as Preview. A lesson needs a video or a write-up.
Closing a lesson with unsaved changes asks "This Lesson isn't saved yet" (Discard Changes / Stay on Page).

Page 14 of 38

Lawdemy PRD v1

ID INS-CRS-07
INS-CRS-08 INS-CRS-09 INS-CRS-10

Requirement
Final quiz (one per course): title, optional instructions, one or more questions. Types: Multiple choice (2+ options, exactly 1 correct), True or False, Short Answer (optional model answer), Upload (Essay/Attachment). Optional feedback per question.
Quiz actions: add question, delete question (confirm), add/edit/delete feedback, Save Quiz, Edit Quiz, Delete Quiz (confirm), discard warning on close.
Save Draft (confirm "Save changes to Drafts?") at any step. Drafts auto-save every 30 s.
Publish Course is enabled when at least one module has a lesson [and a quiz, if the certificate is on]. It confirms "Ready to Publish Your course?" with the 24-48 h review time and moves the course to Under Review.

Acceptance criteria
Given a lesson with neither video nor write-up, when I try to save it, then Save stays disabled. Given a multiple-choice question with no correct option, when I save the quiz, then Save Quiz stays disabled and the question is flagged. Given I publish, when it succeeds, then I see "Course submitted for review", the status is Under Review and admins get the course in their queue.
Toasts: Price information saved; Lesson Saved; Lesson Updated; Lesson Deleted; File Deleted; Module Deleted Successfully; Quiz added; Quiz updated; Quiz Deleted; Changes saved to draft; Course submitted for review.

Page 15 of 38

Lawdemy PRD v1

5.4 My Courses and course details by status (INS-MGT)

ID INS-MGT-01 INS-MGT-02
INS-MGT-03 INS-MGT-04 INS-MGT-05 INS-MGT-06 INS-MGT-07 INS-MGT-08

Requirement
My Courses: Total Courses with counts for Live, Drafts, Rejected, Under Review, Archived; "What do these mean?" opens Understanding Course Statuses (one expandable answer per status).
Course library table: course, category, level, enrolled students, status, last updated; search, updated-after date, sort, status filter; no-results state with Clear. Empty state "Start your first course".
Course details have Overview, Content and Engagement tabs and a status badge. Allowed actions follow the matrix in section 7.
Under Review shows an orange "Course in Review" banner; Edit is disabled.
Rejected shows a red "Course Rejected" banner and a "Reason for rejection" box with the reviewer's text; Edit and Resubmit for Review are enabled.
Archive (Live): confirm, hide from new learners, keep enrolled access. Duplicate (Live): confirm, create "Copy of <title>" as a Draft with all content, offer View copy.
Restore (Archived): confirm, return to Live. Delete permanently: only when no learner is enrolled; confirm "Delete Course?"; removed from the library.
Draft and Rejected: edit and delete lessons and modules from the Content tab (Edit Lesson panel, confirms, toasts).

Page 16 of 38

Lawdemy PRD v1

5.5 Lesson preview (INS-PRV)

ID INS-PRV-01 INS-PRV-02 INS-PRV-03
INS-PRV-04

Requirement
Preview has Video Content and Lesson Write-up tabs; video plays and expands; write-up scrolls and expands.
Remove Video / Remove Text confirm with a warning; removing is blocked when it would leave the lesson with no content.
Replace Video opens Upload File with Video Guidelines (clear audio, max 30 min, MP4 max 500 MB). Add/Replace Text opens the write-up editor with a discard warning.
Changes to a Live course's lessons are not allowed (see section 7); preview edits apply to Draft and Rejected courses.

5.6 Engagement and learner questions (INS-ENG)

ID INS-ENG-01 INS-ENG-02
INS-ENG-03

Requirement
Engagement tab: total enrolled, average quiz score, quiz attempts; empty state "No learners enrolled yet".
Learner activity table: learner, role (Lawyer/Nonlawyer), last active, final quiz (Done/Not Started), questions asked, completion; search; sort (6 options); filter (role, last active, final quiz status, questions asked, completion) with chips and Clear all; pagination.
Learner Engagement detail: role, jurisdiction, modules completed, progress, last active, current module, questions asked (View opens replies), quiz attempt table or "No quiz attempts yet".

Page 17 of 38

Lawdemy PRD v1

ID INS-ENG-04
INS-ENG-05

Requirement
Reply to a question: "Write your response" with text (required) and optional attachment (image/PDF up to 10 MB, progress, preview, delete or replace); Send Reply; edit and delete own replies (confirm).
Learner privacy: instructors see name, role, jurisdiction and course activity only, never email or phone.

5.7 Earnings, bank and payouts (INS-PAY)
Stories
As an instructor, I want to see what I've earned and withdraw it to my bank so that teaching pays me reliably.

ID INS-PAY-01 INS-PAY-02 INS-PAY-03 INS-PAY-04

Requirement
Earnings summary: total earnings, Available to Withdraw, Pending Earnings, Last Withdrawal; "What do these mean?" explainer. First-time state: no transactions, "Add your Bank Info".
Add Bank Account: 10-digit account number  "Matching banks..." suggestion  bank select  "Verifying name..."  verified account name shown. Continue only when verified.
Create Transaction PIN (4 digits, show/hide)  Save Bank Details  "Bank Information saved successfully". Closing midway asks "Discard Setup?".
Transaction history: ID, course/description, learner, amount, type (Enrollment, Promotional Bonus, Withdrawal), status (Successful, Pending, Failed), date; search, date range, sort, type/status filter, chips; no-results state.

Page 18 of 38

Lawdemy PRD v1

ID INS-PAY-05 INS-PAY-06
INS-PAY-07 INS-PAY-08 INS-PAY-09 INS-PAY-10 INS-PAY-11

Requirement
Transaction details panel by type: enrolment, pending, failed withdrawal (Edit Bank Info, Retry Withdrawal), successful withdrawal and bonus (Download Receipt as PDF).
Withdraw Earnings: available balance chip; default bank or another bank (verified); amount with quick chips; validation (min  1,000, max available); Confirm  Confirm Withdrawal Details (amount, bank, account, name, charge, total)  Enter Transaction PIN  Processing  Withdrawal Successful  receipt.
Wrong PIN shows "Incorrect PIN. N tries left"; after 3 failures, PIN entry locks for 30 minutes and Forgot Pin is offered.
Forgot PIN: verify account password  new PIN + confirm (must match)  "Transaction PIN Updated".
Choose Bank Account: list saved accounts with Default badge; Save Default; remove with confirm ("Bank Account Removed" toast); Add a New Bank Account.
Edit Bank Details: confirm password (Forgot Password sends a reset email)  "Please note" (up to 24 h to verify)  re-verify  Update Bank Details; "Leave without saving?" on close.
Cancel Withdraw confirm appears when an amount has been entered.

Acceptance criteria
Given  40,000 available, when I enter  50,000, then I see "Amount exceeds your available balance" and Confirm stays disabled. Given a correct PIN, when the provider confirms the transfer, then available balance falls by the amount, a Withdrawal transaction shows Successful and a receipt email is sent.

Page 19 of 38

Lawdemy PRD v1

Given the bank rejects the transfer, when the webhook arrives, then the transaction shows Failed, funds return to Available, and I'm notified.
5.8 Community and announcements (INS-COM)

ID INS-COM-01 INS-COM-02 INS-COM-03 INS-COM-04
INS-COM-05
INS-COM-06
INS-COM-07

Requirement
Discussions tab: posts with upvotes and reply counts; sort (Latest, Most Upvoted, Instructors Only, Learners Only); empty state "Let's kick off a conversation".
Create Post: choose Discussion or Announcement. Discussion: title, content, optional attachment (JPEG/PNG/PDF, max 5 MB, preview, delete, replace)  Publish Post.
Own posts: Edit (Update and Publish, marked Edited) and Delete (confirm, "Post Deleted").
Reply thread: Add Reply, edit and delete own replies ("Reply Deleted Successfully"), report others' replies ("Report this post": reason required, details optional, then "Thanks for reporting!"). Empty state "No replies yet".
Course Announcement: "Before you post" note and Announcement Guidelines; title, content, course (required), optional attachment  Publish Announcement; enrolled learners get an in-app notification.
Announcements table: title, course, created on, status (Published/Expired); date and status filters; details panel; Edit (Update and Publish, learners notified); Delete with a different confirm for expired announcements.
The 5th announcement for the same course in one calendar month is blocked with a clear message.

Page 20 of 38

Lawdemy PRD v1

5.9 Support and settings (INS-SET)

ID INS-SET-01
INS-SET-02
INS-SET-03 INS-SET-04 INS-SET-05 INS-SET-06
INS-SET-07

Requirement
Support ("Take a Seat"): category (Course Management, Learner Issue, Publishing, Bank Setup, Other), message, optional screenshot  "Your message has been sent!"; reply by email within 24 h.
Settings, Account tab: profile photo (change, remove with confirm), Edit Name (first, last), email (Contact Us), Change Password (current, new with strength, confirm; Forgot Password  Check Your Email  Set New Password  Password Reset Successful).
Legal Background edit: title, years, jurisdictions and practice areas as searchable multi-select chips. Profile edit: bio (500 max) and links.
Payout Preference: Add Bank Info (INS-PAY-02/03) or bank shown with Edit, and Update Transaction Pin (current, new, confirm; "Incorrect PIN" error; Forgot Pin  INS-PAY-08).
Notifications and Preferences tab: on/off for learner questions, enrolments, payout updates, Lawdemy news.
Delete Account: warning, optional reason (Other shows a text box), Deleting..., success. Blocked while the instructor has a positive Available balance, Pending earnings, or Live courses with enrolled learners [confirm policy].
Log out confirms, ends the session and returns to sign in.

Page 21 of 38

Lawdemy PRD v1
6. Key user flows
Six journeys carry most of v1's value. Each lists the happy path, then its cancel, back and failure paths. The course status lifecycle is drawn below them.
6.1 Learner: sign up to first lesson
1. Learner opens Sign up and enters name, email and password (rules shown live). 2. Lawdemy sends a verification email; the learner opens the link and sees "Email
verified". 3. Learner answers whether they're a lawyer (legal credentials form if yes) and picks
areas of interest. 4. "You're all set" opens the first-time dashboard with recommendations. 5. Learner opens a course, watches a preview lesson, and enrols (free) or buys (flow 6.2). Alternative paths: Back on any onboarding step keeps entered data. Closing the tab before verifying leaves the account unverified; signing in again shows "Verify your email" with Resend.
6.2 Learner: buy a course
1. Learner taps Add to cart or Buy now on course details. 2. Cart shows items and total; learner taps Checkout and confirms the order summary. 3. Lawdemy creates an order with a unique reference and redirects to the payment
provider. 4. Learner pays; the provider redirects back and sends a webhook. 5. On the verified webhook, Lawdemy enrols the learner, records the instructor's pending
earning, and shows Payment Success. 6. The course appears in My Courses as newly bought; a receipt email is sent. Alternative paths: Cancel at the provider returns to the cart, unchanged. A failed payment shows an error and Retry. A redirect that arrives before the webhook shows "Confirming your payment..." and polls for up to 60 s, then tells the learner to check My Courses shortly.
6.3 Instructor: create and publish a course
1. Instructor taps Create Course and completes Course Information (required: title, description, category).
Page 22 of 38

Lawdemy PRD v1
2. Instructor sets Price Information (Free or Paid with a price; optional discount and certificate).
3. In Course Builder, the instructor adds modules, then lessons (video and/or write-up), and optionally a final quiz with feedback.
4. Instructor taps Publish Course and confirms "Ready to Publish Your course?". 5. The course becomes Under Review; an admin approves it (Live) or rejects it with a
reason (Rejected). 6. On rejection, the instructor reads the reason, edits, and taps Resubmit for Review. Alternative paths: Save Draft at any point. Closing a lesson or quiz with unsaved changes asks to discard. Cancel on the wizard returns to the dashboard with the draft saved.
6.4 Instructor: add bank and withdraw
1. From Earnings or Settings, the instructor taps Add your Bank Info. 2. Enters a 10-digit account number; Lawdemy suggests the bank; the instructor selects
it. 3. Lawdemy verifies the account name and shows it; the instructor taps Continue. 4. Instructor creates a 4-digit transaction PIN and saves; "Bank Information saved
successfully" appears. 5. Later, the instructor taps Withdraw Earnings, chooses an account and amount, and
taps Confirm. 6. Instructor reviews Confirm Withdrawal Details, taps Proceed, and enters the PIN. 7. Lawdemy starts the transfer; on success the instructor sees Withdrawal Successful
and can view the receipt. Alternative paths: Closing setup midway asks "Discard Setup?". Cancel with an amount entered asks "Cancel Withdraw?". A wrong PIN shows the tries left; after 3, PIN entry locks and Forgot Pin is offered. A failed transfer returns funds to Available and offers Retry or Edit Bank Info.
6.5 Instructor: answer a learner question
1. Instructor sees a new question in notifications, the dashboard, or a learner's Engagement detail.
2. Opens "Write your response", types a reply and optionally attaches a file. 3. Taps Send Reply; the reply shows in the thread and the learner is notified.
Page 23 of 38

Lawdemy PRD v1
Alternative paths: Edit or delete the reply later from its menu (delete confirms).
6.6 Community: report a post
1. A user opens a reply's menu and taps Report Spam. 2. Chooses a reason (required) and adds details (optional), then Submit. 3. "Thanks for reporting!" shows; the post enters the admin report queue (section 11). Alternative paths: Cancel closes the form with nothing sent. Users cannot report their own posts.
6.7 Course status lifecycle
course status lifecycle · 6 states
Only an admin approval moves a course to Live; a rejected course returns to review only after the instructor edits and resubmits. Section 7.2 lists what each status allows.
7. Business rules and limits
Most rules in the designs hold up. Four need a decision before build: the withdrawal charge, the earnings holding period, the quiz pass mark, and whether Live courses can take small edits. All rules are enforced on the server, not just in the UI.
Page 24 of 38

Lawdemy PRD v1

7.1 Rules and limits

Rule Password

Value in designs
Min 8 chars, 1 special, 1 lowercase

Verification and reset links
Sign-in lockout

Not shown Not shown

Course review time 24-48 h

Editing while Under Review
Editing while Live

Locked Locked; duplicate to change

Archived course deletion
Lesson content Video upload

Only when no learners
Video or write-up required MP4, max 500 MB, max 30 min

Post attachments Q&A and reply uploads Instructor bio Final quiz pass mark

JPEG/PNG/PDF, max 5 MB Max 10 MB
Max 500 chars Not shown

Recommendation
Confirm, and also block the 10,000 most common passwords. Add 1 number or uppercase for instructors and admins, who handle money.
Verification 24 h; reset 1 h, single use.
5 failures in 15 min locks sign-in for 15 min.
Confirm; show the target as an estimate, not a promise.
Confirm.
Challenge: allow typo-level edits to text and price, with re-review only for new or removed lessons. Duplicating splits enrolments and reviews across two courses.
Confirm; enrolled learners keep lifetime access.
Confirm.
Confirm; also accept MOV and transcode it.
Confirm.
Align with 5 MB, or keep 10 MB for PDFs only.
Confirm.
Decide: suggest 70% to earn a certificate, unlimited retakes.

Page 25 of 38

Lawdemy PRD v1

Rule Announcements
Announcement expiry Minimum withdrawal Withdrawal charge
Withdrawal amount Transaction PIN Bank account
Pending to Available
Revenue share Refunds
Discount

Value in designs Max 4 per course per month, course updates only, in-app only "Expired" status shown, rule not stated  1,000  20 flat (illustrative)
At most the Available balance 4 digits; limited tries
Name must match verified holder; changes take up to 24 h
Not stated
Not stated
Not stated
Percent with end date

Recommendation
Confirm; count by calendar month in WAT.
Decide: suggest 30 days after publishing.
Confirm.
Decide: pass through the provider's transfer fee or absorb it.
Confirm.
3 tries, then a 30 min lock; block 0000, 1234 and repeated digits.
Confirm; also hold withdrawals for 24 h after a bank change (fraud control).
Decide: suggest 7 days after purchase, matching the refund window.
Decide: the Lawdemy commission per sale.
Decide: suggest a full refund within 7 days if under 20% of the course is completed.
Confirm; max 90%.

7.2 Actions allowed by course status

Action Edit content

Draft Yes

Under Review
No

Rejected Live

Yes

No (see

7.1)

Archived (with learners)
No

Archived (no learners)
No

Page 26 of 38

Lawdemy PRD v1

Action
Submit / resubmit for review Visible to new learners Enrolled learners keep access Duplicate Archive Restore to Live Delete permanently

Draft
Yes
No --
Yes -- -- Yes

Under Review --
No --
No No -- No

Rejected Live

Yes

--

No

Yes

--

Yes

Yes

Yes

--

Yes

--

--

Yes

No

Archived (with learners) --
No Yes
Yes -- Yes No

Archived (no learners) --
No --
Yes -- Yes Yes

8. Data model
Twenty-seven entities cover v1. Money is stored as integers in kobo, times in UTC, and every row has created_at, updated_at and a soft-delete deleted_at where users can delete.

Entity User
LearnerProfile InstructorProfile

Key fields
id, role (learner, instructor, admin), email, password_hash, email_verified_at, first_name, last_name, photo_url, status (active, locked, deleted)
user_id, is_lawyer, call_year, jurisdiction, practice_areas[], interests[]
user_id, professional_title, years_experience, jurisdictions[], practice_areas[], bio ( 500), links {linkedin, x, website, other}

Relationships Has one LearnerProfile or InstructorProfile
Belongs to User
Belongs to User; has many Course, BankAccount

Page 27 of 38

Lawdemy PRD v1

Entity Course
ReviewDecision Module Lesson MediaAsset
Quiz QuizQuestion
QuizAttempt Enrollment LessonProgress Certificate

Key fields
id, instructor_id, title, subtitle, description, outcomes, category, level, duration_minutes, thumbnail_url, access (free, paid), price_kobo, discount_pct, discount_ends_at, has_certificate, status, duplicated_from_id
id, course_id, reviewer_id, decision (approved, rejected), reason, decided_at
id, course_id, title, position
id, module_id, title, position, video_asset_id, write_up (rich text), duration_seconds, is_preview
id, owner_id, kind (video, image, file), storage_key, mime, size_bytes, status (uploading, processing, ready, failed), duration_seconds
id, course_id, title, instructions
id, quiz_id, type (mc, tf, short, upload), prompt, options [{text, correct}], model_answer, feedback, position
id, quiz_id, learner_id, score_pct, passed, answers, submitted_at
id, course_id, learner_id, order_id, progress_pct, current_lesson_id, completed_at, last_active_at
enrollment_id, lesson_id, position_seconds, completed_at
id, enrollment_id, verification_code, issued_at, variant (lawyer, non_lawyer)

Relationships Has many Module, Enrollment, ReviewDecision; has one Quiz
Belongs to Course and admin User Has many Lesson Has many Question; belongs to Module Referenced by Lesson, Post, Reply
Has many QuizQuestion Belongs to Quiz
Belongs to Quiz and User Belongs to Course and User
Belongs to Enrollment Belongs to Enrollment

Page 28 of 38

Lawdemy PRD v1

Entity Order OrderItem WalletTransaction
BankAccount Withdrawal TransactionPin Question, Reply Post
Report Notification

Key fields
id, learner_id, reference, total_kobo, status (pending, paid, failed, refunded), provider, provider_ref
order_id, course_id, price_kobo, instructor_share_kobo, platform_fee_kobo
id, instructor_id, type (enrollment, bonus, withdrawal, refund), amount_kobo, status (pending, available, successful, failed), reference, available_at, notes
id, instructor_id, bank_code, bank_name, account_number_last4, account_number_encrypted, account_name, is_default, verified_at
id, instructor_id, bank_account_id, amount_kobo, fee_kobo, status, provider_ref, requested_at, completed_at, failure_reason
instructor_id, pin_hash, failed_attempts, locked_until, updated_at
id, lesson_id or post_id, author_id, body, attachment_id, edited_at
id, author_id, kind (discussion, announcement), title, body, course_id (announcements), attachment_id, status (published, expired), expires_at, upvotes
id, reporter_id, target_type, target_id, reason, details, status (open, actioned, dismissed), handled_by
id, user_id, type, payload, read_at

Relationships Has many OrderItem Creates a pending WalletTransaction Ledger for the earnings summary
Belongs to InstructorProfile
Has one WalletTransaction
Belongs to InstructorProfile
Thread on a Lesson (Q&A) or Post Has many Reply, Upvote
Moderated by admin User
Belongs to User

Page 29 of 38

Lawdemy PRD v1

Entity SupportTicket
AuditLog

Key fields
id, user_id, category, message, attachment_id, status, assignee_id
id, actor_id, action, target_type, target_id, before, after, ip, at

Relationships Handled by admin User
Append-only

9. Non-functional requirements
Security of money and identity comes first; everything else targets a fast, accessible experience on mid-range Android phones over 3G/4G.
Security
Passwords hashed with Argon2id; transaction PINs hashed separately with their own salt and never logged or returned by any API. Sessions: HTTP-only, secure cookies; 30-day sliding expiry for learners, 7 days for instructors, 12 hours for admins. Changing a password or PIN signs out other sessions. Payout protection: withdrawals need the PIN; a new or changed bank account holds withdrawals for 24 h and triggers an email alert; withdrawals over [THRESHOLD, e.g.  500,000] need admin approval. Bank account numbers encrypted at rest; only the last 4 digits shown in the UI. All money movements go through an append-only ledger (WalletTransaction); balances are derived, never edited directly. Payment and payout webhooks verified by signature and processed idempotently. Rate limits on sign-in, reset, verification resend, PIN entry, uploads and posting. Uploaded files virus-scanned; videos served through signed, expiring URLs so paid content can't be hot-linked. Role-based access: instructors see only their own courses and learners' course activity; admin actions require staff accounts with 2FA.
Performance
Page interactive in under 3 s on a mid-range phone on 4G; API p95 under 500 ms. Video starts in under 2 s with adaptive bitrate down to 360p for weak connections.

Page 30 of 38

Lawdemy PRD v1
Uploads resumable (chunked) so a dropped connection doesn't restart a 500 MB video. 99.5% monthly uptime target for v1.
Accessibility (WCAG 2.1 AA)
Every interactive element reachable and usable by keyboard, with a visible focus ring. Dialogs trap focus and return it on close; tabs, switches, menus and toasts use the correct ARIA roles; toasts are announced to screen readers. Colour contrast at least 4.5:1 for text; status never shown by colour alone (badges carry words). Videos support captions [v1 or v1.1]; text alternatives for images.
Responsiveness
Layouts work from 360 px to 1440 px wide; the sidebar collapses to a menu on small screens; tables scroll horizontally or stack into cards.
Localisation
v1: English, naira () formatted with Intl (en-NG), dates in West Africa Time (WAT). Data model and copy keys ready for more currencies, countries and languages (French for Francophone Africa later).
Privacy and data retention
Comply with the Nigeria Data Protection Act 2023 (NDPA); publish a privacy policy and get consent at sign-up. Learners' email and phone never shown to instructors. Deleted accounts: personal data removed or anonymised within 30 days; financial records kept for [STATUTORY PERIOD, e.g. 6 years]; certificates stay verifiable unless the learner asks otherwise. Users can export their data on request (via support in v1).
Audit logging
Log every sign-in, password and PIN change, bank change, withdrawal, course status change, review decision, moderation action and admin action, with actor, time, IP and before/after values. Retain 2 years.
Page 31 of 38

Lawdemy PRD v1

10. Integrations
Eight integrations are needed for v1. The payment provider is the critical one: it handles checkout, bank lookup, name verification and payouts.

Integration
Payments (collections)

Used for Learner checkout

Bank lookup and name verification

Add/edit bank account

Payouts (transfers)

Withdrawals

Email
Video hosting and streaming

Verification, reset, receipts, review outcomes, withdrawal receipts, support acknowledgements
Lesson videos, previews

Requirements
Hosted checkout (card, bank transfer, USSD); signed webhooks; idempotent references; refunds API
Resolve bank from account number (suggestion), verify account name against the bank; cache result
Transfer to NGN accounts; fee reporting; success/failure webhooks; retry on failure
Templated, branded emails; delivery and bounce tracking

Candidate [PAYMENT PROVIDER, e.g. Flutterwave or Paystack]
Same provider's account-resolve API
Same provider's transfers API
[e.g. Resend, SendGrid, Postmark]

Chunked upload, transcoding, adaptive streaming (HLS), signed playback URLs, thumbnails, duration detection

[e.g. Mux, Cloudflare Stream, Bunny Stream]

Page 32 of 38

Lawdemy PRD v1

Integration File storage Certificates
Analytics

Used for Thumbnails, attachments, photos, certificates
PDF generation and verification
Product events (section 12)

Requirements
Private buckets, signed URLs, virus scan on upload, image resizing
Generate a PDF from a template with the learner's name and verification code; public verify page
Event tracking with user IDs, funnels, retention

Candidate [S3-compatible storage + CDN]
Built in-house (server-side PDF)
[e.g. PostHog, Mixpanel, Amplitude]

Payment and payout design: the provider is the system of record for money movement, Lawdemy's ledger is the system of record for balances. A nightly job reconciles the two and flags mismatches to admins.

11. Admin and back-office requirements
The designs have no admin screens, but five of their flows can't work without one. v1 needs a minimal staff console with these modules; it can be plain and table-based.

ID ADM-01 ADM-02
ADM-03

Module Course review queue Review decision
Live course takedown

Requirement
List Under Review courses oldest first, with time in queue against the 48 h target. Open a course in read-only preview (all lessons, quiz, price).
Approve (course goes Live, instructor notified) or Reject with a required reason of at least 20 characters, shown verbatim in the instructor's "Reason for rejection" box. Every decision is logged.
Unpublish a Live course for policy breaches, with a reason; enrolled learners keep access unless the reason is legal or safety.

Page 33 of 38

Lawdemy PRD v1

ID ADM-04

Module Report moderation

ADM-05 Payout monitoring
ADM-06 Reconciliation ADM-07 Refunds ADM-08 Support inbox ADM-09 User lookup ADM-10 Bonuses ADM-11 Content settings

Requirement
Queue of reported posts and replies with reason, details, reporter and count. Actions: dismiss, hide content, warn the author, suspend the author. The reporter is never revealed to the author.
List withdrawals by status; see provider responses; retry failed transfers; approve withdrawals above the threshold; freeze a wallet.
Daily report comparing the ledger with provider settlements; flag mismatches.
Issue a full or partial refund on an order; reverse the instructor's pending earning; revoke enrolment.
Tickets from both apps by category and status; reply by email from the console; assign to staff.
Search users; view profile, courses, orders, wallet; unlock sign-in or PIN; deactivate accounts.
Credit a Promotional Bonus to an instructor wallet with a description (shown in their transactions).
Manage categories, practice areas, jurisdictions, professional titles and report reasons without a code release.

12. Analytics events
These events feed every KPI in section 1. Each carries user_id, role, timestamp, platform and device; money values in kobo.

Event signup_started / signup_completed
email_verified

Fired when
Account info submitted / onboarding finished
Verification link opened

Key properties role, is_lawyer, interests
minutes_since_signup

Page 34 of 38

Lawdemy PRD v1

Event sign_in / sign_in_failed
course_viewed
preview_lesson_played
search_performed filter_applied wishlist_added / cart_added
checkout_started / payment_succeeded / payment_failed lesson_started / lesson_completed quiz_submitted certificate_issued / certificate_shared question_asked / question_answered course_created / course_submitted / course_approved / course_rejected course_archived / course_restored / course_duplicated / course_deleted bank_added / pin_created / pin_reset

Fired when
Successful / failed sign-in Course details opened
A preview lesson starts
Search submitted
Filter or sort changed Added to wishlist / cart
Checkout opened / webhook confirmed / failed Lesson opened / completed
Final quiz submitted
Issued / share link copied Q&A question / instructor reply
Wizard started / published / reviewed

Key properties role, reason
course_id, source (search, recommendation, community) course_id, lesson_id
query, results_count filters, results_count course_id, price_kobo
order_id, total_kobo, failure_reason
course_id, lesson_id, type
course_id, score_pct, passed course_id, variant
course_id, lesson_id, minutes_to_answer course_id, review_minutes, reason_category

Status actions

course_id, enrolled_count

Payout setup events

bank_code

Page 35 of 38

Lawdemy PRD v1

Event
withdrawal_requested / withdrawal_succeeded / withdrawal_failed
pin_failed
post_created / reply_created / post_upvoted
content_reported
support_ticket_created account_deleted

Fired when Withdrawal lifecycle
Wrong PIN entered Community activity
Report submitted Support form sent Account deleted

Key properties amount_kobo, fee_kobo, failure_reason
attempts_left kind (discussion, announcement), course_id target_type, reason role, category role, reason

13. Release plan, risks and open questions
Ship in three phases: instructors first, so live courses exist on learner launch day.
Release plan
1. Phase 1, Instructor beta (invite-only): instructor onboarding, Create Course wizard, My Courses and statuses, lesson preview, admin review queue, bank setup and PIN. Goal: [N, e.g. 30] approved courses before learner launch.
2. Phase 2, Public MVP: the full learner app (discovery, checkout, learning, Q&A, certificates), engagement analytics, earnings, withdrawals, support for both apps, report moderation, payout monitoring.
3. Phase 3, v1.1: community discussions and announcements, notification preferences, video captions, refunds self-service, the Live-course small-edit rule (if approved), data export.
Later (not scheduled): native mobile apps, more countries and currencies, CLE/CPD accreditation, subscriptions and bundles, French localisation.

Page 36 of 38

Lawdemy PRD v1

Risks

Risk Too few quality courses at launch
Review backlog
Payout fraud (account takeover changes bank details) Payment provider outage
Video costs and slow uploads on mobile data
Certificate credibility
Data protection compliance (NDPA)

Impact Learners churn on an empty catalogue
Instructors wait and give up
Direct financial loss and trust damage
Lost sales and payouts
High bills; frustrated instructors
Lawyers don't value them
Fines, reputational harm

Mitigation
Instructor beta first; seed with [N] partner instructors; review SLA of 48 h
Staff the queue for launch week; show queue position; checklist for instructors before submit
PIN, 24 h hold after bank change, email alerts, admin approval above threshold
Queue and retry webhooks; status banner; consider a second provider in v1.1
Resumable uploads; transcode once; cap at 500 MB and 30 min
Public verification page; pursue CLE/CPD accreditation for phase 3+
Privacy review before launch; data processing agreements with every vendor

Dependencies
Payment provider contract and live keys (collections, account resolve, transfers). Video hosting vendor account and pricing. Legal: terms of service, instructor agreement (revenue share, content rights), privacy policy, refund policy. Brand assets: final certificate artwork, course image guidelines, email templates. Staff for review, moderation and support from phase 1.

Page 37 of 38

Lawdemy PRD v1
Open questions
What is Lawdemy's commission per sale, and is it the same for every instructor? How long do earnings stay Pending before becoming Available? Who pays the withdrawal fee, and what is it? What is the refund policy (window and completion limit)? What quiz pass mark earns a certificate, and are retakes unlimited? Can Live courses take small edits without re-review, or must instructors duplicate? Can one person be both a learner and an instructor on one account? Do certificates need CLE/CPD accreditation in v1 for lawyers to value them? How long until an announcement expires? Support email, phone, address and social links (placeholders in the designs). Which payment provider: Flutterwave or Paystack? Which countries come after Nigeria, and when?
Page 38 of 38

