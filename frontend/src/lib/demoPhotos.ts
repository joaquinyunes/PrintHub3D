/** Foto realista de cada ilustración demo: /demo/<slug>.svg → /photos/<archivo>.jpg */
const PHOTOS: Record<string, string> = {
  'prod-trofeo': 'trofeo',
  'prod-copa': 'copa',
  'prod-llavero': 'llavero',
  'prod-vaso': 'vaso',
  'prod-mate': 'mate',
  'prod-figura': 'figura',
  'prod-macetero': 'macetero',
  'prod-engranaje': 'engranaje',
  'imp-x1c': 'impresora',
  'imp-p1s': 'p1s',
  'imp-a1mini': 'a1mini',
  'fil-pla': 'filamento-pla',
  'fil-petg': 'petg',
  'fil-abs': 'abs',
  'fil-tpu': 'tpu',
  'ins-boquilla': 'boquilla',
  'ins-placa': 'placa',
  'ins-herramientas': 'herramientas',
  'ins-resina': 'resina',
};

/** '' si la imagen no es una ilustración demo o todavía no tiene foto. */
export function photoFor(url?: string): string {
  const slug = url?.match(/\/demo\/([\w-]+)\.svg$/)?.[1];
  const file = slug ? PHOTOS[slug] : undefined;
  return file ? `/photos/${file}.jpg` : '';
}
