export default function handler(req, res) {
    const dealsData = [
        {
            id: 'deal-1',
            title: '2x1 en Tacos Pastor y Suadero',
            restaurant: 'Taquería El Infierno',
            category: 'tacos',
            image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=600&q=80',
            badge: '2x1', discountType: '2x1', originalPrice: 180, discountPrice: 90,
            rating: 4.8, reviews: 320, distance: 0.8, expiresIn: 3600 * 2, isFlash: true,
            couponCode: 'TACOPASTOR2X1', apiSource: 'Google Places POS', address: 'Av. Camelinas #1240, Centro',
            description: 'Aplica en la compra de cualquier orden de 5 tacos de pastor o suadero. Incluye salsas especiales y cebollitas asadas.',
            terms: 'Válido de Lunes a Jueves de 14:00 a 20:00 hrs. Presentar código en caja.'
        },
        {
            id: 'deal-2',
            title: '40% OFF en Burger Doble Queso Tocino',
            restaurant: 'Smash Burger Lab',
            category: 'burgers',
            image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
            badge: '40% OFF', discountType: '30plus', originalPrice: 210, discountPrice: 126,
            rating: 4.9, reviews: 512, distance: 1.4, expiresIn: 3600 * 5, isFlash: true,
            couponCode: 'SMASH40OFF', apiSource: 'Rappi API v3', address: 'Blvd. García de León #450',
            description: 'Carne 100% Sirloin smash doble, queso cheddar fundido, tocino crujiente y pan brioche artesanal con papas fritas incluidas.',
            terms: 'Aplica para comer en restaurante o para llevar.'
        },
        {
            id: 'deal-3',
            title: 'Combo Rollos Dúo + Bebida + Envío Gratis',
            restaurant: 'Sushitto & Niku',
            category: 'sushi',
            image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80',
            badge: 'Envío Gratis', discountType: 'shipping', originalPrice: 290, discountPrice: 220,
            rating: 4.6, reviews: 189, distance: 2.1, expiresIn: 0, isFlash: false,
            couponCode: 'SUSHIFREE26', apiSource: 'UberEats API', address: 'Plaza Las Américas Local 12',
            description: 'Elige 2 rollos tradicionales (California, Empanizado o Filadelfia) + 2 tés helados de la casa. Entrega sin costo adicional.',
            terms: 'Válido ordenando a través de enlace promocional o directo en sucursal.'
        },
        {
            id: 'deal-4',
            title: 'Pizza Grande Familiar al 35% OFF',
            restaurant: 'Pizzeria Della Nonna',
            category: 'pizza',
            image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
            badge: '35% OFF', discountType: '30plus', originalPrice: 320, discountPrice: 208,
            rating: 4.7, reviews: 402, distance: 1.1, expiresIn: 3600 * 1.5, isFlash: true,
            couponCode: 'NONNA35OFF', apiSource: 'Direct REST POS', address: 'Calle Real de Guadalupe #88',
            description: 'Pizza de 8 rebanadas masa delgada en horno de piedra. Elige hasta 3 ingredientes a tu gusto.',
            terms: 'No acumulable con otras promociones de la casa.'
        },
        {
            id: 'deal-5',
            title: 'Capuchino + Rebanada Cheesecake 2x1',
            restaurant: 'Café Bistro Aromas',
            category: 'coffee',
            image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
            badge: '2x1', discountType: '2x1', originalPrice: 160, discountPrice: 80,
            rating: 4.9, reviews: 230, distance: 0.5, expiresIn: 0, isFlash: false,
            couponCode: 'CAFE2X1SABOR', apiSource: 'Google Places POS', address: 'Calle Madero Oriente #310',
            description: 'Disfruta de dos cafés preparados por barista y dos rebanadas de pastel o cheesecake de frutos rojos.',
            terms: 'Válido de 9:00 a 13:00 hrs todos los días.'
        },
        {
            id: 'deal-6',
            title: 'Poke Bowl Salmón con 30% Descuento',
            restaurant: 'Green Bowl & Fresh',
            category: 'healthy',
            image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
            badge: '30% OFF', discountType: '30plus', originalPrice: 195, discountPrice: 136,
            rating: 4.5, reviews: 140, distance: 3.2, expiresIn: 0, isFlash: false,
            couponCode: 'HEALTHY30', apiSource: 'Rappi API v3', address: 'Av. Acueducto #890',
            description: 'Salmón fresco en cubos, aguacate, edamames, mango y toppings crujientes sobre cama de arroz o quinoa.',
            terms: 'Válido para consumo individual en sucursal.'
        }
    ];

    res.status(200).json(dealsData);
}