## What changed

The website inquiry form now uses a server endpoint with a fixed recipient, validated fields, draft retention, and confirmation only after mail-provider acceptance. Each of the 25 projects has a static URL, sharing metadata, and a keyboard-accessible gallery. Mobile featured rows show project photographs.

This branch also brings the September 6 approved live-site changes into the GitHub root layout, including the Haviland gallery, project ordering, and recognition sizing. It starts from origin/main without rewriting Git history. The old local workspace remains untouched. See docs/release.md for the mapping.

## Checks

35 local tests pass. The site verifier checks four main pages, 25 projects, and 254 assets. The static build passes. A Vercel preview renders Haviland and rejects invalid inquiry data. Preview mail is unconfigured and returns 503, so it cannot send email. Server source returns 404.

The standards review found one metadata sentence issue and one possible form/server value drift; both received fixes and a contract test. The spec review found no code-level findings.

## Release gates

Production mail settings are saved. The firewall currently logs excess requests. Preview enforcement, production enforcement, production release verification, and the approved labeled test email still need checks. This draft must not merge until those gates clear. Provider acceptance does not prove inbox receipt.

Fixes LA-263
Fixes LA-264
Fixes LA-265
Related: LA-262
