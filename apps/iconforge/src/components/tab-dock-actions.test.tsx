import { parseSvg } from '@toolbox/svg-core';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { listLayers } from '../scene-editor';
import { TabDock } from './tab-dock';

function renderDock() {
  const parsed = parseSvg('<svg viewBox="0 0 24 24"><rect width="8" height="8" /></svg>');
  const scene = parsed.scene!;
  const layers = listLayers(scene, scene.root.children[0]!.id);
  return renderToStaticMarkup(
    <TabDock
      adjustControls={<div>Adjust controls</div>}
      documentControls={<div>Document controls</div>}
      layers={layers}
      onAddNode={() => undefined}
      onDeleteLayer={() => undefined}
      onDuplicateLayer={() => undefined}
      onMoveLayer={() => undefined}
      onSelectLayer={() => undefined}
      onToggleLayerVisible={() => undefined}
      onUploadSvg={() => undefined}
      selectedLabel="rect"
    />
  );
}

describe('layer action layout', () => {
  it('shows every layer action inline as a button, not behind a menu', () => {
    const html = renderDock();

    for (const label of ['Hide layer', 'Move layer up', 'Move layer down', 'Duplicate layer', 'Delete layer']) {
      expect(html).toContain(`aria-label="${label}"`);
    }
  });

  it('marks delete as the destructive inline action', () => {
    const html = renderDock();
    expect(html).toContain('data-danger="true"');
  });

  it('does not surface any lock affordance', () => {
    const html = renderDock();

    expect(html).not.toContain('Lock layer');
    expect(html).not.toContain('Unlock');
  });

  it('offers adding a layer through a compact dropdown trigger, with adjust always visible', () => {
    const html = renderDock();

    expect(html).toContain('aria-haspopup="menu"');
    expect(html).toContain('Add layer');
    expect(html).toContain('Adjust controls');
  });
});
