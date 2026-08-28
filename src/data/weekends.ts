import type { Weekend } from '../types';

/**
 * Single source of truth for all BMAI 2026 weekend content.
 * Transcribed from the "Syllabus" tab of "BMAI HS26 master spreadsheet.xlsx".
 *
 * To update content, edit the objects below. Each weekend has a Friday and a
 * Saturday agenda plus a `resources` list.
 */

const ORG = 'eth-bmai-hs26';

/** Public materials repository for a weekend, e.g. eth-bmai-hs26/BMAI-WE1-public. */
export const weekendRepo = (n: number): string => `${ORG}/BMAI-WE${n}-public`;

/** Direct file link into a weekend's public repo, for slides and handouts. */
export const raw = (n: number, path: string): string =>
  `https://raw.githubusercontent.com/${weekendRepo(n)}/main/${path}`;

/** Notebook in a weekend's public repo, opened in Google Colab. */
export const colab = (n: number, path: string): string =>
  `https://colab.research.google.com/github/${weekendRepo(n)}/blob/main/${path}`;

/**
 * Placeholder for material that has not been uploaded yet. Renders greyed out
 * as "Soon" instead of a link, so an agenda can go live before its files do.
 * Replace with raw(n, path) or colab(n, path) once the file is in the repo.
 */
export const SOON = '#';

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
      { time: '08:00', title: 'Intro and onboarding', type: 'lecture' },
      { time: '09:00', title: 'First-order approximation algorithms', type: 'lecture' },
      { time: '10:00', title: 'First-order optimization algorithms', type: 'exercise' },
      { time: '10:30', title: 'Coffee break at Polysnack', type: 'break' },
      { time: '11:00', title: 'Gradient descent', type: 'lecture' },
      { time: '12:00', title: 'Gradient descent', type: 'exercise' },
      { time: '13:00', title: 'Lunch break at Dozentenfoyer', type: 'break' },
      { time: '14:00', title: 'Neural networks and universal approximation', type: 'lecture' },
      { time: '14:30', title: 'Neural networks', type: 'exercise' },
      { time: '15:30', title: 'Coffee break at Polysnack', type: 'break' },
      { time: '16:00', title: "Vapnik's statistical learning theory", type: 'lecture' },
    ],
    saturday: [
      { time: '08:00', title: 'Training neural networks with PyTorch', type: 'lecture' },
      { time: '09:00', title: 'Neural networks with PyTorch', type: 'exercise' },
      { time: '10:00', title: 'Coffee break at Cafebar', type: 'break' },
      { time: '10:30', title: 'Validation and overfitting', type: 'lecture' },
      { time: '11:00', title: 'Validation and overfitting', type: 'exercise' },
      { time: '12:00', title: 'Project intro: LLM routing', type: 'project' },
    ],
    resources: [
      { group: 'Lecture slides', label: 'First-order approximation algorithms', url: SOON },
      { group: 'Lecture slides', label: 'Gradient descent', url: SOON },
      { group: 'Lecture slides', label: 'Neural networks and universal approximation', url: SOON },
      { group: 'Lecture slides', label: "Vapnik's statistical learning theory", url: SOON },
      { group: 'Lecture slides', label: 'Training neural networks with PyTorch', url: SOON },
      { group: 'Lecture slides', label: 'Validation and overfitting', url: SOON },
      { group: 'Coding exercises', label: "First-order optimization: Heron's algorithm", url: SOON },
      { group: 'Coding exercises', label: 'First-order optimization: Genie game and Robbins-Monro', url: SOON },
      { group: 'Coding exercises', label: 'First-order optimization: house price prediction', url: SOON },
      { group: 'Coding exercises', label: 'Gradient descent: grasshopper game', url: SOON },
      { group: 'Coding exercises', label: 'Neural networks: forward pass and universal approximation', url: SOON },
      { group: 'Coding exercises', label: 'Neural networks with PyTorch', url: SOON },
      { group: 'Coding exercises', label: 'Overfitting, validation and regularization', url: SOON },
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
