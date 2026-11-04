# Clean URLs and SEO maintenance
Primary host: https://merisukhna.com
Public paths: /, /customize, /gurudwaras, /faq, /reviews, /blog/, /blog/article-slug.
Private utilities: /account and /admin have noindex metadata and headers.
Physical HTML files remain in the source. Hostinger .htaccess serves them behind clean paths and redirects direct legacy .html requests.
Keep THE_REQUEST guards: internal rewrites must not redirect back to themselves.
Keep the 404 file exclusion: error-document subrequests must not become redirects to a successful page.
When adding pages, update the sitemap, canonical and social URLs, structured-data URLs and shared navigation.
Do not generate verification files without the real token from the owner’s Search Console account.
Tests: node work/test-seo-clean.cjs; node work/test-platform.cjs; node outputs/website/tools/test-security.cjs.
OpenSEO baseline audit: 4b443644-c0cf-4d27-93cd-b6933801e63a.
Follow-up audit: a09b39d1-4cd8-4cc3-b4aa-4edbe4b84148.
Smaller retry after a transient 429: c0a51b92-4c82-43fb-a98f-a7ba7cb663f1; no 429 warning.
Country restrictions and secure staff preview remain unchanged.
