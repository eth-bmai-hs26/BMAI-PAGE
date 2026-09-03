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
 * Dozentenfoyer, weekends 2 and 4 at Polysnack, and weekend 3's afternoon
 * coffee is at the foyer instead. Every Saturday coffee is at HG D30.0075, the
 * foyer immediately outside the classroom. Do not "tidy" these into one value.
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

/** Notebook in a public repo, opened in Google Colab. */
export const colab = (repo: PublicRepo, path: string): string =>
  `https://colab.research.google.com/github/${ORG}/${repo}/blob/main/${path}`;

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
export const viz = (n: number, name: string): string =>
  `${import.meta.env.BASE_URL}viz/we${n}/${name}/index.html`;

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
      "The first weekend builds up the machinery behind neural networks: how first-order methods approach a minimum, why gradient descent works, what a network can approximate, and how Vapnik's t[...]",
    friday: [
      {
        time: '08:15',
        title: 'Intro and onboarding',
        type: 'lecture',
        // The intro and administration deck is deliberately NOT linked here.
        // It is course-wide material rather than weekend-1 material, so it sits
        // in the hero on the home page and nowhere else. Carlos, 2026-09-02.
        links: [{ label: 'Cold open', url: deck(1, 'cold-open.pdf') }],
      },
      {
        time: '09:00',
        title: 'First-order approximation algorithms',
        type: 'lecture',
        links: [{ label: 'Slides', url: deck(1, 'first-order-approximation-algorithms.pdf') }],
      },
      // Moved from 10:00 to 09:30 by Carlos on 2026-09-03. The coffee break
      // stays at 10:30, so this exercise runs an hour rather than half of one
      // and the 09:00 lecture is the half hour block.
      {
        time: '09:30',
        title: 'First-order optimization algorithms',
        type: 'exercise',
        links: [
          {
            label: 'Open in browser',
            url: exercise(1, 'cx_robbins-monro.html'),
          },
        ],
      },
      { time: '10:30', title: 'Coffee break at Dozentenfoyer, until 11:00', type: 'break' },
      {
        time: '11:00',
        title: 'Gradient descent',
        type: 'lecture',
        links: [{ label: 'Slides', url: deck(1, 'gradient-descent.pdf') }],
      },
      { time: '12:00', title: 'Gradient descent', type: 'exercise' },
      { time: '13:00', title: 'Lunch break at Dozentenfoyer, until 14:00', type: 'break' },
      {
        time: '14:00',
        title: 'Neural networks and universal approximation',
        type: 'lecture',
        links: [
          { label: 'Slides', url: deck(1, 'neural-networks-universal-approximation.pdf') },
        ],
      },
      {
        time: '14:30',
        title: 'Neural networks',
        type: 'exercise',
        links: [
          {
            label: 'Open in Colab',
            url: colab('w1-cx-public', 'universal-approximation/universal_approximation.ipynb'),
          },
        ],
      },
      { time: '15:30', title: 'Coffee break at Dozentenfoyer, until 16:00', type: 'break' },
      {
        time: '16:00',
        title: "Vapnik's statistical learning theory",
        type: 'lecture',
        links: [{ label: 'Slides', url: deck(1, 'statistical-learning-theory.pdf') }],
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
        title: 'Iris PyTorch',
        type: 'exercise',
        links: [
          {
            label: 'Open in Colab',
            url: colab('w1-cx-public', 'iris-pytorch/iris_pytorch.ipynb'),
          },
        ],
      },
      { time: '10:00', title: 'Coffee break at HG D30.0075, until 10:30', type: 'break' },
      {
        time: '10:30',
        title: 'Validation and overfitting',
        type: 'lecture',
        links: [
          { label: 'Reference', url: deck(1, 'validation-reference.pdf') },
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
      { time: '12:00', title: 'Project intro: LLM routing', type: 'project' },
    ],
    resources: [
      { group: 'Lecture slides', label: 'The cold open', url: deck(1, 'cold-open.pdf') },
      {
        group: 'Lecture slides',
        label: 'First-order approximation algorithms',
        url: deck(1, 'first-order-approximation-algorithms.pdf'),
      },
      { group: 'Lecture slides', label: 'Gradient descent', url: deck(1, 'gradient-descent.pdf') },
      {
        group: 'Lecture slides',
        label: 'Neural networks and universal approximation',
        url: deck(1, 'neural-networks-universal-approximation.pdf'),
      },
      {
        group: 'Lecture slides',
        label: "Vapnik's statistical learning theory",
        url: deck(1, 'statistical-learning-theory.pdf'),
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
      { group: 'Lecture slides', label: 'Validation and overfitting', url: SOON },
      {
        group: 'Lecture slides',
        label: 'Validation and overfitting: reference (why regularisation, the four objectives, R squared)',
        url: deck(1, 'validation-reference.pdf'),
      },
      {
        group: 'Visualizations',
        label: 'The UN games: spurious regression in ten scenes (Saturday, validation and overfitting)',
        url: viz(1, 'un-games'),
      },
      { group: 'Coding exercises', label: "First-order optimization: Heron's algorithm", url: SOON },
      {
        group: 'Coding exercises',
        label: 'First-order optimization: Genie game and Robbins-Monro (runs in the browser)',
        url: exercise(1, 'cx_robbins-monro.html'),
      },
      {
        group: 'Coding exercises',
        label: 'Robbins-Monro: Approximation Game (runs in the browser)',
        url: exercise(1, 'cx-rm/approximation-game.html'),
      },
      { group: 'Coding exercises', label: 'First-order optimization: house price prediction', url: SOON },
      { group: 'Coding exercises', label: 'Gradient descent: grasshopper game', url: SOON },
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
      { group: 'Coding exercises', label: 'Overfitting, validation and regularization', url: SOON },
      {
        group: 'Setup',
        label: 'Setting up Claude Code: VS Code, a terminal, and your licence',
        url: guide('claude-code-setup.html'),
      },
      { group: 'Project', label: 'LLM routing: project description', url: SOON },
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
      'Friday assembles the transformer piece by piece, starting from autoencoders and attention rather than presenting the finished architecture. Saturday moves on to agentic AI, with a guest le[...]