export default function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    // Devolvemos las categorías fijas para que la barra de filtros no colapse
    return res.status(200).json([
        { id: 'all', label: 'Todos' },
        { id: 'tacos', label: 'Tacos & Antojitos' },
        { id: 'hamburguesas', label: 'Hamburguesas' },
        { id: 'sushi', label: 'Sushi & Asiática' },
        { id: 'pizzas', label: 'Pizzas' },
        { id: 'postres', label: 'Cafés & Postres' },
        { id: 'saludable', label: 'Saludable' }
    ]);
}