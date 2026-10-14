import { sql } from '../neon-config/neon-config.js';
import { exigirRol } from '../auth/auth.js';
import { formatearSoles } from '../registro/tarifario.js';

// Exigir rol cajero o administrador
const usuario = exigirRol('cajero') || exigirRol('administrador');

document.addEventListener('DOMContentLoaded', () => {
  const inputBusqueda = document.getElementById('input-busqueda');
  const btnBuscar = document.getElementById('btn-buscar');
  const contenedorResultado = document.getElementById('resultado-busqueda');

  // Formulario de Cobro
  const formCobro = document.getElementById('form-cobro-caja');
  const selectMetodo = document.getElementById('metodo-caja');
  const divEfectivo = document.getElementById('div-efectivo');
  const inputMontoRecibido = document.getElementById('monto-recibido');
  const salidaVuelto = document.getElementById('salida-vuelto');

  let registroSeleccionado = null;

  // 1. Búsqueda de Comercio/Solicitud por DNI o Código
  btnBuscar?.addEventListener('click', async () => {
    const termino = inputBusqueda.value.trim();
    if (!termino) return alert('Ingresa un DNI o código de seguimiento');

    const filas = await sql`
      SELECT im.*, u.dni, u.nombres 
      FROM interested_merchants im
      LEFT JOIN usuarios u ON im.id_usuario = u.id
      WHERE im.codigo_seguimiento ILIKE ${'%' + termino + '%'}
         OR u.dni ILIKE ${'%' + termino + '%'}
         OR im.phone ILIKE ${'%' + termino + '%'}
      LIMIT 5;
    `;

    if (filas.length === 0) {
      contenedorResultado.innerHTML = '<p class="error">No se encontraron registros pendientes.</p>';
      return;
    }

    registroSeleccionado = filas[0];
    mostrarDetalleRegistro(registroSeleccionado);
  });

  function mostrarDetalleRegistro(reg) {
    const esPagado = reg.estado_pago === 'pagado';
    contenedorResultado.innerHTML = `
      <div class="card-detalle">
        <h3>Solicitud: ${reg.codigo_seguimiento || reg.id}</h3>
        <p><strong>Comerciante:</strong> ${reg.business_name || reg.razon_social || 'N/A'}</p>
        <p><strong>Área / Días:</strong> ${reg.area_m2 || 1} m² por ${reg.dias || 1} día(s)</p>
        <p><strong>Monto Total:</strong> <span class="monto">${formatearSoles(reg.monto_calculado)}</span></p>
        <p><strong>Estado Actual:</strong> <span class="badge ${reg.estado_pago}">${reg.estado_pago.toUpperCase()}</span></p>
      </div>
    `;

    if (!esPagado) {
      formCobro.style.display = 'block';
    } else {
      formCobro.style.display = 'none';
    }
  }

  // 2. Control del campo Efectivo / Vuelto
  selectMetodo?.addEventListener('change', () => {
    if (selectMetodo.value === 'efectivo') {
      divEfectivo.style.display = 'block';
    } else {
      divEfectivo.style.display = 'none';
    }
  });

  inputMontoRecibido?.addEventListener('input', () => {
    if (!registroSeleccionado) return;
    const recibido = Number(inputMontoRecibido.value) || 0;
    const aPagar = Number(registroSeleccionado.monto_calculado);
    const vuelto = Math.max(0, recibido - aPagar);
    salidaVuelto.textContent = formatearSoles(vuelto);
  });

  // 3. Procesar Cobro Presencial
  formCobro?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!registroSeleccionado) return;

    const metodo = selectMetodo.value;
    const monto = Number(registroSeleccionado.monto_calculado);
    const recibido = metodo === 'efectivo' ? Number(inputMontoRecibido.value) : monto;
    const vuelto = metodo === 'efectivo' ? Math.max(0, recibido - monto) : 0;

    if (metodo === 'efectivo' && recibido < monto) {
      alert('El monto recibido es menor al total a pagar.');
      return;
    }

    const codigoOp = 'OP-CAJA-' + Date.now().toString().slice(-6);

    try {
      // Registrar pago
      await sql`
        INSERT INTO pagos (
          codigo_operacion, id_registro, id_usuario, canal, metodo, 
          monto, monto_recibido, vuelto, estado, id_cajero
        )
        VALUES (
          ${codigoOp}, ${registroSeleccionado.id}, ${registroSeleccionado.id_usuario || null}, 
          'caja', ${metodo}, ${monto}, ${recibido}, ${vuelto}, 'aprobado', ${usuario?.id || null}
        );
      `;

      // Actualizar estado de la solicitud
      await sql`
        UPDATE interested_merchants 
        SET estado_pago = 'pagado', canal_pago = 'caja', fecha_pago = NOW()
        WHERE id = ${registroSeleccionado.id};
      `;

      alert(`¡Cobro registrado con éxito! Vuelto: ${formatearSoles(vuelto)}`);
      window.location.href = `comprobante.html?id=${registroSeleccionado.id}`;

    } catch (err) {
      console.error(err);
      alert('Error al registrar cobro presencial.');
    }
  });

  // 4. Verificación de Transacciones Web en tiempo real (Polling cada 15s)
  async function cargarPagosWebPendientes() {
    const lista = document.getElementById('lista-pagos-web');
    if (!lista) return;

    const pagosWeb = await sql`
      SELECT p.*, im.codigo_seguimiento, im.business_name
      FROM pagos p
      JOIN interested_merchants im ON p.id_registro = im.id
      WHERE p.canal = 'pasarela' AND p.verificado = false AND p.estado = 'aprobado'
      ORDER BY p.fecha_pago DESC
      LIMIT 10;
    `;

    if (pagosWeb.length === 0) {
      lista.innerHTML = '<li>No hay pagos en línea pendientes de verificación.</li>';
      return;
    }

    lista.innerHTML = pagosWeb.map(p => `
      <li>
        <span><strong>${p.codigo_operacion}</strong> - ${p.business_name || 'Comerciante'} (${formatearSoles(p.monto)})</span>
        <button class="btn-verificar" data-id="${p.id}">Verificar</button>
      </li>
    `).join('');

    document.querySelectorAll('.btn-verificar').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const idPago = e.target.getAttribute('data-id');
        await sql`
          UPDATE pagos 
          SET verificado = true, verificado_por = ${usuario?.id || null}, fecha_verificacion = NOW()
          WHERE id = ${idPago};
        `;
        alert('Transacción verificada correctamente.');
        cargarPagosWebPendientes();
      });
    });
  }

  cargarPagosWebPendientes();
  setInterval(cargarPagosWebPendientes, 15000); // Polling cada 15 segundos
});