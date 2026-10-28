# Montana Contracting design system

Every value here is taken from the live site. Build anything against this file and it
will look like montanacontracting.com: a web page, a deck, a proposal, a PDF, an email,
an app screen, a sign.

The source of truth is the `:root` block in `index.html` and the copy of it in
`assets/information-pages.css`. Change a token there and change it here in the same
commit.

## The three rules that carry the look

1. **One blue, used sparingly.** Navy `#0028cc` marks the thing that matters on a page:
   a section number, a statistic, a button, one word in a headline. Nothing else is
   colored.
2. **Display type is tight and sentence case. Small type is wide and uppercase.** Big
   text gets negative tracking. Small text gets `.08em` to `.24em` and capitals. Nothing
   sits between the two.
3. **Surfaces are white, off-white, or near-black.** There are three backgrounds, and a
   page earns its rhythm by alternating them, not by adding color.

## Logo

| File | Use |
| --- | --- |
| `assets/montana-logo.svg` | Dark logo on white and off-white |
| `assets/montana-logo-white.svg` | White logo on photography and on dark sections |
| `assets/montana-logo-white.png` | White logo where SVG will not render |
| `assets/montana-logo-email.png` | Email signatures and mail templates |

The logo sits 28px tall in the fixed home navigation and 240px wide in the header of an
information page, dropping to 230px below 600px. Over photography the white logo carries
`text-shadow:0 1px 18px rgba(0,0,0,.35)` so it holds its edge against a bright sky. That
shadow comes off the moment the background turns solid.

Never recolor the mark, never place the dark logo on a photograph, and never set the
logo against navy.

## Color

| Token | Hex | Where it goes |
| --- | --- | --- |
| `--navy` | `#0028cc` | The one accent: section numbers, statistics, buttons, links on hover, a single word in a headline |
| `--ink` | `#0a0d18` | All body text and headlines on light surfaces |
| `--muted` | `#5a6174` | Supporting paragraphs, captions, labels on light surfaces |
| `--white` | `#ffffff` | The default page surface |
| `--offwhite` | `#f4f5f8` | The alternate band that separates two white sections |
| `--dark` | `#070912` | Full-bleed dark sections, where text turns white |
| `--plate` | `#0b0c0d` | The photographic surface on the people pages: the backdrop behind a portrait, the gradient that fades it out, and the series band |
| `--line` | `rgba(10,13,24,.10)` | Every hairline rule and border on light surfaces |

Four more values exist for specific jobs. `#8faaff` is the accent on dark surfaces.
`#002bd4` is the flood blue of the opening logo animation. `#719bff` is the focus ring.
`#a32323` is the only error color.

**The rule people get wrong:** navy on near-black does not pass contrast. On a `--dark`
section, swap every navy accent for `#8faaff`, and set body copy to
`rgba(255,255,255,.7)` with emphasis at full white. Borders on dark are
`rgba(255,255,255,.14)`, and a card fills with `rgba(255,255,255,.06)` behind a
`rgba(255,255,255,.1)` border.

## Type

The face is **TT Commons Pro**. Two weights do nearly all the work: 400 for body copy
and 600 for headlines, buttons, labels and numbers. Weight 700 is held back for the
largest closing headline on a page, such as `Start a project.`, and for the contact
details beside it. There is no 500. The fallback stack is
`-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif`. Both weights load from
`assets/` as woff2 with `font-display:swap`.

| Role | Size | Weight | Tracking | Line height |
| --- | --- | --- | --- | --- |
| Closing headline | `clamp(3.2rem,9vw,8rem)` | 700 | `-.035em` | .92 |
| Hero headline | `clamp(2.8rem,5.92vw,5.28rem)` | 600 | `-.02em` | 1.02 |
| Page title | `clamp(2.6rem,6vw,5rem)` | 600 | `-.035em` | 1.03 |
| Section headline | `clamp(2rem,4.6vw,3.8rem)` | 600 | `-.02em` | 1.02 |
| List headline | `clamp(1.5rem,3.6vw,2.8rem)` | 600 | `-.03em` | 1.02 |
| Statistic | `clamp(1.8rem,3.4vw,2.8rem)` | 600 | `-.03em` | 1 |
| Watermark numeral | `clamp(4rem,12vw,10rem)` | 600 | `-.04em` | .8 |
| Lead paragraph | `clamp(1rem,1.4vw,1.18rem)` | 400 | none | 1.5 |
| Body | `1rem` | 400 | none | 1.5 |
| Small body | `.92rem` | 400 | none | 1.45 |
| Eyebrow and section index | `.8rem` | 400 | `.24em` uppercase | 1.5 |
| Statistic label | `.82rem` | 400 | `.14em` uppercase | 1.5 |
| Navigation link | `.82rem` | 400 | `.08em` uppercase | 1.5 |
| Button | `.84rem` | 600 | `.04em` | 1.5 |
| Card label | `.74rem` | 600 | `.12em` uppercase | 1.5 |
| Meta row | `.72rem` | 400 | `.08em` uppercase | 1.5 |

Headlines cap at `16ch` in the hero and `14ch` in a section, which is what forces them to
break into two or three short lines. Body copy caps at `56ch`, and a pull quote at
`60ch`. Every number a reader might compare carries
`font-variant-numeric:tabular-nums`.

Emphasis inside a paragraph uses `<strong>` at weight 400 in `--ink`, so the word darkens
without getting heavier. On dark surfaces emphasis goes to weight 600 in white.

## Space and layout

Content sits in a `1280px` column, centered. The page gutter is
`clamp(1.2rem,4vw,3.5rem)` and every horizontal edge uses it, including the navigation
and the footer, so everything lines up down the page.

Section padding is `clamp(4rem,11vh,9rem)` top and bottom on the home page and
`clamp(3rem,7vw,6rem)` on an information page. Two-column sections run `1fr 1.1fr` with
`clamp(2rem,6vw,6rem)` between them, giving the text column the wider half.

Three breakpoints, and no others. Two columns become one at **860px**. The full
navigation becomes a menu button at **1100px**, because seven links plus the logo plus
the button stop fitting. Phone adjustments land at **600px**.

## Shape, line and surface

Corners are `4px`. That covers buttons, cards, framed images and panels. Circles at `50%`
are for numbered step markers and map dots. Pills from `30px` to `44px` belong to the
navigation button and the menu button alone, and appear nowhere else.

Structure comes from hairlines rather than shadows. A statistics band is bordered top and
bottom and divided by vertical rules; a list divides its rows the same way. Shadow is
reserved for something genuinely floating, such as the open mobile menu at
`0 12px 30px rgba(0,0,0,.12)`.

A fixed grain overlay sits above everything at `opacity:.045` with
`mix-blend-mode:multiply`, drawn from an inline SVG `fractalNoise` at `baseFrequency .85`
over three octaves on a 140px tile. It is what keeps large flat areas from looking
digital, and it is the one texture in the system.

## Motion

Everything eases on `cubic-bezier(.2,.7,.2,1)`, stored as `--ease`. Durations group into
four bands: `.25s` to `.35s` for a hover, `.3s` to `.5s` for a state change, `1s` for
content arriving, and `1s` to `1.1s` for parallax.

Content arrives by rising. An element starts at `opacity:0` and
`transform:translateY(34px)`, then transitions both over `1s` when it enters the
viewport. Up to four elements stagger in `.1s` steps. Underlines grow from zero width
over `.35s` instead of fading.

Every animation stops under `prefers-reduced-motion:reduce`, and the opening logo
sequence is skipped entirely.

## Component recipes

**Eyebrow.** A short line of uppercase facts above a headline, joined by middots, with a
34px by 1px rule to its left: `General Contractor · Since 1984 · NY + NJ`.

**Section index.** Every major section is numbered and named, `01 / Our Approach`, in
navy at `.24em` tracking, with the same 34px rule beside it. On dark sections it turns
white at weight 600.

**Button.** Navy fill, white text, `4px` radius, `.85rem 1.8rem` of padding, weight 600
at `.04em`. Hover drops opacity to `.88`. The ghost variant is transparent with a 2px
navy border and fills with navy on hover.

**Statistic.** A navy number in tabular figures above an uppercase label at `.14em` in
`--muted`. Three across, divided by vertical hairlines, collapsing to one column at
860px.

**Card on dark.** `rgba(255,255,255,.06)` fill, `rgba(255,255,255,.1)` border, `4px`
radius, `1.2rem 1.4rem` of padding, a `#8faaff` uppercase label at `.12em`, then the
value at `.92rem` in `rgba(255,255,255,.85)`.

**Numbered list.** A counter in a 1.8rem circle outlined 2px in the accent, with the item
indented `2.8rem` and its lead phrase bold on its own line.

**Bulleted list.** A 6px accent dot, absolutely placed at `.55em` from the top so it sits
on the first line's center rather than above it.

**Watermark numeral.** The item's number set huge in navy at `.1` opacity behind the
content, `user-select:none`.

## Photography

Photographs run full bleed and are cropped with `object-fit:cover`, never letterboxed.
A hero image sits in a container inset `-8%` and scaled to `116%` height so it can
parallax without exposing an edge.

Every photograph that carries text gets a four-stop scrim so the type stays legible top
and bottom:

```css
background:linear-gradient(180deg,
  rgba(4,6,14,.42) 0%,
  rgba(4,6,14,.05) 32%,
  rgba(4,6,14,.25) 70%,
  rgba(4,6,14,.82) 100%);
```

Project photographs are served as resized WebP copies from `assets/web/` by way of
`data/image-variants.json`. Run `node scripts/optimize-images.mjs` after adding any
image and commit both the original and the copy.

## Accessibility floors

Interactive targets are at least 44px tall. Focus is always visible: `3px solid #719bff`
at `5px` offset on an information page, and `2px solid currentColor` at `4px` offset in
the navigation, where the background can be either photograph or white. Information
pages open with a skip link, and anything new should. Selected text is navy with white
type.

Color never carries meaning on its own, and the accent swap on dark surfaces exists for
this reason.

## Voice

Headlines are short declarative sentences and they end with a period, including
`Featured projects.` and `Start a project.` Sections are named in title case and
numbered. Claims are specific, so the stat band reads `Projects Delivered`, `Since`, and
`Licensed & Operating` rather than adjectives. Nothing shouts, and no sentence sells what
the photographs already show.

## Paste-ready tokens

```css
:root{
  --navy:#0028cc;
  --navy-on-dark:#8faaff;
  --white:#ffffff;
  --offwhite:#f4f5f8;
  --ink:#0a0d18;
  --muted:#5a6174;
  --line:rgba(10,13,24,.10);
  --dark:#070912;
  --plate:#0b0c0d;
  --focus:#719bff;
  --error:#a32323;
  --ease:cubic-bezier(.2,.7,.2,1);
  --gutter:clamp(1.2rem,4vw,3.5rem);
  --sec-y:clamp(4rem,11vh,9rem);
  --max:1280px;
  --radius:4px;
}
body{
  font-family:'TT Commons Pro',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  font-weight:400;line-height:1.5;color:var(--ink);background:var(--white);
  -webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;
}
.sec{padding:var(--sec-y) var(--gutter)}
.sec__inner{max-width:var(--max);margin:0 auto}
.sec__index{
  display:flex;align-items:center;gap:1rem;font-size:.8rem;letter-spacing:.24em;
  text-transform:uppercase;color:var(--navy);margin-bottom:1.8rem;
}
.sec__index i{width:34px;height:1px;background:var(--navy)}
h2{font-weight:600;font-size:clamp(2rem,4.6vw,3.8rem);letter-spacing:-.02em;line-height:1.02;max-width:14ch}
.lead{color:var(--muted);font-size:clamp(1rem,1.4vw,1.18rem);max-width:56ch}
.btn{
  display:inline-flex;align-items:center;gap:.5rem;padding:.85rem 1.8rem;
  font-family:inherit;font-size:.84rem;font-weight:600;letter-spacing:.04em;
  border-radius:var(--radius);background:var(--navy);color:#fff;
  transition:opacity .25s var(--ease);
}
.btn:hover{opacity:.88}
.reveal{opacity:0;transform:translateY(34px);transition:opacity 1s var(--ease),transform 1s var(--ease)}
.reveal.vis{opacity:1;transform:none}
.on-dark{background:var(--dark);color:#fff}
.on-dark .sec__index{color:#fff;font-weight:600}
.on-dark .sec__index i{background:#fff}
.on-dark .lead{color:rgba(255,255,255,.7)}
.on-dark .accent{color:var(--navy-on-dark)}
@media(prefers-reduced-motion:reduce){
  .reveal{opacity:1;transform:none;transition:none}
}
```

## Checklist

Run this against anything before it ships.

- TT Commons Pro at 400 and 600, and no other weight.
- Navy appears two or three times on the page, not everywhere.
- On a dark surface the accent is `#8faaff`, not navy.
- Big type is tight and sentence case. Small type is wide and uppercase.
- Corners are 4px, except circles and the two navigation pills.
- Structure is drawn with hairlines, not boxes and shadows.
- Content is inside a 1280px column on the shared gutter.
- Everything eases on `cubic-bezier(.2,.7,.2,1)`.
- Content rises 34px as it arrives, and stops under reduced motion.
- Grain sits over the whole page at 4.5%.
- Photographs are cropped full bleed and scrimmed under any text.
- Focus is visible, targets clear 44px, and the page opens with a skip link.
- Headlines end with a period.
