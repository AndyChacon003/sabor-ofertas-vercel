let currentCity = "Morelia, Mich.";
let selectedCategory = "all";
let selectedFilterType = "all";
let currentSort = "recommended";
let searchQuery = "";
let favorites = new Set();
let currentUser = null;

let categories = [];
let dealsData = [];
let apiGlobalMeals = [];

window.onload = async function () {
    // Cargar sesión guardada si existe
    const savedUser = localStorage.getItem('sabor_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateAuthUI();
    }

    try {
        const [catsResponse, dealsResponse] = await Promise.all([
            fetch('/api/categories'),
            fetch('/api/deals')
        ]);

        categories = await catsResponse.json();
        dealsData = await dealsResponse.json();

        renderCategories();

        // Cargar platillos externos de API de Comida Masiva (TheMealDB)
        await fetchExternalFoodAPI();

        renderFlashDeals();
        renderDealsGrid();
        startCountdowns();
        lucide.createIcons();
    } catch (error) {
        console.error("Error cargando los datos desde la API:", error);
        showToast("Error conectando con el servidor API.");
    }

    document.getElementById('search-input').addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        document.getElementById('clear-search-btn').classList.toggle('hidden', searchQuery === '');
        renderDealsGrid();
    });
};

// Integración de API externa masiva de comida (TheMealDB)
async function fetchExternalFoodAPI() {
    try {
        const res = await fetch('https://www.themealdb.com/api/json/v1/1/search.php?s=');
        const data = await res.json();
        if (data && data.meals) {
            apiGlobalMeals = data.meals.map((meal, index) => ({
                id: 'meal-api-' + meal.idMeal,
                title: meal.strMeal,
                restaurant: `${meal.strArea} Kitchen (${meal.strCategory})`,
                category: 'saludable',
                image: meal.strMealThumb,
                badge: 'GLOBAL API',
                discountType: index % 2 === 0 ? 'shipping' : '30plus',
                originalPrice: 220 + (index * 5),
                discountPrice: 150 + (index * 3),
                rating: 4.8,
                reviews: 45 + index,
                distance: parseFloat((1.2 + (index * 0.3)).toFixed(1)),
                expiresIn: 3600 * 6,
                isFlash: index < 2,
                couponCode: 'GLOBAL' + meal.idMeal.slice(-4),
                apiSource: 'TheMealDB Global API',
                address: 'Sucursal Digital Internacional',
                description: meal.strInstructions ? meal.strInstructions.substring(0, 140) + '...' : 'Platillo internacional preparado al momento.',
                terms: 'Válido para entrega a domicilio o recoger en sucursal participante.',
                isExternalAPI: true
            }));
            dealsData = [...dealsData, ...apiGlobalMeals];
        }
    } catch (err) {
        console.error("No se pudo cargar la API externa de comida:", err);
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
                            <span>Obtener</span>
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
                timer.innerText = 'Expirado';
            }
        });
    }, 1000);
}

// Funciones de Inicio de Sesión
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

function handleLogin() {
    const name = document.getElementById('login-name').value.trim();
    const email = document.getElementById('login-email').value.trim();
    if (!name || !email) {
        showToast('⚠️ Por favor completa tu nombre y correo.');
        return;
    }
    currentUser = { name, email };
    localStorage.setItem('sabor_user', JSON.stringify(currentUser));
    updateAuthUI();
    toggleAuthModal();
    showToast(`👋 ¡Bienvenido de nuevo, ${name}!`);
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

    if (currentUser) {
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

function openCouponModal(dealId) {
    const deal = dealsData.find(d => d.id === dealId);
    if (!deal) return;

    document.getElementById('modal-title').innerText = deal.title;
    document.getElementById('modal-restaurant').innerHTML = `<i data-lucide="store" class="w-3.5 h-3.5"></i> ${deal.restaurant}`;
    document.getElementById('modal-img').src = deal.image;
    document.getElementById('modal-badge').innerText = deal.badge;
    document.getElementById('modal-api-source').innerText = deal.apiSource;
    document.getElementById('modal-price-discount').innerText = `$${deal.discountPrice} MXN`;
    document.getElementById('modal-price-original').innerText = `$${deal.originalPrice}`;
    document.getElementById('modal-coupon-code').innerText = deal.couponCode;
    document.getElementById('modal-description').innerText = deal.description;
    document.getElementById('modal-address').innerText = deal.address;
    document.getElementById('modal-terms').innerText = `* ${deal.terms}`;
    document.getElementById('modal-map-link').href = `https://maps.google.com/?q=${encodeURIComponent(deal.restaurant + ' ' + deal.address)}`;

    const qrContainer = document.getElementById('modal-qr-container');
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(deal.couponCode)}`;
    qrContainer.innerHTML = `<img src="${qrUrl}" alt="QR Code" class="w-32 h-32 object-contain">`;

    document.getElementById('coupon-modal').classList.remove('hidden');
    document.getElementById('coupon-modal').classList.add('flex');
    lucide.createIcons();
}

function closeCouponModal() {
    document.getElementById('coupon-modal').classList.add('hidden');
    document.getElementById('coupon-modal').classList.remove('flex');
}

function copyCouponCode() {
    const code = document.getElementById('modal-coupon-code').innerText;
    const tempInput = document.createElement('input');
    tempInput.value = code;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);

    const btnText = document.getElementById('copy-btn-text');
    btnText.innerText = '¡Copiado!';
    showToast('Código de cupón copiado al portapapeles 📋');
    setTimeout(() => { btnText.innerText = 'Copiar'; }, 2000);
}

function markAsRedeemed() {
    const scheduleSelect = document.getElementById('delivery-schedule-select');
    const scheduleText = scheduleSelect.options[scheduleSelect.selectedIndex].text;
    closeCouponModal();
    showToast(`🎉 ¡Pedido programado exitosamente! (${scheduleText})`);
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
    showToast('🔄 Conectando con APIs...');

    setTimeout(() => {
        icon.classList.remove('animate-spin');
        const apiSources = ['Rappi API v3', 'UberEats API', 'Google Places + POS', 'Kenia POS Cloud'];
        const randomSource = apiSources[Math.floor(Math.random() * apiSources.length)];

        const newDeal = {
            id: 'deal-api-' + Date.now(),
            title: '¡Nueva Oferta! 30% en Chilaquiles',
            restaurant: 'El Rinconcito Michoacano',
            category: 'tacos',
            image: 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?auto=format&fit=crop&w=600&q=80',
            badge: 'NUEVO API', discountType: '30plus', originalPrice: 140, discountPrice: 98,
            rating: 5.0, reviews: 12, distance: 0.4, expiresIn: 3600 * 3, isFlash: true,
            couponCode: 'SYNSABOR' + Math.floor(Math.random() * 900 + 100),
            apiSource: randomSource, address: 'Calle Aquiles Serdán #45',
            description: 'Chilaquiles verdes o rojos con pollo desmenuzado, crema, queso cotija y frijoles refritos.',
            terms: 'Oferta capturada en tiempo real.'
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