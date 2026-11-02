# Meri Sukhna — restored design with navy refinements
The owner's preferred earlier layout is restored. The editorial redesign is superseded.

Brand: #0c2743, warm ivory #faf6ed, gold #d6ad63. Poppins only.
Active visual styles: assets/css/lovable-design.css (earlier design, recoloured navy), followed by assets/css/refresh.css (rounded components, modern navigation, aligned SVG arrows, responsive type and footer CTA).
Shared header/footer: partials/; update pages with tools/sync-navigation.cjs.

Photography: all 12 listed Gurdwara locations use verified licensed photographs. Desktop WebP up to 1440px, mobile 640px, Golden Temple hero up to 1920px. Source originals range from 1280 to 5456px wide; no upscaling. License, author, source link and actual served dimensions are recorded in assets/images/photo-credits.json. Visible attribution remains at faq.html#photoCredits.
Most originals were obtained directly. Ber Sahib and Kesgarh Sahib were obtained as Wikimedia's licensed 1440px thumbnails after original-file download throttling.
Responsive srcset and lazy loading keep the complete image collection off the initial page load.

Graphics: locally hosted CC0 3dicons by Vijay Verma (https://3dicons.co/) in the request/quote/visit/update flow and footer; minimal inline SVG service icons. Sources for the additional icons:
https://bvconuycpdvgzbvbkijl.supabase.co/storage/v1/object/public/sizes/b91186-shield/dynamic/200/color.webp
https://bvconuycpdvgzbvbkijl.supabase.co/storage/v1/object/public/sizes/b4a0af-zoom/dynamic/200/color.webp
Motion: existing five-second photo shuffling, subtle card/photo hover and scroll reveals. Reduced-motion settings disable animations.

No account, database or country-rule changes. IN/PK/AF/BD restrictions and verified staff preview remain.

Transparency correction: all five graphic WebP assets are now converted from the official transparent PNG originals from the 3dicons v1 source repository, rather than opaque website previews. Actual corner alpha is zero on every asset. See assets/images/graphic-credits.json for exact CC0 original URLs.
