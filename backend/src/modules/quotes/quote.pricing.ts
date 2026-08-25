/**
 * Estimador de cotización de impresión 3D. No es un slicer: aproxima peso y
 * tiempo a partir del bounding box + solidez + relleno. Las tarifas están en
 * ARS y se pueden ajustar acá (o exponer en Settings más adelante).
 */

export const MATERIALS: Record<string, { label: string; density: number; costPerKg: number }> = {
  PLA: { label: 'PLA', density: 1.24, costPerKg: 22000 },
  PETG: { label: 'PETG', density: 1.27, costPerKg: 26000 },
  ABS: { label: 'ABS', density: 1.04, costPerKg: 25000 },
  TPU: { label: 'TPU flexible', density: 1.21, costPerKg: 38000 },
  RESINA: { label: 'Resina', density: 1.1, costPerKg: 45000 },
};

export const RATES = {
  machinePerHour: 1500,
  throughputGramsPerHour: 13,
  setupLabor: 2500,
  postProcessPerUnit: 800,
  margin: 2.3,
  finishMultiplier: { estandar: 1, premium: 1.35 } as Record<string, number>,
  rushMultiplier: 1.4,
  minPrice: 3000,
  roundTo: 500,
};

export const SOLIDITY_FACTOR: Record<string, number> = { hueco: 0.12, normal: 0.24, solido: 0.55 };

export interface QuoteInput {
  material: string;
  dimensionsMm: { x: number; y: number; z: number };
  solidity: string;
  infill: number;
  quantity: number;
  finish: string;
  rush: boolean;
}

export interface QuoteEstimate {
  weightGrams: number;
  printHours: number;
  materialCost: number;
  machineCost: number;
  laborCost: number;
  unitPrice: number;
  total: number;
}

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

export function estimateQuote(input: QuoteInput): QuoteEstimate {
  const mat = MATERIALS[input.material] || MATERIALS.PLA;
  const { x = 0, y = 0, z = 0 } = input.dimensionsMm || {};
  const volCm3 = Math.max(0, (x * y * z) / 1000);

  const base = SOLIDITY_FACTOR[input.solidity] ?? SOLIDITY_FACTOR.normal;
  const materialFraction = Math.min(0.9, base + (Math.max(0, Math.min(100, input.infill)) / 100) * 0.25);

  const weightGrams = Math.max(1, volCm3 * mat.density * materialFraction);
  const printHours = weightGrams / RATES.throughputGramsPerHour;

  const materialCost = (weightGrams / 1000) * mat.costPerKg;
  const machineCost = printHours * RATES.machinePerHour;
  const qty = Math.max(1, Math.round(input.quantity) || 1);
  const laborCost = RATES.setupLabor + RATES.postProcessPerUnit * qty;

  let unit = (materialCost + machineCost) * RATES.margin;
  unit *= RATES.finishMultiplier[input.finish] ?? 1;
  if (input.rush) unit *= RATES.rushMultiplier;
  unit = Math.max(RATES.minPrice, roundTo(unit, RATES.roundTo));

  const total = roundTo(unit * qty + laborCost, RATES.roundTo);

  return {
    weightGrams: Math.round(weightGrams),
    printHours: Math.round(printHours * 10) / 10,
    materialCost: Math.round(materialCost),
    machineCost: Math.round(machineCost),
    laborCost: Math.round(laborCost),
    unitPrice: unit,
    total,
  };
}
