import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import sql from '../config/neon';
import '../modulos/mercado/mercado.css';

export default function DenunciaPuesto() {
  const { user } = useAuth();
  const [comerciante, setComerciante] = useState(null);
  const [hecho, setHecho] = useState('');
  const [hayLesionados, setHayLesionados] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [cargando, setCargando] = useState(false);

  // Cargar automáticamente los datos del puesto del comerciante en sesión
  useEffect(() => {
    async function obtenerPuesto() {
      try {
        const idUsuario = user?.id || 5;
        const res = await sql`
          SELECT id, puesto FROM comerciantes_interesados WHERE id_usuario = ${idUsuario} LIMIT 1;
        `;
        if (res.length > 0) {
          setComerciante(res[0]);
        }
      } catch (err) {
        console.error('Error al cargar datos del comerciante:', err);
      }
    }
    obtenerPuesto();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje(null);

    try {
      const lugarFormateado = `Mercado Mayorista · Puesto ${comerciante?.puesto || 'B-14'}`;
      
      // Guardar en la tabla denuncias_digitales vinculando id_comerciante
      const res = await sql`
        INSERT INTO denuncias_digitales (id_comerciante, lugar, hecho, hay_lesionados, estado)
        VALUES (${comerciante?.id || 7}, ${lugarFormateado}, ${hecho}, ${hayLesionados}, 'registrado')
        RETURNING id;
      `;

      setMensaje({
        tipo: 'exito',
        texto: `¡Denuncia registrada correctamente en la PNP con código DEN-000${res[0].id}!`,
      });
      setHecho('');
      setHayLesionados(false);
    } catch (err) {
      console.error('Error al enviar denuncia:', err);
      setMensaje({
        tipo: 'error',
        texto: 'Error al registrar la denuncia en Neon DB.',
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="mercado-container">
      <div className="crumb">Integración Mercado ↔ PNP › Denuncia Digital</div>
      <h2>Registrar Denuncia desde «Mi Puesto»</h2>
      <p className="lead">Formulario de denuncia PNP con datos precargados automáticamente.</p>

      {mensaje && (
        <div className={`toast-msg ${mensaje.tipo}`}>{mensaje.texto}</div>
      )}

      <form onSubmit={handleSubmit} className="mercado-form">
        <div className="fld">
          <label>Denunciante (Precargado)</label>
          <input type="text" className="in pre" value={user?.nombre || 'Cliente 1'} disabled />
          <span className="tag">precargado</span>
        </div>

        <div className="fld">
          <label>Ubicación del Puesto (Precargado)</label>
          <input
            type="text"
            className="in pre"
            value={`Mercado Mayorista · Puesto ${comerciante?.puesto || 'B-14'}`}
            disabled
          />
          <span className="tag">precargado</span>
        </div>

        <div className="fld">
          <label>Descripción del Hecho / Incidente</label>
          <textarea
            className="in"
            rows="3"
            placeholder="Describa lo sucedido (ej. Robo de mercadería en el puesto)..."
            value={hecho}
            onChange={(e) => setHecho(e.target.value)}
            required
          />
        </div>

        <div className="fld">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={hayLesionados}
              onChange={(e) => setHayLesionados(e.target.checked)}
            />
            ¿Hay personas lesionadas en el incidente?
          </label>
        </div>

        <button type="submit" className="abtn" disabled={cargando}>
          {cargando ? 'Registrando en PNP...' : 'Enviar Denuncia a la PNP'}
        </button>
      </form>
    </div>
  );
}