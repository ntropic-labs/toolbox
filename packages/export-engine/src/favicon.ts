// Minimal PNG-embedded ICO encoder. Modern browsers and operating systems accept
// .ico files whose entries hold PNG data (rather than legacy BMP), so we wrap the
// already-rendered favicon PNG frames in an ICONDIR container.
//
// Layout: a 6-byte ICONDIR header, then one 16-byte ICONDIRENTRY per frame, then the
// concatenated PNG payloads. Each directory entry points at its payload via an offset
// measured from the start of the file.

export interface IcoFrame {
  readonly size: number;
  readonly png: Uint8Array;
}

const ICONDIR_SIZE = 6;
const ICONDIRENTRY_SIZE = 16;

export function encodeIco(frames: readonly IcoFrame[]): Uint8Array<ArrayBuffer> {
  if (frames.length === 0) {
    throw new Error('encodeIco requires at least one frame.');
  }
  if (frames.length > 0xffff) {
    throw new Error('encodeIco supports at most 65535 frames.');
  }

  const headerSize = ICONDIR_SIZE + ICONDIRENTRY_SIZE * frames.length;
  const totalSize = headerSize + frames.reduce((sum, frame) => sum + frame.png.length, 0);

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // ICONDIR: reserved (0), type (1 = icon), image count.
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, frames.length, true);

  let entryOffset = ICONDIR_SIZE;
  let payloadOffset = headerSize;

  for (const frame of frames) {
    // A dimension of 256 is stored as 0; anything larger does not fit one byte.
    if (!Number.isInteger(frame.size) || frame.size < 1 || frame.size > 256) {
      throw new Error(`encodeIco frame size must be an integer in 1..256, got ${frame.size}.`);
    }
    const dimension = frame.size === 256 ? 0 : frame.size;

    view.setUint8(entryOffset, dimension); // width
    view.setUint8(entryOffset + 1, dimension); // height
    view.setUint8(entryOffset + 2, 0); // color palette count (0 = no palette)
    view.setUint8(entryOffset + 3, 0); // reserved
    view.setUint16(entryOffset + 4, 1, true); // color planes
    view.setUint16(entryOffset + 6, 32, true); // bits per pixel
    view.setUint32(entryOffset + 8, frame.png.length, true); // payload byte length
    view.setUint32(entryOffset + 12, payloadOffset, true); // payload offset

    bytes.set(frame.png, payloadOffset);

    entryOffset += ICONDIRENTRY_SIZE;
    payloadOffset += frame.png.length;
  }

  return bytes;
}
