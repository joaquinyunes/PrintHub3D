import { Request, Response } from 'express';
import Task from './task.model';
import { authUser } from '../auth/auth.middleware';

export const getTasks = async (req: Request, res: Response) => {
    const tasks = await Task.find({ tenantId: authUser(req).tenantId }).sort({ createdAt: -1 });
    res.json(tasks);
};

export const createTask = async (req: Request, res: Response) => {
    const newTask = new Task({ ...req.body, tenantId: authUser(req).tenantId });
    await newTask.save();
    res.json(newTask);
};

export const updateTask = async (req: Request, res: Response) => {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json(task);
};

export const deleteTask = async (req: Request, res: Response) => {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
};