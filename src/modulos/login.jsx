
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import sql from '../config/neon';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      // Consulta a las tablas 'usuarios' y 'usuario_rol' en Neon DB
      const resultados = await sql`
        SELECT u.id, u.nombre, u.email, ur.rol 
        FROM usuarios u
        JOIN usuario_rol ur ON u.id = ur.usuario_id
        WHERE u.email = ${email} AND u.password = ${password}
      `;

      if (resultados.length > 0) {
        const usuario = resultados[0];
        login(usuario); // Guarda la sesión en AuthContext y localStorage

        // Redirige según el rol obtenido de la base de datos
        if (usuario.rol === 'comerciante') navigate('/mercado');
        else if (usuario.rol === 'pnp') navigate('/pnp');
        else if (usuario.rol === 'essalud') navigate('/essalud');
        else navigate('/');
      } else {
        setError('Correo o contraseña incorrectos');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión con la base de datos');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-gray-900 text-white rounded-lg border border-green-500 shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6 text-green-400">
        Iniciar Sesión — Mercado Seguro
      </h2>

      {error && (
        <div className="bg-red-500 text-white p-2 rounded mb-4 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block mb-1 text-sm font-semibold">Correo Electrónico</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:border-green-500 text-white"
            placeholder="usuario@ejemplo.com"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-semibold">Contraseña</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:border-green-500 text-white"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={cargando}
          className="w-full py-2 bg-green-500 hover:bg-green-600 text-black font-bold rounded transition-colors duration-200 mt-2"
        >
          {cargando ? 'Verificando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}











