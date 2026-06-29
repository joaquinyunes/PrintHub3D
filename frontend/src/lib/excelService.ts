"use client";

import * as XLSX from "xlsx";
import { importPedidos, importVentas, importFilamentos, importGastos, importImpresoras, getPedidos, getVentas, getFilamentos, getGastos, getImpresoras, Pedido, Venta, Filamento, Gasto, Impresora } from "./dataService";

// ─── IMPORT ───
export function importFromExcel(file: File): Promise<{ ok: boolean; message: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        if (workbook.SheetNames.includes("Pedidos")) {
          const rows = XLSX.utils.sheet_to_json<any>(workbook.Sheets["Pedidos"]);
          const pedidos = rows
            .filter((r: any) => r["CLIENTE"] && String(r["CLIENTE"]).trim())
            .map((r: any) => ({
              cliente: String(r["CLIENTE"] || "").trim(),
              telefono: String(r["TELEFONO"] || r["TELÉFONO"] || "").trim(),
              descripcion: String(r["DESCRIPCION"] || "").trim(),
              fechaEntrega: r["FECHA DE ENTREGA"] ? String(r["FECHA DE ENTREGA"]).slice(0, 10) : "",
              total: parseFloat(String(r["Total (ARS)"] || "0").replace(/[^0-9.-]/g, "")) || 0,
              senia: parseFloat(String(r["SEÑA"] || "0").replace(/[^0-9.-]/g, "")) || 0,
              saldo: parseFloat(String(r["SALDO"] || "0").replace(/[^0-9.-]/g, "")) || 0,
              canal: String(r["CANAL"] || "Otro").trim() || "Otro",
              estado: String(r["ESTADO"] || "Pendiente").trim() || "Pendiente",
              items: [],
              createdAt: new Date().toISOString().slice(0, 10),
            }));
          importPedidos(pedidos);
        }

        if (workbook.SheetNames.includes("Ventas")) {
          const rows = XLSX.utils.sheet_to_json<any>(workbook.Sheets["Ventas"]);
          const ventas = rows
            .filter((r: any) => r["PRODUCTO"] && String(r["PRODUCTO"]).trim() !== "PRODUCTO")
            .map((r: any) => ({
              fecha: r["FECHA"] ? String(r["FECHA"]).slice(0, 10) : new Date().toISOString().slice(0, 10),
              producto: String(r["PRODUCTO"] || "").trim(),
              cantidad: parseInt(String(r["CANTIDAD"] || "1")) || 1,
              cliente: String(r["CLIENTE"] || "").trim(),
              formaPago: String(r["FORMA DE PAGO"] || "Efectivo").trim() || "Efectivo",
              total: parseFloat(String(r["TOTAL"] || "0").replace(/[^0-9.-]/g, "")) || 0,
              observaciones: String(r["OBSERVACIONES"] || "").trim(),
              createdAt: new Date().toISOString().slice(0, 10),
            }));
          importVentas(ventas);
        }

        if (workbook.SheetNames.includes("Filamento")) {
          const ws = workbook.Sheets["Filamento"];
          const raw = XLSX.utils.sheet_to_json<any>(ws, { header: 1 });
          const filamentos: Omit<Filamento, "id">[] = [];
          const brands: Record<number, { marca: string; tipo: string; precio: number }> = {};

          for (let r = 0; r < raw.length; r++) {
            const row = raw[r] as any[];
            for (let c = 0; c < (row?.length || 0); c++) {
              const cell = String(row[c] || "").trim();
              if ((cell.includes("PLA") || cell.includes("PETG")) && cell.includes("kg")) {
                const tipo = cell.includes("PETG") ? "PETG" : "PLA";
                const precio = parseFloat(String(row[c + 1] || "0").replace(/[^0-9.-]/g, "")) || 0;
                brands[c] = { marca: cell, tipo, precio };
              }
            }
          }

          for (let r = 1; r < raw.length; r++) {
            const row = raw[r] as any[];
            for (const colIdx of Object.keys(brands).map(Number)) {
              const color = String(row?.[colIdx] || "").trim();
              if (!color || ["PLA", "PETG", "kg", "$", ""].some((x) => color.includes(x))) continue;
              if (color.length < 2) continue;
              const stock = parseInt(String(row?.[colIdx + 1] || "0")) || 0;
              if (stock > 0) {
                filamentos.push({
                  marca: brands[colIdx].marca,
                  tipo: brands[colIdx].tipo,
                  color,
                  stock,
                  precio: brands[colIdx].precio,
                });
              }
            }
          }
          importFilamentos(filamentos);
        }

        if (workbook.SheetNames.includes("Impresoras")) {
          const rows = XLSX.utils.sheet_to_json<any>(workbook.Sheets["Impresoras"]);
          const impresoras = rows
            .filter((r: any) => r["NOMBRE"] && String(r["NOMBRE"]).trim())
            .map((r: any) => ({
              nombre: String(r["NOMBRE"] || "").trim(),
              modelo: String(r["MODELO"] || "").trim(),
              tipo: String(r["TIPO"] || "FDM").trim(),
              mejorPara: String(r["MEJOR PARA"] || "").trim(),
              notas: String(r["NOTAS"] || "").trim(),
              activa: String(r["ACTIVA"] || "SI").trim().toUpperCase() === "SI",
            }));
          importImpresoras(impresoras);
        }

        if (workbook.SheetNames.includes("Gastos")) {
          const ws = workbook.Sheets["Gastos"];
          const raw = XLSX.utils.sheet_to_json<any>(ws, { header: 1 });
          const gastos: Omit<Gasto, "id">[] = [];
          let categoria = "Global 3D";

          for (let r = 0; r < raw.length; r++) {
            const row = raw[r] as any[];
            if (!row) continue;
            const c0 = String(row[0] || "").trim();
            const c3 = String(row[3] || "").trim();

            if (c0.includes("GLOBAL 3D")) categoria = "Global 3D";
            else if (c0.includes("CASA") || c3.includes("CASA")) categoria = "Casa y Valentino";
            else if (c0.includes("PERSONALES")) categoria = "Personales";
            else if (c0 && !["", "GASTOS", "NaN"].includes(c0)) {
              const monto = parseFloat(String(row[1] || "0").replace(/[^0-9.-]/g, "")) || 0;
              if (monto > 0) gastos.push({ categoria, concepto: c0, monto, mes: new Date().toISOString().slice(0, 7) });
            }

            if (categoria === "Global 3D" && c3 && !["", "CASA", "GASTOS"].includes(c3)) {
              const monto = parseFloat(String(row[4] || "0").replace(/[^0-9.-]/g, "")) || 0;
              if (monto > 0) gastos.push({ categoria: "Casa y Valentino", concepto: c3, monto, mes: new Date().toISOString().slice(0, 7) });
            }
          }
          importGastos(gastos);
        }

        resolve({ ok: true, message: `Importado: ${workbook.SheetNames.filter(n => ["Pedidos","Ventas","Filamento","Gastos","Impresoras"].includes(n)).length} hojas` });
      } catch (err: any) {
        resolve({ ok: false, message: err.message || "Error al leer el archivo" });
      }
    };
    reader.onerror = () => resolve({ ok: false, message: "Error al leer el archivo" });
    reader.readAsArrayBuffer(file);
  });
}

// ─── EXPORT ───
export function exportToExcel() {
  const wb = XLSX.utils.book_new();

  // Pedidos
  const pedidos = getPedidos();
  const pedRows = pedidos.map((p) => ({
    "Columna 1": p.id,
    "CLIENTE": p.cliente,
    "TELEFONO": p.telefono || "",
    "PRODUCTO": (p.items || []).map((i) => i.productoNombre).join(", "),
    "DESCRIPCION": p.descripcion,
    "FECHA DE ENTREGA": p.fechaEntrega,
    "Total (ARS)": p.total,
    "SEÑA": p.senia,
    "SALDO": p.saldo,
    "CANAL": p.canal,
    "ESTADO": p.estado,
  }));
  const wsPed = XLSX.utils.json_to_sheet(pedRows);
  XLSX.utils.book_append_sheet(wb, wsPed, "Pedidos");

  // Ventas
  const ventas = getVentas();
  const vtRows = ventas.map((v) => ({
    "FECHA": v.fecha,
    "PRODUCTO": v.producto,
    "CANTIDAD": v.cantidad,
    "CLIENTE": v.cliente,
    "FORMA DE PAGO": v.formaPago,
    "TOTAL": v.total,
    "OBSERVACIONES": v.observaciones,
  }));
  const wsVt = XLSX.utils.json_to_sheet(vtRows);
  XLSX.utils.book_append_sheet(wb, wsVt, "Ventas");

  // Filamento
  const filamentos = getFilamentos();
  const brands = [...new Set(filamentos.map((f) => f.marca))];
  const colors = [...new Set(filamentos.map((f) => f.color))];
  const headerRow = [""];
  const colMap: Record<string, { col: number; marca: string }> = {};

  brands.forEach((b, i) => {
    const col = i * 2 + 1;
    colMap[b] = { col, marca: b };
    headerRow[col] = b;
  });

  const filRows = colors.map((color) => {
    const row: any[] = [color];
    brands.forEach((b) => {
      const f = filamentos.find((f) => f.marca === b && f.color === color);
      row.push(f?.precio || "");
      // col+2 would be stock, but we need to handle it per brand format
    });
    return row;
  });

  // Simpler format: flat list
  const flatFil = filamentos.map((f) => ({
    "Marca": f.marca,
    "Tipo": f.tipo,
    "Color": f.color,
    "Stock (kg)": f.stock,
    "Precio": f.precio,
  }));
  const wsFil = XLSX.utils.json_to_sheet(flatFil);
  XLSX.utils.book_append_sheet(wb, wsFil, "Filamento");

  // Gastos
  const gastos = getGastos();
  const gsRows = gastos.map((g) => ({
    "Categoría": g.categoria,
    "Concepto": g.concepto,
    "Monto": g.monto,
    "Mes": g.mes,
  }));
  const wsGs = XLSX.utils.json_to_sheet(gsRows);
  XLSX.utils.book_append_sheet(wb, wsGs, "Gastos");

  // Impresoras
  const impresoras = getImpresoras();
  const impRows = impresoras.map((i) => ({
    "NOMBRE": i.nombre,
    "MODELO": i.modelo,
    "TIPO": i.tipo,
    "MEJOR PARA": i.mejorPara,
    "NOTAS": i.notas,
    "ACTIVA": i.activa ? "SI" : "NO",
  }));
  const wsImp = XLSX.utils.json_to_sheet(impRows);
  XLSX.utils.book_append_sheet(wb, wsImp, "Impresoras");

  XLSX.writeFile(wb, `PrintHub3D_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
