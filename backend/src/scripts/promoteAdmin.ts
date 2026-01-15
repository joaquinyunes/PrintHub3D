import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../modules/auth/user.model';

dotenv.config();

const promoteToAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || '');
        console.log('✅ Conectado a MongoDB');

        const email = 'admin@global3d.com'; // El email que usas para loguearte

        // 1. Buscar el usuario
        const user = await User.findOne({ email });

        if (!user) {
            console.log(`❌ No se encontró el usuario ${email}. Ejecuta primero seedAdmin.ts`);
            process.exit(1);
        }

        // 2. Mostrar estado actual
        console.log(`👤 Estado actual: ${user.name} | Rol: ${user.role}`);

        // 3. Forzar actualización
        user.role = 'admin';
        user.tenantId = 'global3d_hq'; // Aseguramos que tenga el tenant correcto
        await user.save();

        console.log(`🚀 ¡LISTO! El usuario ${email} ahora es ADMIN confirmado.`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

promoteToAdmin();