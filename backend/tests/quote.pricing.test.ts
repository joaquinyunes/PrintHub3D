import { estimateQuote } from '../src/modules/quotes/quote.pricing';

describe('estimateQuote', () => {
  const base = {
    material: 'PLA',
    dimensionsMm: { x: 80, y: 80, z: 60 },
    solidity: 'normal',
    infill: 20,
    quantity: 1,
    finish: 'estandar',
    rush: false,
  };

  it('devuelve un presupuesto coherente para una pieza estándar', () => {
    const e = estimateQuote(base);
    expect(e.weightGrams).toBeGreaterThan(0);
    expect(e.printHours).toBeGreaterThan(0);
    expect(e.unitPrice).toBeGreaterThanOrEqual(3000); // minPrice
    expect(e.total).toBeGreaterThanOrEqual(e.unitPrice);
  });

  it('una pieza sólida pesa y cuesta más que una hueca', () => {
    const hueca = estimateQuote({ ...base, solidity: 'hueco' });
    const solida = estimateQuote({ ...base, solidity: 'solido' });
    expect(solida.weightGrams).toBeGreaterThan(hueca.weightGrams);
    expect(solida.total).toBeGreaterThan(hueca.total);
  });

  it('el recargo por urgente sube el precio unitario', () => {
    const normal = estimateQuote(base);
    const urgente = estimateQuote({ ...base, rush: true });
    expect(urgente.unitPrice).toBeGreaterThan(normal.unitPrice);
  });

  it('la resina es más cara que el PLA a igual volumen', () => {
    const pla = estimateQuote({ ...base, material: 'PLA' });
    const resina = estimateQuote({ ...base, material: 'RESINA' });
    expect(resina.materialCost).toBeGreaterThan(pla.materialCost);
  });

  it('más cantidad → total proporcionalmente mayor', () => {
    const uno = estimateQuote({ ...base, quantity: 1 });
    const diez = estimateQuote({ ...base, quantity: 10 });
    expect(diez.total).toBeGreaterThan(uno.total * 5);
  });
});
