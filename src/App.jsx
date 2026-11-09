import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MenuRoles from './components/MenuRoles';
import RutaProtegida from './components/RutaProtegida';
import Footer from './components/Footer';

// Módulo Mercado
import RegistroMercado from './modulos/mercado/RegistroMercado';
import PanelMercado from './modulos/mercado/PanelMercado';

// Módulo PNP
import PanelPNP from './modulos/pnp/PanelPNP';

// Módulo EsSalud
import PanelEssalud from './modulos/essalud/PanelEssalud';

// Integraciones
import DenunciaPuesto from './integraciones/DenunciaPuesto';
import DerivarEssalud from './integraciones/DerivarEssalud';
import ReporteSeguridad from './integraciones/ReporteSeguridad';

function LoginSimulado() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (tipo) => {
    logout();

    if (tipo === 'cliente') {
      login({
        id: 5,
        nombre: 'Jens Rojas (Comerciante)',
        roles: [{ modulo: 'mercado', rol: 'cliente' }],
      });
      navigate('/mercado/registro');
    } else if (tipo === 'admin_mercado') {
      login({
        id: 1,
        nombre: 'Admin Mercado',
        roles: [{ modulo: 'mercado', rol: 'administrador' }],
      });
      navigate('/integracion/seguridad');
    } else if (tipo === 'pnp') {
      login({
        id: 2,
        nombre: 'Oficial Anthony Venegas',
        roles: [{ modulo: 'pnp', rol: 'policia' }],
      });
      navigate('/pnp/panel');
    } else if (tipo === 'essalud') {
      login({
        id: 3,
        nombre: 'Dr. Carlos De la Cruz',
        roles: [{ modulo: 'essalud', rol: 'medico' }],
      });
      navigate('/essalud/panel');
    }
  };

  const handleReset = () => {
    logout();
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="mercado-container" style={{ textAlign: 'center', marginTop: '50px', maxWidth: '600px' }}>
      <div style={{ fontSize: '3.5rem', marginBottom: '10px' }}>🛡️</div>
      <h2>Mercado Seguro · Grupo 4</h2>
      <p style={{ color: '#64748b', fontSize: '1.05rem', marginBottom: '25px' }}>
        Plataforma Unificada Multi-Módulo (Mercado Mayorista · PNP Central · EsSalud)
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <button type="button" className="abtn" onClick={() => handleLogin('cliente')}>
          🛒 Comerciante
        </button>
        <button type="button" className="abtn" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }} onClick={() => handleLogin('admin_mercado')}>
          📊 Admin Mercado
        </button>
        <button type="button" className="abtn" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }} onClick={() => handleLogin('pnp')}>
          👮 Oficial PNP
        </button>
        <button type="button" className="abtn" style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)' }} onClick={() => handleLogin('essalud')}>
          🏥 Médico EsSalud
        </button>
      </div>

      <div style={{ marginTop: '35px' }}>
        <button 
          type="button" 
          onClick={handleReset}
          style={{
            background: 'transparent',
            border: '1px dashed #cbd5e1',
            color: '#64748b',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          🔄 Reiniciar Estado / Cerrar Sesiones Atascadas
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <MenuRoles />
          
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/login" element={<LoginSimulado />} />

              {/* Módulo Mercado */}
              <Route element={<RutaProtegida modulo="mercado" />}>
                <Route path="/mercado/registro" element={<RegistroMercado />} />
                <Route path="/mercado/panel" element={<PanelMercado />} />
              </Route>

              {/* Módulo PNP */}
              <Route element={<RutaProtegida modulo="pnp" />}>
                <Route path="/pnp/panel" element={<PanelPNP />} />
              </Route>

              {/* Módulo EsSalud */}
              <Route element={<RutaProtegida modulo="essalud" />}>
                <Route path="/essalud/panel" element={<PanelEssalud />} />
              </Route>

              {/* Integraciones */}
              <Route element={<RutaProtegida modulo="mercado" rol="cliente" />}>
                <Route path="/integracion/denuncia" element={<DenunciaPuesto />} />
              </Route>
              <Route element={<RutaProtegida modulo="pnp" rol="policia" />}>
                <Route path="/integracion/derivar" element={<DerivarEssalud />} />
              </Route>
              <Route element={<RutaProtegida modulo="mercado" rol="administrador" />}>
                <Route path="/integracion/seguridad" element={<ReporteSeguridad />} />
              </Route>

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}