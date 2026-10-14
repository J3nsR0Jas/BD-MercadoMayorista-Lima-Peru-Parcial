import { sql } from '../neon-config/neon-config.js';

export async function registrarProducto(nombre, precio, categoria) {
  try {
    await sql`
      INSERT INTO productos (nombre, precio, categoria) 
      VALUES (${nombre}, ${precio}, ${categoria})
    `;
    return { exito: true };
  } catch (error) {
    console.error('Error al registrar producto:', error);
    return { exito: false, mensaje: error.message };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const formProducto = document.getElementById('form-producto');
  if (formProducto) {
    formProducto.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nombre = document.getElementById('prod-nombre').value;
      const precio = document.getElementById('prod-precio').value;
      const categoria = document.getElementById('prod-categoria').value;

      const res = await registrarProducto(nombre, precio, categoria);
      if (res.exito) {
        alert('¡Producto guardado en la nueva tabla de Neon!');
        formProducto.reset();
      } else {
        alert('Error: ' + res.mensaje);
      }
    });
  }
});