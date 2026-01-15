"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, DollarSign, Calendar, Tag } from "lucide-react";

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [form, setForm] = useState({ description: "", amount: "", category: "Materiales" });
    const [loading, setLoading] = useState(true);

    const categories = ["Materiales", "Mantenimiento", "Servicios", "Alquiler", "Otros"];

    const fetchExpenses = async () => {
        const userStr = localStorage.getItem("user");
        if (!userStr) return;
        const { token } = JSON.parse(userStr);

        const res = await fetch("http://localhost:5000/api/expenses", {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setExpenses(await res.json());
        setLoading(false);
    };

    useEffect(() => { fetchExpenses(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const userStr = localStorage.getItem("user");
        if (!userStr) return;
        const { token } = JSON.parse(userStr);

        await fetch("http://localhost:5000/api/expenses", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(form)
        });
        setForm({ description: "", amount: "", category: "Materiales" });
        fetchExpenses();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Borrar gasto?")) return;
        const userStr = localStorage.getItem("user");
        if (!userStr) return;
        const { token } = JSON.parse(userStr);

        await fetch(`http://localhost:5000/api/expenses/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchExpenses();
    };

    return (
        <div className="p-8 bg-[#050505] min-h-screen text-white">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
                <DollarSign className="text-red-500" /> Control de Gastos
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Formulario */}
                <div className="bg-[#111] p-6 rounded-2xl border border-white/10 h-fit">
                    <h2 className="font-bold mb-4">Registrar Nuevo Gasto</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-400 block mb-1">Descripción</label>
                            <input 
                                className="w-full bg-black border border-white/10 rounded-lg p-3 text-white"
                                placeholder="Ej: Compra 10kg PLA"
                                value={form.description}
                                onChange={e => setForm({...form, description: e.target.value})}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Monto ($)</label>
                                <input 
                                    type="number"
                                    className="w-full bg-black border border-white/10 rounded-lg p-3 text-white"
                                    placeholder="0.00"
                                    value={form.amount}
                                    onChange={e => setForm({...form, amount: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Categoría</label>
                                <select 
                                    className="w-full bg-black border border-white/10 rounded-lg p-3 text-white"
                                    value={form.category}
                                    onChange={e => setForm({...form, category: e.target.value})}
                                >
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2">
                            <Plus size={18} /> Registrar Gasto
                        </button>
                    </form>
                </div>

                {/* Lista de Gastos */}
                <div className="lg:col-span-2 bg-[#111] p-6 rounded-2xl border border-white/10">
                    <h2 className="font-bold mb-4">Últimos Gastos</h2>
                    <div className="space-y-3">
                        {expenses.map(expense => (
                            <div key={expense._id} className="flex justify-between items-center p-4 bg-black/50 rounded-xl border border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="bg-red-500/10 p-3 rounded-lg text-red-500">
                                        <Tag size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold">{expense.description}</p>
                                        <p className="text-xs text-gray-400 flex items-center gap-2">
                                            <Calendar size={10} /> {new Date(expense.date).toLocaleDateString()} 
                                            <span className="bg-white/10 px-2 rounded text-[10px]">{expense.category}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-mono text-xl font-bold text-red-400">
                                        - ${expense.amount.toLocaleString()}
                                    </span>
                                    <button onClick={() => handleDelete(expense._id)} className="text-gray-600 hover:text-red-500">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}