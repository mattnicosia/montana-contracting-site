# Montana release preparation

This branch starts at GitHub main 0635c32. It maps the tested fable-v5 site from local commit c55648a into this repository's root layout. That local branch started with the verified September 6 production snapshot at 027fe7a. This preserves the existing GitHub history without merging unrelated histories or force-pushing.

The mapped changes include the approved Haviland gallery and new-construction tag, selected-work order, recognition image sizing, contact form, 25 static project pages, and mobile project thumbnails. Source HTML, CSS, JavaScript, project data, and media retain the tested content. Tests move to the root tests folder. The existing local server retains byte-range support and now serves only public files. The verifier retains page, asset, carousel, mobile, and timeline checks; the new tests replace checks for the retired hash overlay. The robots sitemap now points to the production domain rather than the old preview hostname.

The Resend browser workspace bldgestimating, signed in as matt@bldgestimating.com, owns the verified montanacontracting.com domain. The connected Resend tool points to a different workspace and must not manage this sender. A sending-only Montana Website Inquiries key restricted to montanacontracting.com is saved as a production-only Secret in Vercel. INQUIRY_FROM is website@montanacontracting.com. The recipient is matt@montanacontracting.com.

Matt approved deployment and one labeled test inquiry, and both are done. Deployment dpl_NdGDSVW5guuXb9yoY2LmaroqTwHg has served montanacontracting.com since September 6, 2026, and it builds api/inquiry as a server function. It was created after the production settings were saved, so it carries them.

The firewall rule Montana inquiry rate limit is published and enforcing. It counts POST /api/inquiry at 3 requests per 60 seconds per IP on a fixed window and throttles callers above that. A separate preview enforcement rule no longer exists, because the main rule carries no environment condition and already covers preview.

A test inquiry on September 15, 2026 returned accepted, and the message reached the inbox seven seconds later from website@montanacontracting.com. Inbox receipt is confirmed, so the release checks for the inquiry form are complete.
