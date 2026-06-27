import { serializeSvg } from '@toolbox/svg-core';
import type { ExportTarget } from '../registry';

export const svgTarget: ExportTarget = {
  id: 'svg',
  isSelected: (selection) => selection.svg,
  planPaths: () => ['icon.svg'],
  buildFiles: ({ framed }) =>
    Promise.resolve([{ path: 'icon.svg', data: serializeSvg(framed, { pretty: true }) }])
};
