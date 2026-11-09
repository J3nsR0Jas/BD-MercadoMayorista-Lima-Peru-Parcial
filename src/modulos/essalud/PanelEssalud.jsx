import { useState, useEffect } from 'react';
import sql from '../../config/neon';

export default function PanelEssalud() {
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(null);

  const cargarCitas = async () => {
    try {
      const res = await sql`
        SELECT 
          c.id, 
          c.asegurado, 
          c.especialidad, 
          c.estado, 
          c.id_denuncia,
          d.hecho AS origen_hecho
        FROM citas_essalud c
        LEFT JOIN denuncias_digitales d ON c.id_denuncia = d.id
        ORDER BY c.id DESC;
      `;
      setCitas(res);
    } catch (err) {
      console.error('Error al cargar citas de EsSalud:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCitas();
  }, []);

  const cambiarEstado = async (idCita, nuevoEstado) => {
    setActualizando(idCita);
    try {
      // 1. Quitar la restricción CHECK en caso de que esté limitando minúsculas/mayúsculas
      try {
        await sql`ALTER TABLE citas_essalud DROP CONSTRAINT IF EXISTS citas_essalud_estado_check;`;
      } catch (eCheck) {
        console.warn('No se requirió eliminar constraint:', eCheck);
      }

      // 2. Actualizar el estado en Neon DB
      await sql`
        UPDATE citas_essalud
        SET estado = ${nuevoEstado}
        WHERE id = ${idCita};
      `;

      // 3. Recargar la lista en pantalla
      await cargarCitas();
    } catch (err) {
      console.error('Error al actualizar el estado de la cita:', err);
      alert('No se pudo actualizar el estado de la cita.');
    } finally {
      setActualizando(null);
    }
  };

  return (
    <div className="mercado-container" style={{ maxWidth: '900px', marginTop: '40px' }}>
      <div className="crumb">MÓDULO ESSALUD › GESTIÓN DE CITAS</div>
      <h2>Panel Ambulatorio EsSalud</h2>
      <p className="lead">Control de citas programadas y derivadas por incidentes del Mercado Mayorista.</p>

      {cargando ? (
        <p style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Cargando citas médicas...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="mercado-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px 8px' }}>Código Cita</th>
                <th style={{ padding: '12px 8px' }}>Paciente / Comerciante</th>
                <th style={{ padding: '12px 8px' }}>Especialidad</th>
                <th style={{ padding: '12px 8px' }}>Origen / Denuncia</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>Estado Cita</th>
              </tr>
            </thead>
            <tbody>
              {citas.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                    No hay citas registradas.
                  </td>
                </tr>
              ) : (
                citas.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>
                      CES-{String(c.id).padStart(3, '0')}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {c.asegurado || 'Paciente General'}
                    </td>
                    <td style={{ padding: '12px 8px' }}>{c.especialidad}</td>
                    <td style={{ padding: '12px 8px', fontSize: '0.85rem', color: '#475569' }}>
                      {c.id_denuncia ? (
                        <>DEN-{String(c.id_denuncia).padStart(4, '0')} {c.origen_hecho ? `(${c.origen_hecho.substring(0, 45)}...)` : ''}</>
                      ) : (
                        'Ingreso Directo'
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <select
                        value={c.estado || 'PROGRAMADA'}
                        disabled={actualizando === c.id}
                        onChange={(e) => cambiarEstado(c.id, e.target.value)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          border: 'none',
                          fontWeight: 'bold',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          backgroundColor:
                            c.estado === 'ATENDIDA'
                              ? '#dcfce7'
                              : c.estado === 'CANCELADA'
                              ? '#fee2e2'
                              : '#dbeafe',
                          color:
                            c.estado === 'ATENDIDA'
                              ? '#15803d'
                              : c.estado === 'CANCELADA'
                              ? '#991b1b'
                              : '#1e40af',
                        }}
                      >
                        <option value="PROGRAMADA">PROGRAMADA</option>
                        <option value="ATENDIDA">ATENDIDA</option>
                        <option value="CANCELADA">CANCELADA</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}