# CLAUDE.md : BMAI-PAGE, the official HS26 course website

`https://github.com/eth-bmai-hs26/BMAI-PAGE` (PUBLIC, `main`), live at
https://eth-bmai-hs26.github.io/BMAI-PAGE/ . Vite 5, React 18, `react-router-dom` 6 and TypeScript 5;
`base: './'` in `vite.config.ts` and hash routing are load bearing (the site lives under the `/BMAI-PAGE/`
subpath). A push to `main` runs `.github/workflows/deploy.yml` (`npm ci`, `npm run build` = `tsc -b` then
`vite build`, then GitHub Pages). All content is ONE typed array, `src/data/weekends.ts` (types in
`src/types.ts`); the calendar and the `.ics` export are derived from it. Decks and visualizations are
served by the site as COPIES under `public/slides/we<n>/` and `public/viz/we<n>/` (recopy after every
rebuild of the source); notebooks are linked into the public repositories through `colab()`; the site links
exercises only, never a solution. Several sessions edit `src/data/weekends.ts`: commit with explicit paths
and `git diff` the file first.

This repository is PUBLIC, so this file is world-readable. The history of what was published on the site
and when, moved here verbatim from the root `git_bmai/CLAUDE.md` on 2026-10-23, follows.

## Root index entry (moved from the root CLAUDE.md, 2026-10-23)

The former root index described this repository as follows, verbatim: `BMAI-PAGE/` github.com/eth-bmai-hs26/BMAI-PAGE, the OFFICIAL participant facing COURSE WEBSITE, live at https://eth-bmai-hs26.github.io/BMAI-PAGE/

## 2026hs/BMAI-PAGE is the official course website

*Moved verbatim from the root `git_bmai/CLAUDE.md` on 2026-10-23. Where it differs from an older passage of this file, the later date wins.*

`/Users/carloscotrini/Documents/git_bmai/2026hs/BMAI-PAGE` (remote
`https://github.com/eth-bmai-hs26/BMAI-PAGE.git`) is the participant facing course site for HS26.
It is **live**, checked 2026-09-02:

    https://eth-bmai-hs26.github.io/BMAI-PAGE/

GitHub Pages serves it from the repository itself: `build_type: workflow`, source branch `main`,
HTTPS enforced, no custom domain, which is why the address has the default org and repo shape above.
Pushing to `main` runs `.github/workflows/deploy.yml`, which runs `npm ci`, then `npm run build`
(`tsc -b` followed by `vite build`), then publishes `dist/` with `actions/upload-pages-artifact@v3`
and `actions/deploy-pages@v4`. The only run so far is 2026-08-28, green in 31 seconds. The stack is
Vite 5, React 18, `react-router-dom` 6 and TypeScript 5. `base: './'` in `vite.config.ts` and hash
routing are what make assets and deep links work under the `/BMAI-PAGE/` subpath, so both are load
bearing.

All content is one typed array, `src/data/weekends.ts`, transcribed from the "Syllabus" tab of
`BMAI HS26 master spreadsheet.xlsx`, which sits at the repository root. **That xlsx is a copy of
2026-09-02 and stale**: the live spreadsheet, where Carlos moves the slots, is "BMAI HS26 master
spreadsheet" on his Google Drive (file id: see the root `git_bmai/CLAUDE.md`, kept out of this PUBLIC repository). Through the
Drive connector, `read_file_content` shows only its first eleven rows; `download_file_content` with
`exportMimeType: text/csv` returns the whole Syllabus tab, base64 encoded (decode with `base64 -D`;
the schedule is its first 25 rows, a column per weekend, weekend 4 in column H). The calendar view and the
`.ics` export are derived from that array by `src/data/calendar.ts` and `src/lib/ics.ts`, so nobody
hand maintains an event. Weekend 1 already carries the correct Friday and Saturday agendas.

**The Friday decks are PUBLISHED, 2026-09-02.** Carlos asked for them on the site, so ALL SIX
weekend-1 Friday decks are live: the cold open and the intro deck at 08:00, first-order
approximation at 09:00, gradient descent at 11:00, neural networks at 14:00 and statistical learning
theory at 16:00. They appear both in the weekend's Materials list and as "Slides" badges on the
Friday schedule rows. FRIDAY IS COMPLETE; the remaining SOON entries are the two Saturday lectures,
every coding exercise and both project links.

**They are served BY THE SITE, from `public/slides/we1/`**, through a `deck(n, file)` helper that
compiles to `./slides/we<n>/<file>`. They are NOT linked through `raw()`. `raw()` needs a public
repository in the org to read from, and none holds these decks: they live in
`w1-lecture-material`, which is **private**. Hosting them here needed no new repository and no
visibility change, and it is what the sibling FDD site does. The full procedure for republishing a
changed deck, and the live-verification curl, are in `w1-lecture-material/CLAUDE.md`.

**Weekend 2 decks are served the same way, from `public/slides/we2/`**, on Carlos's
instruction of 2026-09-16: `attention.pdf` and `transformers.pdf` (copies of
`w2-lecture-material/attention-deck/attention-slides.pdf` and `transformer-slides.pdf`, which
must be recopied after a rebuild), beside `autoencoders.pdf`, published by another session the
same day, and on 2026-09-17 `agentic-ai-part1.pdf` (Friday 16:00, From LLMs to reasoning
models) and `agentic-ai-part2.pdf` (Saturday 08:15, Agents), copies of the two agentic AI decks,
with the spy game's Colab notebooks from `w2-cx-public/spy-game/` on the Saturday 09:00 exercise
row. Since 2026-09-17 the site also serves the spy game itself as a static page,
`public/viz/we2/spy-game/` (a copy of `w2-lecture-material/spy-game-web/`: no install, the participant's
OpenRouter key pasted into the page), first on that exercise row. Live and byte-matched, 2026-09-16 and 2026-09-17:

    https://eth-bmai-hs26.github.io/BMAI-PAGE/slides/we2/attention.pdf
    https://eth-bmai-hs26.github.io/BMAI-PAGE/slides/we2/transformers.pdf

**The Saturday 10:30 guest lecture went up on 2026-09-19**, on Carlos's instruction:
`public/slides/we2/agentic-ai-in-practice.pdf`, Christophe Makni's own deck, "Agentic AI in
practice: Lessons learned for Leaders", copied byte for byte from the PDF the speaker handed over.
It is the one deck on the site with no source in any of our repositories. Page 6 is a black box
in it, where the talk plays a video. The name was misspelled "Christopher" in the master
spreadsheet, on the site and on the cold open's agenda slide; the site and the cold open were
fixed that day, the spreadsheet was not.

**Weekend 2 visualizations are served by the site too, from `public/viz/we2/`**, through
`viz(n, name, page)` (the page defaults to `index.html`): the yogurt cup game at 08:15, added
2026-09-15, and the two attention walkthroughs at 10:00, added 2026-09-16, each hung on its
lecture row and listed under Visualizations. They are copies; the sources live in the private
`w2-lecture-material`. Live, checked 2026-09-16:

    https://eth-bmai-hs26.github.io/BMAI-PAGE/viz/we2/attention-walkthrough/normalized.html
    https://eth-bmai-hs26.github.io/BMAI-PAGE/viz/we2/attention-walkthrough/softmax.html

**Weekend 3 decks are served the same way, from `public/slides/we3/`**, since 2026-10-01:
`w3_1_intro_cnn.pdf` to `w3_5_clip.pdf`, copies of `w3-lecture-material/pptx-decks/*.pdf`
(Carlos's FS26 PowerPoint decks, re-dated; recopy after a rebuild), one "Slides" chip per lecture
row, the UNet deck on both UNet rows, plus `convolutional-filters.pdf` and the convolution
walkthroughs (`public/viz/we3/`) on the Friday 08:15 row. Live and byte-matched, 2026-10-01. Since
2026-10-02 `cold-open.pdf` too, the Leonardo cold intro, first chip on that row.

**Two weekend 3 visualizations are LINKED, not copied**, since 2026-10-02: the SML course's own
CNN and U-Net deep dives, `https://sml-fs26.github.io/neuralnetworks/cnn-deepdive/` and
`https://sml-fs26.github.io/neuralnetworks/unet-deepdive/` (source `git_sml/neuralnetworks`, remote
`sml-fs26/neuralnetworks`, live on its GitHub Pages, every asset checked 200). The CNN one is a chip
on the Friday 08:15 row, the U-Net one a chip on both Friday UNet rows beside the shared deck, and
both are in the Visualizations list (BMAI-PAGE commit `9b79e3d`, constants `SML_CNN_DEEPDIVE` and
`SML_UNET_DEEPDIVE` in `weekends.ts`). They are the only entries in the Visualizations lists that are
not copies in `public/viz/`, so there is nothing to recopy, but a rename or move inside that
repository breaks them: re-check both URLs if it is touched. The SML diffusion deep dive is live
too, at `https://sml-fs26.github.io/diffusion/` (the Pages site root IS the deep dive, not a
subfolder, so `.../diffusion/diffusion-deepdive/` is a 404), and is not linked yet.

**Weekend 4's grasshopper click-through is served the same way, from `public/viz/we4/`**, since
2026-10-21, on Carlos's word: `grasshopper-regression/`, a copy of
`w4-lecture-material/grasshopper-regression/` (the page, css, js, data and vendored fonts), as a chip
"Two grasshoppers fit a line" on the Friday 08:15 row and an entry under Visualizations (commit
`db6d6a8`; Carlos's second and third rounds recopied on 2026-10-22, commits `5761ad5` and `71950d4`,
and the fix that draws both panels to one scale, `618b630`). The manifolds deck links it and prints its QR code, so its address must not move. Beside
its chip, since 2026-10-22, "Grasshoppers, exercise" opens the same gradient descent as a Colab exercise,
`w4-cx-public/grasshopper-gradient-descent/grasshopper_gradient_descent.ipynb` (commit `1dc2d93`, see the
w4-cx-private section). Live and byte-matched, all 15 files:

    https://eth-bmai-hs26.github.io/BMAI-PAGE/viz/we4/grasshopper-regression/

**Weekend 4's manifold games are served as copies from `public/exercises/we4/manifold-games/`**,
the Sunrise Machine and the Manifold Chart Explorer, copied from `w4-cx-public/manifold-games/`, on
the Friday 09:00 row. Since 2026-10-22 the explorer copy has "Fold the chart" (commit `6ed566b`,
see the w4-cx-private section), and the Friday 08:15 row links the same copy as ONE chip,
"Manifold Explorer" (commit `a863329`, on Carlos's word): the four "Folding" chips and the four
Visualizations entries that opened each fold are gone; do not put a chip per manifold back.
Live and byte-matched, all 5 files:

    https://eth-bmai-hs26.github.io/BMAI-PAGE/exercises/we4/manifold-games/manifold-explorer/index.html#fold=klein

**Weekend 4's Friday 10:00 row links the apples-and-oranges notebook** since 2026-10-22, on
Carlos's word: a chip "Apples and oranges notebook" and an entry under Coding exercises, both
`colab('w4-cx-public', 'apple-orange-autoencoder/apple_orange_autoencoder.ipynb')` (commit
`8338a2e`, checked live). Before it on the same row since 2026-10-22, the chip
"Slides: Conditional VAEs", the lecture's deck (see below). Linked, not copied; the "Conditional VAE with demo" exercise (11:00 then,
14:30 since 2026-10-22) was a placeholder until the evening of 2026-10-22, when the teaching assistants
filled it: Ivan Angjelovski linked his `aging/face_aging.ipynb` (BMAI-PAGE `bced4c4`, `0e5ee69`, easy,
rank 5), and Habouz swapped in his own `face-aging-vae/face_aging_vae.ipynb` the same evening and renamed
the row "Face aging with your own VAE" (`fa054ef`, `1f3378f`, `50dc550`). On 2026-10-23 Ivan overwrote
his notebook in `w4-cx-public` with that version (`da4ca08`), so `aging/face_aging.ipynb` there is no
longer his original.

**Weekend 4's Friday 14:00 row links the happy-and-sad diffusion notebook** since 2026-10-22, on
Carlos's word: a chip "Happy and sad diffusion notebook" and an entry under Coding exercises, both
`colab('w4-cx-public', 'happy-sad-diffusion/happy_sad_diffusion.ipynb')`, the EXERCISE (commit
`0ce0bfc`; its own deploy run was cancelled by the next push, and `8338a2e`'s run deployed both;
checked live in the browser pane). Linked, not copied. **Its complete notebook is in `w4-cx-public`
and is never linked here**: copied there on the morning of 2026-10-22 ("Show me the solution in the
public repo, don't put it on the website yet"), taken out by `w4-cx-public` `982da82` ("After the
exercise, just put them in the public repo but not on the website"), and put back the same day by
`8bcb26f` ("Now, all of them"), with the extension, `happy_sad_diffusion_extension.ipynb`, which
repeats the exercise's answers. Both are listed in `w4-cx-public/SOLUTIONS.md`. The master is
`w4-cx-private/happy-sad-diffusion/happy_sad_diffusion_solutions.ipynb`, never linked here. **Since the
evening of 2026-10-22 the 14:00 row holds every notebook of the stable diffusion line** (BMAI-PAGE
`b50fd29`), on Carlos's word ("put all the notebooks related to this into the slot on coding exercises on
stable diffusion"): the happy and sad exercise (hard, rank 5 now), the text embeddings exercise (easy,
rank 4), and, as demos at first, the extension and the tiny stable diffusion. The same evening, on his word
("shouldn't they be exercises? Could you do them as exercises if possible?"), both became exercises at the same addresses: "Three faces and BERT" (hard, rank 6,
its reference the sunrise season classifier) and "A tiny stable diffusion" (hard, rank 7, no reference),
BMAI-PAGE `ce3bee9`. Their summaries say they come after the earlier exercises, whose answers their folded
cells hold. The solutions (`*_solutions.ipynb`) stay off the site.

**Weekend 4's Friday 08:15 row links the two sunrise CNN notebooks** since 2026-10-22, on Carlos's word:
the chips "Season classifier, example" and "Time of day, exercise", and two entries under Coding
exercises, all `colab('w4-cx-public', 'sunrise-cnn/<file>.ipynb')` (BMAI-PAGE `dc25338`, see the next
paragraph, and the comment update `845cb0b`; checked live). The site serves no copy of them. Their
complete notebook is in `w4-cx-public`, listed in SOLUTIONS.md, and is never linked here. Since
`cc8a4b0` (live, checked in the bundle and on the page) they are ONE entry of `exercises`, the exercise
"Sunrise time of day estimator" with the example "Sunrise season classifier" as its reference, Carlos's
names of 2026-10-22, in the block "Predicting from a photo"; on the schedule row the example is the
"Example" button attached to the exercise's chip, its name a tooltip, and under "Coding exercises,
easiest first" it reads "Example: Sunrise season classifier".

**BMAI-PAGE commit `dc25338` carries another session's edits**: two comment changes of the solutions
session went out with the sunrise CNN session's uncommitted chips in the same file, "Season classifier,
example" and "Time of day, exercise" on the Friday 08:15 row and two Coding exercises entries, approved
content (Carlos had asked that session to publish them), deployed and live; that session was told. A
path given to `git commit` takes the whole working-tree file: `git diff` a shared file first.

**Weekend 4's decks are served the same way as weekend 3's, from `public/slides/we4/`**, since
2026-10-22: `manifolds.pdf`, the manifold half of the Friday 08:15 lecture, as the chip "Slides:
Manifolds" on that row and "Manifolds and VAEs, part 1: manifolds" under Materials. Live and
byte-matched (sha256 `5035adcc...5cb9fd`; since BMAI-PAGE `55f3dff`, the night of 2026-10-22 to 23,
it is the Portolan rebuild, sha256 `2e81911f...452b2c1`):

    https://eth-bmai-hs26.github.io/BMAI-PAGE/slides/we4/manifolds.pdf

And `vae.pdf`, the VAE half, on Carlos's word of the same day ("Publish the slides on VAE"): a copy
of `w4-lecture-material/vae-deck/vae-slides.pdf` at that repository's `ee0c592`, as the chip
"Slides: VAEs" beside it and "Manifolds and VAEs, part 2: VAEs" under Materials (BMAI-PAGE
`9bed8c6`). Live and byte-matched (sha256 `e6922837...`, 531 611 bytes); recopy after a rebuild:

    https://eth-bmai-hs26.github.io/BMAI-PAGE/slides/we4/vae.pdf

And `stable-diffusion.pdf`, the Friday 11:00 lecture "Stable diffusion", on Carlos's word of the same
day ("Publish the slides and notebooks we have created so far"): a copy of
`w4-lecture-material/stable-diffusion/diffusion-deck/diffusion-slides.pdf` at that repository's
`52a242b`, as the chip "Slides" on that row and "Stable diffusion" under Materials (BMAI-PAGE
`864dd25`). Live and byte-matched (sha256 `4ff8bd4c...914daa0`, 2 855 817 bytes); recopy after a
rebuild:

    https://eth-bmai-hs26.github.io/BMAI-PAGE/slides/we4/stable-diffusion.pdf

And `conditional-vae.pdf`, the Friday 10:00 lecture, on Carlos's word of the same day ("Publish it"):
a copy of `w4-lecture-material/cvae-deck/cvae-slides.pdf` at that repository's `d4f8b8f`, as the
chip "Slides: Conditional VAEs" on that row before the notebook's chip, and "Conditional VAEs and age
progression" under Lecture slides, which was `SOON` (BMAI-PAGE `f4bd41d`). Live and byte-matched
(sha256 `8c6e386e...`, 611 880 bytes); recopy after a rebuild:

    https://eth-bmai-hs26.github.io/BMAI-PAGE/slides/we4/conditional-vae.pdf

And `future-of-ai.pdf`, the Friday 16:00 lecture "Future of AI", the last block of the Friday, on
Carlos's word of the same day ("Port the slides here into the BMAI format and publish them on the
website in the last block of Friday"): a copy of
`w4-lecture-material/future-of-ai-deck/future-of-ai-slides.pdf` at that repository's `a383bf4`, the
CSCS survey deck "1,580 AI Authors" ported to the BMAI format, as the chip "Slides" on that row and
"Future of AI" under Lecture slides, which was `SOON` (BMAI-PAGE `cc83a85`). Live and byte-matched
(sha256 `b48e5bdf...a5ff`, 614 555 bytes), and checked on the rendered weekend page; recopy after a
rebuild. The AI Impacts report it is built on states no licence and is not on the site:

    https://eth-bmai-hs26.github.io/BMAI-PAGE/slides/we4/future-of-ai.pdf

And `cold-open.pdf`, the weekend's cold open, Strabo then Snow, on Carlos's word of 2026-10-23 ("Publish
it"): a copy of `w4-lecture-material/cold-intro/slides-strabo.pdf` at that repository's `eaed6d3`, as the
chip "Cold open" first on the Friday 08:15 row and "The cold open" first under Lecture slides (BMAI-PAGE
`58a171d`). Live and byte-matched (sha256 `f6fc35f0...443c5`, 6 291 490 bytes); recopy after a rebuild:

    https://eth-bmai-hs26.github.io/BMAI-PAGE/slides/we4/cold-open.pdf

And `attacks-on-llms.pdf`, the Saturday 10:30 lecture "Attacks on LLMs", on Carlos's word of 2026-10-24
("Publish the Attacks on LLMs deck on the course site, on the Saturday 10:30 row and under Lecture
slides"): a copy of `w4-lecture-material/attacks-on-llms-deck/attacks-on-llms-slides.pdf` at that
repository's `9f0b852`, the VMI 2026 workshop deck "Attacking LLMs" from its section 3.3 on, cut to seven
frames, as a "Slides" link with a description on the Saturday 10:30 row and "Attacks on LLMs" under
Lecture slides, which was `SOON` (sha256 `58b7a247...c09c8e0`, 470 172 bytes); recopy after a rebuild:

    https://eth-bmai-hs26.github.io/BMAI-PAGE/slides/we4/attacks-on-llms.pdf

**Weekend 4's page shows the atlas of the weekend's models just before its agenda**, since 2026-10-22,
on Carlos's word ("post it on the website just before the weekend agenda"), BMAI-PAGE commit `01217d7`.
It is a new optional field of `Weekend`, `overview` (`src/types.ts`: a title, a note and pages, each an
image and a link), rendered by `src/pages/WeekendPage.tsx` between the weekend header and the two agenda
columns, its pages side by side and one column under 820 px (`.overview` in `src/index.css`). Weekend 4's
pages are `public/slides/we4/atlas-1.png` and `atlas-2.png`, each linking to its page of `atlas.pdf`, the
2-page handout of `w4-lecture-material/atlas-deck/`; the PDF is also first under Lecture slides. No other
weekend sets `overview`, so their pages are unchanged. Live and byte-matched (sha256 `5c53708f...`, 390 021
bytes):

    https://eth-bmai-hs26.github.io/BMAI-PAGE/slides/we4/atlas.pdf

**The same commit, `cf8194a`, made weekend 4 follow the master spreadsheet** as Carlos left it on the
night of 2026-10-21, on his word of 2026-10-22: Friday stable diffusion at 11:00 and its exercise at
14:00 (the 14:00 row, with the happy-and-sad chip, is now that exercise), the conditional VAE exercise
at 14:30, "Future of AI" at 16:00, and no cross-attention lecture and no quiz; Saturday "Attacks on
LLMs" at 10:30, "Project intro: Deepfake detection and generation" at 11:00 (type `project`, and the
weekend's `project` field), and 12:00 an empty `tba` row, as the spreadsheet leaves it. The summary
and the Materials list follow. The break venues stay the programme office's, which the spreadsheet
does not carry, and the times stay 08:15 where it says 08:00. **Weekend 4's Friday lunch is at the
Dozentenfoyer since 2026-10-22, together with CAS CMC**, not at Polysnack as in the office's schedule
of 3 September: the programme office's e-mail of that day, the eve of the weekend, moved it
(BMAI-PAGE `614c4e7`); its other three breaks were already as the site had them, so do not put the
lunch back from the older schedule. **The cold open's agenda frame**
(`w4-lecture-material/cold-intro/`, "Where the weekend goes") still lists the weekend as it was
before, with cross-attention and the deepfakes as a lecture.

Both Saturday lectures, every coding exercise and both project links are still the `SOON`
placeholder, which renders greyed out as "Soon". That list is the checklist.

**The annotated decks are on the site too, 2026-09-05.** Carlos annotates each deck on his iPad
during the lecture and hands the export over afterwards. All eight weekend-1 copies sit in
`w1-lecture-material/annotated/` and are served from `public/slides/we1/<name>-annotated.pdf`, as
an "Annotated" chip right after the deck's own chip on every lecture row and directly under the
clean deck in the Materials list, which is the FDD arrangement. Their embedded fonts are damaged by
the iPad export, recorded in `annotated/CLAUDE.md`, which is why the clean deck stays the primary
link. **Weekend 2's followed on 2026-09-19**, the same way, from `w2-lecture-material/annotated/`
to `public/slides/we2/<name>-annotated.pdf`: four of the six exports, the two without ink left
off. An export with no ink on it is the clean deck with broken fonts, so check before
publishing. The home page hero also links the lecture recordings,
`https://video.ethz.ch/lectures/d-infk/2026/autumn/273-0003-00L`, with a note that the credentials
are in the course Moodle, `https://moodle-app2.let.ethz.ch/course/view.php?id=28802`.

Carlos, 2026-09-02: the earlier instruction here to **leave `BMAI-PAGE` alone is superseded**. He
asked for the upload himself. It still carries no CLAUDE.md of its own.

*(2026-10-23: this file is that CLAUDE.md. The sentence above is as written in the root.)*

**Weekend 4's page has a new structure since 2026-10-22, BMAI-PAGE `565886e`, live**, on Carlos's word
("take this proto, this your proposal and make it the official one"), built that evening as the prototype
branch `prototype/slot-details` (still on GitHub, now merged; delete it only on his word). It changes
weekend 4 only; weekends 1 to 3 have no `exercises` and keep the plain chips.
- **Four colours, one per kind of link**, with a legend above the schedule: slides blue, visualizations
  orange, coding exercises solid petrol, worked examples purple (`--kind-*` in `src/index.css`, where a
  comment gives the CIEDE2000 distances). The kind follows from the address (`linkKind` in
  `src/lib/exercises.ts`): a PDF is slides, a Colab notebook an example, any other page a visualization.
  Colour is never the only cue: an exercise is the one solid chip, an example says "Example:".
  **Since 2026-10-23 an exercise's chip on the schedule shows no rank and no Easy or Hard** (BMAI-PAGE
  `5c52cb2`, live), on Carlos's word ("Drop the number indicators in the chip of the coding exercises.
  Also drop the 'easy' 'hard' indicators"): only its title, its reference attached, and a tick once it is
  done. The rank and the level stay in the data, in a row's Details and in the list under the schedule;
  do not put them back on the chip.
- **The notebooks are ONE array, `exercises`, at the end of the weekend** (type `CodingExercise` in
  `src/types.ts`), not chips and not Materials entries: `day`, `time` (the row it shows on), `title`,
  `summary`, `url` (`SOON` until uploaded), and for an exercise a `level` (`'easy'` or `'hard'`) and a
  `rank` in the weekend's easiest-first order, plus a `reference`, the worked example or visualization to
  open beside it; a complete notebook is `demo: true` and has no rank. The levels as Carlos set them on
  2026-10-22: 1 pufferfish autoencoder, 2 "Sunrise time of day estimator", 3 "Two grasshoppers, in Python"
  (easy), 4 happy and sad faces (hard). Since 2026-10-23 (BMAI-PAGE `41b2c40`, then `027e588` and `fc5f8fb`, live) the order is:
  easy, 1 pufferfish autoencoder, 2 sunrise time of day, 3 grasshoppers, 4 text embeddings, 5 face aging
  with your own VAE (14:30), 6 "A dog the network takes for a cat" (Saturday 09:00, the adversarial
  attacks exercise, its example the sunrise season classifier); then hard, 7 "Adversarial attacks on CIFAR-10"
  (Saturday 09:00, Kangsheng Qi's exercise, for the fast, right below the cats and dogs), 8 happy and sad
  faces, 9 three faces and BERT, 10 a tiny stable diffusion, 11 "Stable diffusion" (14:00, Sofi Mousia's exercise, `colab('w4-cx-public',
  'cx4_stable_diffusion.ipynb')`, no reference). Carlos asked for that title and for it to close the list
  ("Can you title it just "Stable diffusion" and put it at the end of the list"); it is marked hard because
  the list under the schedule shows its Easy group first, so only a hard exercise can come last there.
  **To add an exercise:
  an entry there, with its level, a rank (renumber the others so the ranks stay 1, 2, 3 in difficulty
  order) and its worked example as `reference`. Never a solution** (the standing rule above).
- **A link gets a `description`**, one or two sentences shown by the row's "Details" button; "Show all
  details" opens every row, and `#/weekend/we4?details=all` links to that. Under the schedule, "Coding
  exercises, easiest first" lists every exercise: easy, hard, not uploaded yet, with a Done tick kept in
  the reader's browser.
- **The Friday morning is five blocks**, on Carlos's words of the same evening and night, each link in the
  block whose topic it shows: 08:15 Manifolds (slides), 08:45 "Predicting from a photo" (the exercises
  "Sunrise time of day estimator" and "Two grasshoppers, in Python"; the grasshopper click-through is only
  that exercise's reference, not a chip of its own, since it showed twice), 09:15 Manifold games (the
  Manifold Explorer; the teaching assistants add their games beside it, as links with a description),
  09:45 Variational autoencoders (slides, Sunrise Machine, the pufferfish autoencoder with its example,
  and the pufferfish VAE as a demo after it), 10:15 Conditional VAEs and age progression (slides, the
  apples and oranges demo), then the 10:30 coffee (BMAI-PAGE `350d63c`). The master spreadsheet still
  showed the old morning that evening (08:00 "Manifolds and VAEs", 09:00 "CX Manifold games", 10:00
  conditional VAEs).
The weekend-4 paragraphs above that name chips on rows ("the Friday 08:15 row links ...") describe the page
before `565886e`: the addresses still hold, the places are as in this list.

## Maintenance contract

- This file is the working memory for this repository. After any major change here, meaning a new or
  changed exercise, deck, page or script, a renamed or moved directory, a changed build or run procedure,
  a changed data format, or a change in who owns the work, UPDATE THIS FILE IN THE SAME COMMIT. A
  CLAUDE.md that describes a layout the repository no longer has is worse than none.
- History, decisions, gotchas and publication records (commits, sha256 sums, "on Carlos's word")
  stay in THIS file. The root `git_bmai/CLAUDE.md` is an index of about 8 KB: it gets at most one
  line per change, and only when the map of repositories changes.
- Every subdirectory that holds work of its own carries its own CLAUDE.md, and that file must itself
  carry this same maintenance contract, including this propagation rule. When you create a
  subdirectory, create its CLAUDE.md at the same time.
- Keep it concrete: real file names, real identifiers, real commands. Record the gotchas that cost
  someone an hour. Do not restate what the code already says plainly.

**Weekend 4's project intro deck is served from `public/slides/we4/deepfake-project.pdf`** since
2026-10-24: "Deepfake Generation & Detection" (Francesco Caperna, Christina Tsakanika, Daniele Russica,
12 pages, exported from Google Slides), uploaded by Francesco through the GitHub web interface as
`Slide Project_4.pdf` (commit `26c18f9`) and renamed in the next commit, as the chip "Slides" first on the
Saturday 11:00 project row and "Deepfake detection and generation: project intro slides" under Project,
the weekend-2 arrangement. Like the guest deck of weekend 2 it has no source in any of our repositories:
to change it, replace the file. The project description and the grading scheme stay `SOON`:

    https://eth-bmai-hs26.github.io/BMAI-PAGE/slides/we4/deepfake-project.pdf
