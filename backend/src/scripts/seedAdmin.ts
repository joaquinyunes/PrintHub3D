import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../modules/auth/user.model'; // Asegúrate que la ruta al modelo sea correcta

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/global3d');
        console.log('✅ Conectado a MongoDB');

        const adminEmail = 'admin@global3d.com';
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log('⚠️ El administrador ya existe');
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        const newAdmin = new User({
            name: 'Super Admin',
            email: adminEmail,
            password: hashedPassword,
            role: 'admin',      // 👈 IMPORTANTE: Rol admin
            tenantId: 'global3d_hq'
        });

        await newAdmin.save();
        console.log('🚀 Administrador creado con éxito');
        console.log('📧 Email: admin@global3d.com');
        console.log('🔑 Pass: admin123');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creando admin:', error);
        process.exit(1);
    }
};

createAdmin();