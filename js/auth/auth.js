import { neon } from 'https://esm.sh/@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_zdlU6G7LExeY@ep-flat-voice-b5koa41r-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const sql = neon(DATABASE_URL, { disableWarningInBrowsers: true });

const formLogin = document.getElementById('form-login');
if (formLogin) {
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();

    const correoInput = document.getElementById('correo') || formLogin.querySelector('[name="correo"]');
    const passInput = document.getElementById('contrasena') || formLogin.querySelector('[name="contrasena"]');

    if (!correoInput || !passInput) {
      alert('Error: No se encontraron los campos del formulario.');
      return;
    }

    const correo = correoInput.value.trim();
    const contrasena = passInput.value.trim();

    try {
      let usuarios = [];
      try {
        usuarios = await sql`
          SELECT * FROM usuarios 
          WHERE correo = ${correo} AND contrasena = ${contrasena}
        `;
      } catch (e1) {
        try {
          usuarios = await sql`
            SELECT * FROM usuarios 
            WHERE correo_electronico = ${correo} AND contrasena = ${contrasena}
          `;
        } catch (e2) {
          usuarios = await sql`
            SELECT * FROM usuarios 
            WHERE email = ${correo} AND contrasena = ${contrasena}
          `;
        }
      }

      if (usuarios.length > 0) {
        const usuario = usuarios[0];
        const correoClean = (usuario.correo || usuario.correo_electronico || usuario.email || correo).toLowerCase().trim();
        const rol = (usuario.rol || '').toString().trim().toLowerCase();
        const nombre = usuario.nombre || usuario.nombre_completo || 'Usuario';

        // MAPEO DE TURNOS Y ROLES SEGÚN TU TABLA DE NEON DB
        const MAPA_TURNOS = {
          '61232134@continental.edu.pe': { turno: 'admin', nombre: 'Jens Ahmed' },
          'jensahmedrojas@gmail.com': { turno: 'admin', nombre: 'Alex' },
          '76540975@continental.edu.pe': { turno: 'manana', nombre: 'juan' },
          'mercedez@gmail.com': { turno: 'tarde', nombre: 'roberto Sanchez' },
          '15254578@gmail.com': { turno: 'noche', nombre: 'Jack Yover' }
        };

        const infoMapeada = MAPA_TURNOS[correoClean] || { turno: 'tarde', nombre: nombre };

        // 1. GUARDAR OBJETO COMPLETO EN SESSIONSTORAGE
        sessionStorage.setItem('usuario', JSON.stringify(usuario));

        // 2. GUARDAR PROPIEDADES INDIVIDUALES PARA PANEL.JS
        sessionStorage.setItem('usuario_email', correoClean);
        sessionStorage.setItem('usuario_nombre', infoMapeada.nombre || nombre);
        sessionStorage.setItem('usuario_rol', rol);
        sessionStorage.setItem('usuario_turno', infoMapeada.turno);

        // PERSISTENCIA EN LOCALSTORAGE
        localStorage.setItem('usuario_email', correoClean);
        localStorage.setItem('usuario_nombre', infoMapeada.nombre || nombre);
        localStorage.setItem('usuario_rol', rol);
        localStorage.setItem('usuario_turno', infoMapeada.turno);

        if (rol === 'administrador' || rol === 'empleado' || rol === 'admin') {
          window.location.href = 'panel.html';
        } else {
          window.location.href = 'actualizar.html';
        }
      } else {
        alert('Correo o contraseña incorrectos.');
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      alert(`Error al conectar con la BD: ${error.message}`);
    }
  });
}

const formRegistro = document.getElementById('form-registro');
if (formRegistro) {
  formRegistro.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombreInput = document.getElementById('reg-nombre') || formRegistro.querySelector('[name="nombre"]');
    const correoInput = document.getElementById('reg-correo') || formRegistro.querySelector('[name="correo"]');
    const passInput = document.getElementById('reg-contrasena') || formRegistro.querySelector('[name="contrasena"]');

    if (!nombreInput || !correoInput || !passInput) {
      alert('Error: No se encontraron los campos de registro.');
      return;
    }

    const nombre = nombreInput.value.trim();
    const correo = correoInput.value.trim();
    const contrasena = passInput.value.trim();

    try {
      await sql`
        INSERT INTO usuarios (nombre, correo, contrasena, rol) 
        VALUES (${nombre}, ${correo}, ${contrasena}, 'cliente')
      `;

      alert('¡Cuenta creada con éxito! Ahora puedes iniciar sesión.');

      if (typeof window.mostrarFormulario === 'function') {
        window.mostrarFormulario('login');
      }
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      alert(`Error al registrar: ${error.message}`);
    }
  });
}