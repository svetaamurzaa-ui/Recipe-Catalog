document.addEventListener("DOMContentLoaded", () => {
    const cards = document.querySelectorAll(".recipe-card");
    const filterLinks = document.querySelectorAll(".nav-link, .dropdown-item a, .cat-item");
    const likeButtons = document.querySelectorAll('.like-circle');
    
    const headerLikeBtn = document.querySelector('#headerLikeBtn');
    const profileBtn = document.getElementById('profileBtn');
    const historyBtn = document.getElementById('historyBtn');
    
    let currentFilter = "all"; 

    function applyFilters() {
        let showingLikedOnly = headerLikeBtn && headerLikeBtn.classList.contains('liked');
        cards.forEach(card => {
            const cardCats = card.getAttribute("data-categories") || "";
            const isLiked = card.querySelector('.like-circle').classList.contains('liked');
            let categoryMatch = (currentFilter === "all" || cardCats.includes(currentFilter));
            let likedMatch = showingLikedOnly ? isLiked : true;

            if (categoryMatch && likedMatch) {
                card.style.display = "flex";
            } else {
                card.style.display = "none";
            }
        });
    }

    likeButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation(); 
            this.classList.toggle('liked');
            applyFilters(); 
        });
    });

    if (headerLikeBtn) {
        headerLikeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            this.classList.toggle('liked');
            applyFilters(); 
        });
    }

    const authModal = document.getElementById("authModal");
    const closeAuthModal = document.getElementById("closeAuthModal");
    const historyModal = document.getElementById("historyModal");
    const closeHistoryModal = document.getElementById("closeHistoryModal");

    if (profileBtn) {
        profileBtn.addEventListener("click", (e) => {
            e.preventDefault();
            profileBtn.classList.add("active-profile"); 
            authModal.style.display = "flex";
            document.body.style.overflow = "hidden";
        });
    }
    if (closeAuthModal) {
        closeAuthModal.addEventListener("click", () => {
            authModal.style.display = "none";
            document.body.style.overflow = "auto";
            profileBtn.classList.remove("active-profile");
        });
    }

    if (historyBtn) {
        historyBtn.addEventListener("click", (e) => {
            e.preventDefault();
            historyBtn.classList.add("active-profile"); 
            renderHistory(); 
            historyModal.style.display = "flex";
            document.body.style.overflow = "hidden";
        });
    }
    if (closeHistoryModal) {
        closeHistoryModal.addEventListener("click", () => {
            historyModal.style.display = "none";
            document.body.style.overflow = "auto";
            historyBtn.classList.remove("active-profile");
        });
    }

    function saveToHistory(recipe) {
        let history = JSON.parse(localStorage.getItem('graziaHistory')) || [];
        history = history.filter(item => item.title !== recipe.title); 
        history.unshift(recipe); 
        if (history.length > 5) history.pop();
        localStorage.setItem('graziaHistory', JSON.stringify(history));
    }

    function renderHistory() {
        const historyList = document.getElementById('historyList');
        let history = JSON.parse(localStorage.getItem('graziaHistory')) || [];
        
        if (history.length === 0) {
            historyList.innerHTML = '<p style="color: var(--text-gray); font-size: 13px; text-align: center;">Тут будуть ваші недавно переглянуті рецепти.</p>';
            return;
        }

        historyList.innerHTML = history.map(item => `
            <div class="history-item">
                <img src="${item.img}" alt="${item.title}">
                <div class="history-item-title">${item.title}</div>
            </div>
        `).join('');
    }

    const recipeModal = document.getElementById("recipeModal");
    const closeRecipeModal = document.getElementById("closeRecipeModal");
    const modalImg = document.getElementById("modalRecipeImg");
    const modalTag = document.getElementById("modalRecipeTag");
    const modalTitle = document.getElementById("modalRecipeTitle");
    const modalTimeText = document.getElementById("modalRecipeTimeText");
    const modalIngredients = document.getElementById("modalRecipeIngredients");
    const modalSteps = document.getElementById("modalRecipeSteps");

    cards.forEach(card => {
        card.addEventListener("click", (e) => {
            if (e.target.closest('.like-circle')) return;

            const imgSrc = card.querySelector("img").src;
            const title = card.querySelector(".recipe-name").textContent;
            
            saveToHistory({ title: title, img: imgSrc });

            modalImg.src = imgSrc;
            modalTitle.textContent = title;
            modalTag.textContent = card.querySelector(".recipe-tag").textContent;
            modalTimeText.textContent = card.querySelector(".recipe-meta").textContent;

            modalIngredients.innerHTML = `
                <li><span>Томати чері</span> <span>150 г</span></li>
                <li><span>Оливкова олія</span> <span>2 ст. л.</span></li>
                <li><span>Свіжий базилік</span> <span>За смаком</span></li>
            `;
            modalSteps.innerHTML = "Дані успішно завантажуються... Після підключення бази даних тут з'являться детальні кроки.";

            recipeModal.style.display = "flex";
            document.body.style.overflow = "hidden"; 
        });
    });

    if(closeRecipeModal) {
        closeRecipeModal.addEventListener("click", () => {
            recipeModal.style.display = "none";
            document.body.style.overflow = "auto"; 
        });
    }

    window.addEventListener("click", (e) => {
        if (e.target === recipeModal) {
            recipeModal.style.display = "none";
            document.body.style.overflow = "auto";
        }
        if (e.target === authModal) {
            authModal.style.display = "none";
            document.body.style.overflow = "auto";
            if(profileBtn) profileBtn.classList.remove("active-profile");
        }
        if (e.target === historyModal) {
            historyModal.style.display = "none";
            document.body.style.overflow = "auto";
            if(historyBtn) historyBtn.classList.remove("active-profile");
        }
    });

    const cleanText = (text) => text.trim().toLowerCase().replace(" ▼", "").replace(" ♡", "");

    filterLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            if (link.classList.contains('nav-link') && (link.textContent.includes('Здорове меню') || link.textContent.includes('Колекції'))) {
                return;
            }
            e.preventDefault(); 

            let rawText = link.classList.contains("cat-item") 
                ? link.querySelector(".cat-title").textContent 
                : link.textContent.replace("▼", "");
            
            let clickedText = rawText.trim().toLowerCase();
            if (clickedText === "всі рецепти") clickedText = "all";
            if (clickedText.includes("перші страви")) clickedText = "перші";
            if (clickedText.includes("основні страви")) clickedText = "основні";

            if (currentFilter === clickedText && clickedText !== "all") {
                currentFilter = "all"; 
            } else {
                currentFilter = clickedText; 
            }

            filterLinks.forEach(l => l.classList.remove("active"));
            
            if (currentFilter === "all") {
                document.querySelector('.nav-link').classList.add('active'); 
            } else {
                filterLinks.forEach(l => {
                    let lText = l.classList.contains("cat-item") 
                        ? l.querySelector(".cat-title").textContent 
                        : l.textContent.replace("▼", "");
                    let cText = lText.trim().toLowerCase();
                    
                    if (cText.includes("перші страви")) cText = "перші";
                    if (cText.includes("основні страви")) cText = "основні";
                    
                    if (cText === currentFilter) {
                        l.classList.add("active");
                        if (l.closest('.dropdown')) {
                            const parentNavLink = l.closest('.nav-item').querySelector('.nav-link');
                            if (parentNavLink) parentNavLink.classList.add("active");
                        }
                    }
                });
            }
            applyFilters(); 
        });
    });

    const toggleAuthMode = document.getElementById("toggleAuthMode");
    const authTitle = document.getElementById("authTitle");
    const authSubmitBtn = document.getElementById("authSubmitBtn");
    const authHintText = document.getElementById("authHintText");

    if (toggleAuthMode) {
        toggleAuthMode.addEventListener("click", (e) => {
            e.preventDefault();
            if (authTitle.textContent === "Ласкаво просимо") {
                authTitle.textContent = "Реєстрація";
                authSubmitBtn.textContent = "Створити акаунт";
                authHintText.textContent = "Вже є акаунт?";
                toggleAuthMode.textContent = "Увійти";
            } else {
                authTitle.textContent = "Ласкаво просимо";
                authSubmitBtn.textContent = "Увійти";
                authHintText.textContent = "Немає акаунту?";
                toggleAuthMode.textContent = "Зареєструватися";
            }
        });
    }
});
