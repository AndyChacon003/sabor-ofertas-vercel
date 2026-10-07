export default function handler(req, res) {
    const categories = [
        { id: 'all', label: 'Todos', icon: 'utensils' },
        { id: 'tacos', label: 'Tacos & Antojitos', icon: 'flame' },
        { id: 'burgers', label: 'Hamburguesas', icon: 'hamburger' },
        { id: 'sushi', label: 'Sushi & Asiática', icon: 'fish' },
        { id: 'pizza', label: 'Pizzas', icon: 'pizza' },
        { id: 'coffee', label: 'Cafés & Postres', icon: 'coffee' },
        { id: 'healthy', label: 'Saludable', icon: 'salad' }
    ];

    res.status(200).json(categories);
}