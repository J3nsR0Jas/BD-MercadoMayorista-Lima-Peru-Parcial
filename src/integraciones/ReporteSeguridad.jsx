import { useState, useEffect } from 'react';
import sql from '../config/neon';
import '../modulos/mercado/mercado.css';

export default function ReporteSeguridad() {
  const [ranking, setRanking] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function obtenerReporte() {
      try {
        // Consulta SQL requerida (RF-4.4): Cuenta denuncias por comerciante con JOIN + GROUP BY
        const datos = await sql`
          SELECT 
            u.nombre AS comerciante,
            c.puesto,
            COUNT(d.id)::int AS total_denuncias
          FROM comerciantes_interesados c
          JOIN usuarios u ON u.id = c.id_usuario
          LEFT JOIN denuncias_digitales d ON d.id_comerciante = c.id
          GROUP BY u.nombre, c.puesto
          ORDER BY total_denuncias DESC;
        `;

        setRanking(datos);
      } catch (err) {
        console.error('Error al generar reporte de seguridad:', err);
      } finally {
        setCargando(false);
      }
    }

    obtenerReporte();
  }, []);

  if (cargando) {
    return (
      <div className="mercado-container">
        <p>Cargando reporte de seguridad desde Neon DB...</p>
      </div>
    );
  }

  // Calcular la cantidad máxima de denuncias para definir el ancho del gráfico de barras
  const maxDenuncias = Math.max(...ranking.map((r) => r.total_denuncias), 1);

  return (
    <div className="mercado-container">
      <div className="crumb">Integración Mercado ↔ PNP › Panel de Control</div>
      <h2>Reporte de Seguridad por Comerciante</h2>
      <p className="lead">
        Estadística de incidentes reportados para la toma de decisiones y refuerzo de vigilancia.
      </p>

      <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #cfdcd5', marginTop: '15px' }}>
        <h3 style={{ marginTop: 0, color: '#0f3d24' }}>Ranking de Puestos con Incidentes (GROUP BY)</h3>

        {ranking.length === 0 ? (
          <p>No se encontraron registros de comerciantes o denuncias en la BD.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '15px' }}>
            {ranking.map((item, index) => {
              const porcentaje = (item.total_denuncias / maxDenuncias) * 100;
              return (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '220px 1fr 60px', gap: '10px', alignItems: 'center' }}>
                  <div>
                    <strong>{item.comerciante}</strong>
                    <div style={{ fontSize: '0.85rem', color: '#4b6658' }}>Puesto {item.puesto}</div>
                  </div>

                  <div style={{ background: '#e2e8f0', borderRadius: '6px', height: '22px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${porcentaje}%`,
                        background: item.total_denuncias > 2 ? '#dc2626' : item.total_denuncias > 0 ? '#f59e0b' : '#16a34a',
                        height: '100%',
                        borderRadius: '6px',
                        transition: 'width 0.8s ease',
                      }}
                    />
                  </div>

                  <div style={{ fontWeight: 'bold', textAlign: 'right', fontSize: '1.1rem' }}>
                    {item.total_denuncias} {item.total_denuncias === 1 ? 'incidente' : 'incidentes'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}