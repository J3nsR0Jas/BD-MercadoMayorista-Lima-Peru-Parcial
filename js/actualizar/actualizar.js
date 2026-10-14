import { sql } from '../neon-config/neon-config.js';
import { exigirSesion } from '../auth/auth.js';

const usuario = exigirSesion();

document.addEventListener('DOMContentLoaded', async () => {
    if (!usuario) return;

    aplicarPermisosPorRol();
    await cargarDatosCliente();

    const form = document.getElementById('formActualizar') || document.querySelector('form');
    if (form) {
        form.addEventListener('submit', guardarRegistroCliente);
    }
});

function aplicarPermisosPorRol() {
    const comboEstado = document.getElementById('estado');
    if (!comboEstado) return;

    if (usuario.rol === 'cliente') {
        comboEstado.disabled = true;
    } else {
        comboEstado.disabled = false;
    }
}

async function cargarDatosCliente() {
    try {
        let registros = [];
        
        try {
            registros = await sql`
                SELECT * FROM interested_merchants 
                WHERE user_id = ${usuario.id} OR usuario_id = ${usuario.id};
            `;
        } catch (e) {
            registros = await sql`
                SELECT * FROM interested_merchants 
                WHERE id_usuario = ${usuario.id};
            `;
        }

        if (registros.length > 0) {
            const reg = registros[0];
            
            const campoRazon = document.getElementById('razonSocial') || document.getElementById('razon_social');
            const campoProducto = document.getElementById('producto') || document.getElementById('producto_principal');
            const campoTelefono = document.getElementById('telefono');
            const campoEstado = document.getElementById('estado');

            if (campoRazon) campoRazon.value = reg.business_name || reg.razon_social || '';
            if (campoProducto) campoProducto.value = reg.main_product || reg.producto_principal || reg.producto || '';
            if (campoTelefono) campoTelefono.value = reg.phone || reg.telefono || '';
            if (campoEstado) campoEstado.value = reg.status || reg.estado || 'registrado';
        }
    } catch (error) {
        console.error('Error al cargar datos:', error);
    }
}

async function guardarRegistroCliente(e) {
    e.preventDefault();

    const campoRazon = document.getElementById('razonSocial') || document.getElementById('razon_social');
    const campoProducto = document.getElementById('producto') || document.getElementById('producto_principal');
    const campoTelefono = document.getElementById('telefono');
    const campoEstado = document.getElementById('estado');

    const razonSocial = campoRazon ? campoRazon.value.trim() : '';
    const producto = campoProducto ? campoProducto.value.trim() : '';
    const telefono = campoTelefono ? campoTelefono.value.trim() : '';
    const estado = campoEstado ? campoEstado.value : 'registrado';

    try {
        let existentes = [];
        try {
            existentes = await sql`SELECT id FROM interested_merchants WHERE user_id = ${usuario.id} OR usuario_id = ${usuario.id};`;
        } catch (e) {
            existentes = await sql`SELECT id FROM interested_merchants WHERE id_usuario = ${usuario.id};`;
        }

        if (existentes.length > 0) {

            if (usuario.rol === 'cliente') {
                try {
                    await sql`
                        UPDATE interested_merchants 
                        SET business_name = ${razonSocial}, main_product = ${producto}, phone = ${telefono}
                        WHERE user_id = ${usuario.id} OR usuario_id = ${usuario.id};
                    `;
                } catch (e) {
                    await sql`
                        UPDATE interested_merchants 
                        SET razon_social = ${razonSocial}, producto = ${producto}, telefono = ${telefono}
                        WHERE id_usuario = ${usuario.id};
                    `;
                }
            } else {
                try {
                    await sql`
                        UPDATE interested_merchants 
                        SET business_name = ${razonSocial}, main_product = ${producto}, phone = ${telefono}, status = ${estado}
                        WHERE user_id = ${usuario.id} OR usuario_id = ${usuario.id};
                    `;
                } catch (e) {
                    await sql`
                        UPDATE interested_merchants 
                        SET razon_social = ${razonSocial}, producto = ${producto}, telefono = ${telefono}, estado = ${estado}
                        WHERE id_usuario = ${usuario.id};
                    `;
                }
            }
        } else {
            try {
                await sql`
                    INSERT INTO interested_merchants (user_id, business_name, main_product, phone, status)
                    VALUES (${usuario.id}, ${razonSocial}, ${producto}, ${telefono}, ${estado});
                `;
            } catch (e) {
                await sql`
                    INSERT INTO interested_merchants (id_usuario, razon_social, producto, telefono, estado)
                    VALUES (${usuario.id}, ${razonSocial}, ${producto}, ${telefono}, ${estado});
                `;
            }
        }

        alert('¡Información guardada correctamente!');
        await cargarDatosCliente();
    } catch (error) {
        console.error('Error al guardar:', error);
        alert('Error al guardar la información en la base de datos.');
    }
}