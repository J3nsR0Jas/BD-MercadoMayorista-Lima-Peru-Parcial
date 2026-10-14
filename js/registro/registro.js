import { sql } from '../neon-config/neon-config.js';
import { calcularMontoServicio, formatearSoles, marcado } from './tarifario.js';

export async function guardarRegistro(datos) {
  try {
    const codigo = 'COD-' + Date.now().toString().slice(-8);
    const monto = calcularMontoServicio(datos);
    const estadoPago = monto === 0 ? 'exonerado' : 'pendiente';

    let resultado = [];
    try {
      resultado = await sql`
        INSERT INTO interested_merchants (
          business_name, main_product, phone, status, 
          area_m2, dias, alto_consumo, monto_calculado, estado_pago, codigo_seguimiento
        )
        VALUES (
          ${datos.nombre_comerciante}, ${datos.producto}, ${datos.contacto}, 'registrado',
          ${Number(datos.area_m2)}, ${Number(datos.dias)}, ${marcado(datos.alto_consumo)}, ${monto}, ${estadoPago}, ${codigo}
        )
        RETURNING id;
      `;
    } catch (e1) {
      try {
        resultado = await sql`
          INSERT INTO interested_merchants (
            razon_social, producto, telefono, estado, 
            area_m2, dias, alto_consumo, monto_calculado, estado_pago, codigo_seguimiento
          )
          VALUES (
            ${datos.nombre_comerciante}, ${datos.producto}, ${datos.contacto}, 'registrado',
            ${Number(datos.area_m2)}, ${Number(datos.dias)}, ${marcado(datos.alto_consumo)}, ${monto}, ${estadoPago}, ${codigo}
          )
          RETURNING id;
        `;
      } catch (e2) {
        resultado = await sql`
          INSERT INTO interested_merchants (
            business_name, main_product, phone, status
          )
          VALUES (
            ${datos.nombre_comerciante}, ${datos.producto}, ${datos.contacto}, 'registrado'
          )
          RETURNING id;
        `;
      }
    }

    return { exito: true, codigo: codigo, id: resultado[0]?.id, estadoPago: estadoPago };
  } catch (error) {
    console.error('Error al registrar comerciante:', error);
    return { exito: false, mensaje: error.message };
  }
}

async function cargarClima() {
  const tempElem = document.getElementById('widget-temp');
  const condElem = document.getElementById('widget-condicion');

  if (!tempElem) return;

  try {
    const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-12.0402&longitude=-76.9602&current_weather=true');
    if (res.ok) {
      const data = await res.json();
      const temp = Math.round(data.current_weather.temperature);
      tempElem.textContent = `${temp}°C`;
      condElem.textContent = 'Actualizado en tiempo real';
    }
  } catch (e) {
    console.log('Usando clima estático de reserva');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  cargarClima();

  const formComerciante = document.getElementById('form-inicio-comerciante') || document.getElementById('form-comerciante') || document.querySelector('form');
  const salidaMonto = document.getElementById('monto-estimado');
  const salidaDetalle = document.getElementById('formula-detalle');

  function actualizarCotizacion() {
    if (!formComerciante) return;
    
    const formData = new FormData(formComerciante);
    const datos = Object.fromEntries(formData);
    
    const monto = calcularMontoServicio(datos);

    if (salidaMonto) {
      salidaMonto.textContent = formatearSoles(monto);
      salidaMonto.classList.remove('monto-animado');
      void salidaMonto.offsetWidth;
      salidaMonto.classList.add('monto-animado');
    }

    if (salidaDetalle) {
      const area = Number(datos.area_m2) || 0;
      const dias = Number(datos.dias) || 0;
      const conAltoConsumo = marcado(datos.alto_consumo);
      const tarifaDiaria = (15 * area) + (conAltoConsumo ? 5 : 0);

      salidaDetalle.innerHTML = `
        <strong>${area} m²</strong> × S/ 15.00 ${conAltoConsumo ? '+ S/ 5.00 (Alto consumo)' : ''} 
        = <strong>${formatearSoles(tarifaDiaria)}/día</strong><br>
        Total por <strong>${dias} día(s)</strong>
      `;
    }
  }

  if (formComerciante) {
    formComerciante.addEventListener('input', actualizarCotizacion);
    formComerciante.addEventListener('change', actualizarCotizacion);
    actualizarCotizacion();

    formComerciante.addEventListener('submit', async (e) => {
      e.preventDefault();

      const inputNombre = document.getElementById('nombre') || formComerciante.querySelectorAll('input')[0];
      const inputProducto = document.getElementById('producto') || formComerciante.querySelectorAll('input')[1];
      const inputContacto = document.getElementById('contacto') || document.getElementById('telefono') || formComerciante.querySelectorAll('input')[2];
      
      const inputArea = document.getElementById('area_m2');
      const inputDias = document.getElementById('dias');
      const inputAltoConsumo = document.getElementById('alto_consumo');

      const datos = {
        nombre_comerciante: inputNombre ? inputNombre.value.trim() : '',
        producto: inputProducto ? inputProducto.value.trim() : '',
        contacto: inputContacto ? inputContacto.value.trim() : '',
        area_m2: inputArea ? inputArea.value : 1,
        dias: inputDias ? inputDias.value : 1,
        alto_consumo: inputAltoConsumo ? inputAltoConsumo.checked : false
      };

      const montoTotal = calcularMontoServicio(datos);

      const confirmar = confirm(
        `📋 CONFIRMACIÓN DE SOLICITUD\n\n` +
        `• Comerciante: ${datos.nombre_comerciante}\n` +
        `• Rubro: ${datos.producto}\n` +
        `• Área Requerida: ${datos.area_m2} m²\n` +
        `• Días de Alquiler: ${datos.dias} día(s)\n` +
        `• Alto Consumo: ${datos.alto_consumo ? 'SÍ (+S/ 5.00/día)' : 'NO'}\n\n` +
        `💰 MONTO TOTAL A PAGAR: S/ ${montoTotal.toFixed(2)}\n\n` +
        `¿Deseas guardar la solicitud y continuar a la pasarela de pago?`
      );

      if (!confirmar) return;

      const res = await guardarRegistro(datos);
      if (res.exito) {
        if (res.estadoPago === 'pendiente') {
          window.location.href = `pago.html?id=${res.id}`;
        } else {
          alert('Registrado con éxito. Código de seguimiento: ' + res.codigo);
          formComerciante.reset();
          actualizarCotizacion();
        }
      } else {
        alert('Error al registrar: ' + res.mensaje);
      }
    });
  }

  const botonesPunto = document.querySelectorAll('.btn-punto');
  const iframeMapa = document.getElementById('gmap-canvas');
  const textoPuerta = document.getElementById('texto-puerta');

  const descripciones = {
    "Puerta 1 - Carga Pesada": "Puerta 1 - Ingreso exclusivo para tráileres y camiones de provincia.",
    "Puerta 2 - Carga Mediana": "Puerta 2 - Acceso para furgones, camionetas y distribuidores locales.",
    "Pabellones A y B - Ventas": "Pabellones A y B - Zona de comercio mayorista de frutas y verduras."
  };

  if (botonesPunto.length > 0) {
    botonesPunto.forEach(btn => {
      btn.addEventListener('click', () => {
        botonesPunto.forEach(b => b.classList.remove('activo'));
        btn.classList.add('activo');

        const puerta = btn.getAttribute('data-puerta');
        const lat = btn.getAttribute('data-lat');
        const lng = btn.getAttribute('data-lng');

        if (iframeMapa) {
          iframeMapa.src = `https://maps.google.com/maps?q=${lat},${lng}&z=16&ie=UTF8&iwloc=&output=embed`;
        }

        if (textoPuerta && descripciones[puerta]) {
          textoPuerta.textContent = descripciones[puerta];
        }
      });
    });
  }
});