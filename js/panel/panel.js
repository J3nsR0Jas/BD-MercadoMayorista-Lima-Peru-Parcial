import { neon } from 'https://esm.sh/@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_zdlU6G7LExeY@ep-flat-voice-b5koa41r-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';  

const sql = neon(DATABASE_URL, { disableWarningInBrowsers: true });
let datosCargados = [];

// Determina el turno en tiempo real según la hora actual de Perú (UTC-5)
function obtenerTurnoActualReloj() {
  const hora = new Date().getHours();
  if (hora >= 6 && hora < 14) {
    return 'manana';
  } else if (hora >= 14 && hora < 22) {
    return 'tarde';
  } else {
    return 'noche';
  }
}

function limpiarTexto(texto) {
  return (texto || '')
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n");
}

function evaluarPermisoAcceso() {
  // 1. Recuperar credenciales e información de la sesión
  const correoRaw = sessionStorage.getItem('usuario_email') || 
                    sessionStorage.getItem('email') || 
                    localStorage.getItem('usuario_email') || 
                    localStorage.getItem('email') || '';

  const nombreRaw = sessionStorage.getItem('usuario_nombre') || 
                    sessionStorage.getItem('nombre') || 
                    localStorage.getItem('usuario_nombre') || '';

  const rolRaw = sessionStorage.getItem('usuario_rol') || 
                 sessionStorage.getItem('rol') || 
                 localStorage.getItem('usuario_rol') || '';

  const correo = limpiarTexto(correoRaw);
  const rol = limpiarTexto(rolRaw);

  // 2. Mapeo de credenciales registradas en la tabla de Neon DB
  const MAPA_USUARIOS = {
    '61232134@continental.edu.pe': { nombre: 'Jens Ahmed', rol: 'administrador', turno: 'admin' },
    'jensahmedrojas@gmail.com': { nombre: 'Alex', rol: 'administrador', turno: 'admin' },
    '76540975@continental.edu.pe': { nombre: 'juan', rol: 'empleado', turno: 'manana' },
    'mercedez@gmail.com': { nombre: 'roberto Sanchez', rol: 'empleado', turno: 'tarde' },
    '15254578@gmail.com': { nombre: 'Jack Yover', rol: 'empleado', turno: 'noche' }
  };

  // Buscar el usuario por su correo registrado o usar los datos disponibles
  const usuarioInfo = MAPA_USUARIOS[correo] || {
    nombre: nombreRaw || 'Usuario',
    rol: rol || 'empleado',
    turno: sessionStorage.getItem('usuario_turno') || 'tarde'
  };

  const ahora = new Date();
  const horaFormateada = ahora.toLocaleTimeString('es-PE', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit', 
    hour12: true 
  });

  const nombresTurno = {
    manana: 'Mañana (06:00 - 14:00)',
    tarde: 'Tarde (14:00 - 22:00)',
    noche: 'Noche (22:00 - 06:00)'
  };

  // 3. ROL ADMINISTRADOR (Jens Ahmed / Alex) -> Acceso ilimitado 24/7 sin restricción de turno
  if (usuarioInfo.rol === 'administrador' || rol.includes('admin')) {
    return { 
      permitido: true, 
      mensaje: `👑 Administrador: ${usuarioInfo.nombre} | Acceso Total 24/7 (Hora Perú: ${horaFormateada})` 
    };
  }

  // 4. ROL EMPLEADO (juan, roberto Sanchez, Jack Yover) -> Evaluación por turno y reloj
  const turnoReloj = obtenerTurnoActualReloj();
  const turnoEmpleado = usuarioInfo.turno;

  if (turnoEmpleado === turnoReloj) {
    return { 
      permitido: true, 
      mensaje: `👤 Empleado: ${usuarioInfo.nombre} | Turno Habilitado: ${nombresTurno[turnoEmpleado]} | Hora actual: ${horaFormateada}` 
    };
  } else {
    return { 
      permitido: false, 
      mensaje: `🔒 Acceso Restringido: ${usuarioInfo.nombre} | Tu Turno es: ${nombresTurno[turnoEmpleado]} | Hora actual: ${horaFormateada}` 
    };
  }
}

function aplicarRestriccionesDeTurno() {
  const permiso = evaluarPermisoAcceso();
  const bannerInfo = document.getElementById('info-turno-usuario');
  const bannerBadge = document.getElementById('estado-permiso-turno');
  const btnNuevo = document.getElementById('btn-nuevo-registro');

  if (bannerInfo) bannerInfo.textContent = permiso.mensaje;

  if (!permiso.permitido) {
    if (bannerBadge) {
      bannerBadge.innerHTML = `<span style="background:#ef4444; color:white; padding:6px 14px; border-radius:12px; font-weight:bold; font-size: 0.85rem;">🔴 Edición Bloqueada</span>`;
    }
    if (btnNuevo) {
      btnNuevo.disabled = true;
      btnNuevo.style.opacity = '0.5';
      btnNuevo.style.cursor = 'not-allowed';
    }

    document.querySelectorAll('.btn-edit, .btn-delete').forEach(btn => {
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
      btn.title = 'Acción restringida fuera de tu turno laboral.';
    });
  } else {
    if (bannerBadge) {
      bannerBadge.innerHTML = `<span style="background:#22c55e; color:white; padding:6px 14px; border-radius:12px; font-weight:bold; font-size: 0.85rem;">🟢 Acceso Habilitado</span>`;
    }
    if (btnNuevo) {
      btnNuevo.disabled = false;
      btnNuevo.style.opacity = '1';
      btnNuevo.style.cursor = 'pointer';
    }

    document.querySelectorAll('.btn-edit, .btn-delete').forEach(btn => {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
      btn.title = '';
    });
  }
}

function renderizarTabla(lista) {
  const tbody = document.getElementById('tabla-registros');
  if (!tbody) return;

  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="loading-cell">No hay registros que coincidan.</td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(row => {
    const codigo = row.codigo_seguimiento || `COD-${row.id}`;
    const razon = row.business_name || row.razon_social || row.nombre_comercial || 'Comerciante';
    const producto = row.main_product || row.producto_principal || row.producto || '-';
    const telefono = row.phone || row.telefono || row.celular || '-';
    const area = row.area_m2 ? `${row.area_m2} m²` : '1 m²';
    const dias = row.dias ? `${row.dias} d` : '1 d';
    const monto = row.monto_calculado ? `S/ ${Number(row.monto_calculado).toFixed(2)}` : 'S/ 0.00';
    const estadoPago = (row.estado_pago || row.status || row.estado || 'pendiente').toLowerCase();
    
    const badgeClass = estadoPago === 'pagado' ? 'badge-pagado' : (estadoPago === 'exonerado' ? 'badge-exonerado' : 'badge-pendiente');

    return `
      <tr>
        <td><strong>${codigo}</strong></td>
        <td>${razon}</td>
        <td>${producto}</td>
        <td>${telefono}</td>
        <td>${area} / ${dias}</td>
        <td class="monto-resaltado">${monto}</td>
        <td>
          <span class="badge ${badgeClass}">
            ${estadoPago.toUpperCase()}
          </span>
        </td>
        <td class="acciones-celda">
          <button class="btn-edit" data-id="${row.id}">Editar</button>
          <button class="btn-delete" data-id="${row.id}">Eliminar</button>
        </td>
      </tr>
    `;
  }).join('');

  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      abrirModalEdicion(id);
    });
  });

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      eliminarRegistro(id);
    });
  });

  aplicarRestriccionesDeTurno();
}

async function cargarDatos() {
  const tbody = document.getElementById('tabla-registros');
  if (!tbody) return;

  try {
    try {
      datosCargados = await sql`SELECT * FROM interested_merchants ORDER BY id DESC`;
    } catch (e) {
      datosCargados = await sql`SELECT * FROM usuarios ORDER BY id DESC`;
    }

    renderizarTabla(datosCargados);

  } catch (error) {
    console.error('Error al cargar la lista:', error);
    tbody.innerHTML = `<tr><td colspan="8" class="loading-cell" style="color:#ef4444;">Error al cargar datos de Neon: ${error.message}</td></tr>`;
  }
}

async function eliminarRegistro(id) {
  const permiso = evaluarPermisoAcceso();
  if (!permiso.permitido) {
    alert('Acción DENEGADA: Tu cuenta de empleado no se encuentra en su turno de trabajo activo.');
    return;
  }

  const confirmacion = confirm(`¿Estás seguro de que deseas eliminar el registro #${id}?`);
  if (!confirmacion) return;

  try {
    try {
      await sql`DELETE FROM interested_merchants WHERE id = ${id}`;
    } catch (e) {
      await sql`DELETE FROM usuarios WHERE id = ${id}`;
    }

    alert('¡Registro eliminado correctamente de Neon!');
    cargarDatos();
  } catch (error) {
    console.error('Error al eliminar registro:', error);
    alert('Error al intentar eliminar el registro.');
  }
}

function abrirModalEdicion(id) {
  const permiso = evaluarPermisoAcceso();
  if (!permiso.permitido) {
    alert('Acción DENEGADA: Tu cuenta de empleado no se encuentra en su turno de trabajo activo.');
    return;
  }

  const registro = datosCargados.find(r => r.id == id);
  if (!registro) return;

  document.getElementById('edit-id').value = registro.id;
  document.getElementById('edit-razon').value = registro.business_name || registro.razon_social || registro.nombre_comercial || '';
  document.getElementById('edit-telefono').value = registro.phone || registro.telefono || registro.celular || '';
  
  const valEstado = (registro.estado_pago || registro.status || registro.estado || 'pendiente').toLowerCase();
  document.getElementById('edit-estado').value = valEstado;

  const modal = document.getElementById('modal-editar');
  if (modal) modal.style.display = 'flex';
}

const btnCancelarEdit = document.getElementById('btn-cancelar-modal');
if (btnCancelarEdit) {
  btnCancelarEdit.addEventListener('click', () => {
    document.getElementById('modal-editar').style.display = 'none';
  });
}

const formEditar = document.getElementById('form-editar');
if (formEditar) {
  formEditar.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('edit-id').value;
    const razon = document.getElementById('edit-razon').value.trim();
    const telefono = document.getElementById('edit-telefono').value.trim();
    const nuevoEstadoPago = document.getElementById('edit-estado').value;

    try {
      try {
        await sql`
          UPDATE interested_merchants 
          SET business_name = ${razon}, 
              phone = ${telefono}, 
              estado_pago = ${nuevoEstadoPago},
              status = ${nuevoEstadoPago}
          WHERE id = ${id}
        `;
      } catch (e1) {
        await sql`
          UPDATE interested_merchants 
          SET razon_social = ${razon}, 
              telefono = ${telefono}, 
              estado_pago = ${nuevoEstadoPago},
              estado = ${nuevoEstadoPago}
          WHERE id = ${id}
        `;
      }

      alert('¡Estado de pago actualizado correctamente!');
      document.getElementById('modal-editar').style.display = 'none';
      cargarDatos();
    } catch (error) {
      console.error('Error al actualizar:', error);
      alert('Error al actualizar el registro en Neon: ' + error.message);
    }
  });
}

const btnNuevo = document.getElementById('btn-nuevo-registro');
const modalNuevo = document.getElementById('modal-nuevo');
const btnCancelarNuevo = document.getElementById('btn-cancelar-nuevo');
const formNuevo = document.getElementById('form-nuevo');

if (btnNuevo && modalNuevo) {
  btnNuevo.addEventListener('click', () => {
    const permiso = evaluarPermisoAcceso();
    if (!permiso.permitido) {
      alert('Acción DENEGADA: Tu cuenta de empleado no se encuentra en su turno de trabajo activo.');
      return;
    }
    modalNuevo.style.display = 'flex';
  });
}

if (btnCancelarNuevo && modalNuevo) {
  btnCancelarNuevo.addEventListener('click', () => {
    modalNuevo.style.display = 'none';
  });
}

if (formNuevo) {
  formNuevo.addEventListener('submit', async (e) => {
    e.preventDefault();

    const razon = document.getElementById('nuevo-razon').value.trim();
    const producto = document.getElementById('nuevo-producto').value.trim();
    const telefono = document.getElementById('nuevo-telefono').value.trim();

    try {
      try {
        await sql`
          INSERT INTO interested_merchants (business_name, main_product, phone, status, estado_pago)
          VALUES (${razon}, ${producto}, ${telefono}, 'registrado', 'pendiente')
        `;
      } catch (e1) {
        await sql`
          INSERT INTO interested_merchants (razon_social, producto_principal, telefono, estado, estado_pago)
          VALUES (${razon}, ${producto}, ${telefono}, 'registrado', 'pendiente')
        `;
      }

      alert('¡Nuevo comerciante añadido con éxito!');
      formNuevo.reset();
      modalNuevo.style.display = 'none';
      cargarDatos();
    } catch (error) {
      console.error('Error al agregar registro:', error);
      alert('Error al agregar el nuevo comerciante.');
    }
  });
}

const inputBuscar = document.getElementById('input-buscar');
if (inputBuscar) {
  inputBuscar.addEventListener('input', (e) => {
    const termino = e.target.value.toLowerCase().trim();
    const filtrados = datosCargados.filter(item => {
      const razon = (item.business_name || item.razon_social || item.nombre_comercial || '').toLowerCase();
      const producto = (item.main_product || item.producto_principal || '').toLowerCase();
      const codigo = (item.codigo_seguimiento || '').toLowerCase();
      return razon.includes(termino) || producto.includes(termino) || codigo.includes(termino);
    });
    renderizarTabla(filtrados);
  });
}

const btnCerrar = document.getElementById('btn-cerrar-sesion');
if (btnCerrar) {
  btnCerrar.addEventListener('click', (e) => {
    e.preventDefault();
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = 'login.html';
  });
}

// Bucle continuo para mantener el reloj actualizado en tiempo real cada segundo
setInterval(aplicarRestriccionesDeTurno, 1000);

document.addEventListener('DOMContentLoaded', cargarDatos);