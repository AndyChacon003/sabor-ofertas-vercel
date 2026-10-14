import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: true }
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Método no permitido' });
    }

    const { nombre, correo, password } = req.body;

    try {
        const userExists = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'El correo ya está registrado.' });
        }

        const nuevoUsuario = await pool.query(
            'INSERT INTO usuarios (nombre, correo, password) VALUES ($1, $2, $3) RETURNING id, nombre, correo',
            [nombre, correo, password]
        );

        return res.status(200).json({ success: true, user: nuevoUsuario.rows[0] });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error en el servidor al registrar usuario.' });
    }
}