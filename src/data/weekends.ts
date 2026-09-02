import type { Weekend } from '../types';

/**
 * Single source of truth for all BMAI 2026 weekend content.
 * Transcribed from the "Syllabus" tab of "BMAI HS26 master spreadsheet.xlsx".
 *
 * To update content, edit the objects below. Each weekend has a Friday and a
 * Saturday agenda plus a `resources` list.
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
 * A participant-facing HOW-TO page hosted by this site, from `public/guides/`.
 *
 * Same reasoning as deck(): the source lives in a private repository, and a
 * page served from here needs no new repository and no visibility change. The
 * sibling FDD site serves its installation guide the same way.
 */
export const guide = (file: string): string =>
  `${import.meta.env.BASE_URL}guides/${file}`;

/**
 * An exercise notebook hosted by THIS site, from `public/exercises/we<n>/`.
 *
 * Why not colab(): colab() opens a notebook in Google Colab, which is right for
 * every other exercise in this course and wrong for this one. The Claude Code
 * exercise drives a terminal program that edits files in a folder the
 * participant owns, and Colab has neither the folder nor the licence, so the
 * notebook is DOWNLOADED and opened locally in VS Code. See the setup guide.
 */
export const exercise = (n: number, file: string): string =>
  `${import.meta.env.BASE_URL}exercises/we${n}/${file}`;

export const weekends: Weekend[] = [
  {
    id: 'we1',
    number: 1,
    title: 'Neural Network Foundations',
    theme: "Optimization, universal approximation and Vapnik's statistical learning theory",
    dates: '4–5 September 2026',
    startISO: '2026-09-04',
    project: 'LLM routing',
    summary:
      "The first weekend builds up the machinery behind neural networks: how first-order methods approach a minimum, why gradient descent works, what a network can approximate, and how Vapnik's theory explains when training generalises. Saturday puts that into PyTorch and looks at how to tell overfitting from real learning.",
    friday: [
      {
        time: '08:00',
        title: 'Intro and onboarding',
        type: 'lecture',
        links: [
          { label: 'Slides', url: deck(1, 'intro-and-onboarding.pdf') },
          { label: 'Cold open', url: deck(1, 'cold-open.pdf') },
        ],
      },
      {
        time: '09:00',
        title: 'First-order approximation algorithms',
        type: 'lecture',
        links: [{ label: 'Slides', url: deck(1, 'first-order-approximation-algorithms.pdf') }],
      },
      { time: '10:00', title: 'First-order optimization algorithms', type: 'exercise' },
      { time: '10:30', title: 'Coffee break at Polysnack', type: 'break' },
      {
        time: '11:00',
        title: 'Gradient descent',
        type: 'lecture',
        links: [{ label: 'Slides', url: deck(1, 'gradient-descent.pdf') }],
      },
      { time: '12:00', title: 'Gradient descent', type: 'exercise' },
      { time: '13:00', title: 'Lunch break at Dozentenfoyer', type: 'break' },
      {
        time: '14:00',
        title: 'Neural networks and universal approximation',
        type: 'lecture',
        links: [
          { label: 'Slides', url: deck(1, 'neural-networks-universal-approximation.pdf') },
        ],
      },
      { time: '14:30', title: 'Neural networks', type: 'exercise' },
      { time: '15:30', title: 'Coffee break at Polysnack', type: 'break' },
      {
        time: '16:00',
        title: "Vapnik's statistical learning theory",
        type: 'lecture',
        links: [{ label: 'Slides', url: deck(1, 'statistical-learning-theory.pdf') }],
      },
    ],
    saturday: [
      { time: '08:00', title: 'Training neural networks with PyTorch', type: 'lecture' },
      {
        time: '08:00',
        title: 'Introduction to Claude Code (parallel session)',
        type: 'lecture',
        links: [
          { label: 'Slides', url: deck(1, 'introduction-to-claude-code.pdf') },
          { label: 'Setup guide', url: guide('claude-code-setup.html') },
          { label: 'Exercise', url: exercise(1, 'operation-midnight-launch.ipynb') },
        ],
      },
      { time: '09:00', title: 'Neural networks with PyTorch', type: 'exercise' },
      { time: '10:00', title: 'Coffee break at Cafebar', type: 'break' },
      { time: '10:30', title: 'Validation and overfitting', type: 'lecture' },
      { time: '11:00', title: 'Validation and overfitting', type: 'exercise' },
      { time: '12:00', title: 'Project intro: LLM routing', type: 'project' },
    ],
    resources: [
      { group: 'Lecture slides', label: 'Intro and onboarding', url: deck(1, 'intro-and-onboarding.pdf') },
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
      { group: 'Lecture slides', label: 'Training neural networks with PyTorch', url: SOON },
      { group: 'Lecture slides', label: 'Validation and overfitting', url: SOON },
      { group: 'Coding exercises', label: "First-order optimization: Heron's algorithm", url: SOON },
      { group: 'Coding exercises', label: 'First-order optimization: Genie game and Robbins-Monro', url: SOON },
      { group: 'Coding exercises', label: 'First-order optimization: house price prediction', url: SOON },
      { group: 'Coding exercises', label: 'Gradient descent: grasshopper game', url: SOON },
      { group: 'Coding exercises', label: 'Neural networks: forward pass and universal approximation', url: SOON },
      {
        group: 'Coding exercises',
        label: 'Claude Code: Operation Midnight Launch (notebook, runs locally)',
        url: exercise(1, 'operation-midnight-launch.ipynb'),
      },
      { group: 'Coding exercises', label: 'Neural networks with PyTorch', url: SOON },
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
    title: 'Language Models and Agents',
    theme: 'Autoencoders, attention, transformers and agentic AI',
    dates: '18–19 September 2026',
    startISO: '2026-09-18',
    project: 'Tax agent',
    summary:
      'Friday assembles the transformer piece by piece, starting from autoencoders and attention rather than presenting the finished architecture. Saturday moves on to agentic AI, with a guest lecture and the introduction of the tax agent project.',
    friday: [
      { time: '08:00', title: 'Autoencoders', type: 'lecture' },
      { time: '09:00', title: 'Autoencoders', type: 'exercise' },
      { time: '10:00', title: 'Attention', type: 'lecture' },
      { time: '10:30', title: 'Coffee break at Polysnack', type: 'break' },
      { time: '11:00', title: 'Attention', type: 'exercise' },
      { time: '12:00', title: 'Lab session', type: 'lab' },
      { time: '13:00', title: 'Lunch break at Dozentenfoyer', type: 'break' },
      { time: '14:00', title: 'Transformers', type: 'lecture' },
      { time: '14:30', title: 'Transformers', type: 'exercise' },
      { time: '15:30', title: 'Coffee break at Polysnack', type: 'break' },
      { time: '16:00', title: 'Agentic AI', type: 'lecture' },
    ],
    saturday: [
      { time: '08:00', title: 'Agentic AI', type: 'lecture' },
      { time: '09:00', title: 'Agentic AI', type: 'exercise' },
      { time: '10:00', title: 'Coffee break at Cafebar', type: 'break' },
      { time: '10:30', title: 'Guest lecture: Christopher Makni', type: 'lecture' },
      { time: '11:00', title: 'Guest lecture continues', type: 'lecture' },
      { time: '12:00', title: 'Project intro: Tax agent', type: 'project' },
    ],
    resources: [
      { group: 'Lecture slides', label: 'Autoencoders', url: SOON },
      { group: 'Lecture slides', label: 'Attention', url: SOON },
      { group: 'Lecture slides', label: 'Transformers', url: SOON },
      { group: 'Lecture slides', label: 'Agentic AI', url: SOON },
      { group: 'Coding exercises', label: 'Autoencoders', url: SOON },
      { group: 'Coding exercises', label: 'Attention', url: SOON },
      { group: 'Coding exercises', label: 'Transformers', url: SOON },
      { group: 'Coding exercises', label: 'Agentic AI', url: SOON },
      { group: 'Project', label: 'Tax agent: project description', url: SOON },
      { group: 'Project', label: 'Tax agent: grading scheme', url: SOON },
    ],
  },
  {
    id: 'we3',
    number: 3,
    title: 'Computer Vision',
    theme: 'Convolutional networks, UNets and diffusion',
    dates: '2–3 October 2026',
    startISO: '2026-10-02',
    project: 'Fashion magazine editor',
    summary:
      'Two days on models that work on images. Friday covers convolutional networks and UNets and gets them running in PyTorch, Saturday moves to diffusion. A quiz and a Kahoot recap check what actually stuck before the fashion magazine editor project is introduced.',
    friday: [
      { time: '08:00', title: 'CNNs', type: 'lecture' },
      { time: '09:00', title: 'CNNs', type: 'exercise' },
      { time: '10:00', title: 'CNNs', type: 'lecture' },
      { time: '10:30', title: 'Coffee break at Polysnack', type: 'break' },
      { time: '11:00', title: 'CNNs in PyTorch', type: 'exercise' },
      { time: '12:00', title: 'Lab session', type: 'lab' },
      { time: '13:00', title: 'Lunch break at Dozentenfoyer', type: 'break' },
      { time: '14:00', title: 'UNets', type: 'lecture' },
      { time: '14:30', title: 'UNets', type: 'exercise' },
      { time: '15:30', title: 'Coffee break at Polysnack', type: 'break' },
      { time: '16:00', title: 'Quiz', type: 'quiz' },
    ],
    saturday: [
      { time: '08:00', title: 'Diffusion', type: 'lecture' },
      { time: '09:00', title: 'Diffusion', type: 'exercise' },
      { time: '10:00', title: 'Coffee break at Cafebar', type: 'break' },
      { time: '10:30', title: 'Kahoot recap', type: 'quiz' },
      { time: '11:00', title: 'Extra', type: 'exercise' },
      { time: '12:00', title: 'Project intro: Fashion magazine editor', type: 'project' },
    ],
    resources: [
      { group: 'Lecture slides', label: 'CNNs', url: SOON },
      { group: 'Lecture slides', label: 'UNets', url: SOON },
      { group: 'Lecture slides', label: 'Diffusion', url: SOON },
      { group: 'Coding exercises', label: 'CNNs', url: SOON },
      { group: 'Coding exercises', label: 'CNNs in PyTorch', url: SOON },
      { group: 'Coding exercises', label: 'UNets', url: SOON },
      { group: 'Coding exercises', label: 'Diffusion', url: SOON },
      { group: 'Project', label: 'Fashion magazine editor: project description', url: SOON },
      { group: 'Project', label: 'Fashion magazine editor: grading scheme', url: SOON },
    ],
  },
  {
    id: 'we4',
    number: 4,
    title: 'Geometry of Generative Models',
    theme: 'Manifolds, variational autoencoders and adversarial robustness',
    dates: '23–24 October 2026',
    startISO: '2026-10-23',
    project: 'To be announced',
    summary:
      'The closing weekend looks at what a latent space is shaped like: manifolds, variational autoencoders and age progression, then stable diffusion, CLIP and cross-attention. Saturday turns to the other side of generative models, adversarial attacks and deepfake detection.',
    friday: [
      { time: '08:00', title: 'Manifolds and VAEs', type: 'lecture' },
      { time: '09:00', title: 'Manifold games', type: 'exercise' },
      { time: '10:00', title: 'Conditional VAEs and age progression', type: 'lecture' },
      { time: '10:30', title: 'Coffee break at Polysnack', type: 'break' },
      { time: '11:00', title: 'Conditional VAE with demo', type: 'exercise' },
      { time: '12:00', title: 'Lab session', type: 'lab' },
      { time: '13:00', title: 'Lunch break at Dozentenfoyer', type: 'break' },
      { time: '14:00', title: 'Stable diffusion, CLIP, MAE', type: 'lecture' },
      { time: '14:30', title: 'Cross-attention mechanisms', type: 'lecture' },
      { time: '15:30', title: 'Coffee break at Polysnack', type: 'break' },
      { time: '16:00', title: 'Quiz', type: 'quiz' },
    ],
    saturday: [
      { time: '08:00', title: 'Adversarial attacks', type: 'lecture' },
      { time: '09:00', title: 'Adversarial attacks', type: 'exercise' },
      { time: '10:00', title: 'Coffee break at Cafebar', type: 'break' },
      { time: '10:30', title: 'Deepfake detection and generation', type: 'lecture' },
      // The syllabus leaves these two slots open for now.
      { time: '11:00', title: '', type: 'tba' },
      { time: '12:00', title: 'Project intro', type: 'tba' },
    ],
    resources: [
      { group: 'Lecture slides', label: 'Manifolds and VAEs', url: SOON },
      { group: 'Lecture slides', label: 'Conditional VAEs and age progression', url: SOON },
      { group: 'Lecture slides', label: 'Stable diffusion, CLIP, MAE', url: SOON },
      { group: 'Lecture slides', label: 'Cross-attention mechanisms', url: SOON },
      { group: 'Lecture slides', label: 'Adversarial attacks', url: SOON },
      { group: 'Lecture slides', label: 'Deepfake detection and generation', url: SOON },
      { group: 'Coding exercises', label: 'Manifold games', url: SOON },
      { group: 'Coding exercises', label: 'Conditional VAE with demo', url: SOON },
      { group: 'Coding exercises', label: 'Adversarial attacks', url: SOON },
      { group: 'Project', label: 'Project description', url: SOON },
      { group: 'Project', label: 'Grading scheme', url: SOON },
    ],
  },
];

export const getWeekend = (id: string): Weekend | undefined =>
  weekends.find((w) => w.id === id);
