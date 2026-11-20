import { Request, Response } from 'express';
import mongoose from 'mongoose';
import HomeIdea from '../../models/homeIdea.model';
import HomePrinter from '../../models/homePrinter.model';

// Ideas
// Solo los campos permitidos (nunca tenantId ni _id).
const pick = (body: Record<string, unknown> | undefined, keys: string[]): Record<string, unknown> =>
  Object.fromEntries(keys.filter((k) => body && body[k] !== undefined).map((k) => [k, (body as Record<string, unknown>)[k]]));

export const getIdeas = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const ideas = await HomeIdea.find({ tenantId });
    res.json(ideas);
  } catch (e) {
    res.status(500).json({ message: 'Error al obtener ideas' });
  }
};

export const createIdea = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
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
    const update = pick(req.body, ['name', 'image', 'downloads', 'link', 'price', 'category']);
    const idea = mongoose.isValidObjectId(String(id)) ? await HomeIdea.findOneAndUpdate({ _id: id, tenantId: req.user!.tenantId }, { $set: update }, { returnDocument: 'after' }) : null;
    if (!idea) return res.status(404).json({ message: 'Idea no encontrada' });
    res.json(idea);
  } catch (e) {
    res.status(500).json({ message: 'Error actualizando idea' });
  }
};

export const deleteIdea = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = mongoose.isValidObjectId(String(id)) ? await HomeIdea.findOneAndDelete({ _id: id, tenantId: req.user!.tenantId }) : null;
    if (!result) return res.status(404).json({ message: 'Idea no encontrada' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Error eliminando idea' });
  }
};

// Printers
export const getPrinters = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const printers = await HomePrinter.find({ tenantId });
    res.json(printers);
  } catch (e) {
    res.status(500).json({ message: 'Error al obtener impresoras' });
  }
};

export const createPrinter = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
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
    const update = pick(req.body, ['name', 'price', 'imageUrl', 'link', 'description', 'category']);
    const printer = mongoose.isValidObjectId(String(id)) ? await HomePrinter.findOneAndUpdate({ _id: id, tenantId: req.user!.tenantId }, { $set: update }, { returnDocument: 'after' }) : null;
    if (!printer) return res.status(404).json({ message: 'Impresora no encontrada' });
    res.json(printer);
  } catch (e) {
    res.status(500).json({ message: 'Error actualizando impresora' });
  }
};

export const deletePrinter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = mongoose.isValidObjectId(String(id)) ? await HomePrinter.findOneAndDelete({ _id: id, tenantId: req.user!.tenantId }) : null;
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
