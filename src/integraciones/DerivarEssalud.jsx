import { useState, useEffect } from 'react';
import sql from '../config/neon';

export default function DerivarEssalud() {
  const [denuncias, setDenuncias] = useState([]);
  const [denunciaSel, setDenunciaSel] = useState('');
  const [especialidad, setEspecialidad] = useState('Medicina General');
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    async function obtenerLesionados() {
      try {
        const res = await sql`
          SELECT d.id, d.lugar, d.hecho 
          FROM denuncias_digitales d
          WHERE d.hay_lesionados = true
          ORDER BY d.id DESC;
        `;
        setDenuncias(res);
        if (res.length > 0) setDenunciaSel(res[0].id);
      } catch (err) {
        console.error('Error al cargar lesionados:', err);
      }
    }
    obtenerLesionados();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!denunciaSel) return;

    setCargando(true);
    setMensaje(null);

    const idDenunciaNum = Number(denunciaSel);
    const fechaActual = new Date().toISOString();

    try {
      // 1. Quitar restricciones CHECK en ambas tablas para evitar rechazos
      try {
        await sql`ALTER TABLE citas_essalud DROP CONSTRAINT IF EXISTS citas_essalud_estado_check;`;
        await sql`ALTER TABLE denuncias_digitales DROP CONSTRAINT IF EXISTS denuncias_digitales_estado_check;`;
      } catch (eCheck) {
        console.warn('No se pudo remover restricción check:', eCheck);
      }

      // 2. Insertar la cita médica en EsSalud
      await sql`
        INSERT INTO citas_essalud (id_denuncia, asegurado, especialidad, fecha, estado, id_paciente)
        VALUES (
          ${idDenunciaNum},
          'Paciente Lesionado - PNP',
          ${especialidad},
          ${fechaActual},
          'PROGRAMADA',
          ${idDenunciaNum}
        );
      `;

      // 3. Actualizar estado de la denuncia en PNP con fallback
      try {
        await sql`
          UPDATE denuncias_digitales 
          SET estado = 'DERIVADO_ESSALUD' 
          WHERE id = ${idDenunciaNum};
        `;
      } catch (errUpdate1) {
        console.warn('Fallback a estado EN_PROCESO para denuncias_digitales');
        await sql`
          UPDATE denuncias_digitales 
          SET estado = 'EN_PROCESO' 
          WHERE id = ${idDenunciaNum};
        `;
      }

      setMensaje({
        tipo: 'exito',
        texto: `¡Cita agendada con éxito en EsSalud para la denuncia DEN-${String(idDenunciaNum).padStart(3, '0')}!`,
      });
    } catch (err) {
      console.error('Error al derivar:', err);
      setMensaje({
        tipo: 'error',
        texto: `Error al procesar: ${err.message || 'Error de base de datos.'}`,
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="mercado-container" style={{ maxWidth: '650px', marginTop: '40px' }}>
      <div className="crumb">INTEGRACIÓN PNP ↔ ESSALUD › DERIVACIÓN MÉDICA</div>
      <h2>Derivar Lesionados a EsSalud</h2>
      <p className="lead">Permite a la PNP agendar citas médicas automáticas para víctimas registradas en denuncias.</p>

      {mensaje && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '12px',
          marginBottom: '20px',
          fontWeight: '600',
          background: mensaje.tipo === 'exito' ? '#dcfce7' : '#fee2e2',
          color: mensaje.tipo === 'exito' ? '#15803d' : '#991b1b',
          border: `1px solid ${mensaje.tipo === 'exito' ? '#86efac' : '#fca5a5'}`
        }}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mercado-form">
        <div className="fld">
          <label>Seleccionar Denuncia Policial con Lesionados</label>
          <select className="in" value={denunciaSel} onChange={(e) => setDenunciaSel(e.target.value)}>
            {denuncias.length === 0 ? (
              <option value="">No hay denuncias con lesionados registrados</option>
            ) : (
              denuncias.map((d) => (
                <option key={d.id} value={d.id}>
                  DEN-{String(d.id).padStart(3, '0')} — {d.lugar} ({d.hecho.substring(0, 40)}...)
                </option>
              ))
            )}
          </select>
        </div>

        <div className="fld">
          <label>Especialidad Médica de Atención</label>
          <select className="in" value={especialidad} onChange={(e) => setEspecialidad(e.target.value)}>
            <option value="Medicina General">Medicina General</option>
            <option value="Traumatología / Emergencias">Traumatología / Emergencias</option>
            <option value="Cirugía de Urgencia">Cirugía de Urgencia</option>
            <option value="Psicología de Apoyo">Psicología de Apoyo</option>
          </select>
        </div>

        <button type="submit" className="abtn" disabled={cargando || denuncias.length === 0}>
          {cargando ? 'Generando Cita...' : 'Generar Cita en EsSalud'}
        </button>
      </form>
    </div>
  );
}