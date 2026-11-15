const filterCategory = document.getElementById('filterCategory');
const filterHair = document.getElementById('filterHair');
const filterPrice = document.getElementById('filterPrice');
const searchInput = document.getElementById('searchInput');
const sortOrder = document.getElementById('sortOrder');
const clearBtn = document.getElementById('clearFilters');
const grid = document.getElementById('productsGrid');
const countLabel = document.getElementById('productCount');

function applyFilters() {
    const categoryVal = filterCategory.value;
    const hairVal = filterHair.value;
    const priceVal = filterPrice.value;
    const searchVal = searchInput.value.toLowerCase().trim();
    const cards = Array.from(grid.getElementsByClassName('product-card'));

    let visibleCount = 0;

    cards.forEach(card => {
        const category = card.dataset.category;
        const hair = card.dataset.hair;
        const price = parseFloat(card.dataset.price);
        const title = card.querySelector('.product-title').textContent.toLocaleLowerCase();

        const matchCategory = (categoryVal === 'todos' || category === categoryVal);
        const matchHair = (hairVal === 'todos' || hair === hairVal);
        const matchSearch = title.includes(searchVal);

        let matchPrice = true;
        if (priceVal === 'ate80') matchPrice = price <= 80;
        else if (priceVal === '80a150') matchPrice = price > 80 && price <= 150;
        else if (priceVal === 'acima150') matchPrice = price > 150;

        if (matchCategory && matchHair && matchPrice && matchSearch) {
            card.style.display = 'flex';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    countLabel.textContent = `${visibleCount} ${visibleCount === 1 ? 'Produto' :  'Produtos'}`;

    const hasActiveFilter = categoryVal !== 'todos' || hairVal !== 'todos' || priceVal !== 'todos' || searchVal !=='';
    clearBtn.style.display = hasActiveFilter ? 'inline-block' : 'none'; 
}

    function sortProducts() {
        const cards = Array.from(grid.getElementsByClassName('product-card'));
        const order = sortOrder.value; 

        cards.sort((a, b) => {
            const priceA = parseFloat(a.dataset.price);
            const priceB = parseFloat(b.dataset.price);
            if (order === 'menor-preco') return priceA - priceB;
            if (order === 'maior-preco') return priceB - priceA;
            return 0;
        });

        cards.forEach(card => grid.appendChild(card));
    }

    function setGrid(cols) {
        document.getElementById('btn4Cols').classList.toggle('active', cols === 4); 
        document.getElementById('btn2Cols').classList.toggle('active', cols ===2); 
        grid.classList.toggle('two-cols', cols === 2);
    }

    clearBtn.addEventListener('click', () => {
        filterCategory.value = 'todos';
        filterHair.value = 'todos'; 
        filterPrice.value = 'todos';
        searchInput.value = '';
        applyFilters();
    });

    [filterCategory, filterHair, filterPrice].forEach(el => el.addEventListener('change', applyFilters));
    searchInput.addEventListener('input', applyFilters);
    sortOrder.addEventListener('change', sortProducts);