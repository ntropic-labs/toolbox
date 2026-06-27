import { describe, expect, it } from 'vitest';
import { encodeIco } from './favicon';

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function fakePng(byte: number, length: number): Uint8Array {
  const data = new Uint8Array(length);
  data.set(PNG_SIGNATURE, 0);
  data.fill(byte, PNG_SIGNATURE.length);
  return data;
}

function readEntry(view: DataView, index: number) {
  const base = 6 + index * 16;
  return {
    width: view.getUint8(base),
    height: view.getUint8(base + 1),
    planes: view.getUint16(base + 4, true),
    bitCount: view.getUint16(base + 6, true),
    bytesInRes: view.getUint32(base + 8, true),
    imageOffset: view.getUint32(base + 12, true)
  };
}

describe('encodeIco', () => {
  it('writes a valid ICONDIR header for the supplied frames', () => {
    const ico = encodeIco([
      { size: 16, png: fakePng(0x11, 20) },
      { size: 32, png: fakePng(0x22, 30) },
      { size: 48, png: fakePng(0x33, 40) }
    ]);
    const view = new DataView(ico.buffer, ico.byteOffset, ico.byteLength);

    expect(view.getUint16(0, true)).toBe(0); // reserved
    expect(view.getUint16(2, true)).toBe(1); // type = icon
    expect(view.getUint16(4, true)).toBe(3); // image count
  });

  it('records each frame dimension, payload length, and a contiguous offset', () => {
    const frames = [
      { size: 16, png: fakePng(0x11, 20) },
      { size: 32, png: fakePng(0x22, 30) },
      { size: 48, png: fakePng(0x33, 40) }
    ];
    const ico = encodeIco(frames);
    const view = new DataView(ico.buffer, ico.byteOffset, ico.byteLength);

    const headerSize = 6 + 16 * frames.length;
    let expectedOffset = headerSize;
    frames.forEach((frame, index) => {
      const entry = readEntry(view, index);
      expect(entry.width).toBe(frame.size);
      expect(entry.height).toBe(frame.size);
      expect(entry.planes).toBe(1);
      expect(entry.bitCount).toBe(32);
      expect(entry.bytesInRes).toBe(frame.png.length);
      expect(entry.imageOffset).toBe(expectedOffset);
      expectedOffset += frame.png.length;
    });

    expect(ico.byteLength).toBe(expectedOffset);
  });

  it('embeds the PNG payload bytes verbatim at the recorded offset', () => {
    const png = fakePng(0xab, 24);
    const ico = encodeIco([{ size: 32, png }]);
    const view = new DataView(ico.buffer, ico.byteOffset, ico.byteLength);
    const { imageOffset, bytesInRes } = readEntry(view, 0);

    expect(Array.from(ico.slice(imageOffset, imageOffset + bytesInRes))).toEqual(Array.from(png));
  });

  it('stores a 256px frame dimension as 0 per the ICO format', () => {
    const ico = encodeIco([{ size: 256, png: fakePng(0x01, 10) }]);
    const view = new DataView(ico.buffer, ico.byteOffset, ico.byteLength);
    const entry = readEntry(view, 0);

    expect(entry.width).toBe(0);
    expect(entry.height).toBe(0);
  });

  it('rejects an empty frame list and out-of-range sizes', () => {
    expect(() => encodeIco([])).toThrow();
    expect(() => encodeIco([{ size: 0, png: fakePng(0x01, 4) }])).toThrow();
    expect(() => encodeIco([{ size: 512, png: fakePng(0x01, 4) }])).toThrow();
  });
});
