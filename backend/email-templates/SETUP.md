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
Delivery activation and end-to-end mailbox verification remain pending until SMTP credentials are entered.

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
