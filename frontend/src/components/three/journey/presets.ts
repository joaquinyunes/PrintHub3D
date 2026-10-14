import type { ItemKind } from './objects';

export interface JourneyItemCopy {
  kind: ItemKind;
  name: string;
  text: string;
  tags: string[];
  /** Ilustración para la versión sin WebGL */
  image: string;
  /** Foto realista que aparece después de la animación (generada con `npm run photos`) */
  photo?: string;
  price?: string;
}

export interface JourneyCta {
  label: string;
  href: string;
  primary?: boolean;
}

export interface JourneyPreset {
  /** Cartel del pasillo (3D) y etiqueta de la sección */
  aisle: string;
  aisleTitle: string;
  titleLines: string[];
  intro: string;
  items: JourneyItemCopy[];
  outroTitle: string;
  outroText: string;
  ctas: JourneyCta[];
}

/** Pasillo 1: lo que fabricamos. */
export const PRODUCT_JOURNEY: JourneyPreset = {
  aisle: 'Pasillo 1',
  aisleTitle: 'Productos 3D',
  titleLines: ['Todo hecho', 'a medida.'],
  intro: 'Caminá el pasillo y sacá de la góndola lo que te interese.',
  items: [
    {
      kind: 'trophy',
      name: 'Trofeos y copas',
      text: 'Premios con el nombre, el escudo y el año que quieras.',
      tags: ['PLA', 'Personalizado'],
      image: '/demo/prod-trofeo.svg',
      photo: '/photos/trofeo.jpg',
    },
    {
      kind: 'mug',
      name: 'Vasos y mates',
      text: 'Con tu logo o el escudo de tu equipo. Para regalar o para vender.',
      tags: ['PETG', 'Tu diseño'],
      image: '/demo/prod-vaso.svg',
      photo: '/photos/vaso.jpg',
    },
    {
      kind: 'gears',
      name: 'Piezas y repuestos',
      text: 'Engranajes, soportes y encastres a medida para lo que necesites.',
      tags: ['PETG', 'ABS', 'A medida'],
      image: '/demo/prod-engranaje.svg',
      photo: '/photos/engranaje.jpg',
    },
    {
      kind: 'robot',
      name: 'Figuras y deco',
      text: 'Figuras, coleccionables y objetos decorativos.',
      tags: ['Coleccionables', 'Decoración'],
      image: '/demo/prod-figura.svg',
      photo: '/photos/figura.jpg',
    },
    {
      kind: 'keychain',
      name: 'Llaveros',
      text: 'Para eventos, marcas y emprendimientos. Desde una unidad.',
      tags: ['Merchandising', 'Tu marca'],
      image: '/demo/prod-llavero.svg',
      photo: '/photos/llavero.jpg',
    },
  ],
  outroTitle: '¿Tenés una idea?',
  outroText: 'Contanos qué querés y te pasamos un presupuesto. Enviamos a todo el país.',
  ctas: [
    { label: 'Ver productos', href: '/productos', primary: true },
    { label: 'Cotizar una pieza', href: '/cotizar' },
  ],
};

/** Pasillo 2: para imprimir. */
export const PRINTER_JOURNEY: JourneyPreset = {
  aisle: 'Pasillo 2',
  aisleTitle: 'Impresoras e insumos',
  titleLines: ['Todo para', 'imprimir.'],
  intro: 'Impresoras, filamentos y repuestos, cada uno en su góndola.',
  items: [
    {
      kind: 'printer',
      name: 'Impresoras 3D',
      text: 'Bambu Lab y más modelos, listas para imprimir.',
      tags: ['Bambu Lab', 'Cerradas y abiertas'],
      image: '/demo/imp-x1c.svg',
      photo: '/photos/impresora.jpg',
    },
    {
      kind: 'filaments',
      name: 'Filamentos',
      text: 'PLA, PETG, ABS y TPU en bobinas de 1 kg.',
      tags: ['PLA', 'PETG', 'ABS', 'TPU'],
      image: '/demo/fil-pla.svg',
      photo: '/photos/filamento-pla.jpg',
    },
    {
      kind: 'nozzles',
      name: 'Boquillas y hotends',
      text: 'Repuestos para que tu impresora siga trabajando.',
      tags: ['Boquillas', 'Hotends'],
      image: '/demo/ins-boquilla.svg',
      photo: '/photos/boquilla.jpg',
    },
    {
      kind: 'resin',
      name: 'Resina',
      text: 'Resina para impresoras de alta definición.',
      tags: ['Estándar', 'Alta definición'],
      image: '/demo/ins-resina.svg',
      photo: '/photos/resina.jpg',
    },
    {
      kind: 'supplies',
      name: 'Insumos y herramientas',
      text: 'Placas de impresión, espátulas y accesorios de taller.',
      tags: ['Placas', 'Herramientas'],
      image: '/demo/ins-herramientas.svg',
      photo: '/photos/herramientas.jpg',
    },
  ],
  outroTitle: 'Armá tu taller',
  outroText: 'Te ayudamos a elegir la impresora y los materiales para lo que querés hacer.',
  ctas: [
    { label: 'Ver impresoras', href: '/impresoras', primary: true },
    { label: 'Ver filamentos', href: '/filamentos' },
  ],
};
