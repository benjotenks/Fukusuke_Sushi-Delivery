/*
 TODO:
    1. Agregar mutations a pedidos ya existentes
*/
const baseUrl = 
  window.location.hostname === 'localhost'
    ? 'http://localhost:8090' // Local
    : 'https://fukusuke-sushi-delivery.onrender.com';

const imgDir = '/menuData/imagenes/'; 
const ubicacionLocal = 'Corregidor Zañartu 1773, Maipú, Región Metropolitana, Santiago, Chile'

let categories = [];
let menu = new Map();
let menuContainer = null;
let cart = new Map();
let User = new Map();
let userRun = null;
let pedidosUsuario = new Map();
let colorUser = 'white'; //default


let administrandoAccount = null;
// Variable que contiene todos los datos de uso de cada tipo de usuario del caso 19
const usersOptionsByType = {
    'owner': [
        {'label': 'Ver Perfil', 'target': '#profileModal'}, 
        {'label': 'Generar Reporte De Ventas', 'target': '#reporteVentasModal', 'onclick': 'generarReporteVentas()'}
    ],
    'admin': [
        {'label': 'Ver Perfil', 'target': '#profileModal'}, 
        {'label': 'Administrar Cliente', 'target': '#administrar', 'onclick': 'postNavChangeEvents()'},
        {'label': 'Administrar Cuentas', 'target': '#administrar', 'onclick': 'postNavChangeEvents()'}, 
        {'label': 'Administrar Productos', 'target': '#administrar', 'onclick': 'postNavChangeEvents()', 'id': 'administrarProductos'}, 
        {'label': 'Anular Compra', 'target': '#administrar', 'onclick': 'postNavChangeEvents()'}
    ],
    'despacho': [
        {'label': 'Ver Perfil', 'target': '#profileModal'},
        {'label': 'Obtener Orden Despachos', 'target': '#obtenerOrdenesDespachoModal', 'onclick': 'obtenerOrdenesDespachoModal()'}
    ],
    'user': [
        {'label': 'Ver Perfil', 'target': '#profileModal', 'id':'profileModalBtn',},
        {'label': 'Mis Pedidos', 'target': '#pedidosUsuarioModal', 'id': 'pedidosUsuariosBtn'}
    ],
    'virtual worker': [
        {'label': 'Ver Perfil', 'target': '#profileModal'},
        {'label': 'Administrar Cliente', 'target': '#administrar', 'onclick': 'postNavChangeEvents()'},
    ]
}

function defineColorUser(type) {
    switch (type) {
        case 'admin':
            return 'red';
        case 'owner':
            return 'gold';
        case 'despacho':
            return 'green';
        case 'virtual worker':
            return 'pink';
        default:
            return 'white';
    }
}

function hideModal(modal) {
    if (modal) {
        document.activeElement.blur(); // Quita el foco antes de ocultar el modal
        modal.hide();
    }
}

// Función para crear una carta de producto
function createCard(opcion) {
    const imgBG = 'rgba(255, 255, 255, 0.1)';
    const txtBG = 'rgba(255, 255, 255, 0.1)';
    const prcBG = 'rgba(255, 255, 255, 0.09)';

    const card = document.createElement('div');
    card.className = 'menuOpcsCard d-flex justify-content-start align-items-center p-1 my-2';

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
    priceText.style.color = (opcion.AplicaDescuento ? 'purple' : 'black');
    priceText.textContent = `$${Math.round(opcion.Precio * (opcion.AplicaDescuento ? (1 - opcion.Descuento) : 1))}`;

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

async function goTo(category) {
    const categoryElement = document.querySelector(`[name="${category}"]`);
    if (categoryElement) {
       
        // Calcular la cantidad de desplazamiento
        const scrollToPosition = categoryElement.offsetTop

        window.scrollTo({
            top: scrollToPosition,
            behavior: 'smooth'
        });
    }
}

// Función que obtiene el menú y lo modifica
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

        const dropdownCategorias = document.getElementById('dropdownCategorias');
        dropdownCategorias.innerHTML = '';
        dropdownCategorias.innerHTML = `
        <a class="nav-link text-white dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="bi bi-grid-fill nav-icon"></i>
                Categorias
        </a>
        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown" >
            ${categories.map((category) => `
                <li>
                    <button class="dropdown-item" type="button" onclick="goTo('${category}')">${category}</button>
                </li>
                `).join('')}
        </ul>
        `
        // Cargar el menú
        const menuResponse = await fetch('/menuData/menu.xlsx');
        if (!menuResponse.ok) {
            alert('No se pudo acceder al archivo del menú');
            throw new Error('No se pudo acceder al archivo del menú');
        }
        
        let menuItems = await getMenuFromMongo();

        return menuItems;
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
        return null; // Devolver null si hay un error
    }
}

async function initMenu() {
    menuContainer = document.getElementById('menuDisplay');
    menuContainer.innerHTML = ''; // Limpiar el contenedor antes de agregar elementos
    if (!menuContainer) {
        console.error('El contenedor "menu-container" no se encontró en el DOM.');
        return;
    }

    if (!menuContainer.hasAttribute('data-event-added')) {
        menuContainer.addEventListener('click', (event) => {
            event.preventDefault();
        
            // Verifica si el clic fue en un botón o en un hijo dentro del botón
            let button = event.target.closest('button');
            
            if (button) {
                addCartBtn(button); // Ejecuta la función con el botón detectado
            }
        });
        menuContainer.setAttribute('data-event-added', 'true');
    }


    categories.forEach(async (category) => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'categoryDiv row my-3'; // Margen superior e inferior
        categoryDiv.setAttribute('name', category);
        categoryDiv.style = "width: 100%; padding: 1px; border: 1px solid rgba(255, 255, 255, 0.09);";
    
        // Crear encabezado para la categoría
        const categoryTitle = document.createElement('h2');
        categoryTitle.className = 'p-2'; // Alinea el texto a la izquierda
        categoryTitle.textContent = category;
        menuContainer.appendChild(categoryTitle);
    
        // Agregar tarjetas de productos correspondientes a la categoría
        menu.forEach(async (opcion) => {
            if (opcion.Categoria == category) {
                const card = await createCard(opcion); // Esperar la creación de la tarjeta
                
                card.classList.add('col-12', 'col-sm-6', 'col-md-4', 'col-lg-3', 'col-xl-4', 'px-3', 'my-2', 'mx-1');
            
                categoryDiv.appendChild(card);
            }
        });
    
        menuContainer.appendChild(categoryDiv);
    });
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
        cartBody.innerHTML = '<p style="text-align: center; font-style: italic; font-weight: bold;">El carrito está vacío</p>';
        return;
    }
    else {
        cartBody.innerHTML = `
            <form id="cartForm">
                <!-- Encabezado -->
                <div class="row mb-3 d-flex flex-row justify-content-between align-items-center">
                    <div class="col-3 d-flex justify-content-center align-items-center text-center titleItemCart" style="font-style: italic; font-weight: bold;">Producto</div>
                    <div class="col-3 d-flex justify-content-center align-items-center text-center quantityItemCart" style="font-style: italic; font-weight: bold;">Cantidad</div>
                    <div class="col-3 d-flex justify-content-center align-items-center text-center priceItemCart" style="font-style: italic; font-weight: bold;">Precio</div>
                    <div class="col-3 d-flex justify-content-end" style="font-style: italic; font-weight: bold;">Acciones</div>
                </div>
    
                <!-- Productos -->
                ${Array.from(cart.values()).map((product) => `
                    <div class="row d-flex flex-row justify-content-between align-items-center">
                        <div class="col-3 d-flex justify-content-center align-items-center text-center titleItemCart" name="titleCartOpc">${product.title}</div>
                        <div class="col-3 d-flex justify-content-center align-items-center text-center quantityItemCart" name="quantityCartOpc">${product.quantity }</div>
                        <div class="col-3 d-flex justify-content-center align-items-center text-center priceItemCart" name="priceCartOpc">$${product.price}</div>
                        <div class="col-3 d-flex justify-content-end">
                            <button class="cartButton text-primary" name="addItemCart">
                                <i class="bi bi-plus-circle-fill"></i>
                            </button>
                            <button class="cartButton text-danger" name="eraseItemCart">
                                <i class="bi bi-dash-circle-fill"></i>
                            </button>
                        </div>
                    </div>`
                    )
                    .join('')}
    
                <!-- Botón de confirmación -->
                <div class="row mt-3 d-flex flex-row justify-content-center align-items-center">
                    <div class="col-3 mt-3 d-flex justify-content-center align-items-center">
                        <button type="submit" class="btn btn-primary btn-sm" onclick="prepareCart()" id="confirmCart">Confirmar</button>
                    </div>
                </div>
            </form>
        `;
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

function initCart() {
    const cartBody = document.getElementById('cartBody');
    cartBody.addEventListener('click', (event) => {
        event.preventDefault();
        let button = event.target.closest('button');
        if (button && button.id !== 'confirmCart') {
            const row = button.closest('.row');
            const title = row.querySelector('.titleItemCart').textContent;
            const product = cart.get(title); // Accede directamente al cart

            if (product) { // Verifica que el producto esté en el carrito
                if (button.name === 'addItemCart') {
                    product.quantity += 1;
                    // Convertir `product.price` a número solo si es una cadena
                    const priceValue = menu.find(item => item.Nombre === title).Precio;
                    product.price = priceValue * product.quantity;
                } else if (button.name === 'eraseItemCart') {
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

function optionsByType(type){
    options = `
    <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navUserDropdown">
        ${usersOptionsByType[type].map((option) => `
            <li>
                <button type="button" class="dropdown-item" data-bs-toggle="modal" data-bs-target="${option.target}" ${option.id ? `id=${option.id}` : ''} ${option.onclick ? `onclick="${option.onclick}"` : ''}>${option.label}</button>
            </li>
        `).join('')}
    </ul>
`;
    return options;
}

function temp(event) {
    let button = event.target.closest('button');
    if (!button) return;
    if (button.id === 'confirmAdmin') return;
    if (button.getAttribute('data-bs-target') === '#administrar') {
        const modalTitle = document.getElementById('administrarModalTitle');
        const modalBody = document.getElementById('administrarModalBody');
        const modalFooter = document.getElementById('administrarModalFooter');

        modalTitle.textContent = button.textContent; //Cambiamos el titulo del modal
        modalFooter.innerHTML = ``;
        texto = button.textContent;
        texto = texto.split(' ')[1];

        const btnFunction = {
            'Cliente': 'administrarClientes',
            'Cuentas': 'administrarCuentas',
            'Compra': 'anularComprasUsuario'
        }[texto] || '';

        if (texto !== 'Productos') { // Si es Administrar Clientes, Cuentas o Anular Compra
                modalBody.innerHTML = `
                <label>Run de la cuenta a administrar:</label>
                <input type="text" class="form-control" id="runAdmin" placeholder="Run">
                <div class="d-flex justify-content-center align-items-center my-2">
                    <button type="button" class="btn btn-primary" id="confirmAdmin" onclick="${btnFunction}()">Confirmar</button>
                </div>
            `;
            
            modalFooter.innerHTML = `
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            `;
        } else { // Si es Administrar Productos
            administradorModalBodyProductos();
            modalFooter.innerHTML = `
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            `;
        }
    }
}

function postNavChangeEvents() {
    const navUser = document.getElementById('userDropdown');
    if (!navUser.hasAttribute('data-event-added')) {
        navUser.addEventListener('click', (event) => {
            event.preventDefault();
            temp(event);
        });
        navUser.setAttribute('data-event-added', 'true');
    }
}

function changeNavUser(run) {
    const navUser = document.getElementById('userDropdown');
    navUser.innerHTML = `
    <a class="nav-link text-white d-flex flex-row dropdown-toggle" id="navUserDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false" style="cursor:pointer;">
        <i class="bi bi-person-fill nav-icon"></i>
        <div class="d-flex flex-column align-items-center" style="margin:0; padding: 0; color: ${colorUser};" id="labelUsuarioHeader">
            ${run} 
        </div>
    </a>
    ${optionsByType(User.get("userType"))}
    `;

    const userModalBody = document.getElementById('userModalBody');
    userModalBody.innerHTML = `
    <div class="d-flex flex-column position-relative scrollspy-example p-3" style="height: 300px; overflow-y: auto;" data-bs-spy="scroll" data-bs-target="#scrollspyMenu" data-bs-offset="0" tabindex="0">
        ${User.get("userRun") ? `<p>Run: ${User.get("userRun")}</p>` : ''}
        ${User.get("userName") ? `<p>Nombre: ${User.get("userName")}</p>` : ''}
        ${User.get("userEmail") ? `<p>Email: ${User.get("userEmail")}</p>` : ''}
        ${User.get("userPassword") ? `<p>Contraseña: ${User.get("userPassword")}</p>` : ''}
        ${User.get("userAddress") ? `<p>Dirección: ${User.get("userAddress")}</p>` : ''}
        ${User.get("userProvince") ? `<p>Provincia: ${User.get("userProvince")}</p>` : ''}
        ${User.get("userRegion") ? `<p>Región: ${User.get("userRegion")}</p>` : ''}
        ${User.get("userBornDate") ? `<p>Fecha de nacimiento: ${User.get("userBornDate")}</p>` : ''}
        ${User.get("userSex") ? `<p>Sexo: ${User.get("userSex")}</p>` : ''}
        ${User.get("userPhone") ? `<p>Telefono: ${User.get("userPhone")}</p>` : ''}
        ${User.get("userType") ? `<p>Tipo de Usuario: ${User.get("userType").toUpperCase()}</p>` : ''}
    </div>
    `;
    

    hideModal(bootstrap.Modal.getInstance(document.getElementById('registerModal')));
}

function initButtons() {
    const logOutBtn = document.getElementById('confirmLogout');
    logOutBtn.addEventListener('click', () => {
        logOut();
    });

    const loginOptions = document.querySelectorAll('[name="loginDropdown"] .dropdown-item');

    // Añadir evento de clic a cada opción del dropdown
    loginOptions.forEach((option) => {
        option.addEventListener('click', (event) => {
            const loginType = event.target.getAttribute('data-login');
            
            // Dependiendo de la opción seleccionada, realizar el login con diferentes credenciales
            switch (loginType) {
                case 'test1':
                    login('benja.elgueti@gmail.com', 'test');
                    break;
                case 'test2':
                    login('test@test.test', 'test');
                    break;
                case 'test3':
                    login('efrain@gigachad.jhon', '12345');
                    break;
                case 'test4':
                    login('Jonathan@joestar.1998', 'Joseph Joestar');
                    break;
                case 'test5':
                    login('respaldocrack58@gmail.com', 'test');
                    break;
                default:
                    console.error('Opción de login no válida');
            }
        });
    });
}

async function startLanding() {
    menu = await getMenu()
    await initMenu();
}

// Ahora mismo no me acuerdo de todo lo que tengo que actualizar
async function updateImportantData() {
    if (!User) return;
    obtenerOrdenesDespachoModal();
    generarReporteVentas();

}

document.addEventListener('DOMContentLoaded', async () =>{
    await startLanding(); // Se obtiene lo necesario para procesar apenas carge el DOM
    setInterval(() => {
        updateImportantData();
    }, 300000);
});

document.addEventListener('DOMContentLoaded', () =>{
    updateCart();
    initCart();
    initButtons();
});
