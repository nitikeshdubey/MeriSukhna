# MERI SUKHNA backend

The website remains a static GitHub Pages site. Supabase provides authentication, PostgreSQL and private storage. Only the public publishable key belongs in `assets/js/backend-config.js`. Never add a secret/service-role key to the website or repository.

## Installed migrations

1. `001_platform.sql`: requests, timelines, versioned quotations, family access, private media, consented reviews, drafts, staff roles and audit records.
2. `003_gallery_visibility.sql`: reversible hiding/restoration of gallery items, including access checks for signed URLs.
3. `004_pricing_snapshot.sql`: retains the customer's initial currency/rate snapshot with a request. These are enquiry estimates; staff confirm the actual written quotation.

`002_security_tests.sql` runs a transaction with disposable test identities and rolls everything back. It tests ownership, customer/staff separation, role escalation denial, scoped family access and revocation, server-calculated quotation totals, acceptance, private-media authorisation and consented review moderation. Run only in an empty staging database or adjust count assertions for existing production data. It has passed against the initially empty project.

## Owner setup

- Email verification remains enabled. The approved first staff account is `nitikeshdubey@gmail.com`; its verified website account was assigned the staff role with the owner's explicit approval. No password is stored in this repository.
- Staff sign in at `admin.html`. Customers sign in at `account.html`. Supabase dashboard credentials and website customer credentials are separate.
- The authentication Site URL is `https://nitikeshdubey.github.io/MeriSukhna/account.html`.
- Configure your own SMTP provider in Supabase Authentication → Emails → SMTP Settings for reliable public confirmation email delivery. Enter SMTP credentials in Supabase, not this repository or chat. Confirm delivery to a non-team address before promoting public signup.
- To add staff, first obtain the owner's approval for the exact email, require a confirmed website account, then insert its user UUID into `ms_private.staff` from the trusted SQL editor. Never expose role assignment through the public client or editable user metadata.

## Operational limits

- Family invitations and updates are recorded in accounts. Customers explicitly copy/send the invitation text; automated email/SMS/WhatsApp delivery is not configured. No message is sent automatically.
- Private media use a non-public bucket and signed URLs lasting 60 seconds. Revocation prevents new URLs; an already issued URL may work for up to its remaining 60 seconds.
- Staff upload JPEG/PNG/WebP/MP4/WebM up to 50 MB and must have permission for the recording. Hidden media can be restored; hiding is not permanent deletion.
- Customers can accept only issued quotations for requests they own. Unknown shop prices remain pending; a quote cannot be issued until all prices and written payment/cancellation/refund terms are supplied. No payment processing is implemented or implied.
- Reviews require a completed owned request, publication consent and staff moderation. Withdrawing consent removes public visibility.
- The inherited country gate is browser-side. It blocks IN/PK/BD and fails closed for unknown country; it is not a hosting-edge firewall. Database ownership and staff permissions are enforced separately by RLS and checked RPCs.
- Sessions are kept in the current tab's session storage, not long-lived local storage. Device package drafts expire after 30 days and exclude notes. Signed-in account drafts are private.
- Country FX lookup failure does not reveal an alternate currency or substitute CAD prices.

## Maintenance

Keep verification, RLS and the private bucket enabled. Do not grant table writes to `anon` or `authenticated`; writes use explicitly authorised database functions. The staff table and audit data live in an unexposed private schema. Before modifying permissions, re-run the security tests in staging and test a second customer account. Rotate any secret previously disclosed outside its trusted server environment.
