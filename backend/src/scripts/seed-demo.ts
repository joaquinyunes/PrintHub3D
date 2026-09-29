import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Carga un catalogo de DEMO completo (textos + imagenes) para mostrar el
 * sistema funcionando. Pensado para demos comerciales, no para datos reales.
 *
 *   npm run seed:demo
 *
 * OJO: PISA las secciones de la web (productos, impresoras, filamentos,
 * rastreo y la home). Los pedidos, ventas, gastos y usuarios NO se tocan.
 *
 * Las imagenes apuntan a /demo/*.svg, que viven en frontend/public/demo y se
 * versionan con el repo. A diferencia de /uploads, no se borran en cada deploy
 * de Render. Se regeneran con: node scripts/gen-placeholders.mjs
 */

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/global3d';
const TENANT_ID = process.env.DEFAULT_TENANT_ID || 'global3d_hq';

const img = (n: string) => `/demo/${n}.svg`;

let seq = 0;
const id = () => `demo-${Date.now()}-${++seq}`;

const producto = (name: string, price: number, imagen: string, description: string) => ({
  id: id(),
  name,
  price,
  imageUrl: img(imagen),
  description,
  videoUrl: '',
  enabled: true,
});

const categoria = (
  name: string,
  imagen: string,
  description: string,
  subName: string,
  products: ReturnType<typeof producto>[]
) => ({
  id: id(),
  name,
  icon: '',
  imageUrl: img(imagen),
  description,
  subCategories: [{ id: id(), name: subName, products }],
});

// --- Home (hero + animaciones de scroll) ---
const homepageSections = {
  heroTitle: 'Global 3D',
  heroSubtitle: 'Transformamos tus ideas en objetos reales.',
  heroDescription: 'Impresion 3D de alta calidad en Corrientes',
  heroBadge: 'Envios gratis en pedidos mayores a $50.000',
  heroStats: { reviews: '4.8', reviewsCount: '200+ resenas', orders: '500+', delivery: '48-72h' },
  heroFeatures: ['Impresion rapida', 'Calidad premium', 'Envio a todo el pais', 'Asesoramiento tecnico'],
  productStar: {
    enabled: true,
    title: 'Vaso Personalizado',
    subtitle: 'Impresion 3D de alta calidad con el escudo de tu equipo favorito.',
    badge: '',
    price: '$8.900',
    originalPrice: '$11.500',
    teams: ['Boca', 'River', 'Racing', 'Independiente'],
  },
  copaAnimation: {
    enabled: true,
    title: 'Copa de la Liga',
    subtitle: 'Diseno 3D de alta calidad con detalles premium',
    badge: '',
    price: '$15.900',
    accentColor: '#f5a524',
    framesDir: '/frames-copakling/',
    totalFrames: 73,
  },
  impresoraAnimation: {
    enabled: true,
    title: 'Impresora 3D Bambu Lab X1C',
    subtitle: 'La nueva generacion de precision y velocidad',
    badge: '',
    price: '$469.000',
    accentColor: '#14e0c8',
    framesDir: '/frames-mp/',
    totalFrames: 192,
  },
};

// --- Seccion Productos ---
const productosSection = {
  enabled: true,
  title: 'Productos Personalizados',
  subtitle: 'Trofeos, llaveros, vasos y mucho mas, hechos a medida',
  badge: 'PRODUCTOS',
  heroImage: img('hero-productos'),
  allProductsSearch: { enabled: true, placeholder: 'Buscar productos...' },
  categories: [
    categoria('Trofeos y Copas', 'cat-trofeos', 'Premios y reconocimientos para torneos y eventos', 'Deportivos', [
      producto('Trofeo Personalizado', 12500, 'prod-trofeo', 'Trofeo con nombre, escudo y ano grabados. Altura 18 cm.'),
      producto('Copa de la Liga', 15900, 'prod-copa', 'Replica detallada con base de madera y placa grabada.'),
    ]),
    categoria('Llaveros', 'cat-llaveros', 'Llaveros con nombre, logo o el diseno que quieras', 'Personalizados', [
      producto('Llavero con Nombre', 2500, 'prod-llavero', 'Llavero en PLA con el nombre que elijas. Varios colores.'),
    ]),
    categoria('Vasos y Mates', 'cat-vasos', 'Vasos y mates impresos con el escudo de tu equipo', 'Linea Mate', [
      producto('Vaso Personalizado', 8900, 'prod-vaso', 'Vaso termico con diseno a eleccion. Apto uso diario.'),
      producto('Mate Impreso 3D', 15000, 'prod-mate', 'Mate imprimible con bombilla. Diseno ergonomico.'),
    ]),
    categoria('Figuras y Deco', 'cat-figuras', 'Figuras coleccionables y objetos decorativos', 'Decoracion', [
      producto('Figura Coleccionable', 9500, 'prod-figura', 'Figura articulada de 15 cm, pintada a mano.'),
      producto('Macetero Geometrico', 7800, 'prod-macetero', 'Macetero de diseno con plato incluido. Varios tamanos.'),
    ]),
  ],
};

// --- Seccion Impresoras ---
const impresorasSection = {
  enabled: true,
  title: 'Impresoras 3D',
  subtitle: 'Vendemos equipos Bambu Lab, repuestos y accesorios',
  badge: 'IMPRESORAS',
  heroImage: img('hero-impresoras'),
  animation: {
    enabled: true,
    title: 'Impresora 3D Bambu Lab X1C',
    subtitle: 'La nueva generacion de precision y velocidad',
    badge: '',
    price: '$469.000',
    accentColor: '#3b82f6',
    framesDir: '/frames-mp/',
    totalFrames: 192,
  },
  categories: [
    categoria('Bambu Lab', 'imp-x1c', 'Equipos de alta velocidad con sistema multicolor', 'Linea completa', [
      producto('Bambu Lab X1 Carbon', 469000, 'imp-x1c', 'Tope de gama. Sensor de flujo, camara y AMS compatible.'),
      producto('Bambu Lab P1S', 329000, 'imp-p1s', 'Cerrada, rapida y confiable. Ideal para produccion.'),
      producto('Bambu Lab A1 mini', 189000, 'imp-a1mini', 'Compacta y economica. Perfecta para empezar.'),
    ]),
  ],
};

// --- Seccion Filamentos ---
const filamentosSection = {
  enabled: true,
  title: 'Filamentos y Materiales',
  subtitle: 'PLA, PETG, ABS y TPU en todos los colores',
  badge: 'FILAMENTOS',
  heroImage: img('hero-filamentos'),
  categories: [
    categoria('Materiales', 'fil-pla', 'Bobinas de 1 kg, diametro 1.75 mm', 'Bobinas 1 kg', [
      producto('Filamento PLA', 18500, 'fil-pla', 'El mas facil de imprimir. Ideal para piezas decorativas.'),
      producto('Filamento PETG', 22900, 'fil-petg', 'Resistente y flexible. Apto para uso exterior.'),
      producto('Filamento ABS', 21500, 'fil-abs', 'Alta resistencia termica. Para piezas tecnicas.'),
      producto('Filamento TPU', 27900, 'fil-tpu', 'Flexible tipo goma. Fundas, ruedas y juntas.'),
    ]),
  ],
};

const rastreoSection = {
  enabled: true,
  title: 'Rastrea tu Pedido',
  subtitle: 'Ingresa tu codigo y segui tu pedido en tiempo real',
  badge: 'RASTREO',
  categories: [],
  customVideos: [],
};

const contar = (sec: { categories: Array<{ subCategories: Array<{ products: unknown[] }> }> }) =>
  sec.categories.reduce(
    (acc, c) => acc + c.subCategories.reduce((a, sc) => a + sc.products.length, 0),
    0
  );

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    const { default: Settings } = await import('../modules/settings/settings.model');

    const settings =
      (await Settings.findOne({ tenantId: TENANT_ID })) ||
      (await Settings.create({ tenantId: TENANT_ID }));

    const doc = settings as unknown as Record<string, unknown>;
    doc.homepageSections = homepageSections;
    doc.productosSection = productosSection;
    doc.impresorasSection = impresorasSection;
    doc.filamentosSection = filamentosSection;
    doc.rastreoSection = rastreoSection;

    const contacto = (doc.contactInfo || {}) as Record<string, unknown>;
    contacto.contactoTitle = 'Contactanos';
    contacto.contactoSubtitle = 'Estamos para ayudarte';
    contacto.contactoBadge = 'CONTACTO';
    doc.contactInfo = contacto;

    for (const campo of [
      'homepageSections',
      'productosSection',
      'impresorasSection',
      'filamentosSection',
      'rastreoSection',
      'contactInfo',
    ]) {
      settings.markModified(campo);
    }
    await settings.save();

    console.log(`Catalogo de demo cargado en "${TENANT_ID}".`);
    console.log(`  Productos:  ${productosSection.categories.length} categorias, ${contar(productosSection)} items`);
    console.log(`  Impresoras: ${impresorasSection.categories.length} categorias, ${contar(impresorasSection)} items`);
    console.log(`  Filamentos: ${filamentosSection.categories.length} categorias, ${contar(filamentosSection)} items`);
    console.log('Las imagenes salen de frontend/public/demo/*.svg');
    process.exit(0);
  } catch (error) {
    console.error('Error cargando el catalogo de demo:', error);
    process.exit(1);
  }
};

run();
