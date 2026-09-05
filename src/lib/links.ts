/**
 * Material this site SERVES rather than displays: the lecture and project PDFs
 * under `public/slides/`, and the notebooks under `public/exercises/` that
 * Colab cannot carry. Clicking one should put the file on the participant's
 * laptop, not open a browser viewer they then have to save out of.
 *
 * THE <a download> ATTRIBUTE IS SAME-ORIGIN ONLY. Browsers silently ignore it
 * on a cross-origin href, so it does nothing for a github.com or
 * raw.githubusercontent.com link: GitHub decides there, and it renders a PDF in
 * its own viewer and serves a notebook as `text/plain`. That is why project
 * material is copied into `public/` and linked with deck()/exercise() rather
 * than github()/raw(). If a file has to stay on GitHub, expect it to open, not
 * to download, whatever this returns.
 */
export type DownloadKind = 'pdf' | 'notebook';

export function downloadKind(url: string): DownloadKind | null {
  const u = url.toLowerCase();
  if (u.endsWith('.pdf')) return 'pdf';
  if (u.endsWith('.ipynb')) return 'notebook';
  return null;
}
