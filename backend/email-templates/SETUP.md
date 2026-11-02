# Hostinger email activation
Public contact: contact@merisukhna.com. WhatsApp: +917717534949.
The approved staff account remains nitikeshdubey@gmail.com.

## Account verification
In Supabase Authentication > Emails > SMTP Settings, enable custom SMTP:
- Sender address and username: contact@merisukhna.com
- Sender name: Meri Sukhna
- Host: smtp.hostinger.com
- Port: 465 (SSL/TLS)
- Password: enter the mailbox password directly in Supabase, never chat or source files.
- Site URL: https://nitikeshdubey.github.io/MeriSukhna/account.html

Paste confirm-signup.html into Confirm signup; recovery.html into Reset password.
Leave email verification enabled. Keep ConfirmationURL unchanged.
Test signup and recovery with an address you control and check spam.
Hostinger hPanel must show SPF and DKIM correctly connected for this domain.

## Saved-request receipts
Custom SMTP for Auth does not send request receipts. Deploy the receipt function and SQL migration separately before enabling the browser call.
A receipt acknowledges receipt only; it must not imply a confirmed booking or payment.
Never send to an address supplied in the request body; use the authenticated, verified account.
Installed on 2026-11-02: Hostinger Auth SMTP, branded verification/recovery templates, receipt migration and function, SMTP_PASSWORD secret and browser integration. The owner confirmed recovery email delivery. An authenticated saved-request receipt still needs an inbox check.

## Receipt function deployment
Apply ../007_request_receipts.sql in the trusted SQL editor.
Deploy ../functions/request-receipt/index.ts as the request-receipt Edge Function.
Set SMTP_PASSWORD through Edge Functions > Secrets using the Hostinger mailbox password.
The function validates the access token itself with Auth; disable legacy gateway JWT verification if required for publishable-key compatibility. Never disable its internal Auth check.
Invoke POST /functions/v1/request-receipt with the signed-in user's Authorization bearer token, public apikey and JSON {"request_id":"saved UUID"}.
The recipient comes only from the verified Auth account; ownership is checked server-side.
The service-only ledger prevents concurrent duplicates and limits failed delivery retries to three with five-minute spacing.
A crash after SMTP acceptance may leave status "sending"; staff must inspect before retrying because SMTP cannot guarantee exactly-once delivery.
Do not activate browser invocation until the migration, function and secret are deployed and tested.
## Activation record — 2026-11-02
- Hostinger Auth SMTP saved by owner; mailbox password remains in Supabase.
- Branded signup/recovery templates installed.
- Owner confirmed the recovery message arrived from contact@merisukhna.com.
- Migration 007 installed with RLS enabled; rollback-only 008 assertions passed.
- Receipt function deployed; SMTP_PASSWORD saved by owner.
- Owner approved internal Auth verification instead of the legacy gateway JWT check.
- Live tests: unauthenticated call = 401; untrusted Origin = 403.
- Mock tests: verified account, request ownership, recipient injection, duplicate claim and SMTP failure passed.
- Browser request saves invoke the function; email failure never undoes a saved request.
- Remaining verification: save a real request while signed in and confirm its receipt arrives.
