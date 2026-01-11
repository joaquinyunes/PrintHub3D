import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './user.model';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// --- REGISTRO PÚBLICO (Solo crea CLIENTES) ---
export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'Email ya registrado' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role: 'client', // 👈 FORZAMOS QUE SEA CLIENTE
            tenantId: 'global3d_hq' // Todos son clientes de TU tienda
        });

        await newUser.save();

        // Login automático al registrarse
        const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET, { expiresIn: '30d' });

        res.status(201).json({ 
            token, 
            user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role } 
        });

    } catch (error) {
        res.status(500).json({ message: 'Error en registro' });
    }
};

// --- LOGIN (Para Admin y Clientes) ---
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Usuario no encontrado' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Contraseña incorrecta' });

        const token = jwt.sign({ 
            id: user._id, 
            role: user.role, // Guardamos el rol en el token
            tenantId: user.tenantId 
        }, JWT_SECRET, { expiresIn: '30d' });

        res.json({ 
            token, 
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email, 
                role: user.role // Devolvemos el rol al frontend para saber a dónde redirigir
            } 
        });

    } catch (error) {
        res.status(500).json({ message: 'Error en login' });
    }
};