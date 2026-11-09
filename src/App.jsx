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
    <div className="landing-wrapper">
      <div className="landing-header">
        <div className="shield-icon">🛡️</div>
        <h1>Mercado Seguro · Grupo 4</h1>
        <p>Plataforma Unificada Multi-Módulo (Mercado Mayorista · PNP Central · EsSalud)</p>
      </div>

      <div className="modules-grid">
        <button 
          type="button" 
          className="module-card comerciante" 
          onClick={() => handleLogin('cliente')}
        >
          <span className="icon">🛒</span>
          <h3>Comerciante</h3>
        </button>

        <button 
          type="button" 
          className="module-card admin" 
          onClick={() => handleLogin('admin_mercado')}
        >
          <span className="icon">📊</span>
          <h3>Admin Mercado</h3>
        </button>

        <button 
          type="button" 
          className="module-card pnp" 
          onClick={() => handleLogin('pnp')}
        >
          <span className="icon">👮</span>
          <h3>Oficial PNP</h3>
        </button>

        <button 
          type="button" 
          className="module-card essalud" 
          onClick={() => handleLogin('essalud')}
        >
          <span className="icon">🏥</span>
          <h3>Médico EsSalud</h3>
        </button>
      </div>

      <div className="reset-container">
        <button 
          type="button" 
          className="btn-reset" 
          onClick={handleReset}
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