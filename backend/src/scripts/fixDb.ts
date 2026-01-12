import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const fixIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/global3d');
        console.log('✅ Conectado a la Base de Datos');
        
        // Accedemos a la colección de productos directamente
        const collection = mongoose.connection.collection('products');
        
        // Borramos TODOS los índices (reglas) viejos
        await collection.dropIndexes();
        
        console.log('🎉 ¡LISTO! Índices borrados. Ahora podrás crear infinitos productos.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error (Tal vez no había índices para borrar, eso es bueno):', error);
        process.exit(1);
    }
};

fixIndexes();