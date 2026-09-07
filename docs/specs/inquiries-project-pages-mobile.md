## Problem Statement
Visitors need to send a project inquiry without opening an email app, share a specific project with its own preview, and compare featured work on a phone.

## Solution
Implement recommendations 7, 8, and 5 from the approved ranked site assessment. Preserve the September 6 production release and existing project content.

## User Stories
1. As a prospective client, I can send an inquiry to Matt through the website.
2. As a visitor, I see confirmation only after the mail service accepts the inquiry.
3. As a visitor, I keep my draft and can retry after a network or service error.
4. As Matt, I receive inquiries at matt@montanacontracting.com and can reply to the visitor.
5. As Matt, I do not expose mail credentials or create an open mail relay.
6. As an architect, I can share a permanent project URL with that project's title, description, and photograph.
7. As a visitor or crawler, I can read project content without JavaScript.
8. As an existing visitor, my old project hash links still reach the right project.
9. As a phone user, I see a photograph beside every featured project and can use the existing mobile menu.
10. As a keyboard user, I can browse galleries and navigation with visible focus.

## Implementation Decisions
- Start from the verified production snapshot, not the older local preview. Use an isolated worktree to preserve unrelated changes.
- Keep the static site. Generate static project documents from one shared project dataset and template. Use /projects/<existing-slug>/ and a real project index; emit canonical, Open Graph, and Twitter metadata in initial HTML.
- Preserve gallery order, photos, films, typography, desktop layout, and all existing project descriptions. No invented credits or claims.
- Preserve legacy hash routing through redirects to real pages. Navigation and project links use ordinary anchors.
- Use a same-origin server-side inquiry endpoint with a fixed recipient, bounded validated fields, no visitor-controlled sender, and a Reply-To address.
- Use the connected Resend service through a server-only API adapter. Actual activation requires an approved verified sender and a site-scoped credential; neither is configured for Montana. Never read unrelated secrets or enable sending without that setup.
- Return a receipt only for confirmed provider acceptance, not inbox delivery. Reject unavailable configuration and upstream failure. Add request idempotency, bot controls, and same-origin checks. Keep fallback direct email visible.
- Mobile featured rows retain TT Commons Pro, Montana blue #0028cc, dark #070912, white #ffffff, ink #0a0d18, and pale #f4f5f8. Each row gets a real project image and left-aligned title/metadata. No new card shadows, decorative labels, fonts, or animation.
- No production deployment is authorized by this follow-up request.

## Testing Decisions
Test public behavior at the HTTP and rendered-page boundaries. Test valid inquiry, field validation, invalid method/content/origin, duplicate attempts, missing configuration, timeout, and provider rejection with an injected mail transport, without sending real messages. Test generated project URLs, initial metadata, all local asset paths, legacy links, gallery keyboard controls, and browser Back. Inspect desktop and mobile layouts at 390px and narrower, preserve recognition card count, and test reduced motion. There are no existing automated tests.

## Out of Scope
Publishing, DNS changes, API-key creation, buying services, real test email, CRM automation, new case-study copy, reordered homepage sections, and other ranked recommendations.

## Further Notes
Matt confirmed the inquiry recipient. The connected Resend account exists, but montanacontracting.com is not among its verified sender domains. Complete safe local work, then report the credential/sender gate. Use the already approved Pocock workflow without approval pauses between spec, ticket publication, and implementation.
