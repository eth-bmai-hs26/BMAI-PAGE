import type { Weekend } from '../types';

/**
 * Single source of truth for all BMAI 2026 weekend content.
 * Transcribed from the "Syllabus" tab of "BMAI HS26 master spreadsheet.xlsx".
 *
 * To update content, edit the objects below. Each weekend has a Friday and a
 * Saturday agenda plus a `resources` list.
 */

/**
 * SCHEDULE FACTS AND WHERE THEY COME FROM.
 *
 * Times and rooms are the course unit's own entry in the ETH Vorlesungs-
 * verzeichnis, 273-0003-00L, autumn semester 2026: Friday 08:15 to 17:00 and
 * Saturday 08:15 to 13:00, both in HG D 7.2. That is why every day starts at
 * 08:15 rather than 08:00.
 *
 * Catering comes from the CAS AIS HS26 schedule sent by the programme office on
 * 3 September 2026. THE FRIDAY VENUES ARE NOT THE SAME EVERY WEEKEND, so they
 * are set per weekend rather than once: weekends 1 and 3 are largely at the
 * Dozentenfoyer, weekends 2 and 4 at Polysnack, except weekend 4's lunch, which
 * is at the Dozentenfoyer, and weekend 3's afternoon coffee is at the foyer
 * instead. Every Saturday coffee is at HG D30.0075, the foyer immediately
 * outside the classroom. Do not "tidy" these into one value.
 *
 * The programme office sent the breaks for weekends 2 to 4 again by e-mail,
 * transcribed here on 16 September 2026. All twelve match what was already
 * here, time and venue. What it adds is how the foyer is served. On a Saturday
 * the Cafebar prepares a coffee trolley, which a teaching assistant collects
 * before the break, brings to the foyer and returns afterwards, so the venue is
 * the foyer and not the Cafebar, although the coffee comes from there. The
 * Friday afternoon coffee of weekend 3 is catering delivered to the same foyer.
 * The rows name the foyer in words beside HG D30.0075, since the code alone
 * does not tell a participant where to walk. The space inside the code is a
 * no-break space, \u00a0, because the longer label otherwise wraps between "HG"
 * and "D30.0075" in the two-column schedule on a laptop, and no word order
 * avoids that at every width.
 *
 * The programme office sent weekend 4's breaks once more on 22 October 2026,
 * the day before it. One of the four changed: the Friday lunch, 13:00 to 14:00,
 * is at the Dozentenfoyer and no longer at Polysnack, a joint lunch with CAS
 * CMC, which its row says. The two Friday coffees at Polysnack and the Saturday
 * coffee in the foyer, with its trolley from the Cafebar, are as they were.
 */
const ORG = 'eth-bmai-hs26';

/**
 * Name of a public repository in the eth-bmai-hs26 organisation that materials
 * are read from, e.g. 'w1-cx-public' or 'w1-lecture-slides'.
 *
 * Deliberately any string, not a fixed list: a lecturer creates whatever public
 * repo suits them and we link it, rather than asking them to rename it to fit a
 * convention. `w<N>-<cx|project|lecture>-public` is the house habit for TA
 * material, not a rule. The trade-off is that a typo in a repo name is a dead
 * link at runtime instead of a build error, so paste names, do not type them.
 */
export type PublicRepo = string;

/**
 * Direct file link into a public repo, for slides and handouts. GitHub serves
 * these as a download rather than rendering them in the browser.
 */
export const raw = (repo: PublicRepo, path: string): string =>
  `https://raw.githubusercontent.com/${ORG}/${repo}/main/${path}`;

/**
 * Notebook in a public repo, opened in Google Colab. Pass `branch` only for a
 * notebook that has not been merged to main yet.
 */
export const colab = (repo: PublicRepo, path: string, branch = 'main'): string =>
  `https://colab.research.google.com/github/${ORG}/${repo}/blob/${branch}/${path}`;

/** File shown in GitHub's own viewer, for a notebook or PDF to preview in-page. */
export const github = (repo: PublicRepo, path: string): string =>
  `https://github.com/${ORG}/${repo}/blob/main/${path}`;

/**
 * Placeholder for material that has not been uploaded yet. Renders greyed out
 * as "Soon" instead of a link, so an agenda can go live before its files do.
 * Replace with raw(repo, path) or colab(repo, path) once the file is pushed.
 */
export const SOON = '#';

/**
 * A lecture deck hosted by THIS site, from `public/slides/we<n>/`.
 *
 * Why not raw(): raw() needs a PUBLIC repository in the org to read from, and
 * no public repository holds these decks. They live in
 * `eth-bmai-hs26/w1-lecture-material`, which is private. Serving them from this
 * repository is what the sibling FDD site does, it needs no new repository and
 * no visibility change, and it goes live on the next deploy. If a public slides
 * repo is ever created, switch these to raw('<that-repo>', ...) and delete the
 * PDFs from public/slides/.
 *
 * BASE_URL rather than a bare './' so the link survives a change to `base` in
 * vite.config.ts. Under hash routing the document URL is always the site root,
 * so a relative href resolves correctly from any route.
 */
export const deck = (n: number, file: string): string =>
  `${import.meta.env.BASE_URL}slides/we${n}/${file}`;

/**
 *
 * An interactive VISUALIZATION hosted by this site, from
 * `public/viz/we<n>/<name>/`.
 *
 * Same reasoning as deck(): the source lives in the private
 * `eth-bmai-hs26/w1-lecture-material`, and serving the built page from here
 * needs no new repository and no visibility change.
 *
 * A visualization is a FOLDER rather than one file, so this points at its
 * index.html. Each one is browser only, opens with no build step and no
 * network, and carries its own vendored libraries, so it works from this
 * subpath exactly as it works from a file:// URL on a laptop.
 */
export const viz = (n: number, name: string, page = 'index.html'): string =>
  `${import.meta.env.BASE_URL}viz/we${n}/${name}/${page}`;

/**
 * A participant-facing HOW-TO page hosted by this site, from `public/guides/`.
 *
 * Same reasoning as deck(): the source lives in a private repository, and a
 * page served from here needs no new repository and no visibility change. The
 * sibling FDD site serves its installation guide the same way.
 */
export const guide = (file: string): string =>
  `${import.meta.env.BASE_URL}guides/${file}`;

/**
 * An exercise hosted by THIS site, from `public/exercises/we<n>/`, for the
 * exercises that Colab cannot carry. Two kinds live here:
 *
 * A NOTEBOOK, which the browser downloads. colab() is right for every other
 * exercise in this course and wrong for the Claude Code one: it drives a
 * terminal program that edits files in a folder the participant owns, and Colab
 * has neither the folder nor the licence, so the notebook is opened locally in
 * VS Code. See the setup guide.
 *
 * A self-contained HTML page, which opens in a tab and needs no Python at all.
 * Why not raw(): raw.githubusercontent.com serves .html as `text/plain` with
 * `nosniff`, so a participant clicking it reads the source instead of using the
 * page. The file is copied here from its public repo rather than linked, so
 * check for a newer copy upstream when the TA edits it.
 */
export const exercise = (n: number, file: string): string =>
  `${import.meta.env.BASE_URL}exercises/we${n}/${file}`;

/**
 * A runnable APPLICATION hosted by this site, from `public/apps/we<n>/`, as a
 * zip the participant unpacks and starts on their own laptop.
 *
 * Same reasoning as deck(): it has to DOWNLOAD, and the download attribute is
 * same-origin only, so linking w1-project-public directly would leave the chip
 * at the mercy of whatever GitHub decides to serve. A copy, so re-export it
 * when the app changes upstream.
 */
export const app = (n: number, file: string): string =>
  `${import.meta.env.BASE_URL}apps/we${n}/${file}`;

/**
 * Two interactive deep dives from the SML course's own site, a convolutional
 * network and a U-Net, linked rather than copied, unlike every other
 * visualization here: they are public, live and maintained upstream in
 * github.com/sml-fs26/neuralnetworks, so a fix there reaches this site with no
 * recopy. The catch is that moving or renaming them there breaks these two
 * links. Both pages and every asset they load were checked live on 2026-10-02.
 */
const SML_CNN_DEEPDIVE = 'https://sml-fs26.github.io/neuralnetworks/cnn-deepdive/';
const SML_UNET_DEEPDIVE = 'https://sml-fs26.github.io/neuralnetworks/unet-deepdive/';

export const weekends: Weekend[] = [
  {
    id: 'we1',
    number: 1,
    // Renamed by Carlos on 2026-09-03, from 'Neural Network Foundations'.
    // Title Case to match the other three weekend cards, which sit beside
    // this one on the home page; he wrote it in sentence case.
    title: 'The Nature of Modern AI Applications',
    theme: "Optimization, universal approximation and Vapnik's statistical learning theory",
    dates: '4–5 September 2026',
    startISO: '2026-09-04',
    fridayRoom: 'HG D 7.2',
    saturdayRoom: 'HG D 7.2',
    project: 'LLM routing',
    summary:
      "The first weekend builds up the machinery behind neural networks: how first-order methods approach a minimum, why gradient descent works, what a network can approximate, and how Vapnik's statistical learning theory frames generalization.",
    friday: [
      {
        time: '08:15',
        title: 'Intro and onboarding',
        type: 'lecture',
        // The intro and administration deck is deliberately NOT linked here.
        // It is course-wide material rather than weekend-1 material, so it sits
        // in the hero on the home page and nowhere else. Carlos, 2026-09-02.
        //
        // "Annotated" is the same deck as Carlos wrote on it in the lecture, an
        // iPad export, and it sits right after the deck it annotates on every
        // lecture row, as on the FDD site. Carlos asked for that on 2026-09-05,
        // when the last four copies arrived. Their embedded fonts are damaged,
        // see the note on the Materials list below.
        links: [
          { label: 'Cold open', url: deck(1, 'cold-open.pdf') },
          { label: 'Annotated', url: deck(1, 'cold-open-annotated.pdf') },
        ],
      },
      {
        time: '09:00',
        title: 'First-order approximation algorithms',
        type: 'lecture',
        links: [
          { label: 'Slides', url: deck(1, 'first-order-approximation-algorithms.pdf') },
          { label: 'Annotated', url: deck(1, 'first-order-approximation-algorithms-annotated.pdf') },
        ],
      },
      // Moved from 10:00 to 09:30 by Carlos on 2026-09-03. The coffee break
      // stays at 10:30, so this exercise runs an hour rather than half of one
      // and the 09:00 lecture is the half hour block.
      {
        time: '09:30',
        title: 'First-order optimization algorithms',
        type: 'exercise',
        // Three browser exercises run in this slot. All are self-contained
        // pages, so 'Open in browser' would name them all: the labels say
        // WHICH exercise instead, in the order the TA runs them.
        //
        // The genie chip pointed at cx_robbins-monro.html until 2026-09-04,
        // which was the wrong page: that one is titled 'Two Problems, Done by
        // Hand' and has no genie in it. The riddle is its own page upstream,
        // cx-rm/cx_genie-game.html, and that is what hangs here now. The
        // Robbins-Monro page stays in Materials rather than in this slot.
        links: [
          {
            label: 'Approximation game',
            url: exercise(1, 'cx_approximation-game.html'),
          },
          {
            label: 'Genie game',
            url: exercise(1, 'cx_genie-game.html'),
          },
          {
            label: 'Housing prediction',
            url: exercise(1, 'cx_house-pricing-game.html'),
          },
        ],
      },
      { time: '10:30', title: 'Coffee break at Dozentenfoyer, until 11:00', type: 'break' },
      {
        time: '11:00',
        title: 'Gradient descent',
        type: 'lecture',
        links: [
          { label: 'Slides', url: deck(1, 'gradient-descent.pdf') },
          { label: 'Annotated', url: deck(1, 'gradient-descent-annotated.pdf') },
        ],
      },
      {
        time: '12:00',
        title: 'Gradient descent',
        type: 'exercise',
        links: [
          {
            label: 'Grasshopper game',
            url: exercise(1, 'cx_grasshopper.html'),
          },
        ],
      },
      { time: '13:00', title: 'Lunch break at Dozentenfoyer, until 14:00', type: 'break' },
      {
        time: '14:00',
        title: 'Neural networks and universal approximation',
        type: 'lecture',
        links: [
          { label: 'Slides', url: deck(1, 'neural-networks-universal-approximation.pdf') },
          { label: 'Annotated', url: deck(1, 'neural-networks-universal-approximation-annotated.pdf') },
        ],
      },
      {
        time: '14:30',
        title: 'Neural networks',
        type: 'exercise',
        // Both notebooks open in Colab, so the labels name the notebook
        // rather than saying 'Open in Colab' twice.
        links: [
          {
            label: 'Property valuation notebook',
            url: colab('w1-cx-public', 'cx-nn/nn_base_exercise.ipynb'),
          },
          {
            label: 'Universal approximation',
            url: colab('w1-cx-public', 'universal-approximation/universal_approximation.ipynb'),
          },
        ],
      },
      { time: '15:30', title: 'Coffee break at Dozentenfoyer, until 16:00', type: 'break' },
      {
        time: '16:00',
        title: "Vapnik's statistical learning theory",
        type: 'lecture',
        links: [
          { label: 'Slides', url: deck(1, 'statistical-learning-theory.pdf') },
          { label: 'Annotated', url: deck(1, 'statistical-learning-theory-annotated.pdf') },
        ],
      },
      // Weekend 1 only, and after the teaching day: the course unit runs to
      // 17:00 on a Friday.
      { time: '17:00', title: 'Welcome apero at Polysnack, until 19:30', type: 'break' },
    ],
    saturday: [
      {
        time: '08:15',
        title: 'Training neural networks with PyTorch',
        type: 'lecture',
        links: [
          { label: 'Slides', url: deck(1, 'training-neural-networks-with-pytorch.pdf') },
          { label: 'Annotated', url: deck(1, 'training-neural-networks-with-pytorch-annotated.pdf') },
        ],
      },
      {
        time: '08:15',
        title: 'Introduction to Claude Code (parallel session)',
        type: 'lecture',
        links: [
          { label: 'Slides', url: deck(1, 'introduction-to-claude-code.pdf') },
          { label: 'Setup guide', url: guide('claude-code-setup.html') },
          { label: 'Exercise', url: exercise(1, 'operation-midnight-launch.ipynb') },
        ],
      },
      {
        time: '09:00',
        // Was titled 'Iris PyTorch' while Iris was the only exercise here. The
        // teaching assistants' property-valuation notebook now runs in the same
        // slot, so the row carries the slot's name and each chip names its own
        // exercise. The Claude Code session it has to stay distinguishable from
        // is its own row at 08:15.
        title: 'Neural networks with PyTorch',
        type: 'exercise',
        links: [
          {
            label: 'Iris',
            url: colab('w1-cx-public', 'iris-pytorch/iris_pytorch.ipynb'),
          },
          {
            label: 'Property valuation',
            url: colab('w1-cx-public', 'cx-nn/nn_base_exercise.ipynb'),
          },
        ],
      },
      {
        time: '10:00',
        title: 'Coffee break in the foyer outside the classroom (HG\u00a0D30.0075), until 10:30',
        type: 'break',
      },
      {
        time: '10:30',
        title: 'Validation and overfitting',
        type: 'lecture',
        links: [
          { label: 'Reference', url: deck(1, 'validation-reference.pdf') },
          { label: 'Annotated', url: deck(1, 'validation-reference-annotated.pdf') },
          { label: 'The UN games', url: viz(1, 'un-games') },
        ],
      },
      {
        time: '11:00',
        title: 'Validation and overfitting',
        type: 'exercise',
        links: [
          {
            label: 'Open in Colab',
            url: colab('w1-cx-public', 'cx-validation/cx_validation.ipynb'),
          },
        ],
      },
      {
        time: '12:00',
        title: 'Project intro: LLM routing',
        type: 'project',
        // The two chips deliberately behave differently. The brief DOWNLOADS,
        // so it is served from this site: the download attribute is same-origin
        // only, and a github.com link would open in GitHub's viewer instead.
        // That PDF is a copy, so check upstream when the TA edits it. The
        // notebook OPENS IN COLAB, which is where participants work on it and
        // which reads w1-project-public directly, so there is nothing to copy
        // and nothing to go stale.
        links: [
          { label: 'Slides', url: deck(1, 'llm-routing-project.pdf') },
          {
            label: 'Project Notebook',
            url: colab('w1-project-public', 'project1_RelayAI_student.ipynb'),
          },
          { label: 'App', url: app(1, 'relayai-router-explorer.zip') },
          {
            label: 'App installation guide',
            url: guide('relayai-installation-guide.pdf'),
          },
        ],
      },
    ],
    resources: [
      // Each annotated copy sits directly under the deck it annotates, and each
      // lecture row above carries an "Annotated" chip beside its deck chip, as
      // on the FDD site. Carlos asked for that arrangement on 2026-09-05, when
      // the last four copies arrived; until then the four Friday morning copies
      // were a group of their own down here.
      //
      // The annotated copies are Carlos's iPad exports and their embedded fonts
      // are damaged: the typeface substitutes and the fi/ff ligatures break, so
      // a few words read as "! ve windows" or "arti\"cial". He asked for them
      // published anyway on 2026-09-04, with the clean deck staying the primary
      // link right above each one. See ../w1-lecture-material/annotated/CLAUDE.md.
      { group: 'Lecture slides', label: 'The cold open', url: deck(1, 'cold-open.pdf') },
      {
        group: 'Lecture slides',
        label: 'The cold open, annotated in the lecture',
        url: deck(1, 'cold-open-annotated.pdf'),
      },
      // The clean intro and administration deck is course-wide material and
      // lives in the hero on the home page, where its annotated copy is linked
      // beside it. The copy is listed here as well because it was written on in
      // this weekend's 08:15 block.
      {
        group: 'Lecture slides',
        label: 'Intro and onboarding, annotated in the lecture',
        url: deck(1, 'intro-and-onboarding-annotated.pdf'),
      },
      {
        group: 'Lecture slides',
        label: 'First-order approximation algorithms',
        url: deck(1, 'first-order-approximation-algorithms.pdf'),
      },
      {
        group: 'Lecture slides',
        label: 'First-order approximation algorithms, annotated in the lecture',
        url: deck(1, 'first-order-approximation-algorithms-annotated.pdf'),
      },
      { group: 'Lecture slides', label: 'Gradient descent', url: deck(1, 'gradient-descent.pdf') },
      {
        group: 'Lecture slides',
        label: 'Gradient descent, annotated in the lecture',
        url: deck(1, 'gradient-descent-annotated.pdf'),
      },
      {
        group: 'Lecture slides',
        label: 'Neural networks and universal approximation',
        url: deck(1, 'neural-networks-universal-approximation.pdf'),
      },
      {
        group: 'Lecture slides',
        label: 'Neural networks and universal approximation, annotated in the lecture',
        url: deck(1, 'neural-networks-universal-approximation-annotated.pdf'),
      },
      {
        group: 'Lecture slides',
        label: "Vapnik's statistical learning theory",
        url: deck(1, 'statistical-learning-theory.pdf'),
      },
      {
        group: 'Lecture slides',
        label: "Vapnik's statistical learning theory, annotated in the lecture",
        url: deck(1, 'statistical-learning-theory-annotated.pdf'),
      },
      {
        group: 'Lecture slides',
        label: 'Introduction to Claude Code (Saturday parallel session)',
        url: deck(1, 'introduction-to-claude-code.pdf'),
      },
      {
        group: 'Lecture slides',
        label: 'Training neural networks with PyTorch',
        url: deck(1, 'training-neural-networks-with-pytorch.pdf'),
      },
      {
        group: 'Lecture slides',
        label: 'Training neural networks with PyTorch, annotated in the lecture',
        url: deck(1, 'training-neural-networks-with-pytorch-annotated.pdf'),
      },
      { group: 'Lecture slides', label: 'Validation and overfitting', url: SOON },
      {
        group: 'Lecture slides',
        label: 'Validation and overfitting: reference (why regularisation, the four objectives, R squared)',
        url: deck(1, 'validation-reference.pdf'),
      },
      {
        group: 'Lecture slides',
        label: 'Validation and overfitting: reference, annotated in the lecture',
        url: deck(1, 'validation-reference-annotated.pdf'),
      },
      {
        group: 'Visualizations',
        label: 'The UN games: spurious regression in ten scenes (Saturday, validation and overfitting)',
        url: viz(1, 'un-games'),
      },
      {
        group: 'Coding exercises',
        label: "First-order optimization: Heron's algorithm (runs in the browser)",
        url: exercise(1, 'cx_approximation-game.html'),
      },
      {
        group: 'Coding exercises',
        label: "First-order optimization: the genie's riddle (runs in the browser)",
        url: exercise(1, 'cx_genie-game.html'),
      },
      {
        group: 'Coding exercises',
        label: 'First-order optimization: Robbins-Monro (runs in the browser)',
        url: exercise(1, 'cx_robbins-monro.html'),
      },
      {
        group: 'Coding exercises',
        label: 'First-order optimization: house price prediction (runs in the browser)',
        url: exercise(1, 'cx_house-pricing-game.html'),
      },
      {
        group: 'Coding exercises',
        label: 'Gradient descent: grasshopper game (runs in the browser)',
        url: exercise(1, 'cx_grasshopper.html'),
      },
      {
        group: 'Coding exercises',
        label: 'Neural networks: forward pass and universal approximation (Colab notebook)',
        url: colab('w1-cx-public', 'universal-approximation/universal_approximation.ipynb'),
      },
      {
        group: 'Coding exercises',
        label: 'Claude Code: Operation Midnight Launch (notebook, runs locally)',
        url: exercise(1, 'operation-midnight-launch.ipynb'),
      },
      {
        group: 'Coding exercises',
        label: 'Iris PyTorch (Colab notebook)',
        url: colab('w1-cx-public', 'iris-pytorch/iris_pytorch.ipynb'),
      },
      {
        group: 'Coding exercises',
        label: 'Neural networks with PyTorch: property valuation (Colab notebook)',
        url: colab('w1-cx-public', 'cx-nn/nn_base_exercise.ipynb'),
      },
      { group: 'Coding exercises', label: 'Overfitting, validation and regularization', url: SOON },
      {
        group: 'Setup',
        label: 'Setting up Claude Code: VS Code, a terminal, and your licence',
        url: guide('claude-code-setup.html'),
      },
      {
        group: 'Project',
        label: 'LLM routing: project description',
        url: deck(1, 'llm-routing-project.pdf'),
      },
      {
        group: 'Project',
        label: 'LLM routing: RelayAI student notebook (Colab notebook)',
        url: colab('w1-project-public', 'project1_RelayAI_student.ipynb'),
      },
      {
        group: 'Project',
        label: 'RelayAI Router Explorer: the app, to unpack and run on your own laptop',
        url: app(1, 'relayai-router-explorer.zip'),
      },
      {
        group: 'Project',
        label: 'RelayAI Router Explorer: installation guide, macOS and Windows',
        url: guide('relayai-installation-guide.pdf'),
      },
      { group: 'Project', label: 'LLM routing: grading scheme', url: SOON },
    ],
  },
  {
    id: 'we2',
    number: 2,
    // Renamed by Carlos on 2026-09-03, from 'Language Models and Agents'.
    title: 'Large Language Models and Their Applications in AI',
    theme: 'Autoencoders, attention, transformers and agentic AI',
    dates: '18–19 September 2026',
    startISO: '2026-09-18',
    fridayRoom: 'HG D 7.2',
    saturdayRoom: 'HG D 7.2',
    project: 'Tax agent',
    summary:
      'Friday assembles the transformer piece by piece, starting from autoencoders and attention rather than presenting the finished architecture. Saturday moves on to agentic AI, with a guest lecture and practical exercises.',
    friday: [
      {
        time: '08:15',
        title: 'Autoencoders',
        type: 'lecture',
        // The block opens with the yogurt cup game, played in pairs on two
        // laptops: the room invents an autoencoder before anyone says the
        // word. Copied on 2026-09-15 from w2-lecture-material/autoencoders/
        // yogurt-cup-game/web/, plus the catalogue and card SVGs from its
        // build/, so the "printed catalogues and cards" page resolves.
        //
        // The HS26 deck and the notebook it walks through went up on
        // 2026-09-16, on Carlos's instruction, before the lecture. The deck is
        // w2-lecture-material/autoencoders/autoencoders-deck/
        // autoencoders-slides.pdf, copied here under a shorter name. The
        // notebook is byte for byte the file every listing of its section 4 is
        // copied from, hosted in w2-cx-public like the weekend-1 Iris notebook.
        // The 09:00 exercise below is a separate thing and is still to come.
        //
        // The weekend's cold open comes first, as on weekend 1: two slides,
        // Wittgenstein's language games and the weekend's agenda, projected in
        // front of the autoencoders deck. It is w2-lecture-material/cold-intro/
        // slides.pdf, copied here on 2026-09-17 on Carlos's instruction.
        //
        // "Annotated" is the deck as Carlos wrote on it in the lecture, an iPad
        // export handed over on 2026-09-19, right after the deck it annotates,
        // as on weekend 1. The cold open has no such chip: its export carries
        // no ink. See the note on the Materials list below.
        links: [
          { label: 'Cold open', url: deck(2, 'cold-open.pdf') },
          { label: 'Slides', url: deck(2, 'autoencoders.pdf') },
          { label: 'Annotated', url: deck(2, 'autoencoders-annotated.pdf') },
          { label: 'Yogurt cup game', url: viz(2, 'yogurt-cups') },
          {
            label: 'Notebook',
            url: colab('w2-cx-public', 'autoencoders-basic/autoencoders_basic.ipynb'),
          },
        ],
      },
      {
        time: '09:00',
        title: 'Autoencoders',
        type: 'exercise',
        // autoencoder/cx-autoencoder.ipynb in the public w2-cx-public, linked
        // not copied, like the attention exercise. NOT the same notebook as
        // the lecture's autoencoders-basic/autoencoders_basic.ipynb above: the
        // two folders are a letter apart and this is the exercise of the pair.
        links: [
          {
            label: 'Notebook',
            url: colab('w2-cx-public', 'autoencoder/cx-autoencoder.ipynb'),
          },
        ],
      },
      {
        time: '10:00',
        title: 'Attention',
        type: 'lecture',
        // The attention mechanism worked out on the Wuggish sentence, twice: a
        // first pass that divides each row of inner products by its sum, and
        // the real softmax. Copied on 2026-09-16 from w2-lecture-material/
        // attention-walkthrough/ (the page files, css, js, data and vendored
        // fonts only). Carlos asked for them to go up that day, before the
        // lecture, which he chose over the weekend's spoiler rule when asked.
        // The deck followed the same day, on his instruction: attention.pdf is
        // w2-lecture-material/attention-deck/attention-slides.pdf, copied.
        //
        // The Wuggish game is the cold open for this block, copied on
        // 2026-09-17 from w2-lecture-material/attention-game/ (index.html,
        // css, js and data; not its dev, precompute or images folders, which
        // the page never loads). The room learns eight words of a made-up
        // sister language of English from pictures, then decodes scrambled
        // bags of them, and only the reveal at the end says that binding a
        // word to a thing is attention. It goes up named, like the decks: the
        // topic is public already and this row is called Attention.
        //
        // ?dev=0 hides the fast-forward button, which jumps straight to the
        // reveal with the game counted as solved. It is on by default so the
        // lecturer can rehearse the reveal without playing 18 items; a
        // participant who finds it skips the whole point of the block. Keep
        // the query on both links.
        links: [
          { label: 'Slides', url: deck(2, 'attention.pdf') },
          { label: 'Annotated', url: deck(2, 'attention-annotated.pdf') },
          { label: 'Wuggish attention game', url: `${viz(2, 'wuggish')}?dev=0` },
          { label: 'Walkthrough, simple normalization', url: viz(2, 'attention-walkthrough', 'normalized.html') },
          { label: 'Walkthrough, softmax', url: viz(2, 'attention-walkthrough', 'softmax.html') },
        ],
      },
      { time: '10:30', title: 'Coffee break at Polysnack, until 11:00', type: 'break' },
      {
        time: '11:00',
        title: 'Attention',
        type: 'exercise',
        // attention/cx_attention.ipynb in the public w2-cx-public, linked
        // rather than copied, so the TA's edits reach the room without a
        // deploy here. Opened through colab() like every other exercise
        // notebook: GitHub's own viewer would only show it, not run it.
        links: [
          {
            label: 'Notebook',
            url: colab('w2-cx-public', 'attention/cx_attention.ipynb'),
          },
        ],
      },
      { time: '12:00', title: 'Lab session', type: 'lab' },
      { time: '13:00', title: 'Lunch break at Polysnack, until 14:00', type: 'break' },
      {
        time: '14:00',
        title: 'Transformers',
        type: 'lecture',
        // Published 2026-09-16 on Carlos's instruction. transformers.pdf is
        // w2-lecture-material/attention-deck/transformer-slides.pdf, copied:
        // the second half of the FS26 attention deck, split off as its own deck
        // that day so each lecture row carries one.
        links: [
          { label: 'Slides', url: deck(2, 'transformers.pdf') },
          { label: 'Annotated', url: deck(2, 'transformers-annotated.pdf') },
        ],
      },
      { time: '15:30', title: 'Coffee break at Polysnack, until 16:00', type: 'break' },
      {
        time: '16:00',
        title: 'Agentic AI, part 1: From LLMs to reasoning models',
        type: 'lecture',
        // agentic-ai-part1-llms-to-reasoning/agentic-ai-part1-slides.pdf in the
        // private w2-lecture-material, copied here on 2026-09-17.
        links: [
          { label: 'Slides', url: deck(2, 'agentic-ai-part1.pdf') },
          { label: 'Annotated', url: deck(2, 'agentic-ai-part1-annotated.pdf') },
        ],
      },
    ],
    saturday: [
      {
        time: '08:15',
        title: 'Agentic AI, part 2: Agents',
        type: 'lecture',
        // agentic-ai-part2-agents/agentic-ai-part2-slides.pdf, copied 2026-09-17.
        // Its last content frame prints the spy game's QR code.
        links: [{ label: 'Slides', url: deck(2, 'agentic-ai-part2.pdf') }],
      },
      {
        time: '09:00',
        title: 'Agentic AI',
        type: 'exercise',
        // The Hidden Layer, ported to OpenRouter keys (Colab secret
        // OPENROUTER_API_KEY), published in w2-cx-public/spy-game/.
        // The browser game (no install, key pasted into the page) is the primary
        // link since 2026-09-17; the Colab notebook stays as a fallback.
        links: [
          { label: 'Spy game', url: viz(2, 'spy-game') },
          {
            label: 'Colab notebook',
            url: colab('w2-cx-public', 'fridge-chef/fridge_chef.ipynb'),
          },
        ],
      },
      {
        time: '10:00',
        title: 'Coffee break in the foyer outside the classroom (HG\u00a0D30.0075), until 10:30',
        type: 'break',
      },
      {
        time: '10:30',
        title: 'Guest lecture: Christophe Makni',
        type: 'lecture',
        // The speaker's own deck, "Agentic AI in practice: Lessons learned for
        // Leaders", 37 pages, copied byte for byte on 2026-09-19 on Carlos's
        // instruction from "Agentic AI and Data for Leaders 19-sep-2026
        // final.pdf". It is not ours, so no repository holds a source to
        // recopy from. Page 6 is a black box in the PDF: the talk plays a
        // video there, and the export kept only a placeholder.
        //
        // The name was "Christopher" here and in the master spreadsheet until
        // that day. The deck spells it Christophe on every page.
        links: [{ label: 'Slides', url: deck(2, 'agentic-ai-in-practice.pdf') }],
      },
      { time: '11:00', title: 'Guest lecture continues', type: 'lecture' },
      {
        time: '12:00',
        title: 'Project intro: Tax agent',
        type: 'project',
        // Same split as weekend 1. The notebook OPENS IN COLAB, which reads
        // w2-project-public directly, so there is nothing to copy and nothing
        // to go stale. Everything else is a copy served from this site,
        // because <a download> is same-origin only: a raw() PDF would open in
        // GitHub's viewer, and raw() hands .html back as text/plain, so the
        // field guide would be read as source instead of used. Re-export the
        // deck, the field guide and the app zip when they change upstream in
        // w2-project-public.
        links: [
          { label: 'Slides', url: deck(2, 'tax-agent-project.pdf') },
          {
            label: 'Project Notebook',
            url: colab('w2-project-public', 'project2_agentic_tax_filler_student.ipynb'),
          },
          { label: 'Field guide', url: exercise(2, 'tax-agent-field-guide.html') },
          { label: 'App', url: app(2, 'agentekki-demo.zip') },
        ],
      },
    ],
    resources: [
      // Each annotated copy sits directly under the deck it annotates, as on
      // weekend 1. They are Carlos's iPad exports of 2026-09-19, copied from
      // w2-lecture-material/annotated/, and their embedded fonts are damaged
      // the same way, so the clean deck stays the primary link above each one.
      // Their extra pages are sheets he inserted to write on.
      //
      // The cold open and part 2 have no annotated copy here: both exports
      // carry no ink, and the cold open's still misspells the guest's name.
      // See ../w2-lecture-material/annotated/CLAUDE.md.
      { group: 'Lecture slides', label: 'The cold open', url: deck(2, 'cold-open.pdf') },
      { group: 'Lecture slides', label: 'Autoencoders', url: deck(2, 'autoencoders.pdf') },
      {
        group: 'Lecture slides',
        label: 'Autoencoders, annotated in the lecture',
        url: deck(2, 'autoencoders-annotated.pdf'),
      },
      { group: 'Lecture slides', label: 'Attention', url: deck(2, 'attention.pdf') },
      {
        group: 'Lecture slides',
        label: 'Attention, annotated in the lecture',
        url: deck(2, 'attention-annotated.pdf'),
      },
      { group: 'Lecture slides', label: 'Transformers', url: deck(2, 'transformers.pdf') },
      {
        group: 'Lecture slides',
        label: 'Transformers, annotated in the lecture',
        url: deck(2, 'transformers-annotated.pdf'),
      },
      {
        group: 'Lecture slides',
        label: 'Agentic AI, part 1: From LLMs to reasoning models',
        url: deck(2, 'agentic-ai-part1.pdf'),
      },
      {
        group: 'Lecture slides',
        label: 'Agentic AI, part 1: From LLMs to reasoning models, annotated in the lecture',
        url: deck(2, 'agentic-ai-part1-annotated.pdf'),
      },
      {
        group: 'Lecture slides',
        label: 'Agentic AI, part 2: Agents',
        url: deck(2, 'agentic-ai-part2.pdf'),
      },
      {
        group: 'Lecture slides',
        label: 'Guest lecture: Agentic AI in practice, by Christophe Makni',
        url: deck(2, 'agentic-ai-in-practice.pdf'),
      },
      {
        group: 'Visualizations',
        label: 'The yogurt cup game: invent an autoencoder in pairs (Friday, autoencoders)',
        url: viz(2, 'yogurt-cups'),
      },
      {
        group: 'Visualizations',
        label: 'The Wuggish attention game: bind the words yourself (Friday, attention)',
        url: `${viz(2, 'wuggish')}?dev=0`,
      },
      {
        group: 'Visualizations',
        label: 'The attention mechanism worked out, with a simple normalization (Friday, attention)',
        url: viz(2, 'attention-walkthrough', 'normalized.html'),
      },
      {
        group: 'Visualizations',
        label: 'The attention mechanism worked out, with the softmax (Friday, attention)',
        url: viz(2, 'attention-walkthrough', 'softmax.html'),
      },
      {
        group: 'Coding exercises',
        label: 'Autoencoders in PyTorch: the notebook from the lecture (Colab notebook)',
        url: colab('w2-cx-public', 'autoencoders-basic/autoencoders_basic.ipynb'),
      },
      {
        group: 'Coding exercises',
        label: 'Autoencoders (Colab notebook)',
        url: colab('w2-cx-public', 'autoencoder/cx-autoencoder.ipynb'),
      },
      {
        group: 'Coding exercises',
        label: 'Attention (Colab notebook)',
        url: colab('w2-cx-public', 'attention/cx_attention.ipynb'),
      },
      { group: 'Coding exercises', label: 'Transformers', url: SOON },
      {
        group: 'Coding exercises',
        label: 'Agentic AI: The Hidden Layer spy game in your browser, no install (bring your OpenRouter key)',
        url: viz(2, 'spy-game'),
      },
      {
        group: 'Coding exercises',
        label: 'Agentic AI: The Hidden Layer spy game, micro mission (Colab notebook, OpenRouter key)',
        url: colab('w2-cx-public', 'spy-game/the_hidden_layer_micro_mission.ipynb'),
      },
      {
        group: 'Coding exercises',
        label: 'Agentic AI: The Hidden Layer spy game, training mission (Colab notebook)',
        url: colab('w2-cx-public', 'spy-game/the_hidden_layer_training_mission.ipynb'),
      },
      {
        group: 'Coding exercises',
        label: 'Agentic AI: The Hidden Layer spy game, full mission (Colab notebook)',
        url: colab('w2-cx-public', 'spy-game/the_hidden_layer_full_mission.ipynb'),
      },
      { group: 'Project', label: 'Tax agent: project description', url: SOON },
      {
        group: 'Project',
        label: 'Tax agent: project intro slides',
        url: deck(2, 'tax-agent-project.pdf'),
      },
      {
        group: 'Project',
        label: 'Tax agent: AgenTekki student notebook (Colab notebook)',
        url: colab('w2-project-public', 'project2_agentic_tax_filler_student.ipynb'),
      },
      {
        group: 'Project',
        label: 'Tax agent: field guide, the plain-language companion to the notebook',
        url: exercise(2, 'tax-agent-field-guide.html'),
      },
      {
        group: 'Project',
        label: 'AgenTekki: the demo app, to unpack and run on your own laptop',
        url: app(2, 'agentekki-demo.zip'),
      },
      {
        group: 'Project',
        label: 'AgenTekki: the demo app, walkthrough slides',
        url: deck(2, 'tax-agent-demo-app.pdf'),
      },
      { group: 'Project', label: 'Tax agent: grading scheme', url: SOON },
    ],
  },
  {
    id: 'we3',
    number: 3,
    // Renamed by Carlos on 2026-09-03, from 'Computer Vision'.
    title: 'Models for Visual AI Applications',
    theme: 'Convolutional networks, UNets and diffusion',
    dates: '2–3 October 2026',
    startISO: '2026-10-02',
    fridayRoom: 'HG D 7.2',
    saturdayRoom: 'HG D 7.2',
    project: 'Fashion magazine editor',
    summary:
      'Two days on models that work on images. Friday covers convolutional networks and UNets and gets them running in PyTorch; Saturday moves on to diffusion models and CLIP.',
    friday: [
      {
        time: '08:15',
        title: 'Convolutional neural networks',
        type: 'lecture',
        // The weekend's cold open comes first, as on weekends 1 and 2: Leonardo
        // da Vinci, four excerpts of his Trattato della pittura, one for each
        // topic of the weekend, then the agenda, projected in front of the
        // first CNN lecture. It is w3-lecture-material/cold-intro-leonardo/
        // slides.pdf, copied here on 2026-10-02 on Carlos's instruction, and a
        // change there must be recopied here. The Haeckel version in
        // ../w3-lecture-material/cold-intro/ is not published.
        //
        // Every "Slides" chip this weekend is one of Carlos's FS26 PowerPoint
        // decks, re-dated for this weekend and exported by PowerPoint, from
        // w3-lecture-material/pptx-decks/, numbered in teaching order. They
        // replaced the Beamer translations on 2026-10-01, on his instruction.
        //
        // "Convolutional filters" is the part of this lecture he works out by
        // hand, his sheets 7 to 11, rebuilt as a deck on 2026-10-01 because
        // the handwritten arithmetic was wrong.
        //
        // The three walkthroughs are the same four frames with room to work
        // them out in the room, one page per sheet: tiles (sheet 7), crosses
        // with pooling (sheets 8 and 11), activations (sheets 9 and 10).
        // Copied on 2026-10-01, on Carlos's instruction, from
        // w3-lecture-material/convolution-walkthrough/ (the four pages, css,
        // js, data and vendored fonts only; not its dev or precompute
        // folders). A change there must be recopied here.
        //
        // "CNN deep dive" is the SML course's own visualization of the same
        // material, from a single filter up to receptive fields. It is linked,
        // not copied, see SML_CNN_DEEPDIVE.
        links: [
          { label: 'Cold open', url: deck(3, 'cold-open.pdf') },
          { label: 'Slides', url: deck(3, 'w3_1_intro_cnn.pdf') },
          { label: 'Annotated', url: deck(3, 'w3_1_intro_cnn-annotated.pdf') },
          { label: 'Convolutional filters', url: deck(3, 'convolutional-filters.pdf') },
          { label: 'Walkthrough, tiles', url: viz(3, 'convolution-walkthrough', 'tiles.html') },
          { label: 'Walkthrough, crosses and pooling', url: viz(3, 'convolution-walkthrough', 'crosses.html') },
          { label: 'Walkthrough, activations', url: viz(3, 'convolution-walkthrough', 'activations.html') },
          { label: 'CNN deep dive', url: SML_CNN_DEEPDIVE },
        ],
      },
      {
        time: '09:00',
        title: 'Tetris games',
        type: 'exercise',
        // Five browser games, played in order, each starting where the last one
        // ran into trouble: filters, layers, pooling, training, CNN vs fully
        // connected. Copied from w3-cx-public/tetris-games/ (the six pages
        // only, not its CLAUDE.md), so recopy when the TA edits them there.
        // The pages link each other and the index by relative path, so keep
        // them together in one folder. One chip to the games' own index page,
        // which lists the five in order, rather than a chip per game.
        links: [{ label: 'Play games', url: exercise(3, 'tetris-games/index.html') }],
      },
      {
        time: '10:00',
        title: 'Convolutional neural networks',
        type: 'lecture',
        // The whole FS26 CNN deck: its first 36 slides are the 08:15 deck, and
        // this hour starts at slide 37 (softmax, loss, training, validation).
        links: [{ label: 'Slides', url: deck(3, 'w3_2_cnn.pdf') }],
      },
      { time: '10:30', title: 'Coffee break at Dozentenfoyer, until 11:00', type: 'break' },
      {
        time: '11:00',
        title: 'CNNs in PyTorch',
        type: 'exercise',
        // Only on the cnn branch of w3-cx-public so far, not on main.
        links: [{ label: 'Colab notebook', url: colab('w3-cx-public', 'w3_cx_cnn.ipynb', 'cnn') }],
      },
      { time: '12:00', title: 'Lab session', type: 'lab' },
      { time: '13:00', title: 'Lunch break at Dozentenfoyer, until 14:00', type: 'break' },
      {
        time: '14:00',
        title: 'UNets',
        type: 'lecture',
        // One deck for both UNet blocks, this one and 16:00, and the SML
        // course's U-Net deep dive hangs on both rows the same way. It is
        // linked, not copied, see SML_UNET_DEEPDIVE.
        links: [
          { label: 'Slides', url: deck(3, 'w3_3_unet.pdf') },
          { label: 'Annotated', url: deck(3, 'w3_3_unet-annotated.pdf') },
          { label: 'U-Net deep dive', url: SML_UNET_DEEPDIVE },
        ],
      },
      {
        time: '14:30',
        title: 'UNets',
        type: 'exercise',
        links: [{ label: 'Colab notebook', url: colab('w3-cx-public', 'unet/w3_cx_unet.ipynb') }],
      },
      {
        time: '15:30',
        title: 'Coffee break in the foyer outside the classroom (HG\u00a0D30.0075), until 16:00',
        type: 'break',
      },
      {
        time: '16:00',
        title: 'UNets',
        type: 'lecture',
        links: [
          { label: 'Slides', url: deck(3, 'w3_3_unet.pdf') },
          { label: 'Annotated', url: deck(3, 'w3_3_unet-annotated.pdf') },
          { label: 'U-Net deep dive', url: SML_UNET_DEEPDIVE },
        ],
      },
    ],
    saturday: [
      {
        time: '08:15',
        title: 'Diffusion',
        type: 'lecture',
        links: [
          { label: 'Slides', url: deck(3, 'w3_4_diffusion.pdf') },
          { label: 'Annotated', url: deck(3, 'w3_4_diffusion-annotated.pdf') },
        ],
      },
      {
        time: '09:00',
        title: 'Diffusion',
        type: 'exercise',
        links: [{ label: 'Colab notebook', url: colab('w3-cx-public', 'diffusion/w3_cx_diffusion.ipynb') }],
      },
      {
        time: '10:00',
        title: 'Coffee break in the foyer outside the classroom (HG\u00a0D30.0075), until 10:30',
        type: 'break',
      },
      {
        time: '10:30',
        title: 'CLIP',
        type: 'lecture',
        links: [
          { label: 'Slides', url: deck(3, 'w3_5_clip.pdf') },
          { label: 'Annotated', url: deck(3, 'w3_5_clip-annotated.pdf') },
        ],
      },
      {
        time: '11:00',
        title: 'CLIP',
        type: 'exercise',
        links: [{ label: 'Colab notebook', url: colab('w3-cx-public', 'clip/cx_clip_w3.ipynb') }],
      },
      {
        time: '12:00',
        title: 'Project intro: Fashion magazine editor and warehouse manager',
        type: 'project',
        // Same split as weekends 1 and 2. The notebook OPENS IN COLAB, which
        // reads w3-project-public directly, so there is nothing to copy and
        // nothing to go stale. The deck downloads, so it is a copy served from
        // this site: w3-project-public/Project3_Fashion_Magazine_Editor.pdf,
        // copied on 2026-10-03. Re-copy it when it changes upstream. The
        // warehouse deck is the same kind of copy, from
        // w3-cv-new-projects-public/week3/project1/slides/warehouse_inspector_slides.pdf
        // (commit 44a3380d, 23 slides), copied on 2026-10-13.
        //
        // The app zip is built from w3-project-public/fashion_app with only
        // what the Flask app reads (backend, templates, requirements.txt and
        // five Data files) under Fashion-Magazine-Editor/app/, beside
        // "Installation Guide.pdf", the same file as the guide chip. Both are
        // copies, so rebuild them together when the app changes upstream.
        links: [
          { label: 'Slides: Fashion magazine', url: deck(3, 'fashion-magazine-editor-project.pdf') },
          { label: 'Slides: Warehouse manager', url: deck(3, 'warehouse-inspector-project.pdf') },
          {
            label: 'Project Notebook: Fashion magazine',
            url: colab('w3-project-public', 'notebook/project_fashion_magazine_handout.ipynb'),
          },
          // The second project of the weekend, "Recycling Warehouse: Automated
          // Tile Inspection", opened in Colab from its own public repo like the
          // first. Labelled "Warehouse manager" as the teaching team names it.
          {
            label: 'Project Notebook: Warehouse manager',
            url: colab('w3-cv-new-projects-public', 'week3/project1/notebook.ipynb'),
          },
          { label: 'App', url: app(3, 'fashion-magazine-editor.zip') },
          {
            label: 'App installation guide',
            url: guide('fashion-magazine-installation-guide.pdf'),
          },
        ],
      },
    ],
    resources: [
      { group: 'Lecture slides', label: 'The cold open', url: deck(3, 'cold-open.pdf') },
      { group: 'Lecture slides', label: 'Convolutional neural networks, part 1', url: deck(3, 'w3_1_intro_cnn.pdf') },
      { group: 'Lecture slides', label: 'Convolutional filters', url: deck(3, 'convolutional-filters.pdf') },
      {
        group: 'Lecture slides',
        label: 'Convolutional neural networks, part 2 (repeats part 1, then training from slide 37)',
        url: deck(3, 'w3_2_cnn.pdf'),
      },
      { group: 'Lecture slides', label: 'UNets', url: deck(3, 'w3_3_unet.pdf') },
      { group: 'Lecture slides', label: 'Diffusion models', url: deck(3, 'w3_4_diffusion.pdf') },
      { group: 'Lecture slides', label: 'CLIP', url: deck(3, 'w3_5_clip.pdf') },
      {
        group: 'Visualizations',
        label: 'Decomposing an image into tiles (Friday, convolutional filters)',
        url: viz(3, 'convolution-walkthrough', 'tiles.html'),
      },
      {
        group: 'Visualizations',
        label: 'Recognizing islands that look like a cross, with pooling (Friday, convolutional filters)',
        url: viz(3, 'convolution-walkthrough', 'crosses.html'),
      },
      {
        group: 'Visualizations',
        label: 'How to compute activations (Friday, convolutional filters)',
        url: viz(3, 'convolution-walkthrough', 'activations.html'),
      },
      {
        group: 'Visualizations',
        label: 'Convolutional networks: a deep dive (Friday, from the SML course)',
        url: SML_CNN_DEEPDIVE,
      },
      {
        group: 'Visualizations',
        label: 'U-Net: a deep dive (Friday, from the SML course)',
        url: SML_UNET_DEEPDIVE,
      },
      {
        group: 'Coding exercises',
        label: 'Tetris games: five games on how a CNN sees, played in order (runs in the browser)',
        url: exercise(3, 'tetris-games/index.html'),
      },
      {
        group: 'Coding exercises',
        label: 'CNNs in PyTorch (Colab notebook)',
        url: colab('w3-cx-public', 'w3_cx_cnn.ipynb', 'cnn'),
      },
      {
        group: 'Coding exercises',
        label: 'UNets (Colab notebook)',
        url: colab('w3-cx-public', 'unet/w3_cx_unet.ipynb'),
      },
      {
        group: 'Coding exercises',
        label: 'Diffusion (Colab notebook)',
        url: colab('w3-cx-public', 'diffusion/w3_cx_diffusion.ipynb'),
      },
      {
        group: 'Coding exercises',
        label: 'CLIP (Colab notebook)',
        url: colab('w3-cx-public', 'clip/cx_clip_w3.ipynb'),
      },
      { group: 'Project', label: 'Fashion magazine editor: project description', url: SOON },
      { group: 'Project', label: 'Fashion magazine editor: grading scheme', url: SOON },
    ],
  },
  {
    id: 'we4',
    number: 4,
    // Renamed by Carlos on 2026-09-03, from 'Geometry of Generative Models'.
    title: 'Riemannian Geometry and Its Applications in AI',
    theme: 'Manifolds, variational autoencoders and adversarial robustness',
    dates: '23–24 October 2026',
    startISO: '2026-10-23',
    fridayRoom: 'HG D 7.2',
    saturdayRoom: 'HG D 7.2',
    project: 'Deepfake detection and generation',
    summary:
      'The closing weekend looks at what a latent space is shaped like: manifolds, variational autoencoders and stable diffusion, then the future of AI. Saturday turns to adversarial attacks, attacks on LLMs and the deepfake project.',
    // "An atlas of the weekend's models", shown just before the agenda on
    // Carlos's word of 2026-10-22 ("post it on the website just before the
    // weekend agenda"): w4-lecture-material/atlas-deck/, two frames, the six
    // models of the weekend on one chart, then when to use which. Its two-page
    // handout is copied as slides/we4/atlas.pdf, byte for byte that
    // repository's 9589d86, and its two pages as atlas-1.png and atlas-2.png
    // (pdftoppm -r 220). A rebuild there must be recopied here, see that deck's
    // CLAUDE.md. Also first under Lecture slides.
    overview: {
      title: "An atlas of the weekend's models",
      note: 'Every model of the weekend on one chart, then when to use which. Click a page to open it as a PDF.',
      pages: [
        {
          image: deck(4, 'atlas-1.png'),
          alt: "An atlas of the weekend's models: six models on a chart. Across, what a model does with a picture: reads it into a few numbers (autoencoder, CNN), makes one in one jump (VAE, conditional VAE), or makes one in many small steps (diffusion, conditional diffusion). Down, what its training needs: pictures only, or pictures with their labels.",
          url: `${deck(4, 'atlas.pdf')}#page=1`,
        },
        {
          image: deck(4, 'atlas-2.png'),
          alt: 'Which one, when? A table of the six models: when to use each, when not to, its pros and its cons.',
          url: `${deck(4, 'atlas.pdf')}#page=2`,
        },
      ],
    },
    friday: [
      // THE MORNING, on Carlos's word of the evening of 2026-10-22: the 08:15
      // lecture "Manifolds and VAEs" became five blocks, manifolds 08:15, the
      // coding exercises on prediction 08:45, the manifold games 09:15,
      // variational autoencoders 09:45 and conditional VAEs 10:15, a quarter
      // of an hour, before the 10:30 coffee; the prediction block and the games
      // swapped places on his word of the same night. Each link sits in the
      // block whose topic it shows: the Manifold Explorer with the manifold
      // games, the grasshoppers with prediction, the Sunrise Machine, a VAE,
      // with the VAEs.
      {
        time: '08:15',
        title: 'Manifolds',
        type: 'lecture',
        // "Slides: Manifolds" is the manifold half of the lecture, the deck
        // w4-lecture-material/manifolds-deck/manifolds-slides.pdf (29 frames
        // over 120 pages), copied on Carlos's word of 2026-10-22 ("Publish the
        // slides"), byte for byte that repository's commit 0dad959. A rebuild
        // there must be recopied here.
        //
        // The weekend's cold open comes first, as on weekends 1 to 3: Strabo,
        // six excerpts of his Geography in H. L. Jones's English (Loeb, 1917) on
        // why a map of the land pays off and how to draw one, then two slides on
        // John Snow's map of the 1854 cholera deaths around the Broad Street
        // pump, then the weekend's agenda. It is
        // w4-lecture-material/cold-intro/slides-strabo.pdf, copied here on
        // Carlos's word of 2026-10-23 ("Publish it"), byte for byte that
        // repository's commit eaed6d3; a change there must be recopied here. The
        // Ovid and Riemann version, cold-intro/slides.pdf, is not published.
        links: [
          {
            label: 'Cold open',
            url: deck(4, 'cold-open.pdf'),
            description:
              'Strabo, the Greek geographer, on why a map of the land pays off, in six excerpts of his Geography; then John Snow, whose map of the 1854 cholera deaths in London pointed at one water pump; then the weekend at a glance.',
          },
          {
            label: 'Slides: Manifolds',
            url: deck(4, 'manifolds.pdf'),
            description:
              'From one photo of a sunrise to the idea of a manifold: pictures that change in only a few ways lie on a surface, and a chart gives every picture its few coordinates. Ends with a cylinder, a torus, a Klein bottle and a projective plane folded from their charts.',
          },
        ],
      },
      {
        time: '08:45',
        title: 'Predicting from a photo',
        type: 'exercise',
        // The coding exercises on prediction, in Carlos's words, titled after the
        // manifolds deck's frame 4, "Predicting from a photo": one photo of a
        // sunrise and what to predict from it.
        //
        // "Two grasshoppers fit a line" is the click-through of the lecture's
        // grasshopper frames, page 8 of Carlos's manifold notes: the room types
        // a start for w and b, and every step of an iteration is a click. A copy
        // of w4-lecture-material/grasshopper-regression/ (the page, css, js,
        // data and vendored fonts only; not its dev or precompute folders),
        // published on Carlos's word of 2026-10-21. A change there must be
        // recopied here. It is no chip of its own here: on Carlos's word of
        // 2026-10-22, since it showed twice, it is only the reference of "Two
        // grasshoppers, in Python", attached to that exercise's chip.
        //
        // The notebooks named below are entries of `exercises`, at the end of
        // this weekend, ranked by difficulty with their worked examples.
        //
        // "Grasshoppers, exercise" is the same gradient descent as a Colab
        // exercise, asked for by Carlos on 2026-10-22: average_loss(w, b) on the
        // three sunrise photos, then the grasshoppers' loop (hop, slope, jump),
        // three tasks marked with a target sign, each with a folded hint, and the
        // page's numbers. Linked, not copied, from
        // w4-cx-public/grasshopper-gradient-descent/ (master in
        // w4-cx-private/grasshopper-gradient-descent/); the complete notebook,
        // grasshopper_gradient_descent_solutions.ipynb, is in w4-cx-public too,
        // listed in its SOLUTIONS.md and NOT linked here, on Carlos's standing rule
        // of 2026-10-22 ("Only publish the exercises to the website").
        //
        // "Sunrise time of day estimator" and its worked example "Sunrise season
        // classifier", names Carlos gave them on 2026-10-22, are the two sunrise
        // CNN notebooks of the deck's opening question, one photo of a sunrise
        // and two predictions (frame 4, "Predicting from a photo"): a worked
        // example, a small CNN that tells the season, and an exercise, the same
        // network told to predict the time of the day, five tasks marked with a
        // target sign (the optimizer among them, on his word of the same day),
        // each with a folded hint. Both draw the
        // Sunrise Machine's pictures. Linked, not copied, from
        // w4-cx-public/sunrise-cnn/; the complete notebook, the exercise with
        // its answers, sunrise_time_regression_solutions.ipynb, is in
        // w4-cx-public too since the same day (9a333a5, on Carlos's standing
        // rule), listed in its SOLUTIONS.md and NOT linked here. Put on the
        // site on Carlos's word of 2026-10-22.
      },
      {
        time: '09:15',
        title: 'Manifold games',
        type: 'exercise',
        // The teaching assistants add their manifold games here, beside the
        // Manifold Explorer, which Carlos moved here from the Manifolds block on
        // 2026-10-22. A game in the browser goes in as a link with a
        // `description`, and shows in the colour of the visualizations; a Colab
        // exercise goes in the weekend's `exercises` instead, with time '09:15',
        // a level and a rank.
        //
        // "Manifold Explorer" is the Manifold Chart Explorer, opened on its first
        // tab. Its "Fold the chart" switch
        // (key F) folds each tab's chart into the surface, the animated
        // version of the deck's folding frames (w4-cx-private 05d9874,
        // w4-cx-public fcc774a). ONE chip, on Carlos's word of 2026-10-22:
        // "Don't put a chip for every manifold in addition to the manifold
        // visualizer", which replaced the four chips, one per fold, that
        // opened it at #fold=cylinder, torus, klein and rp2.
        //
        // The two games of HS26, the Sunrise Machine and the Manifold Explorer,
        // are browser apps copied from w4-cx-public/manifold-games/ (static
        // builds, no Python), so recopy when the TA edits them there. Each folder
        // is self-contained and loads its assets by relative path; the Sunrise
        // Machine pulls TF.js, GSAP, D3 and KaTeX from jsDelivr, so it needs a
        // network connection.
        //
        // The Sunrise Machine is a link of the Variational autoencoders block.
        links: [
          {
            label: 'Manifold Explorer',
            url: exercise(4, 'manifold-games/manifold-explorer/index.html'),
            description:
              'Move on a cylinder, a torus, a Klein bottle and more through their charts, and fold each chart into its surface.',
          },
        ],
      },
      {
        time: '09:45',
        title: 'Variational autoencoders',
        type: 'lecture',
        // "Slides: VAEs" is the VAE half of the lecture, the deck
        // w4-lecture-material/vae-deck/vae-slides.pdf (5 frames over 20 pages),
        // copied on Carlos's word of 2026-10-22 ("Publish the slides on VAE"),
        // byte for byte that repository's commit ee0c592. A rebuild there must
        // be recopied here.
        //
        // "Sunrise Machine" is a VAE trained on synthetic sunrises, one of the
        // two HS26 manifold games, by Frederick Puls (see the 08:45 block).
        //
        // The notebooks named below are entries of `exercises`, at the end of
        // this weekend, ranked by difficulty with their worked examples.
        //
        // "Pufferfish notebook" is the VAE half's live demo: a plain autoencoder
        // on synthetic pufferfish pictures, with sliders on its three numbers.
        // Linked, not copied, from w4-cx-public, the address the VAE deck's QR
        // opens. Since 2026-10-22 that public file is the EXERCISE, three gaps
        // to fill; the complete notebook, pufferfish_autoencoder_solutions.ipynb,
        // is in w4-cx-public too since the same day (8bcb26f, on Carlos's word),
        // listed in its SOLUTIONS.md and NOT linked here. Put on the site on Carlos's
        // word of 2026-10-22. "Worked example" is the exercise's helper beside
        // it in w4-cx-public, pytorch_example.ipynb: a small network on made-up
        // ice cream sales, with the same three kinds of lines the exercise
        // leaves out. Linked on Carlos's word of 2026-10-22.
        //
        // "Pufferfish VAE, after the exercise" is the same fish trained as a
        // variational autoencoder, complete, w4-cx-public/pufferfish-vae/ (master
        // in w4-cx-private): a coding example for after the exercise, since its
        // code gives the exercise's answers away. A demo of `exercises`, so it
        // follows the exercise on this row. On Carlos's word of 2026-10-22.
        links: [
          {
            label: 'Slides: VAEs',
            url: deck(4, 'vae.pdf'),
            description:
              'A picture of a pufferfish is three numbers: where it swims and how puffed up it is. The yogurt-cup game becomes the training of an autoencoder, changing the three numbers by hand draws a new fish, and one slide sums up the variational autoencoder.',
          },
          {
            label: 'Sunrise Machine',
            url: exercise(4, 'manifold-games/sunrise-machine/index.html'),
            description:
              'A VAE trained on synthetic sunrises, in the browser: walk through its code space, decode sunrises live and play Find the Sunrise.',
          },
        ],
      },
      {
        time: '10:15',
        title: 'Conditional VAEs and age progression',
        type: 'lecture',
        // The notebooks named below are entries of `exercises`, at the end of
        // this weekend, ranked by difficulty with their worked examples.
        //
        // "Slides: Conditional VAEs" is the deck "Conditional variational
        // autoencoders", w4-lecture-material/cvae-deck/cvae-slides.pdf (9 frames
        // over 32 pages), built on the 09:45 VAE deck with the apples and oranges
        // notebook as its example, copied on Carlos's word of 2026-10-22
        // ("Publish it"), byte for byte that repository's commit d4f8b8f. A
        // rebuild there must be recopied here.
        //
        // "Apples and oranges notebook" is the lecture's demo: a conditional
        // autoencoder on synthetic apples and oranges, its 16-number code trained
        // twice, without and with a penalty on its length (the stand-in for the
        // KL term), to show which of the two turns an apple into an orange when
        // the label is flipped. Linked, not copied, from w4-cx-public; the master
        // is w4-cx-private/apple-orange-autoencoder/. Put on the site on Carlos's
        // word of 2026-10-22.
        links: [
          {
            label: 'Slides: Conditional VAEs',
            url: deck(4, 'conditional-vae.pdf'),
            description:
              'A new fish, but which one? Telling the autoencoder the label: apples and oranges, the label flipped by hand, why a penalty on the code makes the flip work, and age progression as the application.',
          },
        ],
      },
      { time: '10:30', title: 'Coffee break at Polysnack, until 11:00', type: 'break' },
      // From 11:00 on, the order of the master spreadsheet's Syllabus tab as
      // Carlos left it on the night of 2026-10-21, transcribed on his word of
      // 2026-10-22: stable diffusion moved up from 14:00 to 11:00, its
      // exercise took 14:00 and the conditional VAE exercise moved from 11:00
      // to 14:30, "Future of AI" took the quiz's 16:00, and the cross-attention
      // lecture is no longer in it. The break venues stay the programme
      // office's, see the note at the top of this file.
      {
        time: '11:00',
        title: 'Stable diffusion',
        type: 'lecture',
        // "Slides" is the deck "Diffusion models",
        // w4-lecture-material/stable-diffusion/diffusion-deck/diffusion-slides.pdf
        // (11 slides over 34 pages, built by clicks), copied on Carlos's word of
        // 2026-10-22 ("Publish the slides and notebooks we have created so far"),
        // byte for byte that repository's commit 52a242b. A rebuild there must be
        // recopied here. Its open points are in that deck's README.
        links: [
          {
            label: 'Slides',
            url: deck(4, 'stable-diffusion.pdf'),
            description:
              'How a picture turns into noise step by step, how a UNet learns to guess that noise so that each step can be undone, and how a prompt steers what comes out.',
          },
        ],
      },
      { time: '12:00', title: 'Lab session', type: 'lab' },
      // Moved from Polysnack to the Dozentenfoyer by the programme office's
      // e-mail of 2026-10-22, the day before: a joint lunch with CAS CMC.
      { time: '13:00', title: 'Lunch break at Dozentenfoyer, together with CAS CMC, until 14:00', type: 'break' },
      {
        time: '14:00',
        title: 'Stable diffusion',
        type: 'exercise',
        // Since 2026-10-22 the notebooks this comment names are no longer
        // chips of this row but entries of `exercises`, at the end of this
        // weekend, ranked by difficulty with their worked examples.
        //
        // "Happy and sad diffusion" is a tiny text-to-image diffusion model:
        // 9 x 9 faces whose prompt is one bit, trained in seconds. Linked, not
        // copied, from w4-cx-public, where it is the EXERCISE, five tasks. The
        // complete notebook, happy-sad-diffusion/happy_sad_diffusion_solutions
        // .ipynb, and its extension, happy_sad_diffusion_extension.ipynb (which
        // repeats the exercise's answers), are in w4-cx-public too since
        // 2026-10-22 (8bcb26f), on Carlos's word ("Now, all of them", which
        // replaced his earlier "after the exercise"), listed in its
        // SOLUTIONS.md. The complete notebook is never linked here. The
        // extension is, since the evening of 2026-10-22, with the text
        // embeddings exercise and the tiny stable diffusion, on his word ("put
        // all the notebooks related to this into the slot on coding exercises
        // on stable diffusion"); the same evening the extension and the tiny
        // stable diffusion became exercises, their complete notebooks renamed
        // *_solutions.ipynb, which are never linked here.
        // Put on the site on Carlos's word of 2026-10-22.
      },
      { time: '14:30', title: 'Face aging with your own VAE', type: 'exercise' },
      { time: '15:30', title: 'Coffee break at Polysnack, until 16:00', type: 'break' },
      {
        time: '16:00',
        title: 'Future of AI',
        type: 'lecture',
        // "Slides" is the deck "1,580 AI Authors", the 2024 round of the
        // Expert Survey on Progress in AI (AI Impacts, September 2026),
        // w4-lecture-material/future-of-ai-deck/future-of-ai-slides.pdf (27
        // frames over 83 pages), a port of the CSCS deck
        // cscs-hs26/ai-researchers-survey-slides into the BMAI format, copied on
        // Carlos's word of 2026-10-22 ("Port the slides here into the BMAI
        // format and publish them on the website in the last block of Friday"),
        // byte for byte that repository's commit a383bf4. A rebuild there must
        // be recopied here. The report itself states no licence and is not on
        // the site; the deck links it on the AI Impacts site.
        links: [
          {
            label: 'Slides',
            url: deck(4, 'future-of-ai.pdf'),
            description:
              'What 1,580 AI researchers said in December 2024: when machines could take over tasks and jobs, which milestones they expect when, how good or bad the outcomes could be, and how much safety research matters.',
          },
        ],
      },
    ],
    saturday: [
      { time: '08:15', title: 'Adversarial attacks', type: 'lecture' },
      { time: '09:00', title: 'Adversarial attacks', type: 'exercise' },
      {
        time: '10:00',
        title: 'Coffee break in the foyer outside the classroom (HG\u00a0D30.0075), until 10:30',
        type: 'break',
      },
      // The master spreadsheet, 2026-10-22: attacks on LLMs at 10:30, then the
      // project intro at 11:00, an hour earlier than on weekends 1 to 3, and
      // nothing at 12:00.
      { time: '10:30', title: 'Attacks on LLMs', type: 'lecture' },
      {
        time: '11:00',
        title: 'Project intro: Deepfake detection and generation',
        type: 'project',
        // Same split as weekends 1 to 3: both notebooks OPEN IN COLAB, which
        // reads w4-project-public directly, so there is nothing to copy. The
        // generator comes first because its Step 13 exports the
        // deepfake_imgs.zip the discriminator notebook asks for.
        links: [
          {
            label: 'Deepfake generator notebook',
            url: colab('w4-project-public', 'deepfake_generation/deepfake_generation.ipynb'),
          },
          {
            label: 'Deepfake discriminator notebook',
            url: colab('w4-project-public', 'deepfake_discriminator/deepfake_discriminator_handout.ipynb'),
          },
        ],
      },
      { time: '12:00', title: '', type: 'tba' },
    ],
    resources: [
      { group: 'Lecture slides', label: 'The cold open', url: deck(4, 'cold-open.pdf') },
      {
        group: 'Lecture slides',
        label: "An atlas of the weekend's models: all six on one chart, then when to use which",
        url: deck(4, 'atlas.pdf'),
      },
      { group: 'Lecture slides', label: 'Manifolds', url: deck(4, 'manifolds.pdf') },
      { group: 'Lecture slides', label: 'Variational autoencoders', url: deck(4, 'vae.pdf') },
      { group: 'Lecture slides', label: 'Conditional VAEs and age progression', url: deck(4, 'conditional-vae.pdf') },
      { group: 'Lecture slides', label: 'Stable diffusion', url: deck(4, 'stable-diffusion.pdf') },
      { group: 'Lecture slides', label: 'Future of AI', url: deck(4, 'future-of-ai.pdf') },
      { group: 'Lecture slides', label: 'Adversarial attacks', url: SOON },
      { group: 'Lecture slides', label: 'Attacks on LLMs', url: SOON },
      {
        group: 'Visualizations',
        label: 'Two grasshoppers fit a line: gradient descent on the three sunrise photos, click by click (Friday, predicting from a photo)',
        url: viz(4, 'grasshopper-regression'),
      },
      {
        group: 'Visualizations',
        label: 'Sunrise Machine: a VAE on synthetic sunrises, in the browser (Friday, variational autoencoders)',
        url: exercise(4, 'manifold-games/sunrise-machine/index.html'),
      },
      {
        group: 'Visualizations',
        label: 'Manifold Chart Explorer: 2-D manifolds through their charts, each chart folded into its surface (Friday, manifold games)',
        url: exercise(4, 'manifold-games/manifold-explorer/index.html'),
      },
      { group: 'Project', label: 'Deepfake detection and generation: project description', url: SOON },
      { group: 'Project', label: 'Deepfake detection and generation: grading scheme', url: SOON },
    ],
    // The weekend's coding notebooks, since 2026-10-22 (Carlos: "a
    // rank to each coding exercise in order of difficulty [...] easy and hard",
    // and beside each exercise its reference coding example). A rank is the
    // place in the easiest-first order, the level is easy or hard. The levels
    // as Carlos set them on 2026-10-22: the pufferfish, the sunrise time of day
    // estimator and the grasshoppers in Python easy, the happy and sad faces
    // hard. The text embeddings exercise, added with the stable diffusion
    // slot's other notebooks on his word of the same day, is easy: its hints
    // point at the ice cream example. The BERT extension and the tiny stable
    // diffusion, exercises since that evening, are hard and come last, 6 and 7. A demo is complete and gets no rank. Solutions are never listed here (the standing
    // rule of 2026-10-22: the site links exercises only).
    exercises: [
      {
        day: 'friday',
        time: '09:45',
        title: 'Pufferfish autoencoder',
        summary: 'Three gaps: squeeze a picture of a fish into three numbers and back, then move the numbers with sliders.',
        url: colab('w4-cx-public', 'pufferfish-autoencoder/pufferfish_autoencoder.ipynb'),
        level: 'easy',
        rank: 1,
        reference: {
          label: 'Ice cream sales',
          url: colab('w4-cx-public', 'pufferfish-autoencoder/pytorch_example.ipynb'),
        },
      },
      // The pufferfish as a variational autoencoder, a complete coding example
      // to open AFTER the exercise above, whose answers its code gives away (a
      // warning at its top says so). A demo, so it follows the exercise on the
      // 09:45 row. Put on the site on Carlos's word of 2026-10-22.
      {
        day: 'friday',
        time: '09:45',
        title: 'Pufferfish VAE, after the exercise',
        summary:
          "Open it once the pufferfish exercise is done, since its code holds that exercise's answers: the same fish as a variational autoencoder, whose three sliders, in most runs, each do one thing: move a fish sideways, move it up and down, or puff it up.",
        url: colab('w4-cx-public', 'pufferfish-vae/pufferfish_vae.ipynb'),
        demo: true,
      },
      {
        day: 'friday',
        time: '08:45',
        title: 'Sunrise time of day estimator',
        summary: 'Five tasks: build a small CNN that reads the time of day off a photo of a sunrise.',
        url: colab('w4-cx-public', 'sunrise-cnn/sunrise_time_regression.ipynb'),
        level: 'easy',
        rank: 2,
        reference: {
          label: 'Sunrise season classifier',
          url: colab('w4-cx-public', 'sunrise-cnn/sunrise_season_classifier.ipynb'),
        },
      },
      {
        day: 'friday',
        time: '08:45',
        title: 'Two grasshoppers, in Python',
        summary: 'Three tasks: write the average loss, the two slopes and the two jumps, and the grasshoppers find the line through the three sunrise photos.',
        url: colab('w4-cx-public', 'grasshopper-gradient-descent/grasshopper_gradient_descent.ipynb'),
        level: 'easy',
        rank: 3,
        reference: { label: 'Two grasshoppers fit a line', url: viz(4, 'grasshopper-regression') },
      },
      {
        day: 'friday',
        time: '10:15',
        title: 'Apples and oranges',
        summary: 'Run it, flip the label of a fruit, and see whether an apple turns into an orange.',
        url: colab('w4-cx-public', 'apple-orange-autoencoder/apple_orange_autoencoder.ipynb'),
        demo: true,
      },
      {
        day: 'friday',
        time: '14:00',
        title: 'Happy and sad faces from noise',
        summary: 'Five tasks: a tiny diffusion model draws a happy or a sad face from a one-bit prompt.',
        url: colab('w4-cx-public', 'happy-sad-diffusion/happy_sad_diffusion.ipynb'),
        level: 'hard',
        rank: 8,
        reference: {
          label: 'Ice cream sales',
          url: colab('w4-cx-public', 'pufferfish-autoencoder/pytorch_example.ipynb'),
        },
      },
      // The stable diffusion slot's other notebooks, on Carlos's word of
      // 2026-10-22 ("put all the notebooks related to this into the slot on
      // coding exercises on stable diffusion"): the text embeddings exercise,
      // the BERT extension and the tiny stable diffusion. The last two were
      // complete demos for after the exercises until that evening, when he
      // asked for exercises ("shouldn't they be exercises? Could you do them
      // as exercises if possible?"): each is now an exercise at the same
      // address, whose folded cells hold the earlier exercises' answers, so it
      // comes after them. The solutions (*_solutions.ipynb) stay off the site.
      {
        day: 'friday',
        time: '14:00',
        title: 'Text embeddings from scratch',
        summary:
          'Three tasks: every word gets two numbers of its own, a sentence their average, and a wide network turns it into how happy, sad and surprised the sentence is.',
        url: colab('w4-cx-public', 'text-embeddings/text_embeddings.ipynb'),
        level: 'easy',
        rank: 4,
        reference: {
          label: 'Ice cream sales',
          url: colab('w4-cx-public', 'pufferfish-autoencoder/pytorch_example.ipynb'),
        },
      },
      {
        day: 'friday',
        time: '14:00',
        title: 'Three faces and BERT',
        summary:
          "Five tasks, after the happy and sad exercise, whose answers its folded cells hold: a third face, surprised, and BERT reads a sentence to pick the face to draw.",
        url: colab('w4-cx-public', 'happy-sad-diffusion/happy_sad_diffusion_extension.ipynb'),
        level: 'hard',
        rank: 9,
        reference: {
          label: 'Sunrise season classifier',
          url: colab('w4-cx-public', 'sunrise-cnn/sunrise_season_classifier.ipynb'),
        },
      },
      {
        day: 'friday',
        time: '14:00',
        title: 'A tiny stable diffusion',
        summary:
          'Four tasks, after the three exercises before it: train the denoiser on faces with captions, read by your own frozen text embedder, the way Stable Diffusion is trained, then type a word or a sentence and get its face.',
        url: colab('w4-cx-public', 'tiny-stable-diffusion/tiny_stable_diffusion.ipynb'),
        level: 'hard',
        rank: 10,
      },
      // The real Stable Diffusion, the exercise of Sofi Mousia, a teaching
      // assistant: Stable Diffusion 1.5 through diffusers, with the sampling
      // loop written by the room, ten one-line gaps. It sat on the unmerged
      // branch stableDiff of w4-cx-private (cx4_stable_diffusion.ipynb and
      // cx4_stable_diffusion_sol.ipynb) until she pushed the exercise to the
      // root of w4-cx-public on 2026-10-23, where it is linked. Put on the
      // site on Carlos's word of 2026-10-23 ("a coding exercise on stable
      // diffusion that was done by one of the TAs [...] I'd like to put it on
      // the website"). Its solution stays private, on that branch, on his word
      // of the same day ("publish only the version for the students, not the
      // solution"). Never merge that branch: it deletes vae_sunrises/. Titled
      // just "Stable diffusion" and placed last, rank 9 (11 since the two Saturday
      // exercises joined the list), on his word of the same day ("Can you title
      // it just "Stable diffusion" and put it at the end of the list"); it is
      // marked hard because the list under the schedule shows the easy
      // exercises first and only a hard one can close it.
      {
        day: 'friday',
        time: '14:00',
        title: 'Stable diffusion',
        summary:
          'Ten one-line gaps in the real Stable Diffusion 1.5: write its sampling loop yourself, classifier-free guidance included, decode the result with its VAE, and check your loop against the official pipeline. Runs on a GPU in Colab.',
        url: colab('w4-cx-public', 'cx4_stable_diffusion.ipynb'),
        level: 'hard',
        rank: 11,
      },
      {
        day: 'friday',
        time: '14:30',
        title: 'Face aging: build the VAE of Stable Diffusion',
        summary:
          'Build the VAE of Stable Diffusion yourself, four layers with step-by-step hints, load the official weights into it, then age a face, yours if you upload it, with FADING.',
        url: colab('w4-cx-public', 'face-aging-vae/face_aging_vae.ipynb'),
        level: 'easy',
        rank: 5,
      },
      // The adversarial attacks exercise, built on 2026-10-23 from Carlos's
      // teaching plan for the 08:15 lecture (its master, its plan and its
      // checks are in w4-cx-private/adversarial-cats-dogs/). Put on the site
      // on his word of the same day, the exercise only, as it was; its
      // solution, adversarial_cats_dogs_solutions.ipynb, stays off the site.
      // Easy and the last of the easy ones: twelve lines, each with a hint.
      {
        day: 'saturday',
        time: '09:00',
        title: 'A dog the network takes for a cat',
        summary:
          'Six tasks: train a small CNN to tell cats from dogs, then change the picture of a dog so slightly that nobody can see it, and the network says cat.',
        url: colab('w4-cx-public', 'adversarial-cats-dogs/adversarial_cats_dogs.ipynb'),
        level: 'easy',
        rank: 6,
        reference: {
          label: 'Sunrise season classifier',
          url: colab('w4-cx-public', 'sunrise-cnn/sunrise_season_classifier.ipynb'),
        },
      },
      // The follow-up for the fast, on Carlos's word of 2026-10-23: the exercise
      // Kangsheng Qi, a teaching assistant, wrote for this slot on the branch
      // adversarial-attack of w4-cx-private, with only the changes that let it
      // run from here (w4-cx-private adversarial-attacks-cifar/, which says what
      // changed). Its solution stays private, on his word of the same day. Hard, and
      // the first of the hard ones, so it shows right below the cats and dogs.
      {
        day: 'saturday',
        time: '09:00',
        title: 'Adversarial attacks on CIFAR-10',
        summary:
          'For the fast, after the cats and dogs: attack a CNN trained on real photos, at random and towards a class you choose, then with many small steps (PGD), and defend it with adversarial training. Runs on a GPU in Colab.',
        url: colab('w4-cx-public', 'adversarial-attacks-cifar/adversarial_attacks_cx.ipynb'),
        level: 'hard',
        rank: 7,
      },
    ],
  },
];

export const getWeekend = (id: string): Weekend | undefined =>
  weekends.find((w) => w.id === id);

/**
 * Room label for a weekend. Collapses to a single room when Friday and Saturday
 * share one, which is the case for all of HS26; keeps the two-room form so a
 * future split only needs the data file changed.
 */
export const weekendRoom = (w: Weekend): string | undefined => {
  const { fridayRoom: fri, saturdayRoom: sat } = w;
  if (fri && sat) return fri === sat ? fri : `Fri ${fri} · Sat ${sat}`;
  return fri ?? sat;
};
