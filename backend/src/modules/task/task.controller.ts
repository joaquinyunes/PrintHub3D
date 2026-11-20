import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Task from './task.model';
import { authUser } from '../auth/auth.middleware';

export const getTasks = async (req: Request, res: Response) => {
    const tasks = await Task.find({ tenantId: authUser(req).tenantId }).sort({ createdAt: -1 });
    res.json(tasks);
};

export const createTask = async (req: Request, res: Response) => {
    const newTask = new Task({ text: req.body?.text, completed: !!req.body?.completed, tenantId: authUser(req).tenantId });
    await newTask.save();
    res.json(newTask);
};

export const updateTask = async (req: Request, res: Response) => {
    // Solo el texto y el estado; nunca el tenantId. Y solo tareas del propio taller.
    const update: Record<string, unknown> = {};
    if (typeof req.body?.text === 'string') update.text = req.body.text;
    if (typeof req.body?.completed === 'boolean') update.completed = req.body.completed;
    const id = String(req.params.id);
    const task = mongoose.isValidObjectId(id) ? await Task.findOneAndUpdate({ _id: id, tenantId: authUser(req).tenantId }, { $set: update }, { returnDocument: 'after' }) : null;
    if (!task) return res.status(404).json({ message: 'Tarea no encontrada' });
    res.json(task);
};

export const deleteTask = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const result = mongoose.isValidObjectId(id) ? await Task.findOneAndDelete({ _id: id, tenantId: authUser(req).tenantId }) : null;
    if (!result) return res.status(404).json({ message: 'Tarea no encontrada' });
    res.json({ message: "Deleted" });
};