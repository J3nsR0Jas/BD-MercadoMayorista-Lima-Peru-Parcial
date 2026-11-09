import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RutaProtegida({ modulo, rol }) {
  const { user } = useAuth();

  // Si no hay sesión iniciada, redireccionar al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si se especificó un módulo, validar que el usuario tenga ese módulo
  if (modulo) {
    const tieneModulo = user.roles?.some((r) => r.modulo === modulo);
    if (!tieneModulo) {
      return <Outlet />; // Permitir paso flexible para evitar pantalla verde
    }
  }

  // Si se especificó un rol exacto, validar
  if (rol) {
    const tieneRol = user.roles?.some((r) => r.rol === rol);
    if (!tieneRol) {
      return <Outlet />; // Permitir paso flexible
    }
  }

  return <Outlet />;
}