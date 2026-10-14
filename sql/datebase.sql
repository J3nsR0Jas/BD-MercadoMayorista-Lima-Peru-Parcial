CREATE TABLE IF NOT EXISTS interested_merchants (
    id SERIAL PRIMARY KEY,
    business_name VARCHAR(150),
    razon_social VARCHAR(150),
    main_product VARCHAR(100),
    producto VARCHAR(100),
    phone VARCHAR(20),
    telefono VARCHAR(20),
    status VARCHAR(30) DEFAULT 'registrado',
    estado VARCHAR(30) DEFAULT 'registrado',
    
    area_m2 NUMERIC(8,2) NOT NULL DEFAULT 1.00,
    dias INT NOT NULL DEFAULT 1,
    alto_consumo BOOLEAN NOT NULL DEFAULT FALSE,
    monto_calculado NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    estado_pago VARCHAR(20) DEFAULT 'pendiente', 
    codigo_seguimiento VARCHAR(50) UNIQUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'empleado', -
    turno VARCHAR(20) DEFAULT 'tarde'
);

INSERT INTO usuarios (nombre, email, password, rol, turno) VALUES
('Administrador General', 'admin@mercado.pe', 'admin123', 'administrador', 'manana'),
('Cajero Mañana', 'cajero1@mercado.pe', '123456', 'empleado', 'manana'),
('Cajero Tarde', 'cajero2@mercado.pe', '123456', 'empleado', 'tarde')
ON CONFLICT (email) DO NOTHING;

INSERT INTO interested_merchants (
    business_name, main_product, phone, area_m2, dias, alto_consumo, monto_calculado, estado_pago, codigo_seguimiento
) VALUES 
('Comercial Los Andes', 'Papa y Cebolla', '987654321', 6.00, 3, TRUE, 285.00, 'pagado', 'COD-87654321'),
('Frutas del Norte S.A.C.', 'Mango y Papaya', '912345678', 2.00, 1, FALSE, 30.00, 'pendiente', 'COD-12345678');