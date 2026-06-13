# Card design inspiration

The card template library (profile-card layouts + flippable business-card fronts),
color palettes, and fonts are **original** implementations inspired by common,
non-copyrightable layout *archetypes* seen across professional business-card
galleries (e.g. Canva's `business-cards/templates`). No third-party artwork is
copied — only the structural patterns (where the photo/name/title/contact go,
use of color blocks, dividers, borders, typography).

## Business-card fronts (`components/DigitalCard.tsx` · `BUSINESS_TEMPLATES`)
| Template | Pattern it draws on |
|----------|---------------------|
| banded | white card with a gradient top band |
| filled | full-color front, white text |
| outline | bordered card with an accent rule |
| split / portrait | color photo panel beside details |
| mono | minimalist, text-forward with an accent rule |
| monogram | circular initial badge + vertical divider (e.g. "DG" cards) |
| initials | large letterspaced initials with a divider ("R\|N", "A\|W") |
| duo | two-tone: colored name band + contact below (blue/grey corporate) |
| framed / elegant | thin border or hairline rules, centered letterspaced name (ARCHE, AW) |
| corner | diagonal color accent in the corner (FAUGET) |
| wave | curved color divider |
| corporate | top accent rule + contact list (Morgan Maxwell / Aron Loeb) |
| wordmark | oversized typographic name (MONSOON / BOLD / THYNK) |

## Profile-card layouts (`components/ProfileCard.tsx` · `TEMPLATES`)
classic · minimal · bold · split · spotlight · sidebar · monogram · framed · corner · wave

## Palettes (`lib/card-design.ts` · `PALETTES`, 24 total)
Brand-spectrum + professional schemes pulled from the references: emerald, indigo,
rose, amber, violet, slate, sage, cream, executive (navy/gold), modern
(charcoal/orange), creative (blue/coral), luxury (black/copper), noir, blush,
burgundy, mocha, marine, forest, taupe, teal, sky, plum, coral, lavender.

## Fonts (`FONTS`, 7 total)
sans · serif · rounded · mono · elegant (Didone) · slab · humanist — all system
font stacks, so no extra web-font requests.

> Source thumbnails were provided as screenshots for reference only and are not
> stored in the repo (Canva blocks automated fetching; pasted images can't be
> written to disk). Re-derive from the live editor's pickers if needed.
