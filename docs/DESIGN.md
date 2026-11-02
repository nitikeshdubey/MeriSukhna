# Meri Sukhna — Navy editorial direction
Primary: #0c2743. Paper: #f7f5f0. Warm accent: #ba9155 / #e6cda4.
Poppins only. Display typography 500, generous line spacing, restrained tracking. Small radii on practical controls; no decorative pill/card system. Photography carries the emotional weight.

## References reviewed
- https://www.scrolltide.co/ — cinematic pacing, progressive image movement and restrained scroll reveals. Implemented with existing native CSS/JS; no paid templates copied.
- https://www.navbar.gallery/ — clear horizontal desktop navigation, direct Blog access and compact mobile menu.
- https://www.footer.design/ — large typographic signature, strong footer hierarchy and practical link columns.
- https://www.cta.gallery/ — one clear primary action beside a quiet secondary action; dedicated closing request section.
- https://styles.refero.design/ — consistent tokens for typography, spacing, surfaces and controls; reviewed Mercury's photographic direction as a reference.
- https://supahero.io/ — image-led hero composition. Existing Gurdwara photography is used, not template imagery.
- https://3dicons.co/ — three small, locally hosted 200px WebP icons in the planning tools. CC0 per https://3dicons.co/ FAQ; by Vijay Verma. Sources:
  calendar: https://bvconuycpdvgzbvbkijl.supabase.co/storage/v1/object/public/sizes/0ef25b-calender/dynamic/200/color.webp
  location: https://bvconuycpdvgzbvbkijl.supabase.co/storage/v1/object/public/sizes/1858b9-map-pin/dynamic/200/color.webp
  chat: https://bvconuycpdvgzbvbkijl.supabase.co/storage/v1/object/public/sizes/eec43d-chat-bubble/dynamic/200/color.webp

## Implementation
assets/css/editorial.css replaces the active Lovable override stylesheet. Shared header/footer templates are synchronized with tools/sync-navigation.cjs. Earlier base styles retain functional layout rules; brand colors are migrated to navy. All 11 full pages use this common system. Four legacy redirects retain their destinations.

Motion: five-second photographic crossfade/slow zoom, small hover feedback, viewport reveals and a native reading progress line where supported. Reduced-motion preferences disable transitions and animations.
Existing country restrictions, staff preview, security policy and customer/admin flows are retained.
