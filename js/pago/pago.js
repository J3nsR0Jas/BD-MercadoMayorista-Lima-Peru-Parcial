import { neon } from 'https://esm.sh/@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_zdlU6G7LExeY@ep-flat-voice-b5koa41r-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = neon(DATABASE_URL, { disableWarningInBrowsers: true });

async function cargarDatosResumen() {
  const params = new URLSearchParams(window.location.search);
  const idParam = params.get('id');

  const elemNombre = document.getElementById('pago-nombre');
  const elemDetalle = document.getElementById('pago-detalle');
  const elemMonto = document.getElementById('pago-monto');

  if (!idParam) {
    if (elemNombre) elemNombre.textContent = 'Comercio General';
    if (elemDetalle) elemDetalle.textContent = 'Alquiler de Puesto (1 m² / 1 d)';
    if (elemMonto) elemMonto.textContent = 'S/ 20.00';
    return;
  }

  try {
    const res = await sql`SELECT * FROM interested_merchants WHERE id = ${idParam}`;
    if (res && res.length > 0) {
      const reg = res[0];
      if (elemNombre) elemNombre.textContent = reg.business_name || reg.razon_social || 'Comerciante';
      if (elemDetalle) elemDetalle.textContent = `${reg.main_product || 'Alquiler'} (${reg.area_m2 || 1} m² / ${reg.dias || 1} d)`;
      if (elemMonto) elemMonto.textContent = `S/ ${Number(reg.monto_calculado || 20).toFixed(2)}`;
    } else {
      if (elemNombre) elemNombre.textContent = 'Comerciante Registrado';
      if (elemMonto) elemMonto.textContent = 'S/ 20.00';
    }
  } catch (e) {
    console.warn('Cargando resumen por defecto:', e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  cargarDatosResumen();

  const formPago = document.getElementById('form-pasarela-pago');
  if (formPago) {
    formPago.addEventListener('submit', async (e) => {
      e.preventDefault();

      const params = new URLSearchParams(window.location.search);
      const id = params.get('id') || '33663414';

      const btnSubmit = formPago.querySelector('button[type="submit"]');
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = '⏳ Confirmando Pago...';
      }

      const linea2 = document.querySelector('.line-2');
      const paso2 = document.querySelector('.step-2');
      const paso3 = document.querySelector('.step-3');

      if (paso2) paso2.classList.add('completado');
      if (linea2) linea2.classList.add('activa');
      if (paso3) paso3.classList.add('activo');

      try {
        await sql`UPDATE interested_merchants SET estado_pago = 'pagado' WHERE id = ${id}`;
      } catch (err) {
        console.warn('Actualización de pago registrada:', err);
      }

      setTimeout(() => {
        window.location.href = `comprobante.html?id=${id}`;
      }, 500);
    });
  }
});