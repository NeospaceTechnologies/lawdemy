# Lawdemy design index

Each screen is one `.dc.html` file. Open only the files for the feature you are building.

## How to read a .dc.html file

- Markup lives inside `<x-dc>`. Styles are inline. `<helmet>` holds the font link and base CSS.
- `{{name}}` is a value filled in by `renderVals()` in the `<script type="text/x-dc">` block at the bottom.
- `<sc-if value="{{flag}}">` shows its children when the flag is true. `<sc-for list="{{items}}" as="x">` repeats its children per item.
- `onClick="{{fn}}"`, `onChange="{{fn}}"` are event handlers defined in `renderVals()`.
- `this.state` in the script holds every UI state the screen can be in (modals, steps, toasts, busy labels). Read it to find all states and copy.
- `data-props` on the script tag lists switches (e.g. `firstTime`, `status`) that show other variants of the screen.
- Links between screens are plain `<a href="Other.dc.html">`. Treat them as the navigation map.
- These files are a design spec, not production code: rebuild them as real components in the project stack.

## Learner app (55 screens)

| File | What it shows | Lines |
| --- | --- | --- |
| `learner/Main.dc.html` | Sign up / Create account | 60 |
| `learner/SignUp-AccountInfo.dc.html` | Sign up / Account information | 85 |
| `learner/SignUp-EmailSent.dc.html` | Sign up / Email verification | 64 |
| `learner/SignUp-EmailVerified.dc.html` | Feedback / Email verified | 43 |
| `learner/SignUp-LegalCredentials.dc.html` | Sign up / Legal credentials / Filled | 71 |
| `learner/SignUp-LegalCredentials-Open.dc.html` | Sign up / Legal credentials / Focused | 76 |
| `learner/SignUp-AreasOfInterest.dc.html` | Sign up / Areas of interest | 81 |
| `learner/SignUp-AllSet.dc.html` | Feedback / You're all set | 51 |
| `learner/SignIn.dc.html` | Sign in / Default | 59 |
| `learner/Reset-Request.dc.html` | Reset password / Request | 54 |
| `learner/Reset-CheckEmail.dc.html` | Reset password / Check your email | 51 |
| `learner/Reset-NewPassword.dc.html` | Reset password / Set new password | 65 |
| `learner/Reset-Success.dc.html` | Reset password / Success | 43 |
| `learner/Dashboard-FirstTime.dc.html` | Dashboard / First-time user | 173 |
| `learner/Dashboard-Existing.dc.html` | Dashboard / Existing user | 188 |
| `learner/Notifications.dc.html` | Notifications | 57 |
| `learner/Recommended-All.dc.html` | Recommended courses / All | 89 |
| `learner/MyCourses-New.dc.html` | My courses / New user | 159 |
| `learner/MyCourses-Existing.dc.html` | My courses / Existing user | 183 |
| `learner/Courses-All.dc.html` | Courses / All courses | 118 |
| `learner/Search-Dropdown.dc.html` | Search dropdown / Recent searches | 77 |
| `learner/Search-Results.dc.html` | Search result page | 88 |
| `learner/Search-NoResults.dc.html` | Search no result page | 75 |
| `learner/Cart-Empty.dc.html` | Cart / Empty | 96 |
| `learner/Wishlist-Empty.dc.html` | Wishlist / Empty | 69 |
| `learner/Wishlist.dc.html` | Wishlist / Default | 105 |
| `learner/SortFilter.dc.html` | Sort & filter dropdowns | 96 |
| `learner/Filter-Results.dc.html` | Filter result | 128 |
| `learner/CourseDetails.dc.html` | Non-enrolled course details / Overview | 238 |
| `learner/CourseDetails-Content.dc.html` | Non-enrolled course details / Content | 145 |
| `learner/Cart.dc.html` | Cart / With courses | 157 |
| `learner/Checkout-Dialogs.dc.html` | Review before checkout & Remove course | 45 |
| `learner/Redirect.dc.html` | Redirect page | 37 |
| `learner/PaymentSuccess.dc.html` | Feedback / Payment successful | 36 |
| `learner/MyCourses-NewlyBought.dc.html` | Courses / Newly bought course | 124 |
| `learner/Lesson-Video.dc.html` | Course details / Enrolled / Video expanded | 95 |
| `learner/Lesson-Text.dc.html` | Text content / Normal mode | 121 |
| `learner/Lesson-TextExpanded.dc.html` | Text content / Expanded | 91 |
| `learner/QA-Empty.dc.html` | Q&A / Empty page | 132 |
| `learner/QA-AskModal.dc.html` | Ask a question / Uploaded image | 55 |
| `learner/QA-Upload.dc.html` | Upload file / Default, in progress, completed | 66 |
| `learner/QA-FileDialogs.dc.html` | Preview image & Manage file | 51 |
| `learner/QA-Activity.dc.html` | Q&A / Activity | 129 |
| `learner/QA-Thread.dc.html` | Q&A / Responses & upvote | 157 |
| `learner/QA-ReplyFlow.dc.html` | Q&A / Reply, edit & delete comment | 216 |
| `learner/QA-ManageFlow.dc.html` | Q&A / Search, report, edit & delete question | 304 |
| `learner/QA-Modals.dc.html` | Q&A pop-ups / All states | 159 |
| `learner/Certs-Empty.dc.html` | Certifications / First time | 71 |
| `learner/Certs-List.dc.html` | Certifications | 97 |
| `learner/Cert-Preview.dc.html` | Preview certificate (Non-lawyers / Lawyers tweak) | 100 |
| `learner/Community.dc.html` | Community / Posts, create, report, edit & delete | 282 |
| `learner/Community-Thread.dc.html` | Community / Reply thread | 203 |
| `learner/Support.dc.html` | Support / Take a seat | 134 |
| `learner/Settings.dc.html` | Settings / Name, photo, password, logout & delete account | 372 |
| `learner/Settings-NewPassword.dc.html` | Settings / Set new password & reset successful | 110 |

## Instructor app (16 screens)

| File | What it shows | Lines |
| --- | --- | --- |
| `instructor/Inst-Onboarding.dc.html` | Instructor / Onboarding (sign up → profile → all set) | 176 |
| `instructor/Inst-SignIn.dc.html` | Instructor / Sign in | 63 |
| `instructor/Inst-Dashboard-FirstTime.dc.html` | Instructor / Dashboard / First-time user | 109 |
| `instructor/Inst-Dashboard.dc.html` | Instructor / Dashboard / Activity | 186 |
| `instructor/Inst-CreateCourse.dc.html` | Instructor / Create course (info → price → builder, lessons, quiz, publish) | 671 |
| `instructor/Inst-MyCourses.dc.html` | Instructor / My Courses (statuses, library, filters) | 232 |
| `instructor/Inst-CourseDetails.dc.html` | Instructor / Course details (Live · Draft · Under review · Rejected · Archived) | 327 |
| `instructor/Inst-CourseEngagement.dc.html` | Instructor / Course engagement (learner activity, sort, filter) | 285 |
| `instructor/Inst-ReplyQuestion.dc.html` | Instructor / Reply to learner question | 258 |
| `instructor/Inst-SearchResults.dc.html` | Instructor / Search results | 105 |
| `instructor/Inst-LessonPreview.dc.html` | Instructor / Lesson preview (video & write-up) | 265 |
| `instructor/Inst-Earnings.dc.html` | Instructor / Earnings (bank setup, transactions, edit bank) | 442 |
| `instructor/Inst-Withdraw.dc.html` | Instructor / Withdraw earnings (accounts, PIN, forgot PIN, receipt) | 393 |
| `instructor/Inst-Community.dc.html` | Instructor / Community (discussions, replies, report, announcements) | 547 |
| `instructor/Inst-Support.dc.html` | Instructor / Support | 97 |
| `instructor/Inst-Settings.dc.html` | Instructor / Settings (profile, password, legal background, payout, PIN, delete account) | 473 |

## Design tokens

| Token | Value |
| --- | --- |
| Font | Inter (400, 500, 600, 700) |
| Primary | #0B0B7E (hover/pressed #06065A, disabled #9D9DD0) |
| Accent (logo dot, active tab underline, stepper) | #F26B1D |
| Price | #C4320A |
| Success (toasts) | #067647, light #17B26A, badge bg #DCFAE6 |
| Danger | #D92D20 / #F04438, badge bg #FEE4E2 |
| Warning | #F79009, badge bg #FEF0C7 / text #93370D |
| Info purple | #7F56D9, tint #F1EBFF / #F5F3FF, text #5B21B6 |
| Text | #101828 primary, #344054, #475467 secondary, #667085 muted |
| Borders | #EAECF0, inputs #D0D5DD |
| Surfaces | page #FFFFFF, sidebar/input #F9FAFB, active nav #EAECF0, cream stat strip #FCFAEC |
| Radius | 8px controls, 10–12px cards and dialogs |
