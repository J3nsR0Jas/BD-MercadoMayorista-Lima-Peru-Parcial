import { neon } from 'https://esm.sh/@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_zdlU6G7LExeY@ep-flat-voice-b5koa41r-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  const elemCodigo = document.getElementById('comp-codigo') || document.querySelector('[id*="codigo"]');
  const elemFecha = document.getElementById('comp-fecha') || document.querySelector('[id*="fecha"]');
  const elemNombre = document.getElementById('comp-nombre') || document.querySelector('[id*="comerciante"]');
  const elemDetalle = document.getElementById('comp-detalle') || document.querySelector('[id*="detalle"]');
  const elemMonto = document.getElementById('comp-monto') || document.querySelector('[id*="monto"]');
  const btnImprimir = document.getElementById('btn-imprimir');

  const ahora = new Date();
  const fechaFormateada = ahora.toLocaleDateString('es-PE') + ' ' + ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  const codigoOperacion = `OP-${id || Date.now().toString().slice(-6)}`;

  const filas = document.querySelectorAll('.linea-resumen, p, span, td, div');

  let nombreCargado = 'Comerciante Registrado';
  let montoCargado = 'S/ 20.00';
  let detalleCargado = 'Alquiler de Puesto (1 m² x 1 día)';

  if (id && !isNaN(id)) {
    try {
      const sql = neon(DATABASE_URL, { disableWarningInBrowsers: true });
      const rows = await sql`
        SELECT business_name, main_product, area_m2, dias, monto_calculado 
        FROM interested_merchants 
        WHERE id = ${parseInt(id)}
      `;

      if (rows && rows.length > 0) {
        const datos = rows[0];
        nombreCargado = datos.business_name || nombreCargado;
        montoCargado = `S/ ${parseFloat(datos.monto_calculado || 20).toFixed(2)}`;
        detalleCargado = `Puesto de ${datos.main_product || 'Varios'} (${datos.area_m2 || 1}m² por ${datos.dias || 1} día(s))`;
      }
    } catch (err) {
      console.warn('Neon comprobante:', err);
    }
  }

  document.querySelectorAll('*').forEach(el => {
    if (el.children.length === 0) {
      if (el.textContent.includes('Cargando...')) {
        const textoPadre = el.parentElement ? el.parentElement.textContent : '';
        if (textoPadre.includes('Código') || textoPadre.includes('Operación')) {
          el.textContent = codigoOperacion;
        } else if (textoPadre.includes('Fecha')) {
          el.textContent = fechaFormateada;
        } else if (textoPadre.includes('Comerciante')) {
          el.textContent = nombreCargado;
        } else if (textoPadre.includes('Detalle')) {
          el.textContent = detalleCargado;
        } else {
          el.textContent = codigoOperacion;
        }
      } else if (el.textContent.trim() === 'S/ 0.00') {
        el.textContent = montoCargado;
      }
    }
  });

  if (btnImprimir) {
    btnImprimir.addEventListener('click', () => {
      window.print();
    });
  }
});