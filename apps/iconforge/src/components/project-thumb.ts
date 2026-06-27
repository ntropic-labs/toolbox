const SVG_NS = 'http://www.w3.org/2000/svg';

function withXmlns(svg: string): string {
  return /\bxmlns\s*=/.test(svg) ? svg : svg.replace('<svg', `<svg xmlns="${SVG_NS}"`);
}

function toDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function thumbnailUri(svg: string): string {
  return toDataUri(withXmlns(svg));
}

export function tightThumbnailUri(svg: string): string {
  const namespaced = withXmlns(svg);
  if (typeof document === 'undefined') return toDataUri(namespaced);

  const holder = document.createElement('div');
  holder.style.cssText = 'position:absolute;left:-99999px;top:0;opacity:0;pointer-events:none';
  holder.innerHTML = namespaced;
  const el = holder.querySelector('svg');
  if (!el) return toDataUri(namespaced);

  document.body.appendChild(holder);
  try {
    const box = el.getBBox();
    if (box.width > 0 && box.height > 0) {
      const size = Math.max(box.width, box.height);
      const vx = box.x - (size - box.width) / 2;
      const vy = box.y - (size - box.height) / 2;
      el.setAttribute('viewBox', `${round(vx)} ${round(vy)} ${round(size)} ${round(size)}`);
      el.removeAttribute('width');
      el.removeAttribute('height');
      return toDataUri(el.outerHTML);
    }
  } catch {
  } finally {
    holder.remove();
  }
  return toDataUri(namespaced);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
