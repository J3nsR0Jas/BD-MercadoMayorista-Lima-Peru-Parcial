import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import sql from '../../config/neon';
import './mercado.css';

export default function RegistroMercado() {
  const { user } = useAuth();
  const [puesto, setPuesto] = useState('');
  const [rubro, setRubro] = useState('Abarrotes');
  const [mensaje, setMensaje] = useState(null);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje(null);

    try {
      const idUsuario = user?.id || 5;
      const nombreUsuario = user?.nombre || 'Jens Rojas (Comerciante)';
      const correoUsuario = `usuario_${idUsuario}@mercado.pe`;

      // 1. Insertar usuario base si no existe
      await sql`
        INSERT INTO usuarios (id, nombre, correo, password)
        VALUES (${idUsuario}, ${nombreUsuario}, ${correoUsuario}, '123456')
        ON CONFLICT (id) DO NOTHING;
      `;

      // 2. Registrar el puesto comercial
      const res = await sql`
        INSERT INTO comerciantes_interesados (id_usuario, puesto, rubro)
        VALUES (${idUsuario}, ${puesto}, ${rubro})
        RETURNING id;
      `;

      setMensaje({
        tipo: 'exito',
        texto: `¡Puesto ${puesto} registrado correctamente con ID #${res[0].id}!`,
      });
      setPuesto('');
    } catch (error) {
      console.error('Error al registrar:', error);
      setMensaje({
        tipo: 'error',
        texto: 'Error al conectar con Neon DB. Inténtalo de nuevo.',
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="mercado-container">
      <div className="crumb">Mercado Mayorista › Registro de Puesto</div>
      <h2>Registro de Comerciantes</h2>
      <p className="lead">Ingresa los datos de tu puesto comercial para acceder a los servicios unificados.</p>

      {mensaje && (
        <div className={`toast-msg ${mensaje.tipo}`}>{mensaje.texto}</div>
      )}

      <form onSubmit={handleSubmit} className="mercado-form">
        <div className="fld">
          <label>Comerciante</label>
          <input
            type="text"
            className="in pre"
            value={user?.nombre || 'Jens Rojas (Comerciante)'}
            disabled
          />
          <span className="tag">precargado</span>
        </div>

        <div className="fld">
          <label>Número de Puesto</label>
          <input
            type="text"
            className="in"
            placeholder="Ej: B-14, C-02"
            value={puesto}
            onChange={(e) => setPuesto(e.target.value)}
            required
          />
        </div>

        <div className="fld">
          <label>Rubro Comercial</label>
          <select
            className="in"
            value={rubro}
            onChange={(e) => setRubro(e.target.value)}
          >
            <option value="Abarrotes">Abarrotes</option>
            <option value="Frutas y Verduras">Frutas y Verduras</option>
            <option value="Carnes y Embutidos">Carnes y Embutidos</option>
            <option value="Lácteos">Lácteos</option>
            <option value="Servicios">Servicios</option>
          </select>
        </div>

        <button type="submit" className="abtn" disabled={cargando}>
          {cargando ? 'Guardando en Neon...' : 'Registrar Puesto'}
        </button>
      </form>
    </div>
  );
}