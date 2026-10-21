# MERI SUKHNA website

- index.html: homepage, trust panel and enquiry choices
- customize.html: package customiser
- blog/: blog index and articles
- assets/css/: page styles (Poppins only)
- gurdwaras.html / faq.html / reviews.html: searchable location guide, service answers and moderated customer stories
- account.html / admin.html: customer accounts and restricted staff workspace
- assets/js/: homepage interactions, customiser, regional pricing, Roman Punjabi translations, drafts and Supabase integration
- backend/: installed SQL migrations, privacy tests and operational setup notes
- partials/: shared navigation/footer source templates
- tools/sync-navigation.cjs: rebuilds the same navigation/footer across all full pages
- sitemap.xml: preferred search URLs
- blog-*.html and blog.html at root: compatibility redirects for published links

Edit content in its HTML page and behaviour/styles in the matching asset file. Edit shared navigation/footer in partials, then run `node tools/sync-navigation.cjs` from this folder. Preserve the regional gate on all full pages. The country check remains browser-side. See backend/README.md for accounts, private storage and staff setup. Only Poppins is used; the Punjabi option uses Roman Punjabi to retain the original brand style.
