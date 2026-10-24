import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ success: false });

    const { correo, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        }

        const usuario = result.rows[0];

        // Validar contraseña cifrada
        const passwordCorrecto = await bcrypt.compare(password, usuario.password);
        if (!passwordCorrecto) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        }

        // Regla estricta del profesor: Bloquear login sin confirmación
        if (!usuario.email_verified) {
            return res.status(403).json({ success: false, message: 'Confirma tu correo antes de iniciar sesión.' });
        }

        return res.status(200).json({ success: true, user: { id: usuario.id, name: usuario.nombre, email: usuario.correo } });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error al iniciar sesión.' });
    }
}