import { Request, Response } from 'express';
import Client from './client.model';

export const getClients = async (req: Request, res: Response) => {
    try {
        // Ordenados por quién gastó más (Los clientes VIP primero)
        const clients = await Client.find({ tenantId: 'global3d_hq' })
            .sort({ totalSpent: -1 }); 
        res.json(clients);
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo clientes' });
    }
};