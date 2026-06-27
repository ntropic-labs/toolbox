import { describe, expect, it } from 'vitest';
import { sceneToComponent } from './component';
import { requireScene } from './test-support';

describe('sceneToComponent (React)', () => {
  it('emits a typed component with JSX-normalized attributes', () => {
    const scene = requireScene(
      '<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill-rule="evenodd" stroke-width="2" /></svg>',
    );

    const out = sceneToComponent(scene);

    expect(out).toContain("import type { SVGProps } from 'react';");
    expect(out).toContain('SVGProps<SVGSVGElement>');
    expect(out).toContain('export default Icon');
    expect(out).toContain('{...props}');
    expect(out).toContain('fillRule="evenodd"');
    expect(out).toContain('strokeWidth="2"');
    expect(out).not.toContain('fill-rule');
  });

  it('names the component and emits plain JSX when typescript is disabled', () => {
    const scene = requireScene('<svg viewBox="0 0 24 24"><circle r="6" /></svg>');

    const out = sceneToComponent(scene, { componentName: 'AppLogo', typescript: false });

    expect(out).toContain('export default AppLogo');
    expect(out).not.toContain('SVGProps');
  });

  it('does not emit internal node ids as attributes', () => {
    const scene = requireScene(
      '<svg viewBox="0 0 24 24"><desc>authored description</desc><rect id="mark" class="a" width="10" height="10" /></svg>',
    );

    const out = sceneToComponent(scene);

    expect(out).toContain('authored description');
    expect(out).toContain('id="mark"');
    expect(out).toContain('className="a"');
    expect(out).not.toContain('data-fid');
  });

  it('html-escapes double quotes in attribute values so the JSX stays valid', () => {
    const scene = requireScene('<svg viewBox="0 0 24 24"><path aria-label="say &quot;hi&quot;" d="M0 0" /></svg>');

    const out = sceneToComponent(scene);

    expect(out).toContain('aria-label="say &quot;hi&quot;"');
    expect(out).not.toContain('say "hi"');
  });
});

describe('sceneToComponent (React Native)', () => {
  it('imports used components from react-native-svg and maps tags', () => {
    const scene = requireScene('<svg viewBox="0 0 24 24"><path d="M0 0h4v4H0z" /></svg>');

    const out = sceneToComponent(scene, { native: true });

    expect(out).toContain("from 'react-native-svg'");
    expect(out).toContain('SvgProps');
    expect(out).toMatch(/import \{[^}]*\bSvg\b[^}]*\bPath\b[^}]*\} from 'react-native-svg';/u);
    expect(out).toContain('<Svg');
    expect(out).toContain('<Path');
    expect(out).toContain('export default Icon');
  });

  it('drops xmlns and class on native output', () => {
    const scene = requireScene('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect class="a" width="4" height="4" /></svg>');

    const out = sceneToComponent(scene, { native: true });

    expect(out).not.toContain('xmlns');
    expect(out).not.toContain('className');
    expect(out).not.toContain('class=');
  });
});
