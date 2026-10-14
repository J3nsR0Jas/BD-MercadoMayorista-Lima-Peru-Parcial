export function redondear(valor) {
  return Math.round(valor * 100) / 100;
}

export function formatearSoles(monto) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(monto);
}

export const marcado = (valor) => valor === 'on' || valor === true;

export function calcularMontoServicio(d) {
  const area = Number(d.area_m2) || 0;
  const dias = Number(d.dias) || 0;
  const diario = 15.00 * area + (marcado(d.alto_consumo) ? 5.00 : 0);
  return redondear(diario * dias);
}