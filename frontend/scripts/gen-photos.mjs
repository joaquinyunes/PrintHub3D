// Genera las fotos realistas de public/photos/ con la API de imágenes de OpenAI.
// Uso: OPENAI_API_KEY=sk-... npm run photos   (omite las que ya existen; borrá el .jpg para regenerarla)
import { mkdir, writeFile, access } from 'node:fs/promises';

const STYLE =
  'Professional product photograph, realistic, shot on a DSLR, soft studio lighting, clean light-grey seamless background, shallow depth of field, sharp focus, no text, no logos.';

const PHOTOS = {
  trofeo: '3D printed trophy cup with a star on top, glossy gold PLA, on a small black base',
  vaso: '3D printed reusable travel mug with a lid, matte teal PETG, visible fine layer lines',
  engranaje: 'set of 3D printed mechanical gears and a bracket, orange and black PETG, interlocking',
  figura: '3D printed collectible robot figurine, painted details, standing on a wooden desk',
  llavero: 'three 3D printed colorful keychains with metal rings, bright PLA, lying on a table',
  impresora: 'enclosed desktop FDM 3D printer, modern black and white design, printing a small part inside',
  filamento: 'spool of 1.75mm PLA 3D printer filament, vivid orange, neatly wound, with a cardboard label',
  boquilla: 'brass 3D printer nozzles and a hotend assembly, close-up macro, on a dark workshop mat',
  resina: 'bottle of grey 3D printer UV resin with a printed miniature beside it',
  herramientas: 'flexible 3D printer build plate, a metal scraper spatula and small tools on a workshop table',
};

const key = process.env.OPENAI_API_KEY;
if (!key) {
  console.error('Falta OPENAI_API_KEY');
  process.exit(1);
}

const dir = new URL('../public/photos/', import.meta.url);
await mkdir(dir, { recursive: true });

for (const [name, subject] of Object.entries(PHOTOS)) {
  const file = new URL(`${name}.jpg`, dir);
  if (await access(file).then(() => true, () => false)) {
    console.log(`= ${name} (ya existe)`);
    continue;
  }
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: `${subject}. ${STYLE}`,
      size: '1024x1024',
      quality: 'medium',
      output_format: 'jpeg',
      output_compression: 85,
    }),
  });
  if (!res.ok) {
    console.error(`x ${name}: ${res.status} ${await res.text()}`);
    continue;
  }
  const json = await res.json();
  await writeFile(file, Buffer.from(json.data[0].b64_json, 'base64'));
  console.log(`+ ${name}`);
}
