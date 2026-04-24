import { Request, Response } from 'express';
import Task from './task.model';

export const getTasks = async (req: Request, res: Response) => {
    const tasks = await Task.find({ tenantId: (req as any).user.tenantId }).sort({ createdAt: -1 });
    res.json(tasks);
};

export const createTask = async (req: Request, res: Response) => {
    const newTask = new Task({ ...req.body, tenantId: (req as any).user.tenantId });
    await newTask.save();
    res.json(newTask);
};

export const updateTask = async (req: Request, res: Response) => {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(task);
};

export const deleteTask = async (req: Request, res: Response) => {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
};