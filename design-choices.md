# Montana Contracting design choices

`DESIGN.md` holds the full brand system. This file records the Choices that the BLDG design
standards ask every project to state, and each place where Montana departs from a default.

```
taste: none
ground: white
accent: "#0028cc"
radius: tight
density: compact
depth: hairline
font: TT Commons Pro
type_scale: large
uppercase_labels: true
gradient: none

overrides:
  - rule: font menu
    value: TT Commons Pro at 400 and 600, with 700 for the closing headline
    why: It is Montana's licensed brand face and it already sets every page, proposal and sign.
    date: 2026-11-12
  - rule: type scale
    value: Display sizes run past the Large column, up to clamp(3.2rem,9vw,8rem)
    why: This is a marketing site read at arm's length, and the photographs need headlines that hold against them.
    date: 2026-11-12
  - rule: uppercase labels
    value: Small labels are uppercase with .08em to .24em tracking
    why: The contrast between tight sentence-case display type and wide uppercase small type is the brand's first rule in DESIGN.md.
    date: 2026-11-12
  - rule: blur surfaces
    value: The fixed navigation blurs the page behind it once it turns solid
    why: The bar floats above photographs and text, so the blur marks real depth.
    date: 2026-11-12

notes:
  product: The portfolio and inquiry site of a general contractor that builds published custom homes and commercial work in the Hudson Valley.
  character: Exacting, quiet, sure of itself.
  world: A set of construction drawings on white paper, a navy title block, a site photograph at dusk.
  moments: The navy contact section, and the photograph that fills the first screen.
  signature: A 34px by 1px rule to the left of every section index.
```

## Open items against the Laws

These were found on 2026-11-12 and are not yet fixed.

- Law 3: the `Back to projects` link on project pages draws an arrow, and `View all projects`
  and `Let's talk` end in a growing rule.
- Law 8: the home page shows `Start a project` in the navigation, `See the full process` and
  `Let's talk` as filled buttons on one page.
- Law 9: three headlines are in title case (`The Hudson Valley's Most Ambitious Work`,
  `Four Decades of Ambition.`, `View All Projects`), where DESIGN.md asks for sentence case.
