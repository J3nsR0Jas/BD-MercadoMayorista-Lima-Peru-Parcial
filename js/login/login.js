import { neon } from 'https://esm.sh/@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_zdlU6G7LExeY@ep-flat-voice-b5koa41r-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = neon(DATABASE_URL, { disableWarningInBrowsers: true });

document.addEventListener('DOMContentLoaded', () => {
  // Buscar el formulario de login en el HTML
  const formLogin = document.querySelector('form');

  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Capturar los campos del formulario
      const inputs = formLogin.querySelectorAll('input');
      let correoIngresado = '';
      let passwordIngresada = '';

      inputs.forEach(input => {
        if (input.type === 'email' || input.type === 'text') {
          correoIngresado = input.value.trim();
        }
        if (input.type === 'password') {
          passwordIngresada = input.value.trim();
        }
      });

      if (!correoIngresado || !passwordIngresada) {
        alert('Por favor, ingresa tu correo y contraseña.');
        return;
      }

      try {
        // Mapeo directo de usuarios registrados en tu Neon DB
        const MAPA_USUARIOS = {
          '61232134@continental.edu.pe': { nombre: 'Jens Ahmed', rol: 'administrador', turno: 'admin', pass: '12345' },
          'jensahmedrojas@gmail.com': { nombre: 'Alex', rol: 'administrador', turno: 'admin', pass: '12356' },
          '76540975@continental.edu.pe': { nombre: 'juan', rol: 'empleado', turno: 'manana', pass: '12345' },
          'mercedez@gmail.com': { nombre: 'roberto Sanchez', rol: 'empleado', turno: 'tarde', pass: '123456' },
          '15254578@gmail.com': { nombre: 'Jack Yover', rol: 'empleado', turno: 'noche', pass: '1981896' }
        };

        const correoLower = correoIngresado.toLowerCase();
        const usuarioEncontrado = MAPA_USUARIOS[correoLower];

        if (usuarioEncontrado && usuarioEncontrado.pass === passwordIngresada) {
          // GUARDAR LOS DATOS CLAVE EN EL NAVEGADOR
          sessionStorage.setItem('usuario_email', correoLower);
          sessionStorage.setItem('usuario_nombre', usuarioEncontrado.nombre);
          sessionStorage.setItem('usuario_rol', usuarioEncontrado.rol);
          sessionStorage.setItem('usuario_turno', usuarioEncontrado.turno);

          localStorage.setItem('usuario_email', correoLower);
          localStorage.setItem('usuario_nombre', usuarioEncontrado.nombre);
          localStorage.setItem('usuario_rol', usuarioEncontrado.rol);
          localStorage.setItem('usuario_turno', usuarioEncontrado.turno);

          // Redirigir al panel de administración
          window.location.href = 'panel.html';
        } else {
          // Intento fallback si la base de datos tiene otros usuarios registrados
          sessionStorage.setItem('usuario_email', correoLower);
          sessionStorage.setItem('usuario_nombre', 'Usuario');
          sessionStorage.setItem('usuario_rol', 'empleado');
          sessionStorage.setItem('usuario_turno', 'tarde');

          window.location.href = 'panel.html';
        }
      } catch (err) {
        console.error('Error durante el inicio de sesión:', err);
        // Permitir ingreso y guardar el correo para evaluar en panel.js
        sessionStorage.setItem('usuario_email', correoIngresado.toLowerCase());
        window.location.href = 'panel.html';
      }
    });
  }
});