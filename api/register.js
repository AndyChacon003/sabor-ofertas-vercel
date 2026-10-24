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
        // 1. Verificar si el usuario ya existe
        const userExists = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'El correo ya está registrado.' });
        }

        // 2. Cifrar la contraseña con bcryptjs
        const passwordHash = await bcrypt.hash(password, 10);

        // 3. Generar token aleatorio y su hash
        const token = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

        // 4. Vigencia de 1 hora
        const expires = new Date(Date.now() + 60 * 60 * 1000);

        // 5. Guardar en PostgreSQL
        await pool.query(
            'INSERT INTO usuarios (nombre, correo, password, email_verified, verification_token_hash, verification_token_expires) VALUES ($1, $2, $3, false, $4, $5)',
            [nombre, correo, passwordHash, tokenHash, expires]
        );

        // 6. Intentar enviar el correo electrónico
        const baseUrl = req.headers.origin || 'http://localhost:3000';
        const verifyUrl = `${baseUrl}/api/verify-email?token=${token}`;

        console.log("🔗 Enlace de prueba generado:", verifyUrl);

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            try {
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
                });

                await transporter.sendMail({
                    from: process.env.EMAIL_FROM || 'SaborOfertas <no-reply@saborofertas.com>',
                    to: correo,
                    subject: 'Confirma tu cuenta en SaborOfertas',
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px;">
                            <h2>¡Bienvenido, ${nombre}!</h2>
                            <p>Confirma tu correo electrónico haciendo clic en el siguiente botón:</p>
                            <a href="${verifyUrl}" style="display:inline-block; padding:12px 24px; background:#ea580c; color:white; text-decoration:none; border-radius:8px; font-weight:bold;">Confirmar mi correo</a>
                            <p style="margin-top:20px; color:#666; font-size:12px;">El enlace vence en una hora.</p>
                        </div>
                    `
                });
            } catch (mailErr) {
                console.error("No se pudo enviar el correo electrónico, pero el usuario fue creado:", mailErr);
            }
        }

        return res.status(200).json({ success: true, requires_verification: true, message: 'Usuario registrado. Revisa tu correo.' });
    } catch (err) {
        console.error("Error crítico en /api/register:", err);
        return res.status(500).json({ success: false, message: 'Error en servidor: ' + err.message });
    }
}