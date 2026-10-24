import { Pool } from 'pg';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Método no permitido' });

    const { nombre, correo, password } = req.body;

    try {
        const userExists = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);
        if (userExists.rows.length > 0) return res.status(400).json({ success: false, message: 'El correo ya está registrado.' });

        // 1. Cifrar la contraseña
        const passwordHash = await bcrypt.hash(password, 10);

        // 2. Crear Token y Hash para confirmación
        const token = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

        // 3. Caducidad (1 hora)
        const expires = new Date(Date.now() + 60 * 60 * 1000);

        // 4. Guardar en base de datos con status false
        await pool.query(
            'INSERT INTO usuarios (nombre, correo, password, email_verified, verification_token_hash, verification_token_expires) VALUES ($1, $2, $3, false, $4, $5)',
            [nombre, correo, passwordHash, tokenHash, expires]
        );

        // 5. Crear enlace de verificación y enviar correo
        const baseUrl = req.headers.origin || 'http://localhost:3000';
        const verifyUrl = `${baseUrl}/api/verify-email?token=${token}`;

        const mailOptions = {
            from: 'SaborOfertas <no-reply@saborofertas.com>',
            to: correo,
            subject: 'Confirma tu cuenta en SaborOfertas',
            html: `
                <h3>Bienvenido, ${nombre}</h3>
                <p>Confirma tu correo haciendo clic en el siguiente enlace:</p>
                <a href="${verifyUrl}" style="display:inline-block; padding:10px 20px; background:#ea580c; color:white; text-decoration:none; border-radius:8px; font-weight:bold;">Confirmar mi correo</a>
                <p><small>El enlace vence en una hora.</small></p>
            `
        };

        await transporter.sendMail(mailOptions);

        return res.status(200).json({ success: true, requires_verification: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error en servidor.' });
    }
}