import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet'; // Seguridad headers
import morgan from 'morgan'; // Logs de peticiones
import { connectDB } from './config/db';

// 1. Configuración de Variables de Entorno
dotenv.config();

// 2. Conexión a Base de Datos
connectDB();

// 3. Inicializar App
const app: Application = express();
const PORT = process.env.PORT || 5000;

// 4. Middlewares Globales
app.use(express.json()); // Leer JSON en body
app.use(cors()); // Permitir conexiones desde el Frontend
app.use(helmet()); // Proteger headers HTTP
app.use(morgan('dev')); // Ver peticiones en consola

// 5. Ruta de prueba (Health Check)
app.get('/', (req: Request, res: Response) => {
    res.status(200).json({ 
        message: '🚀 PrintHub 3D API Operativa',
        version: '1.0.0',
        environment: process.env.NODE_ENV
    });
});

// 6. Iniciar Servidor
app.listen(PORT, () => {
    console.log(`\n===================================`);
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`🔗 http://localhost:${PORT}`);
    console.log(`===================================\n`);
});