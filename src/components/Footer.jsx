export default function Footer() {
  return (
    <footer style={{
      marginTop: 'auto',
      padding: '20px',
      textAlign: 'center',
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(10px)',
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: '0.9rem',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <p style={{ margin: 0 }}>
        © 2026 <strong>Grupo 4 · Mercado Seguro</strong> | Integración Multi-Módulo (Mercado Mayorista · PNP · EsSalud)
      </p>
    </footer>
  );
}