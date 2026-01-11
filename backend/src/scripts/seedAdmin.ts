import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// ✅ RUTAS CORREGIDAS (Ahora que estamos dentro de src)
import User from '../modules/auth/user.model';
import Settings from '../modules/settings/settings.model';

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/global3d');
        console.log('🔌 Conectado a MongoDB');

        const email = 'admin@global3d.com'; // 👈 TU EMAIL
        const password = 'admin123';        // 👈 TU CONTRASEÑA

        // 1. Verificar si ya existe
        const existingAdmin = await User.findOne({ email });
        if (existingAdmin) {
            console.log('⚠️ El admin ya existe.');
            process.exit();
        }

        // 2. Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Crear el Super Admin
        const newAdmin = new User({
            name: 'Joaquin Admin',
            email,
            password: hashedPassword,
            role: 'admin', // 👈 PODER SUPREMO
            tenantId: 'global3d_hq'
        });

        await newAdmin.save();

        // 4. Asegurar Configuración Inicial
        await Settings.findOneAndUpdate(
            { tenantId: 'global3d_hq' },
            { businessName: 'Global 3D', welcomeMessage: 'Bienvenido' },
            { upsert: true }
        );

        console.log('✅ ADMIN CREADO EXITOSAMENTE');
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Pass: ${password}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        mongoose.disconnect();
    }
};

createAdmin();