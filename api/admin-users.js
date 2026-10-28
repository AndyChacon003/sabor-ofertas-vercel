import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true
});

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ message: 'Método no permitido' });

    try {
        // Agregamos 'banned' a la lista de datos que trae
        const result = await pool.query('SELECT id, nombre, correo, rol, email_verified, banned FROM usuarios ORDER BY id DESC');
        return res.status(200).json(result.rows);
    } catch (err) {
        console.error("Error al obtener usuarios:", err);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}