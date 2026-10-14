document.addEventListener('DOMContentLoaded', () => {

  // 1. LÓGICA DEL COTIZADOR DE COMPRAS
  const selectProducto = document.getElementById('cot-producto');
  const inputCantidad = document.getElementById('cot-cantidad');
  const txtTotal = document.getElementById('cot-total');

  function calcularCotizacion() {
    if (!selectProducto || !inputCantidad || !txtTotal) return;

    const precioPorKg = parseFloat(selectProducto.value) || 0;
    const numeroSacos = parseInt(inputCantidad.value) || 0;
    
    // Cada saco estándar de mercado mayorista equivale a 50 Kilogramos
    const kilosTotales = numeroSacos * 50;
    const costoTotal = precioPorKg * kilosTotales;

    txtTotal.textContent = `S/ ${costoTotal.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  if (selectProducto && inputCantidad) {
    selectProducto.addEventListener('change', calcularCotizacion);
    inputCantidad.addEventListener('input', calcularCotizacion);
    calcularCotizacion(); // Ejecución inicial
  }

  // 2. LÓGICA DEL FILTRADO POR CATEGORÍAS
  const botonesFiltro = document.querySelectorAll('.btn-filtro');
  const filasTabla = document.querySelectorAll('#tabla-precios tr');

  botonesFiltro.forEach(btn => {
    btn.addEventListener('click', () => {
      // Alternar estilo activo en botones
      botonesFiltro.forEach(b => b.classList.remove('activo'));
      btn.classList.add('activo');

      const categoriaSeleccionada = btn.getAttribute('data-cat');

      // Filtrar filas de la tabla
      filasTabla.forEach(fila => {
        const categoriaFila = fila.getAttribute('data-categoria');

        if (categoriaSeleccionada === 'todos' || categoriaFila === categoriaSeleccionada) {
          fila.style.display = '';
        } else {
          fila.style.display = 'none';
        }
      });
    });
  });

});