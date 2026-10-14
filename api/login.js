import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: true }
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Método no permitido' });
    }

    const { correo, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE correo = $1 AND password = $2', [correo, password]);
        if (result.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Correo o contraseña incorrectos.' });
        }

        const usuario = result.rows[0];
        return res.status(200).json({ success: true, user: { id: usuario.id, name: usuario.nombre, email: usuario.correo } });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error en el servidor al iniciar sesión.' });
    }
}