import type { ExportTarget } from '../registry';
import { renderFavicon } from '../render';

export const faviconTarget: ExportTarget = {
  id: 'favicon',
  isSelected: (selection) => selection.favicon,
  planPaths: () => ['favicon.ico'],
  buildFiles: async ({ framed }) => [{ path: 'favicon.ico', data: await renderFavicon(framed) }]
};
