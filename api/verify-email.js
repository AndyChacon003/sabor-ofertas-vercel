import { Pool } from 'pg';
import crypto from 'crypto';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true
});

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ message: 'Método no permitido' });

    const token = req.query.token;
    if (!token) return res.redirect('/?verified=expired');

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    try {
        const result = await pool.query(
            'SELECT * FROM usuarios WHERE verification_token_hash = $1 AND verification_token_expires > NOW()',
            [tokenHash]
        );

        if (result.rows.length === 0) {
            return res.redirect('/?verified=expired');
        }

        const usuario = result.rows[0];

        await pool.query(
            'UPDATE usuarios SET email_verified = true, verification_token_hash = null, verification_token_expires = null WHERE id = $1',
            [usuario.id]
        );

        return res.redirect('/?verified=success');
    } catch (err) {
        return res.redirect('/?verified=error');
    }
}