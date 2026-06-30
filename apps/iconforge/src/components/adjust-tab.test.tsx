import { parseSvg, type SvgNode } from '@toolbox/svg-core';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AdjustTab, DocumentControls } from './adjust-tab';

function firstNode(svgText: string): SvgNode {
  const parsed = parseSvg(svgText);
  if (!parsed.scene) throw new Error('parse failed');
  return parsed.scene.root.children[0]!;
}

describe('DocumentControls color fields', () => {
  it('keeps the color picker closed behind a swatch trigger by default', () => {
    const html = renderToStaticMarkup(
      <DocumentControls
        backgroundColor="#336699"
        showSafeGuide
        onChangeBackground={() => undefined}
        onToggleSafeGuide={() => undefined}
        projectName="Untitled icon"
        onRenameProject={() => undefined}
        onDownloadProject={() => undefined}
        openControl={null}
      />
    );

    expect(html).toContain('aria-label="Open Background color picker"');
    expect(html).toContain('class="if-color-swatch-button"');
    expect(html).not.toContain('react-colorful');
  });

  it('hides the color field when the background is transparent and offers the safe-area guide toggle', () => {
    const html = renderToStaticMarkup(
      <DocumentControls
        backgroundColor="transparent"
        showSafeGuide
        onChangeBackground={() => undefined}
        onToggleSafeGuide={() => undefined}
        projectName="Untitled icon"
        onRenameProject={() => undefined}
        onDownloadProject={() => undefined}
        openControl={null}
      />
    );

    expect(html).not.toContain('Open Background color picker');
    expect(html).toContain('Safe-area guide');
    expect(html).toContain('type="checkbox"');
  });
});

describe('AdjustTab attribute fields', () => {
  it('prompts to add or select a layer when none is selected', () => {
    const html = renderToStaticMarkup(
      <AdjustTab
        node={null}
        onUpdateField={() => undefined}
        onUpdateText={() => undefined}
        onCenter={() => undefined}
        onSetAdaptiveRole={() => undefined}
      />
    );

    expect(html).toContain('Add or select a layer to adjust it.');
  });

  it('renders the selected node size and appearance fields with their current values', () => {
    const node = firstNode(
      '<svg viewBox="0 0 24 24"><rect x="2" y="3" width="8" height="9" fill="#abcdef" /></svg>'
    );
    const html = renderToStaticMarkup(
      <AdjustTab
        node={node}
        onUpdateField={() => undefined}
        onUpdateText={() => undefined}
        onCenter={() => undefined}
        onSetAdaptiveRole={() => undefined}
      />
    );

    expect(html).toContain('value="8"');
    expect(html).toContain('Fill');
  });

  it('shows the measured layer center as unified X/Y position fields', () => {
    const node = firstNode('<svg viewBox="0 0 1024 1024"><rect width="200" height="200" /></svg>');
    const html = renderToStaticMarkup(
      <AdjustTab
        node={node}
        center={{ x: 512, y: 512 }}
        onSetCenter={() => undefined}
        onUpdateField={() => undefined}
        onUpdateText={() => undefined}
        onCenter={() => undefined}
        onSetAdaptiveRole={() => undefined}
      />
    );

    expect(html).toContain('>X</span>');
    expect(html).toContain('>Y</span>');
    expect(html).toContain('value="512"');
  });

  it('shows an Angle field carrying the current rotation', () => {
    const node = firstNode('<svg viewBox="0 0 1024 1024"><rect width="200" height="200" /></svg>');
    const html = renderToStaticMarkup(
      <AdjustTab
        node={node}
        center={{ x: 512, y: 512 }}
        onSetCenter={() => undefined}
        rotation={30}
        onSetRotation={() => undefined}
        onUpdateField={() => undefined}
        onUpdateText={() => undefined}
        onCenter={() => undefined}
        onSetAdaptiveRole={() => undefined}
      />
    );

    expect(html).toContain('>Angle</span>');
    expect(html).toContain('value="30"');
  });

  it('renders a text content field for text nodes', () => {
    const node = firstNode('<svg viewBox="0 0 24 24"><text x="0" y="9">Hi</text></svg>');
    const html = renderToStaticMarkup(
      <AdjustTab
        node={node}
        onUpdateField={() => undefined}
        onUpdateText={() => undefined}
        onCenter={() => undefined}
        onSetAdaptiveRole={() => undefined}
      />
    );

    expect(html).toContain('value="Hi"');
    expect(html).toContain('<span>Text</span>');
  });

  it('offers a foreground/background adaptive role control reflecting the current tag', () => {
    const node = firstNode(
      '<svg viewBox="0 0 108 108"><rect data-adaptive-role="background" width="108" height="108" /></svg>'
    );
    const html = renderToStaticMarkup(
      <AdjustTab
        node={node}
        onUpdateField={() => undefined}
        onUpdateText={() => undefined}
        onCenter={() => undefined}
        onSetAdaptiveRole={() => undefined}
      />
    );

    expect(html).toContain('Adaptive role');
    expect(html).toContain('Foreground');
    expect(html).toContain('Background');
    expect(html).toMatch(/data-state="on"[^>]*>Background</);
  });
});

const noop = () => {};
const textProps = {
  onUpdateField: noop,
  onUpdateText: noop,
  onCenter: noop,
  onSetAdaptiveRole: noop,
  fontInput: 'Roboto',
  fontStatus: { state: 'loaded' as const, message: 'Roboto' },
  onChangeFontInput: noop,
  onLoadFont: noop,
  onUploadFont: noop,
  fontFamilies: ['Roboto', 'Inter', 'Open Sans'],
  selectedFontFamily: 'Roboto',
  onSelectFont: noop,
  onConvertToShapes: noop,
  shadow: null,
  onSetShadow: noop
};

describe('AdjustTab text controls', () => {
  it('shows the Font control and Convert button for a text node', () => {
    const node = firstNode(
      '<svg viewBox="0 0 24 24"><text font-family="Roboto" x="2" y="20">Hi</text></svg>'
    );
    const html = renderToStaticMarkup(<AdjustTab node={node} {...textProps} />);
    expect(html).toContain('Font');
    expect(html).toContain('Load');
    expect(html).toContain('upload a font file');
    expect(html).toContain('Choose a font');
    expect(html).toContain('>Inter</option>');
    expect(html).toContain('>Open Sans</option>');
    expect(html).toContain('Convert to shapes');
  });

  it('omits the text-only controls for a non-text node', () => {
    const node = firstNode('<svg viewBox="0 0 24 24"><rect width="4" height="4" /></svg>');
    const html = renderToStaticMarkup(<AdjustTab node={node} {...textProps} />);
    expect(html).not.toContain('Convert to shapes');
  });
});

describe('AdjustTab CSS override warning', () => {
  it('shows the embedded-CSS warning only when the layer is CSS-styled', () => {
    const node = firstNode('<svg viewBox="0 0 24 24"><rect fill="red" width="4" height="4" /></svg>');

    expect(renderToStaticMarkup(<AdjustTab node={node} {...textProps} stylingMayOverride />)).toContain(
      'embedded CSS'
    );
    expect(renderToStaticMarkup(<AdjustTab node={node} {...textProps} />)).not.toContain(
      'embedded CSS'
    );
  });
});
