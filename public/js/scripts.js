const imgDir = '/menuData/imagenes/'; 
let categories = [];
let menu = new Map();
let menuContainer = null;
let cart = new Map();


// Función para crear una carta de producto
function createCard(opcion) {
    const imgBG = 'rgba(255, 255, 255, 0.1)';
    const txtBG = 'rgba(255, 255, 255, 0.1)';
    const prcBG = 'rgba(255, 255, 255, 0.09)';

    const card = document.createElement('div');
    card.className = 'menuOpcsCard d-flex flex-row justify-content-start align-items-center p-1 my-2';

    // Zona de imagen
    const imgDiv = document.createElement('div');
    imgDiv.className = 'imgDivCard';
    imgDiv.style.backgroundColor = imgBG;

    const img = document.createElement('img');
    img.style.width = '100%';
    img.style.maxHeight = '150px';
    img.src = imgDir + opcion.Imagen;
    img.alt = opcion.Nombre;
    imgDiv.appendChild(img);
    // Fin de la zona de imagen

    // Zona de texto
    const textDiv = document.createElement('div');
    textDiv.className = 'textDivCard';

    ttlDiv = document.createElement('div');
    ttlDiv.className = 'ttlDivCard';
    const title = document.createElement('h4');
    title.className = 'titleCard';
    title.textContent = opcion.Nombre;
    title.style.textAlign = 'center';
    ttlDiv.appendChild(title);

    const dscDiv = document.createElement('div');
    dscDiv.className = 'dscDivCard';
    const description = document.createElement('p');
    description.textContent = opcion.Ingredientes;
    description.style.textAlign = 'center';
    dscDiv.appendChild(description);

    textDiv.appendChild(ttlDiv);
    textDiv.appendChild(dscDiv);
    // Fin de la zona de texto

    // Zona Precio
    const priceDiv = document.createElement('div');
    priceDiv.className = 'priceDivCard';
    priceDiv.style.backgroundColor = prcBG;

    const priceLabel = document.createElement('p');
    priceLabel.textContent = 'Precio: ';

    const priceText = document.createElement('p');
    priceText.className  = 'priceText'
    priceText.textContent = `$${opcion.Precio}`;

    addButton = document.createElement('button');
    addButton.style.backgroundColor = 'transparent';
    addButton.style.border = 'none';

    addIcon = document.createElement('i');
    addIcon.className = 'bi bi-plus-square-fill text-primary';
    addIcon.style.fontSize = '1.5rem';
    addIcon.style.cursor = 'pointer';

    addButton.appendChild(addIcon);
    priceDiv.appendChild(priceLabel);
    priceDiv.appendChild(priceText);
    priceDiv.appendChild(addButton);
    // Fin de la zona Precio

    // Agregar las zonas al contenedor de la carta
    card.appendChild(imgDiv);
    card.appendChild(textDiv);
    card.appendChild(priceDiv);

    return card;
}

// Funcion que se encarga de cargar las categorias y el menu desde los archivos de texto y excel
async function getMenu() {
    try {
        // Cargar las categorías
        const categoryResponse = await fetch('/menuData/categorys.txt');
        if (!categoryResponse.ok) {
            alert('No se pudo acceder al archivo de categorías');
            throw new Error('No se pudo acceder al archivo de categorías');
        }
        const categoryData = await categoryResponse.text();

        categories = categoryData
            .split('\n')
            .map(line => line.trim())
            .filter(line => line !== '');


        // Cargar el menú
        const menuResponse = await fetch('/menuData/menu.xlsx');
        if (!menuResponse.ok) {
            alert('No se pudo acceder al archivo del menú');
            throw new Error('No se pudo acceder al archivo del menú');
        }

        // Leer el archivo XLSX usando la librería XLSX
        const arrayBuffer = await menuResponse.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const menuItems = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        return menuItems;
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
        return null; // Devolver null si hay un error
    }
}

// Animacion de agregar a carrito
function animateIcon(icon) {
    icon.classList.toggle('text-primary');
    icon.classList.toggle('text-success');
    icon.classList.toggle('bi-plus-square-fill');
    icon.classList.toggle('bi-check-square-fill');
    
    setTimeout(() => {
        icon.classList.toggle('text-primary');
        icon.classList.toggle('text-success');
        icon.classList.toggle('bi-plus-square-fill');
        icon.classList.toggle('bi-check-square-fill');
    }, 250);
}

function updateCart() {
    // Actualizar el carrito en el DOM
    const cartBody = document.getElementById('cartBody');
    if (cart.size === 0) {
        cartBody.innerHTML = '<p>El carrito está vacío</p>';
        return;
    }
    else {
        cartBody.innerHTML = '';
        cart.forEach((product) => {
            const row = document.createElement('div');
            row.className = 'row d-flex flex-row justify-content-between align-items-center';
            row.innerHTML = `
            <div class="col-3 d-flex text-center titleItemCart">${product.title}</div>
            <div class="col-3 quantityItemCart">${product.quantity}</div>
            <div class="col-3 priceItemCart">$${product.price}</div>
            <div class="col-3 d-flex justify-content-end">
                <button class="cartButton text-primary" id="addItemCart">
                    <i class="bi bi-plus-circle-fill"></i>
                </button>
                <button class="cartButton text-danger" id="eraseItemCart">
                    <i class="bi bi-dash-circle-fill"></i>
                </button>
            </div>
            `;

            cartBody.appendChild(row);
        });
    }
}

// Funcion que se encarga de agregar un producto al carrito
function addToCart(product) {
    cart = product;
    // Estaria bueno una animacion o algo por el estilo
    updateCart();
}

// Funcion que se encarga de agregar un producto al carrito
function addCartBtn(button) {

    const btnIcon = button.querySelector('i');
    animateIcon(btnIcon);

    if (btnIcon.classList.contains('bi-check-square-fill')) {
        const card = button.closest('.menuOpcsCard');
        const title = card.querySelector('.titleCard').textContent;
        const price = card.querySelector('.priceText').textContent;
        const product = new Map(cart);

        if (product.has(title)) {
            product.get(title).quantity += 1;
            product.get(title).price = parseFloat(price.replace('$', '')) * product.get(title).quantity;
        } else {
            const quantity = 1;
            product.set(title, { title, price: parseFloat(price.replace('$', '')), quantity });
        }
        

        addToCart(product);
    }
}

async function initMenu() {
    menuContainer = document.getElementById('menuDisplay');
    if (!menuContainer) {
        console.error('El contenedor "menu-container" no se encontró en el DOM.');
        return;
    }

    menuContainer.addEventListener('click', (event) => {
        event.preventDefault();
    
        // Verifica si el clic fue en un botón o en un hijo dentro del botón
        let button = event.target.closest('button');
        
        if (button) {
            addCartBtn(button); // Ejecuta la función con el botón detectado
        }
    });

    categories.forEach(async (category) => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'categoryDiv my-4'; // Margen superior e inferior
        categoryDiv.style = "width: 100%; padding: 1px; border: 1px solid rgba(0, 0, 0, 0.09);";
    
        // Crear encabezado para la categoría
        const categoryTitle = document.createElement('h2');
        categoryTitle.className = 'p-2'; // Alinea el texto a la izquierda
        categoryTitle.textContent = category;
        categoryDiv.appendChild(categoryTitle);
    
        // Agregar tarjetas de productos correspondientes a la categoría
        menu.forEach(async (opcion) => {
            if (opcion.Categoria === category) {
                const card = await createCard(opcion); // Esperar la creación de la tarjeta
                card.classList.add('mx-2'); // Espacio horizontal entre tarjetas
                categoryDiv.appendChild(card);
            }
        });
    
        menuContainer.appendChild(categoryDiv);
    });
    
}

function initCart() {
    const cartBody = document.getElementById('cartBody');
    cartBody.addEventListener('click', (event) => {
        event.preventDefault();
        let button = event.target.closest('button');
        if (button) {
            const row = button.closest('.row');
            const title = row.querySelector('.titleItemCart').textContent;
            const product = cart.get(title); // Accede directamente al cart

            if (product) { // Verifica que el producto esté en el carrito
                if (button.id === 'addItemCart') {
                    product.quantity += 1;
                    // Convertir `product.price` a número solo si es una cadena
                    const priceValue = menu.find(item => item.Nombre === title).Precio;
                    product.price = priceValue * product.quantity;
                } else if (button.id === 'eraseItemCart') {
                    product.quantity -= 1;
                    const priceValue = menu.find(item => item.Nombre === title).Precio;
                    product.price = priceValue * product.quantity;
                    if (product.quantity === 0) {
                        cart.delete(title);
                    }
                }
                updateCart(); // Actualiza la visualización
            }
        }
    });
}

async function startLanding() {
    menu = await getMenu()
    await initMenu();
}

document.addEventListener('DOMContentLoaded', async () =>{
    await startLanding(); // Se obtiene lo necesario para procesar apenas carge el DOM
});

document.addEventListener('DOMContentLoaded', () =>{
    updateCart();
    initCart();
});

