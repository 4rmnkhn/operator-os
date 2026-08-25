# Asset 01 · Webinar registration page (master template)

Part of the webinar funnel pack. Design source of truth:
`Second Brain/02 Project Agents/Consulting Agency OS/Resources/Webinar Funnel Pack/01 Registration Page/`
(v3, tiered — see the hub page BUILD LOG for the full v1→v3 history and rules).

## The one command

Template state (the public gift page, all tiers + verdict labels visible):

    node build.mjs

Prospect page (verdict labels stripped, unchosen tiers deleted, null blocks deleted):

    node build.mjs prospects/<handle>.json

Output lands at `../<handle>/index.html`, live at
`https://4rmnkhn.github.io/operator-os/webinar/registration/<handle>/` after push.

## Video embeds

`video.id` (the host's real video — the slot Noah's page proved) and `outliers[].id`
(up to 3 of the host's recent top performers) take YouTube IDs in the prospect JSON and
render as privacy-enhanced youtube-nocookie iframes, lazy-loaded, 16:9. Null deletes the
section. `outliers_title` labels the strip (default "Recent uploads").
Auto-pulling a channel's recent outliers can wire into the existing YouTube API tooling
(05 Automation) later; the JSON path is the contract either way.

`prospects/_example.json` is a SCHEMA REFERENCE only — neutral placeholders, never deployed,
never filled with invented strategy.

## Rules carried from the template (not style choices)

- No mandatory slot may require an asset the filler might not have. Proof is tiered A/B/C;
  fill the highest tier you can fill HONESTLY, the build deletes the rest.
- No countdowns, no fake scarcity, no invented numbers, no designed-graphic testimonials.
- The form is visual only — no backend. The page says so in its own footer note; override
  `form.note` in the prospect JSON only once a real backend is wired.
- Arman reviews every instance before it is sent.
