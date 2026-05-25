document.addEventListener("DOMContentLoaded", () => {
    let globalRecipes = [];
    let currentRecipe = null;
    const recipesContainer = document.getElementById('recipesContainer');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const searchInput = document.querySelector('.search-bar input');
    const searchBtn = document.querySelector('.search-btn');
    const filterLinks = document.querySelectorAll('.nav-link:not([href="calculator.html"]), .dropdown-item a, .cat-item');
    const headerLikeBtn = document.getElementById('headerLikeBtn');
    const profileBtn = document.getElementById('profileBtn');
    const historyBtn = document.getElementById('historyBtn');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    const authModal = document.getElementById('authModal');
    const closeAuthModal = document.getElementById('closeAuthModal');
    const historyModal = document.getElementById('historyModal');
    const closeHistoryModal = document.getElementById('closeHistoryModal');
    const recipeModal = document.getElementById('recipeModal');
    const closeRecipeModal = document.getElementById('closeRecipeModal');
    const modalImg = document.getElementById('modalRecipeImg');
    const modalTag = document.getElementById('modalRecipeTag');
    const modalTitle = document.getElementById('modalRecipeTitle');
    const modalTimeText = document.getElementById('modalRecipeTimeText');
    const modalIngredients = document.getElementById('modalRecipeIngredients');
    const modalSteps = document.getElementById('modalRecipeSteps');
    const historyList = document.getElementById('historyList');
    const toggleAuthMode = document.getElementById('toggleAuthMode');
    const authTitle = document.getElementById('authTitle');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    const authHintText = document.getElementById('authHintText');

    let recipes = [];
    let displayedCount =30;
    let currentActiveRecipe = null;
    let currentFilter = 'all';
    let likedRecipeTitles = new Set(JSON.parse(localStorage.getItem('graziaLikes') || '[]'));
    let showLikedOnly = false;

    const categoryKeywords = {
        'сніданки': ['breakfast', 'omelette', 'omelet', 'pancake', 'waffle', 'granola', 'oatmeal', 'porridge', 'bagel', 'toast', 'brunch', 'rosti', 'mille feuille'],
        'закуски': ['appetizer', 'snack', 'bruschetta', 'dip', 'starter', 'tapas', 'canape', 'nacho', 'slider', 'sushi', 'potato skins'],
        'салати': ['salad', 'coleslaw', 'vinaigrette', 'caesar', 'tabbouleh'],
        'перші страви': ['soup', 'stew', 'broth', 'ramen', 'bisque', 'chowder', 'borsch', 'noodle', 'pho'],
        'основні страви': ['chicken', 'beef', 'pasta', 'steak', 'risotto', 'casserole', 'meat', 'fish', 'salmon', 'pork', 'lamb', 'burger', 'taco', 'curry', 'rice', 'duck', 'seafood', 'ribs', 'kofta', 'prawn', 'enchilada', 'roasted'],
        'випічка': ['bread', 'cake', 'cookie', 'croissant', 'pie', 'tart', 'muffin', 'biscuit', 'pastry', 'brioche', 'donut', 'scone', 'strudel', 'cupcake', 'brownie'],
        'десерти': ['dessert', 'pudding', 'sweet', 'brownie', 'ice cream', 'gelato', 'custard', 'cupcake', 'tartlet', 'cheesecake', 'sundae', 'parfait', 'mousse'],
        'напої': ['drink', 'smoothie', 'cocktail', 'mocktail', 'latte', 'coffee', 'espresso', 'lemonade', 'soda', 'milkshake', 'punch', 'tea', 'cocoa', 'juice'],
        'здорове меню': ['healthy', 'vegan', 'vegetarian', 'gluten free', 'low carb', 'low calorie', 'kale', 'quinoa', 'lentil', 'chia', 'superfood', 'avocado', 'fat free', 'sugar free', 'organic']
    };

    const strictCategoryFilters = new Set(['сніданки', 'закуски', 'салати', 'перші страви', 'основні страви', 'випічка', 'десерти', 'напої']);
    const savoryTitleKeywords = ['chicken', 'beef', 'pork', 'fish', 'salmon', 'lamb', 'taco', 'risotto', 'casserole', 'soup', 'dip', 'eggplant', 'carrot', 'potato', 'kofta', 'prawn', 'enchilada', 'steak', 'rice'];
    const keywordRegexCache = new Map();

    const categoryImages = {
        'сніданки': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=700',
        'закуски': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=700',
        'салати': 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=700',
        'перші страви': 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=700',
        'основні страви': 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=700',
        'випічка': 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=700',
        'десерти': 'https://images.unsplash.com/photo-1540331817814-0c0b8c3cfa64?w=700',
        'напої': 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=700',
        'здорове меню': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=700'
    };

    const filterKeyMap = {
        'всі рецепти': 'all',
        'здорове меню': 'healthyMenu',
        'веганські': 'vegan',
        'безглютенові': 'glutenFree',
        'безлактозні': 'lactoseFree',
        'низькокалорійні': 'lowCalorie',
        'колекції': 'collections',
        'святкове меню': 'holiday',
        'сезонні страви': 'seasonal',
        'швидкі вечері': 'quickDinner',
        'світова кухня': 'worldCuisine'
    };

    function normalizeText(text) {
        return (text || '')
            .toString()
            .toLowerCase()
            .replace(/&amp;/g, ' and ')
            .replace(/&#\d+;?/g, ' ')
            .replace(/&[a-z]+;/g, ' ')
            .replace(/[^a-zа-яіїєґ0-9\s-]/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function escapeRegExp(value) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function hasKeyword(text, keyword) {
        const normalizedKeyword = normalizeText(keyword);
        if (!normalizedKeyword) return false;

        if (!keywordRegexCache.has(normalizedKeyword)) {
            const keywordPattern = normalizedKeyword
                .split(' ')
                .map(escapeRegExp)
                .join('\\s+');
            keywordRegexCache.set(
                normalizedKeyword,
                new RegExp(`(^|[^a-zа-яіїєґ0-9])${keywordPattern}([^a-zа-яіїєґ0-9]|$)`, 'i')
            );
        }

        return keywordRegexCache.get(normalizedKeyword).test(text);
    }

    function containsAny(text, terms) {
        return terms.some(term => hasKeyword(text, term));
    }

    function countKeywordMatches(text, terms) {
        return terms.reduce((count, term) => count + (hasKeyword(text, term) ? 1 : 0), 0);
    }

    function getRecipeSearchSource(recipe) {
        return normalizeText([
            recipe.title,
            ...(recipe.tags || []),
            ...(recipe.ingredients || []).map(item => item.name),
            recipe.url || '',
            ...(recipe.instructions || [])
        ].join(' '));
    }

    function getRecipeCategorySource(recipe) {
        return normalizeText([
            recipe.title,
            ...(recipe.tags || []),
            ...(recipe.ingredients || []).map(item => item.name),
            recipe.url || ''
        ].join(' '));
    }

    function getRecipeTitleSource(recipe) {
        return normalizeText([
            recipe.title,
            ...(recipe.tags || []),
            recipe.url || ''
        ].join(' '));
    }

    function getFilterKey(rawText) {
        const text = (rawText || '').toLowerCase().trim();
        
        if (text.includes('святков')) return 'holiday';
        if (text.includes('сезонн')) return 'seasonal';
        if (text.includes('швидк')) return 'quickDinner';
        if (text.includes('світ')) return 'worldCuisine';
        
        if (text.includes('всі')) return 'all';
        if (text.includes('веган')) return 'vegan';
        if (text.includes('безглют')) return 'glutenFree';
        if (text.includes('безлакт')) return 'lactoseFree';
        if (text.includes('низькокал')) return 'lowCalorie';
        if (text.includes('здоров')) return 'healthyMenu';
        
        const normalized = normalizeText(rawText.replace('▼', '').trim());
        return filterKeyMap[normalized] || normalized;
    }

    function detectCategory(recipe) {
        const titleSource = getRecipeTitleSource(recipe);
        const categorySource = getRecipeCategorySource(recipe);

        if (containsAny(titleSource, categoryKeywords['напої'])) {
            return 'напої';
        }
        if (containsAny(titleSource, categoryKeywords['десерти'])) {
            return 'десерти';
        }

        const hasSavoryTitle = containsAny(titleSource, savoryTitleKeywords);
        if (containsAny(titleSource, categoryKeywords['випічка']) && !hasSavoryTitle) {
            return 'випічка';
        }

        if (containsAny(titleSource, categoryKeywords['сніданки'])) {
            return 'сніданки';
        }
        if (containsAny(titleSource, categoryKeywords['салати'])) {
            return 'салати';
        }
        if (containsAny(titleSource, categoryKeywords['перші страви'])) {
            return 'перші страви';
        }
        if (containsAny(titleSource, categoryKeywords['закуски'])) {
            return 'закуски';
        }
        if (containsAny(titleSource, categoryKeywords['основні страви'])) {
            return 'основні страви';
        }
        if (containsAny(categorySource, categoryKeywords['здорове меню'])) {
            return 'здорове меню';
        }

        const savoryScore = countKeywordMatches(categorySource, [
            ...savoryTitleKeywords,
            ...categoryKeywords['основні страви'],
            ...categoryKeywords['закуски'],
            ...categoryKeywords['перші страви']
        ]);
        const dessertScore = countKeywordMatches(categorySource, [
            ...categoryKeywords['десерти'],
            'chocolate',
            'vanilla',
            'caramel',
            'syrup'
        ]);
        const drinkScore = countKeywordMatches(categorySource, categoryKeywords['напої']);

        if (dessertScore >= 2 && savoryScore === 0) {
            return 'десерти';
        }
        if (drinkScore >= 2 && savoryScore === 0) {
            return 'напої';
        }

        if (containsAny(categorySource, categoryKeywords['сніданки'])) {
            return 'сніданки';
        }
        if (containsAny(categorySource, categoryKeywords['салати'])) {
            return 'салати';
        }
        if (containsAny(categorySource, categoryKeywords['перші страви'])) {
            return 'перші страви';
        }
        if (containsAny(categorySource, categoryKeywords['закуски'])) {
            return 'закуски';
        }
        if (containsAny(categorySource, categoryKeywords['основні страви'])) {
            return 'основні страви';
        }

        return 'основні страви';
    }

    function buildRecipeCard(recipe, index) {

        const imageFallback = {
        "Smoked Salmon and Egg Breakfast Mille-feuille": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=700", // Сьомга
        "Middle Eastern Roasted Eggplant with Couscous": "https://media.istockphoto.com/id/2233296510/photo/stuffed-eggplant-with-couscous.webp?a=1&b=1&s=612x612&w=0&k=20&c=FaEbKo2_oIc-GJ4ZCrtV5KFBY-hAzgTTz8XN-iM1Cgg=", // Баклажан
        "Chorizo & Kale Risotto": "https://images.unsplash.com/photo-1575401449875-b695a38ef896?q=80&w=1010&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Різотто
        "Ultra Crispy Smashed Potatoes": "https://images.unsplash.com/photo-1633959639799-6d3f66e05710?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Картопля
        "Cheese and Bacon Potato Skins": "https://images.unsplash.com/photo-1595955538897-d3c8ec58efe2?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Шкірки картоплі
        "One Pot Chicken Enchilada Rice Casserole": "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=700", // Запіканка
        "Smoked Salmon Potato Rosti Stack": "https://plus.unsplash.com/premium_photo-1697032903231-b9c702d816f5?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Рості з лососем
        "Mexican Shredded Beef (and Tacos)": "https://plus.unsplash.com/premium_photo-1661730329741-b3bf77019b39?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Тако
        "Hawaiian Chicken Salad": "https://plus.unsplash.com/premium_photo-1695399566183-df3e7778e198?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Салат з куркою
        "Glazed Stovetop Carrots": "https://images.unsplash.com/photo-1636743716922-1884c23fb6f6?q=80&w=685&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Морква
        "Smoked Trout Dip / Potted Smoked Trout (le Budget le Gourmet)": "https://images.unsplash.com/photo-1695605302524-e6dd509cb170?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Форель
        "Slow-Roasted Crispy Pork Belly": "https://images.unsplash.com/photo-1625477811233-044633d10dd1?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Свинина
        "Queso Dip (Mexican Cheese Dip)": "https://images.unsplash.com/photo-1638992147921-f054a9829b96?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Сирний соус
        "Tom Yum Soup (Thai Soup)": "https://images.unsplash.com/photo-1777828827870-92e3069424bd?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Том Ям
        "Rotisserie Flavoured Chicken and Potato Bake & a Giveaway!": "https://images.unsplash.com/photo-1714683237282-4a4623333058?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Курка запечена
        "Salisbury Steak with Mushroom Gravy": "https://images.unsplash.com/photo-1675969108138-6a181885b105?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Стейк
        "Japanese Salmon with Mirin and Soy Sauce": "https://images.unsplash.com/photo-1585610880923-e886dfb0bb72?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Лосось японський
        "Chili Con Carne Corn Bread Pie": "https://images.unsplash.com/photo-1551807501-9263ed1942d8?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Чилі
        "Lamb Koftas with Yoghurt Dressing": "https://images.unsplash.com/photo-1520218508822-998633d997e6?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Кофта
        "Browned Butter Garlic Prawns with Cauliflower Puree": "https://images.unsplash.com/photo-1751641676715-db06bb0f2ad8?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Креветки
        "Easy French Onion Soup Dip": "https://images.unsplash.com/photo-1561954467-e8e85546d360?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" // Цибулевий суп
    };


        function getRecipeImage(recipe) {
            if (recipe.image) return recipe.image;

            const cleanTitle = recipe.title.replace(/&amp;/g, '&');
            if (imageFallback[cleanTitle]) return imageFallback[cleanTitle];
            recipe.image = imageUrl;

            const cat = detectCategory(recipe);
            if (categoryImages[cat]) return categoryImages[cat];
        
            return 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=700';
        }

        const imageUrl = recipe.image || imageFallback[recipe.title.replace(/&amp;/g, '&')] || 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=700';
        
        const isLiked = likedRecipeTitles.has(recipe.title);
        const heartClass = isLiked ? 'active-like' : '';
        const fill = isLiked ? '#e74c3c' : 'none';
        const stroke = isLiked ? '#e74c3c' : 'currentColor';

        return `
            <div class="recipe-card-new" data-index="${index}" style="background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.05); display: flex; flex-direction: column; position: relative;">
                
                <div class="like-circle ${heartClass}" style="position: absolute; top: 10px; right: 10px; background: white; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 2;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="${fill}" stroke="${stroke}" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                </div>

                <div style="height: 180px;">
                    <img src="${imageUrl}" alt="${recipe.title}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                
                <div style="padding: 15px; display: flex; flex-direction: column; flex-grow: 1;">
                    <h3 style="margin: 0 0 10px 0; font-size: 18px;">${recipe.title}</h3>
                    <div style="margin-top: auto; display: flex; gap: 10px;">
                        <button class="card-btn btn-delete" style="flex: 1; background: #ffebee; color: #d32f2f; border: none; padding: 10px; border-radius: 8px; cursor: pointer;">Видалити</button>
                        <button class="card-btn btn-open" style="flex: 1; background: var(--accent-olive); color: white; border: none; padding: 10px; border-radius: 8px; cursor: pointer;">Всередину</button>
                    </div>
                </div>
            </div>
        `;
    }

    function openRecipeModal(recipe) {
        currentActiveRecipe = recipe;

        document.getElementById('modalRecipeTitle').textContent = recipe.title;

        const modalTimeText = document.getElementById('modalRecipeTimeText');
        if (modalTimeText) {
            modalTimeText.textContent = recipe.total_time ? recipe.total_time + ' хв' : 'Час не вказано';
        }

        const imageFallback = {
            "Smoked Salmon and Egg Breakfast Mille-feuille": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=700",
            "Middle Eastern Roasted Eggplant with Couscous": "https://media.istockphoto.com/id/2233296510/photo/stuffed-eggplant-with-couscous.webp?a=1&b=1&s=612x612&w=0&k=20&c=FaEbKo2_oIc-GJ4ZCrtV5KFBY-hAzgTTz8XN-iM1Cgg=",
            "Chorizo & Kale Risotto": "https://images.unsplash.com/photo-1575401449875-b695a38ef896?q=80&w=1010&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            "Ultra Crispy Smashed Potatoes": "https://images.unsplash.com/photo-1633959639799-6d3f66e05710?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            "Cheese and Bacon Potato Skins": "https://images.unsplash.com/photo-1595955538897-d3c8ec58efe2?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            "One Pot Chicken Enchilada Rice Casserole": "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=700",
            "Smoked Salmon Potato Rosti Stack": "https://plus.unsplash.com/premium_photo-1697032903231-b9c702d816f5?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            "Mexican Shredded Beef (and Tacos)": "https://plus.unsplash.com/premium_photo-1661730329741-b3bf77019b39?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            "Hawaiian Chicken Salad": "https://plus.unsplash.com/premium_photo-1695399566183-df3e7778e198?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            "Glazed Stovetop Carrots": "https://images.unsplash.com/photo-1636743716922-1884c23fb6f6?q=80&w=685&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            "Smoked Trout Dip / Potted Smoked Trout (le Budget le Gourmet)": "https://images.unsplash.com/photo-1695605302524-e6dd509cb170?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            "Slow-Roasted Crispy Pork Belly": "https://images.unsplash.com/photo-1625477811233-044633d10dd1?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            "Queso Dip (Mexican Cheese Dip)": "https://images.unsplash.com/photo-1638992147921-f054a9829b96?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            "Tom Yum Soup (Thai Soup)": "https://images.unsplash.com/photo-1777828827870-92e3069424bd?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            "Rotisserie Flavoured Chicken and Potato Bake & a Giveaway!": "https://images.unsplash.com/photo-1714683237282-4a4623333058?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            "Salisbury Steak with Mushroom Gravy": "https://images.unsplash.com/photo-1675969108138-6a181885b105?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            "Japanese Salmon with Mirin and Soy Sauce": "https://images.unsplash.com/photo-1585610880923-e886dfb0bb72?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            "Chili Con Carne Corn Bread Pie": "https://images.unsplash.com/photo-1551807501-9263ed1942d8?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            "Lamb Koftas with Yoghurt Dressing": "https://images.unsplash.com/photo-1520218508822-998633d997e6?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            "Browned Butter Garlic Prawns with Cauliflower Puree": "https://images.unsplash.com/photo-1751641676715-db06bb0f2ad8?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            "Easy French Onion Soup Dip": "https://images.unsplash.com/photo-1561954467-e8e85546d360?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        };
        const cleanTitle = recipe.title.replace(/&amp;/g, '&');
        const finalImageUrl = recipe.image || imageFallback[cleanTitle] || 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=700';

        const modalImg = document.getElementById('modalRecipeImg');
        if (modalImg) modalImg.src = finalImageUrl;
        
        const modalTag = document.getElementById('modalRecipeTag');
        if (modalTag) modalTag.textContent = detectCategory(recipe);



        const stepsContainer = document.getElementById('modalRecipeSteps');
        stepsContainer.innerHTML = recipe.instructions && recipe.instructions.length
            ? recipe.instructions.filter(Boolean).join('<br><br>')
            : 'Інструкція буде додана пізніше.';

        const slider = document.getElementById('modal-portion-slider');
        const sliderVal = document.getElementById('modal-portion-val');
        
        if (slider && sliderVal) {
            slider.value = 1;
            sliderVal.textContent = "1";
        }

        calculateIngredients(1);

        recipeModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function calculateIngredients(desiredPortions) {
        if (!currentActiveRecipe) return;
        const list = document.getElementById('modalRecipeIngredients');
        list.innerHTML = '';
    
        const baseServings = currentActiveRecipe.servings || 1;
        const multiplier = desiredPortions / baseServings;

        (currentActiveRecipe.ingredients || []).forEach(ing => {
            let newQuantity = '';
        if (ing.quantity) {
            let calc = ing.quantity * multiplier;
            newQuantity = Number(calc.toFixed(1)).toString(); 
        }
        
            const unit = ing.unit ? ` ${ing.unit}` : '';
            const notes = ing.notes ? ` <i>(${ing.notes})</i>` : '';
        
            list.innerHTML += `<li style="padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.05); font-size: 14px; display: flex; justify-content: space-between;">
                <span style="font-weight: 600; color: var(--accent-olive);">${newQuantity}${unit}</span>
                <span style="text-align: right;">${ing.name}${notes}</span>
            </li>`;
        });
    }

    function saveToHistory(recipe) {
        const history = JSON.parse(localStorage.getItem('graziaHistory') || '[]');
        const filteredHistory = history.filter(item => item.title !== recipe.title);
        filteredHistory.unshift({ title: recipe.title, img: recipe.image || '', category: detectCategory(recipe) });
        localStorage.setItem('graziaHistory', JSON.stringify(filteredHistory.slice(0, 6)));
    }

    function renderHistory() {
        const history = JSON.parse(localStorage.getItem('graziaHistory') || '[]');
        if (!history.length) {
            historyList.innerHTML = '<p style="color: var(--text-gray); font-size: 13px; text-align: center;">Тут будуть ваші недавно переглянуті рецепти.</p>';
            return;
        }
        historyList.innerHTML = history.map(item => `
            <div class="history-item">
                <img src="${item.img || 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=700'}" alt="${item.title}">
                <div class="history-item-title">${item.title}</div>
            </div>
        `).join('');
    }

    function applyFilters() {
        const showingLikedOnly = headerLikeBtn && headerLikeBtn.classList.contains('liked');
        const cards = document.querySelectorAll('.recipe-card');

        cards.forEach(card => {
            const recipeIndex = Number(card.dataset.index);
            const recipe = recipes[recipeIndex];
            const isLiked = card.querySelector('.like-circle').classList.contains('liked');
            const filterMatch = filterRecipe(recipe, currentFilter);
            const likedMatch = showingLikedOnly ? isLiked : true;
            card.style.display = filterMatch && likedMatch ? 'flex' : 'none';
        });
    }

    function handleFilters() {
        const rawText = this.classList.contains('cat-item')
            ? this.querySelector('.cat-title').textContent
            : this.textContent.replace('▼', '');

        const clickedKey = getFilterKey(rawText);
        currentFilter = currentFilter === clickedKey && clickedKey !== 'all' ? 'all' : clickedKey;
        filterLinks.forEach(link => link.classList.remove('active'));

        if (currentFilter === 'all') {
            const firstNav = document.querySelector('.nav-menu .nav-link');
            if (firstNav) firstNav.classList.add('active');
            document.querySelectorAll('.cat-item').forEach(item => item.classList.remove('active'));
        } else {
            filterLinks.forEach(link => {
                const text = link.classList.contains('cat-item')
                    ? link.querySelector('.cat-title').textContent
                    : link.textContent.replace('▼', '');
                const linkKey = getFilterKey(text);
                if (linkKey === currentFilter) {
                    link.classList.add('active');
                    if (link.closest('.dropdown')) {
                        link.closest('.nav-item')?.querySelector('.nav-link')?.classList.add('active');
                    }
                }
            });
        }

        renderRecipes(true);
    }

    function filterRecipe(recipe, filterKey) {
        if (filterKey === 'all') {
            return true;
        }

        const searchSource = getRecipeSearchSource(recipe);
        const titleSource = getRecipeTitleSource(recipe);
        const category = detectCategory(recipe);

        const hasAnimalTerms = containsAny(searchSource, ['chicken', 'beef', 'pork', 'fish', 'salmon', 'shrimp', 'meat', 'egg', 'eggs', 'milk', 'butter', 'cheese', 'yogurt', 'cream', 'honey', 'sausage', 'bacon', 'ham']);
        const hasGlutenTerms = containsAny(searchSource, ['flour', 'bread', 'pasta', 'spaghetti', 'noodle', 'couscous', 'cake', 'cookie', 'crust', 'biscuit', 'croissant', 'dough', 'pizza', 'ramen', 'lasagna']);
        const hasDairyTerms = containsAny(searchSource, ['milk', 'cream', 'butter', 'cheese', 'yogurt', 'sour cream', 'custard', 'buttermilk']);

        const isHealthyCategory = category === 'здорове меню';
        const hasVeganTerms = containsAny(searchSource, ['vegan', 'vegetarian', 'веган', 'веганські', 'plant-based', 'plant based', 'meatless', 'meat free', 'без м\'яса', 'безмяс']);
        const hasGlutenFreeTerms = containsAny(searchSource, ['gluten free', 'безглютен', 'gluten-free', 'rice', 'quinoa', 'corn', 'potato', 'buckwheat', 'amaranth', 'millet', 'lentil', 'beans', 'soy']);
        const hasLactoseFreeTerms = containsAny(searchSource, ['lactose free', 'безлактоз', 'dairy free', 'dairy-free', 'coconut milk', 'almond milk', 'soy milk', 'rice milk', 'olive oil', 'vegetable oil']);
        const hasLowCalorieTerms = containsAny(searchSource, ['low calorie', 'низькокалорій', 'низькокалор', 'light meal', 'light recipe', 'salad', 'soup', 'broth', 'steamed', 'grilled', 'vegetable', 'zucchini', 'spinach', 'cucumber', 'lettuce', 'broccoli', 'cauliflower', 'lentil', 'beans']);
        const hasStrictGlutenFreeTerms = containsAny(searchSource, ['gluten free', 'безглютен', 'gluten-free']);
        const hasStrictLactoseFreeTerms = containsAny(searchSource, ['lactose free', 'безлактоз', 'dairy free', 'dairy-free']);
        const hasStrictLowCalorieTerms = containsAny(searchSource, ['low calorie', 'низькокалорій', 'низькокалор']);
        const hasHeavyTerms = containsAny(searchSource, ['pork belly', 'deep fried', 'bacon', 'sausage', 'heavy cream', 'double cream', 'queso', 'butter sauce', 'pastry']);

        if (filterKey === 'healthyMenu') {
            return isHealthyCategory || hasVeganTerms || hasStrictGlutenFreeTerms || hasStrictLactoseFreeTerms || filterRecipe(recipe, 'lowCalorie');
        }
        if (filterKey === 'vegan') {
            return isHealthyCategory || hasVeganTerms || (!hasAnimalTerms && containsAny(searchSource, ['tofu', 'lentil', 'chickpea', 'beans', 'eggplant', 'zucchini', 'mushroom', 'avocado', 'quinoa', 'rice', 'couscous', 'vegetable', 'salad']));
        }
        if (filterKey === 'glutenFree') {
            return isHealthyCategory || hasGlutenFreeTerms || (!hasGlutenTerms && containsAny(searchSource, ['rice', 'quinoa', 'corn', 'potato', 'buckwheat', 'amaranth', 'millet', 'lentil', 'beans', 'sorghum', 'cassava', 'almond flour', 'coconut flour']));
        }
        if (filterKey === 'lactoseFree') {
            return isHealthyCategory || hasLactoseFreeTerms || (!hasDairyTerms && containsAny(searchSource, ['broth', 'salad', 'vegetable', 'olive oil', 'coconut milk', 'soy milk', 'rice milk', 'tomato', 'grilled', 'roasted', 'almond milk', 'nut milk']));
        }
        if (filterKey === 'lowCalorie') {
            return isHealthyCategory
                || hasStrictLowCalorieTerms
                || (hasLowCalorieTerms && !hasHeavyTerms);
        }
        if (filterKey === 'випічка') {
            return category === 'випічка';
        }
        if (filterKey === 'десерти') {
            return category === 'десерти';
        }
        if (filterKey === 'напої') {
            return category === 'напої';
        }
        if (filterKey === 'collections') {
            return filterRecipe(recipe, 'holiday') || filterRecipe(recipe, 'seasonal') || filterRecipe(recipe, 'quickDinner') || filterRecipe(recipe, 'worldCuisine');
        }
        if (filterKey === 'holiday') {
            return containsAny(searchSource, ['holiday', 'festive', 'christmas', 'thanksgiving', 'easter', 'celebration', 'святков', 'різдвян']);
        }
        if (filterKey === 'seasonal') {
            return containsAny(searchSource, ['seasonal', 'summer', 'winter', 'autumn', 'spring', 'fall', 'сезонн', 'літн', 'зимн']);
        }
        if (filterKey === 'quickDinner') {
            const isDinnerLikeCategory = category === 'основні страви' || category === 'перші страви' || category === 'салати' || category === 'закуски';
            return containsAny(searchSource, ['quick', 'easy', 'fast', '30 min', 'ready in', 'швидк', 'прост']) || (isDinnerLikeCategory && (recipe.prep_time || 0) <= 30);
        }
        if (filterKey === 'worldCuisine') {
            return containsAny(searchSource, ['indian', 'italian', 'mexican', 'japanese', 'thai', 'asian', 'french', 'world', 'кухня']);
        }
        if (strictCategoryFilters.has(filterKey)) {
            return category === filterKey;
        }

        return category.includes(filterKey) || searchSource.includes(filterKey);
    }

    function buildFilteredRecipes() {
        const searchTerm = normalizeText(searchInput.value);
        return recipes
            .map((recipe, index) => ({ recipe, index }))
            .filter(({ recipe }) => {
                const searchSource = getRecipeSearchSource(recipe);

                const matchesFilter = filterRecipe(recipe, currentFilter);
                const matchesSearch = !searchTerm || searchSource.includes(searchTerm);
                const matchesLikes = !showLikedOnly || likedRecipeTitles.has(recipe.title);
                return matchesFilter && matchesSearch && matchesLikes;
            });
    }

    function renderRecipes(resetCount = false) {
        const filtered = buildFilteredRecipes();
        if (resetCount) displayedCount = 30;
        const visible = filtered.slice(0, displayedCount);

        if (!visible.length) {
            const categoryEmptyTextMap = {
                'сніданки': 'У категорії "Сніданки" поки немає рецептів.',
                'закуски': 'У категорії "Закуски" поки немає рецептів.',
                'салати': 'У категорії "Салати" поки немає рецептів.',
                'перші страви': 'У категорії "Перші страви" поки немає рецептів.',
                'основні страви': 'У категорії "Основні страви" поки немає рецептів.',
                'випічка': 'У категорії "Випічка" поки немає рецептів.',
                'десерти': 'У категорії "Десерти" поки немає рецептів.',
                'напої': 'У категорії "Напої" поки немає рецептів.'
            };
            const emptyText = categoryEmptyTextMap[currentFilter] || 'Рецепти не знайдені. Спробуйте інше слово для пошуку або оберіть іншу категорію.';
            recipesContainer.innerHTML = `<div class="recipe-empty">${emptyText}</div>`;
            loadMoreBtn.style.display = 'none';
            return;
        }

        recipesContainer.innerHTML = visible.map(({ recipe, index }) => buildRecipeCard(recipe, index)).join('');
        loadMoreBtn.style.display = filtered.length > displayedCount ? 'inline-flex' : 'none';
        attachCardEvents();
        applyFilters();
    }

    function attachCardEvents() {
        document.querySelectorAll('.recipe-card-new').forEach(card => {
            const recipeIndex = Number(card.dataset.index);
            const recipe = recipes[recipeIndex];

            const btnOpen = card.querySelector('.btn-open');
            if (btnOpen) {
                btnOpen.addEventListener('click', (e) => {
                    e.stopPropagation();
                    recipe.image = card.querySelector('img').src;
                    saveToHistory(recipe);
                    openRecipeModal(recipe);
                });
            }

            const btnDelete = card.querySelector('.btn-delete');
            if (btnDelete) {
                btnDelete.addEventListener('click', (e) => {
                    e.stopPropagation();
                    card.remove();
                });
            }

            const btnLike = card.querySelector('.like-circle');
            if (btnLike) {
                btnLike.style.cursor = 'pointer';
                
                btnLike.addEventListener('click', (e) => {
                    e.stopPropagation();
                    btnLike.classList.toggle('active-like');
                    
                    const svg = btnLike.querySelector('svg');
                    
                    if (btnLike.classList.contains('active-like')) {
                        likedRecipeTitles.add(recipe.title);
                        svg.style.fill = '#e74c3c';
                        svg.style.stroke = '#e74c3c';
                    } else {
                        likedRecipeTitles.delete(recipe.title);
                        svg.style.fill = 'none';
                        svg.style.stroke = 'currentColor';
                    }
                    
                    localStorage.setItem('graziaLikes', JSON.stringify([...likedRecipeTitles]));
                });
            }
        });
    }

    async function loadRecipes() {
        try {
            const response = await fetch('global_recipes_database.json');
            recipes = await response.json();
        } catch (error) {
            recipes = [];
            console.error('Error loading recipes:', error);
        }
        renderRecipes();
    }

    function setupEvents() {
        if (headerLikeBtn) {
            headerLikeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                showLikedOnly = !showLikedOnly;
                headerLikeBtn.style.color = showLikedOnly ? '#e74c3c' : '';
                renderRecipes(true);
            });
        }
        filterLinks.forEach(link => link.addEventListener('click', event => {
            event.preventDefault();
            handleFilters.call(link);
        }));

        if (searchBtn) {
            searchBtn.addEventListener('click', event => {
                event.preventDefault();
                renderRecipes(true);
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                renderRecipes(true);
            });
            
            searchInput.addEventListener('keydown', event => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    renderRecipes(true);
                }
            });
        }

        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                displayedCount += 30;
                renderRecipes();
            });
        }

        if (mobileMenuBtn && navMenu) {
            mobileMenuBtn.addEventListener('click', event => {
                event.preventDefault();
                navMenu.classList.toggle('active');
                document.querySelectorAll('.nav-item.open').forEach(item => item.classList.remove('open'));
            });

            document.addEventListener('click', event => {
                if (!event.target.closest('nav') && !event.target.closest('.mobile-menu-btn')) {
                    navMenu.classList.remove('active');
                }
            });

            document.querySelectorAll('.nav-item').forEach(item => {
                const submenu = item.querySelector('.dropdown');
                const toggleLink = item.querySelector('.nav-link');
                if (submenu && toggleLink) {
                    toggleLink.addEventListener('click', event => {
                        if (window.innerWidth <= 992) {
                            event.preventDefault();
                            item.classList.toggle('open');
                        }
                    });
                }
            });
        }

        if (headerLikeBtn) {
            headerLikeBtn.addEventListener('click', event => {
                event.preventDefault();
                headerLikeBtn.classList.toggle('liked');
                applyFilters();
            });
        }

        if (profileBtn) {
            profileBtn.addEventListener('click', event => {
                event.preventDefault();
                authModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            });
        }

        if (closeAuthModal) {
            closeAuthModal.addEventListener('click', () => {
                authModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            });
        }

        if (historyBtn) {
            historyBtn.addEventListener('click', event => {
                event.preventDefault();
                renderHistory();
                historyModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            });
        }

        if (closeHistoryModal) {
            closeHistoryModal.addEventListener('click', () => {
                historyModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            });
        }

        if (closeRecipeModal) {
            closeRecipeModal.addEventListener('click', () => {
                recipeModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            });
        }

        window.addEventListener('click', event => {
            if (event.target === recipeModal) {
                recipeModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
            if (event.target === authModal) {
                authModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
            if (event.target === historyModal) {
                historyModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });

        if (toggleAuthMode) {
            toggleAuthMode.addEventListener('click', event => {
                event.preventDefault();
                const isLoginMode = authTitle.textContent.trim() === 'Ласкаво просимо';
                authTitle.textContent = isLoginMode ? 'Реєстрація' : 'Ласкаво просимо';
                authSubmitBtn.textContent = isLoginMode ? 'Створити акаунт' : 'Увійти';
                authHintText.textContent = isLoginMode ? 'Вже є акаунт?' : 'Немає акаунту?';
                toggleAuthMode.textContent = isLoginMode ? 'Увійти' : 'Зареєструватися';
            });
        }
        const portionSlider = document.getElementById('modal-portion-slider');
        if (portionSlider) {
            portionSlider.addEventListener('input', (e) => {
                const val = e.target.value;
                document.getElementById('modal-portion-val').textContent = val;
                calculateIngredients(val);
            });
        }

    const parseBtn = document.getElementById('parse-url-btn');
    const urlInput = document.getElementById('parse-url-input');
    const parseMsg = document.getElementById('parse-message');

    if (parseBtn && urlInput && parseMsg) {
        parseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetUrl = urlInput.value.trim();
            parseMsg.style.display = 'block';

            if (!targetUrl) {
                parseMsg.style.color = '#e74c3c';
                parseMsg.textContent = "Помилка: Вставте посилання на рецепт у поле!";
                return;
            }

            if (!targetUrl.startsWith('http')) {
                parseMsg.style.color = '#e74c3c';
                parseMsg.textContent = "Помилка: Невірний формат посилання.";
                return;
            }

            parseBtn.innerText = "Парсинг...";
            parseMsg.style.color = 'var(--text-dark)';
            parseMsg.textContent = "Зв'язок із сервером... Аналізуємо рецепт...";

            setTimeout(() => {
                parseBtn.innerText = "Пошук";
                parseMsg.style.color = '#e74c3c';
                parseMsg.textContent = "Помилка: рецепт не знайдено.";
                
                setTimeout(() => {
                    parseMsg.style.display = 'none';
                }, 5000);
            }, 2000);
        });
    }

        const loadDbBtn = document.getElementById('parse-predefined-btn');
        if (loadDbBtn) {
            loadDbBtn.addEventListener('click', () => {
                loadDbBtn.innerText = "Завантаження...";
                loadRecipes().then(() => {
                    loadDbBtn.innerText = "Завантажити із заготованих адрес";
                });
            });
        }
    }

    setupEvents();
    });
