import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ success: false });

    const { correo, codigo } = req.body;

    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE correo = $1 AND codigo_verificacion = $2', [correo, codigo]);

        if (result.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Código incorrecto o usuario no encontrado.' });
        }

        // Si es correcto, marcamos como verificado
        await pool.query('UPDATE usuarios SET verificado = true, codigo_verificacion = null WHERE correo = $1', [correo]);

        return res.status(200).json({ success: true, message: 'Cuenta verificada correctamente.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Error del servidor al verificar.' });
    }
}