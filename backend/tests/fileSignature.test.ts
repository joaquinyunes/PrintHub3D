import { detectFileType } from '../src/utils/fileSignature';
import { PNG_1X1 } from './helpers';

const pad = (bytes: number[], len = 16) => Buffer.from([...bytes, ...new Array(Math.max(0, len - bytes.length)).fill(0)]);

describe('detectFileType', () => {
  it('reconoce PNG, JPEG, GIF y WEBP por su contenido', () => {
    expect(detectFileType(PNG_1X1)).toMatchObject({ kind: 'image', mime: 'image/png', ext: 'png' });
    expect(detectFileType(pad([0xff, 0xd8, 0xff, 0xe0]))).toMatchObject({ mime: 'image/jpeg', ext: 'jpg' });
    expect(detectFileType(Buffer.from('GIF89a\0\0\0\0\0\0\0\0\0\0', 'latin1'))).toMatchObject({ mime: 'image/gif' });
    expect(detectFileType(Buffer.from('RIFF\0\0\0\0WEBPVP8 ', 'latin1'))).toMatchObject({ mime: 'image/webp' });
  });

  it('distingue mp4, mov y avif dentro del contenedor ISO-BMFF', () => {
    const ftyp = (brand: string) => Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from(`ftyp${brand}`, 'latin1'), Buffer.alloc(8)]);
    expect(detectFileType(ftyp('isom'))).toMatchObject({ kind: 'video', mime: 'video/mp4' });
    expect(detectFileType(ftyp('qt  '))).toMatchObject({ kind: 'video', mime: 'video/quicktime' });
    expect(detectFileType(ftyp('avif'))).toMatchObject({ kind: 'image', mime: 'image/avif' });
  });

  it('reconoce webm', () => {
    expect(detectFileType(pad([0x1a, 0x45, 0xdf, 0xa3]))).toMatchObject({ kind: 'video', mime: 'video/webm' });
  });

  it('rechaza texto, HTML, SVG y ejecutables aunque se disfracen', () => {
    expect(detectFileType(Buffer.from('<html><script>alert(1)</script>'))).toBeNull();
    expect(detectFileType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'))).toBeNull();
    expect(detectFileType(pad([0x4d, 0x5a, 0x90, 0x00]))).toBeNull(); // MZ (.exe)
    expect(detectFileType(Buffer.alloc(0))).toBeNull();
  });
});
