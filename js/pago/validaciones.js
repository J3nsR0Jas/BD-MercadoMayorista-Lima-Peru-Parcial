export function esTarjetaValidaLuhn(numero) {
  const limpio = String(numero).replace(/\D/g, '');
  if (limpio.length < 13 || limpio.length > 19) return false;
  
  let suma = 0;
  let alternar = false;
  for (let i = limpio.length - 1; i >= 0; i--) {
    let n = parseInt(limpio.charAt(i), 10);
    if (alternar) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    suma += n;
    alternar = !alternar;
  }
  return suma % 10 === 0;
}

export function esFechaVencimientoValida(mes, anio) {
  const m = Number(mes);
  const a = Number(anio);
  if (!m || !a || m < 1 || m > 12) return false;

  const anioCompleto = a < 100 ? 2000 + a : a;
  const hoy = new Date();
  const anioActual = hoy.getFullYear();
  const mesActual = hoy.getMonth() + 1;

  if (anioCompleto < anioActual) return false;
  if (anioCompleto === anioActual && m < mesActual) return false;
  return true;
}

export function esCvvValido(cvv) {
  return /^\d{3,4}$/.test(String(cvv).trim());
}

export function esCelularValido(celular) {
  return /^9\d{8}$/.test(String(celular).trim());
}

export function esCodigoAprobacionValido(codigo) {
  return /^\d{6}$/.test(String(codigo).trim());
}