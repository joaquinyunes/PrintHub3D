import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../modules/products/product.model'; // Ajusta la ruta si es necesario

dotenv.config();

const seedProducts = async () => {
    try {
        // 1. Conectar a la Base de Datos
        await mongoose.connect(process.env.MONGO_URI || '');
        console.log('✅ Conectado a MongoDB para sembrar productos');

        // 2. Limpiar productos anteriores (Opcional, para no duplicar)
        await Product.deleteMany({});
        console.log('🗑️  Productos anteriores eliminados');

        // 3. Definir los productos de prueba
        // IMPORTANTE: El tenantId debe coincidir con el de tu usuario Admin ('global3d_hq')
        const products = [
            {
                name: "Creality Ender 3 V2",
                category: "Impresoras FDM",
                description: "Impresora 3D clásica, ideal para principiantes. Silenciosa y precisa.",
                price: 280,
                cost: 200,
                stock: 15,
                minStock: 2,
                isPublic: true,
                tenantId: "global3d_hq",
                sku: "PRN-END3-V2",
                imageUrl: "https://m.media-amazon.com/images/I/61p-WDtLpwL._AC_SL1500_.jpg" 
            },
            {
                name: "Filamento PLA Blanco 1kg",
                category: "Filamentos",
                description: "PLA de alta calidad, biodegradable y fácil de imprimir.",
                price: 25,
                cost: 15,
                stock: 100,
                minStock: 10,
                isPublic: true,
                tenantId: "global3d_hq",
                sku: "FIL-PLA-WHT",
                imageUrl: "https://m.media-amazon.com/images/I/61Nf9k-O0JL._AC_SL1001_.jpg"
            },
            {
                name: "Resina Elegoo Standard Grey",
                category: "Resinas",
                description: "Resina fotopolimérica para impresoras SLA/DLP.",
                price: 40,
                cost: 28,
                stock: 50,
                minStock: 5,
                isPublic: true,
                tenantId: "global3d_hq",
                sku: "RES-ELE-GRY",
                imageUrl: "https://m.media-amazon.com/images/I/71X8gWkO1bL._AC_SL1500_.jpg"
            },
            {
                name: "Anycubic Photon Mono 2",
                category: "Impresoras Resina",
                description: "Impresora de resina 4K monocromática, gran detalle.",
                price: 350,
                cost: 290,
                stock: 8,
                minStock: 1,
                isPublic: true,
                tenantId: "global3d_hq",
                sku: "PRN-ANY-MONO2",
                imageUrl: "https://m.media-amazon.com/images/I/71S-X-GgXlL._AC_SL1500_.jpg"
            }
        ];

        // 4. Insertar en la base de datos
        await Product.insertMany(products);
        console.log(`🚀 ¡Éxito! Se agregaron ${products.length} productos a la base de datos.`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error al sembrar productos:', error);
        process.exit(1);
    }
};

seedProducts();