import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import sql from '../../config/neon';

export default function PanelPNP() {
  const [denuncias, setDenuncias] = useState([]);
  const navigate = useNavigate();

  const cargarDenuncias = async () => {
    try {
      const res = await sql`
        SELECT d.id, u.nombre as denunciante, d.lugar, d.hecho, d.hay_lesionados, d.estado
        FROM denuncias_digitales d
        LEFT JOIN comerciantes_interesados c ON d.id_comerciante = c.id
        LEFT JOIN usuarios u ON c.id_usuario = u.id
        ORDER BY d.id DESC;
      `;
      setDenuncias(res);
    } catch (err) {
      console.error('Error al cargar denuncias PNP:', err);
    }
  };

  useEffect(() => {
    cargarDenuncias();
  }, []);

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      await sql`UPDATE denuncias_digitales SET estado = ${nuevoEstado} WHERE id = ${id};`;
      cargarDenuncias();
    } catch (err) {
      console.error('Error al cambiar estado:', err);
    }
  };

  return (
    <div className="mercado-container" style={{ maxWidth: '1000px' }}>
      <div className="crumb">MÓDULO PNP CENTRAL › GESTIÓN POLICIAL</div>
      <h2>Panel de Control PNP Digital</h2>
      <p className="lead">Atención de incidentes reportados desde los puestos del Mercado Mayorista.</p>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', background: 'white', borderRadius: '12px', overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
            <th style={{ padding: '12px' }}>Cod. Denuncia</th>
            <th style={{ padding: '12px' }}>Denunciante</th>
            <th style={{ padding: '12px' }}>Lugar</th>
            <th style={{ padding: '12px' }}>Lesionados</th>
            <th style={{ padding: '12px' }}>Estado PNP</th>
            <th style={{ padding: '12px' }}>Acción</th>
          </tr>
        </thead>
        <tbody>
          {denuncias.map((d) => (
            <tr key={d.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '12px', fontWeight: 'bold' }}>DEN-{String(d.id).padStart(3, '0')}</td>
              <td style={{ padding: '12px' }}>{d.denunciante || 'Comerciante'}</td>
              <td style={{ padding: '12px' }}>{d.lugar}</td>
              <td style={{ padding: '12px' }}>{d.hay_lesionados ? '⚠️ Sí' : 'No'}</td>
              <td style={{ padding: '12px' }}>
                <select 
                  value={d.estado || 'REGISTRADO'} 
                  onChange={(e) => cambiarEstado(d.id, e.target.value)}
                  style={{ padding: '6px', borderRadius: '6px', fontWeight: 'bold' }}
                >
                  <option value="REGISTRADO">REGISTRADO</option>
                  <option value="EN PROCESO">EN PROCESO</option>
                  <option value="ATENDIDO">ATENDIDO</option>
                  <option value="DERIVADO_ESSALUD">DERIVADO ESSALUD</option>
                </select>
              </td>
              <td style={{ padding: '12px' }}>
                {d.hay_lesionados && (
                  <button onClick={() => navigate('/integracion/derivar')} style={{ padding: '6px 12px', background: '#eab308', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    🏥 Derivar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}