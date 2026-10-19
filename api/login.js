import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ success: false });

    const { correo, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE correo = $1 AND password = $2', [correo, password]);
        if (result.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Correo o contraseña incorrectos.' });
        }

        const usuario = result.rows[0];

        // Validamos si ya verificó su correo
        if (!usuario.verificado) {
            return res.status(403).json({ success: false, message: 'Debes verificar tu correo antes de iniciar sesión.' });
        }

        return res.status(200).json({ success: true, user: { id: usuario.id, name: usuario.nombre, email: usuario.correo } });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Error al iniciar sesión.' });
    }
}