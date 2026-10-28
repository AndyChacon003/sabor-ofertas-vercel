import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true
});

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Método no permitido' });

    const { userId, banStatus } = req.body;

    try {
        await pool.query('UPDATE usuarios SET banned = $1 WHERE id = $2', [banStatus, userId]);
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("Error al actualizar estado de baneo:", err);
        return res.status(500).json({ success: false, message: 'Error interno' });
    }
}