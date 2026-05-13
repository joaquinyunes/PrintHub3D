import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/printhub3d';

const createAdmin = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Conectado a MongoDB');
        
        const { default: User } = await import('../modules/auth/user.model');
        
        const existingAdmin = await User.findOne({ email: 'admin@global3d.com' });
        
        if (existingAdmin) {
            console.log('⚠️ El admin ya existe, actualizando contraseña...');
            const salt = await bcrypt.genSalt(10);
            existingAdmin.password = await bcrypt.hash('admin123', salt);
            existingAdmin.role = 'admin';
            await existingAdmin.save();
            console.log('✅ Admin actualizado');
        } else {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            
            await User.create({
                name: 'Super Admin',
                email: 'admin@global3d.com',
                password: hashedPassword,
                role: 'admin',
                tenantId: 'global3d_hq',
                verified: true
            });
            console.log('✅ Admin creado');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

createAdmin();