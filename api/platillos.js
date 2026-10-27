import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true
});

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Método no permitido' });
    }

    try {
        const result = await pool.query('SELECT * FROM platillos ORDER BY id DESC');

        const platillosFormateados = result.rows.map(row => ({
            id: 'neon-' + row.id,
            title: row.titulo,
            restaurant: row.restaurante,
            category: row.categoria,
            image: row.imagen,
            badge: row.badge,
            discountType: row.discount_type,
            originalPrice: parseFloat(row.precio_original),
            discountPrice: parseFloat(row.precio_promocional),
            rating: parseFloat(row.rating),
            reviews: row.reviews,
            distance: parseFloat(row.distancia),
            isFlash: row.is_flash,
            couponCode: row.coupon_code,
            apiSource: row.api_source,
            address: row.direccion,
            description: row.descripcion,
            terms: row.terms
        }));

        return res.status(200).json(platillosFormateados);
    } catch (err) {
        console.error("Error al consultar los platillos en la base de datos:", err);
        return res.status(200).json([]);
    }
}