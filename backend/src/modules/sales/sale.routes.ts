import { Router } from "express";
import { registerSale, getSalesAnalytics, getSales } from "./sale.controller";
import { protect, adminOnly } from "../auth/auth.middleware";

const router = Router();

// GET /api/sales -> Obtener lista de historial (ESTO FALTABA)
router.get("/", protect, adminOnly, getSales);

// POST /api/sales -> Registrar venta (Botón VENDER)
router.post("/", protect, adminOnly, registerSale);

// GET /api/sales/analytics -> Datos para gráficos
router.get("/analytics", protect, adminOnly, getSalesAnalytics);

export default router;