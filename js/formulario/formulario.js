import { neon } from 'https://esm.sh/@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_zdlU6G7LExeY@ep-flat-voice-b5koa41r-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

function recalcularTarifa() {
  const inputArea = document.getElementById('area-puesto');
  const inputDias = document.getElementById('dias-alquiler');
  const elemMonto = document.getElementById('monto-calculado');

  const area = parseFloat(inputArea ? inputArea.value : 1) || 1;
  const dias = parseInt(inputDias ? inputDias.value : 1) || 1;

  const total = area * dias * 20;

  if (elemMonto) {
    elemMonto.textContent = `S/ ${total.toFixed(2)}`;
  }
  return total;
}

document.addEventListener('DOMContentLoaded', () => {
  const inputArea = document.getElementById('area-puesto');
  const inputDias = document.getElementById('dias-alquiler');
  const form = document.getElementById('form-solicitud');

  if (inputArea) {
    inputArea.addEventListener('input', recalcularTarifa);
    inputArea.addEventListener('change', recalcularTarifa);
  }
  if (inputDias) {
    inputDias.addEventListener('input', recalcularTarifa);
    inputDias.addEventListener('change', recalcularTarifa);
  }

  recalcularTarifa();

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const btn = document.getElementById('btn-continuar');
      if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ Avanzando al Paso 2...';
      }

      const linea1 = document.querySelector('.line-1');
      const paso1 = document.querySelector('.step-1');
      const paso2 = document.querySelector('.step-2');

      if (paso1) paso1.classList.add('completado');
      if (linea1) linea1.classList.add('activa');
      if (paso2) paso2.classList.add('activo');

      const idGenerado = Date.now();
      const nombre = document.getElementById('nombre-razon')?.value || 'Comerciante';
      const producto = document.getElementById('producto-principal')?.value || 'General';
      const telefono = document.getElementById('telefono-contacto')?.value || '000000000';
      const area = parseFloat(document.getElementById('area-puesto')?.value || 1);
      const dias = parseInt(document.getElementById('dias-alquiler')?.value || 1);
      const montoTotal = recalcularTarifa();

      try {
        const sql = neon(DATABASE_URL, { disableWarningInBrowsers: true });
        sql`
          INSERT INTO interested_merchants (business_name, main_product, phone, area_m2, dias, monto_calculado, estado_pago)
          VALUES (${nombre}, ${producto}, ${telefono}, ${area}, ${dias}, ${montoTotal}, 'pendiente')
        `.catch(err => console.warn('Neon:', err));
      } catch (err) {
        console.warn('DB:', err);
      }

      setTimeout(() => {
        window.location.href = `pago.html?id=${idGenerado}`;
      }, 300);
    });
  }
});