import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import sql from '../../config/neon';
import './mercado.css';

export default function PanelMercado() {
  const { user } = useAuth();
  const [datosPuesto, setDatosPuesto] = useState(null);
  const [denuncias, setDenuncias] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarInformacion() {
      try {
        const idUsuario = user?.id || 5;

        // 1. Obtener datos del comerciante
        const puestos = await sql`
          SELECT * FROM comerciantes_interesados WHERE id_usuario = ${idUsuario} LIMIT 1;
        `;

        if (puestos.length > 0) {
          setDatosPuesto(puestos[0]);

          // 2. Traer denuncias asociadas a su puesto (JOIN denuncias_digitales)
          const listaDenuncias = await sql`
            SELECT d.id, d.lugar, d.hecho, d.estado, c.id AS id_cita, c.estado AS estado_cita
            FROM denuncias_digitales d
            LEFT JOIN citas_essalud c ON c.id_denuncia = d.id
            WHERE d.id_comerciante = ${puestos[0].id};
          `;
          setDenuncias(listaDenuncias);
        }
      } catch (err) {
        console.error('Error al cargar panel:', err);
      } finally {
        setCargando(false);
      }
    }

    cargarInformacion();
  }, [user]);

  if (cargando) return <div className="mercado-container"><p>Cargando datos desde Neon DB...</p></div>;

  return (
    <div className="mercado-container">
      <div className="crumb">Mercado Mayorista › Mi Puesto</div>
      <h2>Panel «Mi Puesto»</h2>

      {datosPuesto ? (
        <>
          <div className="card-info">
            <h3>Puesto: {datosPuesto.puesto}</h3>
            <p><b>Rubro:</b> {datosPuesto.rubro}</p>
            <p><b>Estado del comerciante:</b> <span className="bd green">activo</span></p>
          </div>

          <h3>Denuncias y Citas Vinculadas</h3>
          {denuncias.length === 0 ? (
            <p>No tienes incidentes o denuncias registradas.</p>
          ) : (
            <table className="at">
              <thead>
                <tr>
                  <th>Cod. Denuncia</th>
                  <th>Lugar</th>
                  <th>Estado PNP</th>
                  <th>Cita EsSalud</th>
                </tr>
              </thead>
              <tbody>
                {denuncias.map((d) => (
                  <tr key={d.id}>
                    <td>DEN-000{d.id}</td>
                    <td>{d.lugar}</td>
                    <td>
                      <span className={`bd ${d.estado === 'registrado' ? 'gray' : 'amber'}`}>
                        {d.estado}
                      </span>
                    </td>
                    <td>
                      {d.id_cita ? (
                        <span className="bd green">CES-000{d.id_cita} ({d.estado_cita})</span>
                      ) : (
                        <span className="bd gray">Sin derivación</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      ) : (
        <p>Aún no has registrado ningún puesto. Ve a la sección de Registro.</p>
      )}
    </div>
  );
}