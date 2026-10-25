import { Pool } from 'pg';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Método no permitido' });
    }

    const { nombre, correo, password } = req.body;

    if (!nombre || !correo || !password) {
        return res.status(400).json({ success: false, message: 'Faltan campos obligatorios.' });
    }

    try {
        // Verificar conexión a la base de datos primero
        const client = await pool.connect();

        try {
            const userExists = await client.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);
            if (userExists.rows.length > 0) {
                client.release();
                return res.status(400).json({ success: false, message: 'El correo ya está registrado.' });
            }

            const passwordHash = await bcrypt.hash(password, 10);
            const token = crypto.randomBytes(32).toString("hex");
            const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
            const expires = new Date(Date.now() + 60 * 60 * 1000);

            await client.query(
                'INSERT INTO usuarios (nombre, correo, password, email_verified, verification_token_hash, verification_token_expires) VALUES ($1, $2, $3, false, $4, $5)',
                [nombre, correo, passwordHash, tokenHash, expires]
            );

            client.release();

            // Intentar enviar el correo si están configuradas las credenciales
            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                try {
                    const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
                    });

                    const baseUrl = req.headers.origin || 'https://sabor-ofertas.vercel.app';
                    const verifyUrl = `${baseUrl}/api/verify-email?token=${token}`;

                    await transporter.sendMail({
                        from: process.env.EMAIL_FROM || 'SaborOfertas <no-reply@saborofertas.com>',
                        to: correo,
                        subject: 'Confirma tu cuenta en SaborOfertas',
                        html: `<h3>Bienvenido, ${nombre}</h3><p>Haz clic para confirmar:</p><a href="${verifyUrl}">Confirmar mi correo</a>`
                    });
                } catch (mailErr) {
                    console.error("Error enviando correo:", mailErr);
                }
            }

            return res.status(200).json({ success: true, requires_verification: true });
        } catch (dbErr) {
            client.release();
            throw dbErr;
        }
    } catch (err) {
        console.error("Error en /api/register:", err);
        return res.status(500).json({ success: false, message: 'Error interno: ' + err.message });
    }
}