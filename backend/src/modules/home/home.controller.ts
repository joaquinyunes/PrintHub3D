import { Request, Response } from 'express';
import HomeIdea from '../../models/homeIdea.model';
import HomePrinter from '../../models/homePrinter.model';

// Ideas
export const getIdeas = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.headers['x-tenant-id'] || 'global3d_hq';
    const ideas = await HomeIdea.find({ tenantId });
    res.json(ideas);
  } catch (e) {
    res.status(500).json({ message: 'Error al obtener ideas' });
  }
};

export const createIdea = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || 'global3d_hq';
    const { name, image, downloads, link, price, category } = req.body;
    const idea = new (HomeIdea as any)({ name, image, downloads, link, price, category, tenantId });
    await idea.save();
    res.status(201).json(idea);
  } catch (e) {
    res.status(500).json({ message: 'Error creando idea' });
  }
};

export const updateIdea = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const update = req.body;
    const idea = await HomeIdea.findByIdAndUpdate(id, update, { new: true });
    if (!idea) return res.status(404).json({ message: 'Idea no encontrada' });
    res.json(idea);
  } catch (e) {
    res.status(500).json({ message: 'Error actualizando idea' });
  }
};

export const deleteIdea = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await HomeIdea.findByIdAndDelete(id);
    if (!result) return res.status(404).json({ message: 'Idea no encontrada' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Error eliminando idea' });
  }
};

// Printers
export const getPrinters = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.headers['x-tenant-id'] || 'global3d_hq';
    const printers = await HomePrinter.find({ tenantId });
    res.json(printers);
  } catch (e) {
    res.status(500).json({ message: 'Error al obtener impresoras' });
  }
};

export const createPrinter = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || 'global3d_hq';
    const { name, price, imageUrl, link, description, category } = req.body;
    const printer = new (HomePrinter as any)({ name, price, imageUrl, link, description, category, tenantId });
    await printer.save();
    res.status(201).json(printer);
  } catch (e) {
    res.status(500).json({ message: 'Error creando impresora' });
  }
};

export const updatePrinter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const update = req.body;
    const printer = await HomePrinter.findByIdAndUpdate(id, update, { new: true });
    if (!printer) return res.status(404).json({ message: 'Impresora no encontrada' });
    res.json(printer);
  } catch (e) {
    res.status(500).json({ message: 'Error actualizando impresora' });
  }
};

export const deletePrinter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await HomePrinter.findByIdAndDelete(id);
    if (!result) return res.status(404).json({ message: 'Impresora no encontrada' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Error eliminando impresora' });
  }
};

export default {
  getIdeas, createIdea, updateIdea, deleteIdea,
  getPrinters, createPrinter, updatePrinter, deletePrinter
} as any;
