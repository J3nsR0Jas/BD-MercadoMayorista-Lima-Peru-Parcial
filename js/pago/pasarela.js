import { sql } from '../neon-config/neon-config.js';
import { 
  esTarjetaValidaLuhn, esFechaVencimientoValida, esCvvValido, 
  esCelularValido, esCodigoAprobacionValido 
} from './validaciones.js';

export async function procesarPagoPasarela({ idRegistro, idUsuario, metodo, datosMetodo, monto }) {
  const codigoOperacion = 'OP-' + Date.now().toString().slice(-8);

  try {
    if (metodo === 'tarjeta') {
      const { numero, mes, anio, cvv } = datosMetodo;
      const numLimpio = String(numero).replace(/\D/g, '');

      if (!esTarjetaValidaLuhn(numLimpio)) {
        return registrarRechazo(idRegistro, idUsuario, 'tarjeta_debito', 'Número de tarjeta inválido', monto, codigoOperacion);
      }
      if (!esFechaVencimientoValida(mes, anio)) {
        return registrarRechazo(idRegistro, idUsuario, 'tarjeta_debito', 'Tarjeta vencida', monto, codigoOperacion);
      }
      if (!esCvvValido(cvv)) {
        return registrarRechazo(idRegistro, idUsuario, 'tarjeta_debito', 'CVV inválido', monto, codigoOperacion);
      }

      const tarjetas = await sql`
        SELECT t.*, c.saldo_disponible 
        FROM banco_tarjetas t
        JOIN banco_cuentas c ON t.id_cuenta = c.id
        WHERE t.numero = ${numLimpio} AND t.cvv = ${String(cvv).trim()};
      `;

      if (tarjetas.length === 0) {
        return registrarRechazo(idRegistro, idUsuario, 'tarjeta_debito', 'Tarjeta no encontrada o datos incorrectos', monto, codigoOperacion);
      }

      const tarjeta = tarjetas[0];

      if (tarjeta.estado !== 'activa') {
        return registrarRechazo(idRegistro, idUsuario, 'tarjeta_' + tarjeta.tipo, 'Tarjeta bloqueada', monto, codigoOperacion, tarjeta.marca);
      }

      if (Number(tarjeta.saldo_disponible) < Number(monto)) {
        return registrarRechazo(idRegistro, idUsuario, 'tarjeta_' + tarjeta.tipo, 'Saldo insuficiente', monto, codigoOperacion, tarjeta.marca);
      }

      await sql`
        UPDATE banco_cuentas 
        SET saldo_disponible = saldo_disponible - ${monto}
        WHERE id = ${tarjeta.id_cuenta};
      `;

      const tipoMetodo = tarjeta.tipo === 'credito' ? 'tarjeta_credito' : 'tarjeta_debito';
      return registrarAprobado(idRegistro, idUsuario, tipoMetodo, monto, codigoOperacion, tarjeta.marca, null, 'pasarela');

    } else if (metodo === 'billetera') {
      const { proveedor, celular, codigoAprobacion } = datosMetodo;

      if (!esCelularValido(celular)) {
        return registrarRechazo(idRegistro, idUsuario, 'billetera', 'Número de celular inválido', monto, codigoOperacion, null, proveedor);
      }
      if (!esCodigoAprobacionValido(codigoAprobacion)) {
        return registrarRechazo(idRegistro, idUsuario, 'billetera', 'Código de aprobación inválido (debe ser 6 dígitos)', monto, codigoOperacion, null, proveedor);
      }

      const billeteras = await sql`
        SELECT * FROM billeteras 
        WHERE proveedor = ${proveedor} AND celular = ${String(celular).trim()} AND codigo_aprobacion = ${String(codigoAprobacion).trim()};
      `;

      if (billeteras.length === 0) {
        return registrarRechazo(idRegistro, idUsuario, 'billetera', 'Billetera no encontrada o código incorrecto', monto, codigoOperacion, null, proveedor);
      }

      const billetera = billeteras[0];

      if (Number(billetera.saldo_disponible) < Number(monto)) {
        return registrarRechazo(idRegistro, idUsuario, 'billetera', 'Saldo insuficiente en billetera', monto, codigoOperacion, null, proveedor);
      }

      await sql`
        UPDATE billeteras 
        SET saldo_disponible = saldo_disponible - ${monto}
        WHERE id = ${billetera.id};
      `;

      return registrarAprobado(idRegistro, idUsuario, 'billetera', monto, codigoOperacion, null, proveedor, 'pasarela');
    }

  } catch (error) {
    console.error('Error procesando pago:', error);
    return { exito: false, mensaje: 'Error interno procesando el pago.' };
  }
}

async function registrarAprobado(idRegistro, idUsuario, metodo, monto, codigoOp, marca, proveedor, canal) {
  await sql`
    INSERT INTO pagos (codigo_operacion, id_registro, id_usuario, canal, metodo, marca_tarjeta, proveedor_billetera, monto, estado)
    VALUES (${codigoOp}, ${idRegistro}, ${idUsuario || null}, ${canal}, ${metodo}, ${marca || null}, ${proveedor || null}, ${monto}, 'aprobado');
  `;

  await sql`
    UPDATE interested_merchants 
    SET estado_pago = 'pagado', canal_pago = ${canal}, fecha_pago = NOW()
    WHERE id = ${idRegistro};
  `;

  return { exito: true, codigoOperacion: codigoOp };
}

async function registrarRechazo(idRegistro, idUsuario, metodo, motivo, monto, codigoOp, marca, proveedor) {
  await sql`
    INSERT INTO pagos (codigo_operacion, id_registro, id_usuario, canal, metodo, marca_tarjeta, proveedor_billetera, monto, estado, motivo_rechazo)
    VALUES (${codigoOp}, ${idRegistro}, ${idUsuario || null}, 'pasarela', ${metodo}, ${marca || null}, ${proveedor || null}, ${monto}, 'rechazado', ${motivo});
  `;

  return { exito: false, mensaje: motivo, codigoOperacion: codigoOp };
}