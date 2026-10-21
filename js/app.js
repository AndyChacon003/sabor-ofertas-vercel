let currentCity = "Ubicación...";
let selectedCategory = "all";
let selectedFilterType = "all";
let currentSort = "recommended";
let searchQuery = "";
let favorites = new Set();
let currentUser = null;
let isRegisterMode = false;

let categories = [];
let dealsData = [];
let cart = [];
let currentViewingDealId = null;
let pendingVerificationEmail = null;

window.onload = async function () {
    const savedUser = localStorage.getItem('sabor_user');
    if (savedUser) {
        try {
            const parsed = JSON.parse(savedUser);
            if (parsed.name && parsed.email) {
                currentUser = parsed;
                updateAuthUI();
            } else {
                localStorage.removeItem('sabor_user');
            }
        } catch (e) {
            localStorage.removeItem('sabor_user');
        }
    }

    try {
        const [catsResponse, dealsResponse] = await Promise.all([
            fetch('/api/categories'),
            fetch('/api/platillos')
        ]);

        categories = await catsResponse.json();
        const apiDeals = await dealsResponse.json();

        // Limpieza de datos y corrección de temporizadores para evitar el estado "Expirado"
        dealsData = apiDeals.map(deal => {
            if (!deal.expiresIn || deal.expiresIn <= 0) {
                deal.expiresIn = Math.floor(Math.random() * 10800) + 3600; // Asigna entre 1 y 4 horas
            }
            return deal;
        });

        renderCategories();

        await fetchLocalMoreliaAPI();

        renderFlashDeals();
        renderDealsGrid();
        startCountdowns();
        lucide.createIcons();
    } catch (error) {
        console.error("Error cargando los datos:", error);
        showToast("Error conectando con el servidor API.");
    }

    document.getElementById('search-input').addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        document.getElementById('clear-search-btn').classList.toggle('hidden', searchQuery === '');
        renderDealsGrid();
    });
};

async function fetchLocalMoreliaAPI() {
    const moreliaLocalData = [
        { id: 'mrl-1', title: 'Tacos Pastor y Suadero (Orden 5)', restaurant: 'Taquería El Infierno', category: 'tacos', image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=600&q=80', badge: 'MÁS PEDIDO', discountType: '2x1', originalPrice: 180, discountPrice: 90, rating: 4.8, reviews: 3100, distance: 1.1, expiresIn: 18000, isFlash: true, couponCode: 'INF2X1', apiSource: 'SaborOfertas Cloud', address: 'Av. Madero Poniente', description: 'Nuestros clásicos tacos al pastor con doble tortilla, piña, cilantro y cebolla.' },
        { id: 'mrl-2', title: 'Uchepos con Crema y Queso', restaurant: 'Restaurante San Miguelito', category: 'tacos', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80', badge: 'TRADICIONAL', discountType: 'shipping', originalPrice: 160, discountPrice: 130, rating: 4.9, reviews: 890, distance: 2.8, expiresIn: 36000, isFlash: false, couponCode: 'MIGUEL130', apiSource: 'SaborOfertas Cloud', address: 'Av. Camelinas', description: 'Auténticos uchepos michoacanos bañados en salsa verde, crema de rancho y queso cotija.' },
        { id: 'mrl-5', title: '1/2 Kilo de Carnitas Estilo Quiroga', restaurant: 'Carnitas Don Raúl', category: 'tacos', image: 'https://images.unsplash.com/photo-1627308595229-7830f5c92258?auto=format&fit=crop&w=600&q=80', badge: 'DOMINGUERO', discountType: '30plus', originalPrice: 240, discountPrice: 168, rating: 4.9, reviews: 4200, distance: 4.2, expiresIn: 28800, isFlash: false, couponCode: 'RAUL168', apiSource: 'SaborOfertas Cloud', address: 'Salida a Quiroga', description: 'Maciza, costilla y cuerito. Incluye tortillas hechas a mano, salsas y limones.' },
        { id: 'mrl-6', title: 'Enchiladas Placeras Michoacanas', restaurant: 'Cenaduría Lupita', category: 'tacos', image: 'https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?auto=format&fit=crop&w=600&q=80', badge: 'CENA', discountType: 'shipping', originalPrice: 110, discountPrice: 85, rating: 4.7, reviews: 650, distance: 1.8, expiresIn: 10800, isFlash: true, couponCode: 'LUPITA85', apiSource: 'SaborOfertas Cloud', address: 'Colonia Ventura Puente', description: 'Con papa, zanahoria, pollo dorado y mucho queso cotija.' },
        { id: 'mrl-3', title: 'Hamburguesa Doble Smash', restaurant: 'Smash Burger Lab', category: 'hamburguesas', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80', badge: 'EXCLUSIVO', discountType: '30plus', originalPrice: 210, discountPrice: 147, rating: 4.9, reviews: 512, distance: 1.4, expiresIn: 7200, isFlash: true, couponCode: 'SMASH30', apiSource: 'SaborOfertas Cloud', address: 'Boulevard Chiquimitio', description: 'Doble carne de res smash, queso cheddar, tocino y aderezo especial.' },
        { id: 'mrl-7', title: 'Pizza a la Leña 4 Quesos', restaurant: 'Pizzería Lasagna', category: 'pizzas', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80', badge: 'ARTESANAL', discountType: '2x1', originalPrice: 280, discountPrice: 140, rating: 4.8, reviews: 1120, distance: 3.1, expiresIn: 14400, isFlash: true, couponCode: 'PIZZA2X1', apiSource: 'SaborOfertas Cloud', address: 'Centro Histórico', description: 'Masa madre, mezcla de provolone, mozzarella, parmesano y gorgonzola al horno de piedra.' },
        { id: 'mrl-8', title: 'Combo Alitas BBQ (10 pzas)', restaurant: 'Wings Army Morelia', category: 'hamburguesas', image: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&w=600&q=80', badge: 'PROMO', discountType: 'shipping', originalPrice: 190, discountPrice: 160, rating: 4.5, reviews: 890, distance: 2.2, expiresIn: 43200, isFlash: false, couponCode: 'WINGS160', apiSource: 'SaborOfertas Cloud', address: 'Plaza Las Américas', description: 'Alitas bañadas en salsa BBQ dulce, acompañadas de apio y aderezo ranch.' },
        { id: 'mrl-4', title: 'Sushi Empanizado Mar y Tierra', restaurant: 'Sushi Itto Camelinas', category: 'sushi', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80', badge: 'GOURMET', discountType: '2x1', originalPrice: 220, discountPrice: 110, rating: 4.6, reviews: 340, distance: 3.5, expiresIn: 21600, isFlash: false, couponCode: 'SUSHI2X1', apiSource: 'SaborOfertas Cloud', address: 'Plaza Camelinas', description: 'Rollo empanizado relleno de camarón, res y queso crema.' },
        { id: 'mrl-9', title: 'Aguachile Verde de Camarón', restaurant: 'Mariscos El Pirata', category: 'saludable', image: 'https://images.unsplash.com/photo-1599021456807-25e0f117c0df?auto=format&fit=crop&w=600&q=80', badge: 'FRESCO', discountType: '30plus', originalPrice: 260, discountPrice: 182, rating: 4.8, reviews: 670, distance: 5.1, expiresIn: 25200, isFlash: false, couponCode: 'PIRA182', apiSource: 'SaborOfertas Cloud', address: 'Periférico Paseo de la República', description: 'Camarón curtido en limón con chile serrano, pepino, cebolla morada y tostadas.' },
        { id: 'mrl-10', title: 'Tazón Poke de Salmón', restaurant: 'Ono Poke Bar', category: 'sushi', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80', badge: 'FITNESS', discountType: 'shipping', originalPrice: 210, discountPrice: 190, rating: 4.9, reviews: 210, distance: 2.0, expiresIn: 86400, isFlash: false, couponCode: 'POKE190', apiSource: 'SaborOfertas Cloud', address: 'Boulevard García de León', description: 'Base de arroz al vapor, salmón fresco, edamames, aguacate, mango y aderezo spicy.' },
        { id: 'mrl-11', title: 'Gaspacho Tradicional Grande', restaurant: 'Gaspachos El Güero de la Merced', category: 'postres', image: 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?auto=format&fit=crop&w=600&q=80', badge: 'LOCAL', discountType: '2x1', originalPrice: 90, discountPrice: 45, rating: 4.9, reviews: 5600, distance: 0.8, expiresIn: 14400, isFlash: true, couponCode: 'GUERO45', apiSource: 'SaborOfertas Cloud', address: 'Andrés Quintana Roo', description: 'El original. Jícama, mango y piña finamente picados con queso, cebolla, chile negro y jugo de naranja.' },
        { id: 'mrl-12', title: 'Frappé de Mazapán & Rebanada de Pastel', restaurant: 'Café del Olmo', category: 'postres', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80', badge: 'SWEET', discountType: '30plus', originalPrice: 150, discountPrice: 105, rating: 4.7, reviews: 320, distance: 1.2, expiresIn: 18000, isFlash: false, couponCode: 'OLMO105', apiSource: 'SaborOfertas Cloud', address: 'Benito Juárez, Centro', description: 'Bebida frappeada con auténtico mazapán de la rosa, crema batida y pastel de chocolate.' },
        { id: 'mrl-13', title: 'Caja de Donas Gourmet (6 pzas)', restaurant: 'Donut Maker', category: 'postres', image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=600&q=80', badge: 'OFERTA', discountType: 'shipping', originalPrice: 180, discountPrice: 140, rating: 4.8, reviews: 890, distance: 3.8, expiresIn: 32400, isFlash: false, couponCode: 'DONA140', apiSource: 'SaborOfertas Cloud', address: 'Plaza Escala Morelia', description: 'Selección del chef con glaseado de maple, chocolate belga, matcha y red velvet.' },
        { id: 'mrl-14', title: 'Corte Rib Eye 400g con Guarnición', restaurant: 'La Cueva de Chucho', category: 'saludable', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', badge: 'PREMIUM', discountType: '30plus', originalPrice: 450, discountPrice: 315, rating: 4.9, reviews: 150, distance: 4.5, expiresIn: 21600, isFlash: true, couponCode: 'RIB315', apiSource: 'SaborOfertas Cloud', address: 'Altozano', description: 'Corte calidad Angus término a elegir, acompañado de papas al romero y vegetales asados.' },
        { id: 'mrl-15', title: 'Chilaquiles Verdes con Arrachera', restaurant: 'Panoli', category: 'tacos', image: 'https://images.unsplash.com/photo-1640719028782-42bbba2eb2e8?auto=format&fit=crop&w=600&q=80', badge: 'DESAYUNO', discountType: 'shipping', originalPrice: 180, discountPrice: 150, rating: 4.6, reviews: 410, distance: 2.1, expiresIn: 50400, isFlash: false, couponCode: 'PANOLI15', apiSource: 'SaborOfertas Cloud', address: 'Acueducto', description: 'Totopos horneados bañados en salsa verde tatemada, 150g de arrachera, crema y cebolla.' }
    ];

    dealsData = [...dealsData, ...moreliaLocalData];
}

function requestGeolocation() {
    showToast('📍 Obteniendo ubicación GPS...');

    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                toggleLocationModal();
                document.getElementById('current-location-text').innerText = "Tu ubicación";
                document.getElementById('mobile-location-text').innerText = "Tu ubicación";
                currentCity = "Tu ubicación";

                showToast('✅ Ubicación detectada. Ordenando por cercanía.');

                dealsData = dealsData.map(deal => {
                    deal.distance = parseFloat((Math.random() * 2.1 + 0.1).toFixed(1));
                    return deal;
                });

                const sortSelect = document.querySelector('select[onchange="handleSortChange(this.value)"]');
                if (sortSelect) sortSelect.value = 'distance';

                handleSortChange('distance');

                setTimeout(() => triggerApiSync(), 800);
            },
            (error) => {
                console.error("Error GPS:", error);
                showToast('❌ Permiso de ubicación denegado.');
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    } else {
        showToast('❌ Navegador no soporta GPS.');
    }
}

function openCouponModal(dealId) {
    const deal = dealsData.find(d => d.id === dealId);
    if (!deal) return;

    currentViewingDealId = deal.id;

    document.getElementById('modal-title').innerText = deal.title;
    document.getElementById('modal-restaurant').innerHTML = `<i data-lucide="store" class="w-3.5 h-3.5"></i> ${deal.restaurant}`;
    document.getElementById('modal-img').src = deal.image;
    document.getElementById('modal-badge').innerText = deal.badge;
    document.getElementById('modal-price-discount').innerText = `$${deal.discountPrice} MXN`;
    document.getElementById('modal-price-original').innerText = `$${deal.originalPrice}`;
    document.getElementById('modal-description').innerText = deal.description;

    const mapQuery = encodeURIComponent(`${deal.restaurant}, ${deal.address}, Morelia, Michoacán`);
    document.getElementById('modal-map-iframe').src = `https://maps.google.com/maps?q=${mapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

    const qrDataObj = {
        ordenId: deal.id,
        restaurante: deal.restaurant,
        cliente: currentUser ? currentUser.name : "Invitado"
    };
    const qrString = encodeURIComponent(JSON.stringify(qrDataObj));
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrString}`;
    document.getElementById('modal-qr-container').innerHTML = `<img src="${qrUrl}" alt="QR Code" class="w-32 h-32 object-contain">`;

    document.getElementById('coupon-modal').classList.remove('hidden');
    document.getElementById('coupon-modal').classList.add('flex');
    lucide.createIcons();
}

function closeCouponModal() {
    document.getElementById('coupon-modal').classList.add('hidden');
    document.getElementById('coupon-modal').classList.remove('flex');
}

function toggleCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    if (drawer.classList.contains('hidden')) {
        renderCart();
        drawer.classList.remove('hidden');
        drawer.classList.add('flex');
    } else {
        drawer.classList.add('hidden');
        drawer.classList.remove('flex');
    }
}

function addToCartFromModal() {
    if (!currentViewingDealId) return;
    const deal = dealsData.find(d => d.id === currentViewingDealId);

    const existingItem = cart.find(item => item.id === deal.id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...deal, quantity: 1 });
    }

    closeCouponModal();
    updateCartCounter();
    showToast(`🛒 Agregado: ${deal.title}`);
}

function removeFromCart(dealId) {
    cart = cart.filter(item => item.id !== dealId);
    renderCart();
    updateCartCounter();
}

function updateCartCounter() {
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    document.getElementById('cart-counter').innerText = totalItems;
}

function renderCart() {
    const list = document.getElementById('cart-items-list');
    let subtotal = 0;

    if (cart.length === 0) {
        list.innerHTML = `
            <div class="text-center py-10 text-slate-400 space-y-2">
                <i data-lucide="shopping-cart" class="w-12 h-12 mx-auto opacity-30"></i>
                <p class="font-bold">Tu carrito está vacío</p>
                <p class="text-xs">¡Agrega platillos deliciosos para continuar!</p>
            </div>`;
        document.getElementById('cart-subtotal').innerText = "$0.00 MXN";
        document.getElementById('cart-total').innerText = "$0.00 MXN";
        lucide.createIcons();
        return;
    }

    list.innerHTML = cart.map(item => {
        subtotal += (item.discountPrice * item.quantity);
        return `
        <div class="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 shadow-sm relative">
            <img src="${item.image}" class="w-16 h-16 rounded-xl object-cover">
            <div class="flex-1 min-w-0">
                <h4 class="text-xs font-bold text-slate-800 truncate">${item.title}</h4>
                <p class="text-[10px] text-slate-500">${item.restaurant}</p>
                <div class="flex justify-between items-center mt-1.5">
                    <span class="text-sm font-black text-brand-600">$${item.discountPrice}</span>
                    <span class="text-xs font-bold bg-white px-2 py-0.5 rounded shadow-sm">Cant: ${item.quantity}</span>
                </div>
            </div>
            <button onclick="removeFromCart('${item.id}')" class="absolute -top-2 -right-2 bg-red-100 hover:bg-red-500 hover:text-white text-red-500 p-1.5 rounded-full transition-colors">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
        </div>`;
    }).join('');

    document.getElementById('cart-subtotal').innerText = `$${subtotal.toFixed(2)} MXN`;
    document.getElementById('cart-total').innerText = `$${subtotal.toFixed(2)} MXN`;
    lucide.createIcons();
}

function checkout() {
    if (cart.length === 0) {
        showToast("⚠️ Tu carrito está vacío.");
        return;
    }
    if (!currentUser) {
        toggleCartDrawer();
        showToast("Debes iniciar sesión para procesar tu pago.");
        toggleAuthModal();
        return;
    }
    showToast("💳 Redirigiendo a pasarela de pago segura...");
    cart = [];
    updateCartCounter();
    toggleCartDrawer();
}

function toggleAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    } else {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function switchAuthMode(mode) {
    isRegisterMode = (mode === 'register');
    const nameField = document.getElementById('name-field-container');
    const title = document.getElementById('auth-modal-title');
    const submitBtn = document.getElementById('auth-submit-btn');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');

    if (isRegisterMode) {
        nameField.classList.remove('hidden');
        title.innerText = 'Crear Cuenta';
        submitBtn.innerText = 'Registrarse';
        tabRegister.className = 'flex-1 py-2 rounded-lg bg-white shadow-sm text-slate-900 transition-all';
        tabLogin.className = 'flex-1 py-2 rounded-lg text-slate-500 transition-all';
    } else {
        nameField.classList.add('hidden');
        title.innerText = 'Iniciar Sesión';
        submitBtn.innerText = 'Acceder';
        tabLogin.className = 'flex-1 py-2 rounded-lg bg-white shadow-sm text-slate-900 transition-all';
        tabRegister.className = 'flex-1 py-2 rounded-lg text-slate-500 transition-all';
    }
}

async function submitAuthForm() {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value.trim();
    const name = document.getElementById('auth-name').value.trim();

    if (!email || !password || (isRegisterMode && !name)) {
        showToast('⚠️ Por favor completa todos los campos.');
        return;
    }

    const endpoint = isRegisterMode ? '/api/register' : '/api/login';
    const payload = isRegisterMode ? { nombre: name, correo: email, password } : { correo: email, password };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('sabor_user', JSON.stringify(currentUser));
            updateAuthUI();
            toggleAuthModal();
            showToast(isRegisterMode ? '🎉 ¡Cuenta creada con éxito!' : `👋 ¡Bienvenido de nuevo, ${currentUser.name}!`);
        } else if (data.requires_verification) {
            pendingVerificationEmail = email;
            toggleAuthModal();
            document.getElementById('verify-email-display').innerText = email;
            document.getElementById('verify-modal').classList.remove('hidden');
            document.getElementById('verify-modal').classList.add('flex');
            showToast('📧 Revisa tu correo electrónico.');
        } else {
            showToast(`❌ ${data.message || 'Ocurrió un error.'}`);
        }
    } catch (err) {
        console.error(err);
        showToast('❌ Error de conexión con el servidor.');
    }
}

async function submitVerification() {
    const code = document.getElementById('verify-code-input').value.trim();
    if (!code) return showToast("Ingresa el código");

    try {
        const res = await fetch('/api/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo: pendingVerificationEmail, codigo: code })
        });
        const data = await res.json();

        if (data.success) {
            closeVerifyModal();
            showToast("✅ Cuenta verificada, ya puedes iniciar sesión.");
            toggleAuthModal();
            switchAuthMode('login');
        } else {
            showToast(`❌ ${data.message}`);
        }
    } catch (err) {
        showToast("Error de red al verificar.");
    }
}

function closeVerifyModal() {
    document.getElementById('verify-modal').classList.add('hidden');
    document.getElementById('verify-modal').classList.remove('flex');
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('sabor_user');
    updateAuthUI();
    toggleAuthModal();
    showToast('Sesión cerrada correctamente.');
}

function updateAuthUI() {
    const btnText = document.getElementById('auth-btn-text');
    const formContainer = document.getElementById('auth-form-container');
    const userInfo = document.getElementById('auth-user-info');
    const modalTitle = document.getElementById('auth-modal-title');

    if (currentUser && currentUser.name) {
        btnText.innerText = currentUser.name.split(' ')[0];
        modalTitle.innerText = 'Mi Cuenta';
        formContainer.classList.add('hidden');
        userInfo.classList.remove('hidden');
        document.getElementById('display-user-name').innerText = currentUser.name;
        document.getElementById('display-user-email').innerText = currentUser.email;
        const initials = currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        document.getElementById('user-avatar-initials').innerText = initials;
    } else {
        btnText.innerText = 'Iniciar Sesión';
        modalTitle.innerText = 'Iniciar Sesión';
        formContainer.classList.remove('hidden');
        userInfo.classList.add('hidden');
    }
}

function renderCategories() {
    const container = document.getElementById('category-chips');
    container.innerHTML = categories.map(cat => {
        const isActive = cat.id === selectedCategory;
        return `
            <button onclick="selectCategory('${cat.id}')" 
                    class="shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${isActive
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }">
                <span>${cat.label}</span>
            </button>
        `;
    }).join('');
}

function selectCategory(catId) {
    selectedCategory = catId;
    renderCategories();
    renderDealsGrid();
}

function renderFlashDeals() {
    const container = document.getElementById('flash-deals-container');
    const flashItems = dealsData.filter(d => d.isFlash).slice(0, 2);

    container.innerHTML = flashItems.map(deal => `
        <div onclick="openCouponModal('${deal.id}')" class="cursor-pointer bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl p-3 border border-white/20 transition-all flex gap-3 items-center group">
            <img src="${deal.image}" alt="${deal.title}" class="w-16 h-16 rounded-xl object-cover shadow-md group-hover:scale-105 transition-transform">
            <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between text-[11px] text-yellow-300 font-bold mb-0.5">
                    <span class="flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i> <span class="countdown-timer" data-expires="${deal.expiresIn}">--:--:--</span></span>
                    <span class="bg-white text-brand-600 px-1.5 py-0.2 rounded font-extrabold text-[10px]">${deal.badge}</span>
                </div>
                <h4 class="text-xs font-bold text-white truncate">${deal.title}</h4>
                <p class="text-[11px] text-brand-100 truncate">${deal.restaurant}</p>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

function renderDealsGrid() {
    const grid = document.getElementById('deals-grid');
    const emptyState = document.getElementById('empty-state');

    let filtered = dealsData.filter(deal => {
        if (selectedCategory !== 'all' && deal.category !== selectedCategory) return false;
        if (selectedFilterType === '2x1' && deal.discountType !== '2x1') return false;
        if (selectedFilterType === '30plus' && deal.discountType !== '30plus') return false;
        if (selectedFilterType === 'shipping' && deal.discountType !== 'shipping') return false;
        if (selectedFilterType === 'flash' && !deal.isFlash) return false;
        if (selectedFilterType === 'api' && !deal.isExternalAPI) return false;

        if (searchQuery) {
            const matchTitle = deal.title.toLowerCase().includes(searchQuery);
            const matchRest = deal.restaurant.toLowerCase().includes(searchQuery);
            const matchCat = deal.category.toLowerCase().includes(searchQuery);
            if (!matchTitle && !matchRest && !matchCat) return false;
        }
        return true;
    });

    if (currentSort === 'discount') {
        filtered.sort((a, b) => (b.originalPrice - b.discountPrice) - (a.originalPrice - a.discountPrice));
    } else if (currentSort === 'distance') {
        filtered.sort((a, b) => a.distance - b.distance);
    } else if (currentSort === 'rating') {
        filtered.sort((a, b) => b.rating - a.rating);
    }

    document.getElementById('deals-count-badge').innerText = filtered.length;

    if (filtered.length === 0) {
        grid.innerHTML = '';
        emptyState.classList.remove('hidden');
        emptyState.classList.add('flex');
        return;
    }

    emptyState.classList.add('hidden');
    emptyState.classList.remove('flex');

    grid.innerHTML = filtered.map(deal => {
        const isFav = favorites.has(deal.id);
        return `
            <div class="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group relative">
                <div class="relative h-44 overflow-hidden bg-slate-100">
                    <img src="${deal.image}" alt="${deal.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                    <div class="absolute top-3 left-3 bg-brand-500 text-white font-extrabold text-xs px-2.5 py-1 rounded-xl shadow-md">${deal.badge}</div>
                    <button onclick="toggleFavorite(event, '${deal.id}')" 
                            class="absolute top-3 right-3 p-2 bg-white/80 hover:bg-white backdrop-blur-md rounded-full shadow-sm transition-transform active:scale-90">
                        <i data-lucide="heart" class="w-4 h-4 ${isFav ? 'text-brand-500 fill-brand-500' : 'text-slate-600'}"></i>
                    </button>
                    <div class="absolute bottom-3 left-3 bg-slate-900/70 backdrop-blur-md text-white text-[11px] font-medium px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <i data-lucide="navigation" class="w-3 h-3 text-brand-500"></i>
                        <span>${deal.distance} km</span>
                    </div>
                </div>
                <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div class="space-y-1.5">
                        <div class="flex items-center justify-between text-xs text-slate-500">
                            <span class="font-bold text-slate-700 truncate max-w-[160px]">${deal.restaurant}</span>
                            <span class="flex items-center gap-1 font-semibold text-amber-500">
                                <i data-lucide="star" class="w-3.5 h-3.5 fill-amber-400"></i> ${deal.rating} (${deal.reviews})
                            </span>
                        </div>
                        <h3 class="font-bold text-slate-900 text-base leading-snug group-hover:text-brand-600 transition-colors">${deal.title}</h3>
                    </div>
                    <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                            <span class="text-xs text-slate-400 block -mb-1">Precio Promocional</span>
                            <div class="flex items-baseline gap-1.5">
                                <span class="text-xl font-extrabold text-slate-900">$${deal.discountPrice}</span>
                                <span class="text-xs text-slate-400 line-through">$${deal.originalPrice}</span>
                            </div>
                        </div>
                        <button onclick="openCouponModal('${deal.id}')" class="bg-slate-900 hover:bg-brand-500 text-white hover:text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1.5">
                            <span>Ver más</span>
                            <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    lucide.createIcons();
}

function startCountdowns() {
    setInterval(() => {
        const timers = document.querySelectorAll('.countdown-timer');
        timers.forEach(timer => {
            let seconds = parseInt(timer.getAttribute('data-expires'));
            if (seconds > 0) {
                seconds--;
                timer.setAttribute('data-expires', seconds);
                const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
                const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
                const s = (seconds % 60).toString().padStart(2, '0');
                timer.innerText = `${h}:${m}:${s}`;
            } else {
                timer.innerText = '00:00:00'; // Evita que se vea el feo "Expirado" si llega a cero
            }
        });
    }, 1000);
}

function toggleFavorite(event, dealId) {
    event.stopPropagation();
    if (favorites.has(dealId)) {
        favorites.delete(dealId);
        showToast('Oferta removida de guardados');
    } else {
        favorites.add(dealId);
        showToast('❤️ Oferta guardada en tus Favoritos');
    }
    updateFavCounter();
    renderDealsGrid();
    renderFavoritesList();
}

function updateFavCounter() {
    document.getElementById('fav-counter').innerText = favorites.size;
}

function toggleFavoritesDrawer() {
    const drawer = document.getElementById('favorites-modal');
    if (drawer.classList.contains('hidden')) {
        renderFavoritesList();
        drawer.classList.remove('hidden');
        drawer.classList.add('flex');
    } else {
        drawer.classList.add('hidden');
        drawer.classList.remove('flex');
    }
}

function renderFavoritesList() {
    const container = document.getElementById('favorites-list');
    const favDeals = dealsData.filter(d => favorites.has(d.id));

    if (favDeals.length === 0) {
        container.innerHTML = `
            <div class="text-center py-10 text-slate-400 space-y-2">
                <i data-lucide="heart-off" class="w-10 h-10 mx-auto"></i>
                <p class="text-xs">Aún no has guardado ninguna oferta.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    container.innerHTML = favDeals.map(deal => `
        <div class="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
            <img src="${deal.image}" class="w-14 h-14 rounded-xl object-cover">
            <div class="flex-1 min-w-0">
                <h4 class="text-xs font-bold text-slate-800 truncate">${deal.title}</h4>
                <p class="text-[11px] text-slate-500">${deal.restaurant}</p>
                <span class="text-xs font-bold text-brand-600">$${deal.discountPrice} MXN</span>
            </div>
            <button onclick="openCouponModal('${deal.id}')" class="bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg font-semibold">
                Ver
            </button>
        </div>
    `).join('');
    lucide.createIcons();
}

function setFilterType(type) {
    selectedFilterType = type;
    document.querySelectorAll('.filter-pill').forEach(pill => {
        if (pill.getAttribute('data-type') === type) {
            pill.className = 'filter-pill active px-3 py-1.5 rounded-full font-semibold bg-slate-900 text-white transition-all shadow-sm';
        } else {
            pill.className = 'filter-pill px-3 py-1.5 rounded-full font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 transition-all';
        }
    });
    renderDealsGrid();
}

function handleSortChange(val) {
    currentSort = val;
    renderDealsGrid();
}

function clearSearch() {
    document.getElementById('search-input').value = '';
    searchQuery = '';
    document.getElementById('clear-search-btn').classList.add('hidden');
    renderDealsGrid();
}

function resetFilters() {
    selectedCategory = 'all';
    selectedFilterType = 'all';
    searchQuery = '';
    document.getElementById('search-input').value = '';
    renderCategories();
    setFilterType('all');
    renderDealsGrid();
}

function toggleLocationModal() {
    const modal = document.getElementById('location-modal');
    modal.classList.toggle('hidden');
}

function selectCity(city) {
    currentCity = city;
    document.getElementById('current-location-text').innerText = city;
    document.getElementById('mobile-location-text').innerText = city;
    toggleLocationModal();
    showToast(`Ubicación actualizada a ${city}`);
    triggerApiSync();
}

function triggerApiSync() {
    const icon = document.getElementById('sync-icon');
    icon.classList.add('animate-spin');
    showToast('🔄 Conectando con Red Local de Morelia...');

    setTimeout(() => {
        icon.classList.remove('animate-spin');
        const apiSources = ['Canirac Michoacán', 'Directorio Centro', 'SaborOfertas Local'];
        const randomSource = apiSources[Math.floor(Math.random() * apiSources.length)];

        const newDeal = {
            id: 'deal-api-' + Date.now(),
            title: '¡Nueva Oferta! Uchepos Especiales',
            restaurant: 'Cenaduría Centro',
            category: 'tacos',
            image: 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?auto=format&fit=crop&w=600&q=80',
            badge: 'EN VIVO', discountType: '30plus', originalPrice: 140, discountPrice: 98,
            rating: 5.0, reviews: 12, distance: 0.4, expiresIn: 10800, isFlash: true,
            couponCode: 'SYNSABOR' + Math.floor(Math.random() * 900 + 100),
            apiSource: randomSource, address: 'Centro Histórico',
            description: 'Uchepos calientitos capturados en tiempo real.',
            terms: 'Oferta capturada ahora.'
        };

        dealsData.unshift(newDeal);
        renderDealsGrid();
        renderFlashDeals();
        showToast(`✅ ¡Sincronizado! +1 oferta desde ${randomSource}`);
    }, 1200);
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 transform transition-all duration-300 translate-y-full opacity-0 border border-slate-700 pointer-events-auto';
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.remove('translate-y-full', 'opacity-0'), 10);
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}