import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function MenuRoles() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Si no hay usuario O si se está en la pantalla de Login, oculta la barra superior
  if (!user || location.pathname === '/login') return null;

  // Evaluar roles del usuario actual
  const esComerciante = user.roles?.some(r => r.modulo === 'mercado' && r.rol === 'cliente');
  const esAdminMercado = user.roles?.some(r => r.modulo === 'mercado' && r.rol === 'administrador');
  const esPolicia = user.roles?.some(r => r.modulo === 'pnp' && r.rol === 'policia');
  const esMedico = user.roles?.some(r => r.modulo === 'essalud' && r.rol === 'medico');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Estilo base garantizado para todos los enlaces del menú (Texto blanco bien visible)
  const linkStyle = {
    color: '#ffffff',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '0.95rem',
    padding: '6px 10px',
    borderRadius: '6px',
    transition: 'background 0.2s ease'
  };

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 24px',
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
      color: '#fff',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '1.5rem' }}>🛡️</span>
        <strong style={{ fontSize: '1.2rem', color: '#10b981' }}>Mercado Seguro</strong>
      </div>

      <nav style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
        {/* Vistas para el Comerciante */}
        {esComerciante && (
          <>
            <Link to="/mercado/registro" style={linkStyle}>Registrar Puesto</Link>
            <Link to="/mercado/panel" style={linkStyle}>Mi Puesto</Link>
            <Link to="/integracion/denuncia" style={{ ...linkStyle, color: '#f87171', background: 'rgba(239, 68, 68, 0.15)' }}>
              🚨 Denunciar Incidente
            </Link>
          </>
        )}

        {/* Vistas para el Admin Mercado */}
        {esAdminMercado && (
          <>
            <Link to="/integracion/seguridad" style={linkStyle}>📊 Reporte de Seguridad</Link>
            <Link to="/mercado/panel" style={linkStyle}>🏬 Panel General Puestos</Link>
          </>
        )}

        {/* Vistas para la PNP */}
        {esPolicia && (
          <>
            <Link to="/pnp/panel" style={linkStyle}>Gestión PNP</Link>
            <Link to="/integracion/derivar" style={{ ...linkStyle, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)' }}>
              🏥 Derivar EsSalud
            </Link>
          </>
        )}

        {/* Vistas para EsSalud */}
        {esMedico && (
          <Link to="/essalud/panel" style={linkStyle}>Citas Médicas EsSalud</Link>
        )}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '0.85rem', background: 'rgba(255,255,255,0.15)', padding: '6px 12px', borderRadius: '20px', color: '#ffffff' }}>
          👤 {user.nombre}
        </span>
        <button 
          onClick={handleLogout}
          style={{
            background: '#ef4444',
            color: '#fff',
            border: 'none',
            padding: '6px 14px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Salir
        </button>
      </div>
    </header>
  );
}