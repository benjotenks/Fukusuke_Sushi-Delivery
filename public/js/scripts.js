let userId = null;
let pedidoId = null;
let categories = null;
let pedidoElecciones = [];

// Crea las cartas del menu en base al archivo menu.csv
function createCard(name, description, price, image) {
    const card = document.createElement('div');
    card.className = 'd-flex align-items-start border mb-3'; // Flexbox para alinear horizontalmente
    card.style.width = '100%'; // La tarjeta ocupará el ancho del contenedor
    card.style.height = '100px'; // La altura se ajustará al contenido
    card.style.overflow = 'hidden'; // Ocultar contenido que se desborde

    const imgDiv = document.createElement('div');
    imgDiv.className = 'd-flex justify-content-center align-items-center'; // Flexbox para centrar la imagen
    imgDiv.style.width = '100px'; // Ancho fijo de 100px
    imgDiv.style.height = '100%'; // Altura del 100% del contenedor
    imgDiv.style.marginRight = '10px'; 

    const img = document.createElement('img');
    img.className = 'img-fluid'; // Imagen fluida
    img.src = image;
    img.alt = name;
    img.style.width = '100px'; // Ajusta el ancho de la imagen según prefieras
    
    imgDiv.appendChild(img);

    const cardBody = document.createElement('div');
    cardBody.className = 'd-flex flex-column my-1'; // El contenido ocupa el resto del espacio disponible

    const cardTitle = document.createElement('h5');
    cardTitle.className = 'card-title';
    cardTitle.textContent = name;

    const cardText = document.createElement('p');
    cardText.className = 'card-text';
    cardText.textContent = description;

    const cardPrice = document.createElement('p');
    cardPrice.className = 'card-text';
    cardPrice.textContent = `Price: $${price}`;

    // Ensamblar el cuerpo de la tarjeta
    cardBody.appendChild(cardTitle);
    cardBody.appendChild(cardText);
    cardBody.appendChild(cardPrice);

    // Ensamblar la tarjeta completa
    card.appendChild(imgDiv);
    card.appendChild(cardBody);

    return card;
}

async function getMenu() {
    let menu = new Map();
    try {
        // Cargar las categorías
        const categoryResponse = await fetch('/menuData/categorys.txt');
        if (!categoryResponse.ok) throw new Error('Network response was not ok');
        const categoryData = await categoryResponse.text();

        categories = categoryData
            .split('\n')
            .map(line => line.trim())
            .filter(line => line !== '');

        // Cargar el menú
        const menuResponse = await fetch('/menuData/menu.csv');
        if (!menuResponse.ok) throw new Error('Network response was not ok');
        const menuData = await menuResponse.text();

        const menuItems = menuData
            .split('\n')
            .map(line => line.split('\t'))
            .map(([id, Nombre, Descripcion, Precio, Categoria, Imagen]) => ({
                id,
                nombre: Nombre,
                descripcion: Descripcion,
                precio: Precio,
                categoria: Categoria,
                imagen: Imagen,
            }))
            .filter(item =>
                Object.values(item).every(value => value.trim() !== '')
            );

        // Agrupar los items del menú por categoría
        menuItems.forEach((item, index) => {
            if (index === 0) return; // Saltar el primer elemento
            if (!menu.has(item.categoria)) {
                menu.set(item.categoria, []);
            }
            menu.get(item.categoria).push(item);
        });

        return menu;
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
        return null; // Devolver null si hay un error
    }
}

// Carga el menu desde los archivos menu.csv y categorys.txt
function loadMenu(menu){
    // Crea las cartas del menu en base a las categorias
    divsMenuOpctions = document.getElementById('menu-options');
    divsMenuOptionsChilds = Array.from(divsMenuOpctions.children);
    divsMenuOptionsChilds.forEach((div, index) => {
        menu.get(categories[index]).forEach(item => {
            const divSon = document.createElement('div');
            divSon.textContent = categories[index];
            divSon.style = "text-align: center; justify-content: center; font-size: 20px; font-weight: bold; border: 1px solid";
            div.appendChild(divSon);
            div.appendChild(createCard(item.nombre, item.descripcion, item.precio, ('/menuData/imagenes/' + item.imagen)));
        });
    });
}

function initPedido(menu){
    // Div Para id de Usuario Centrado
    divIdUser = document.getElementById('pedidoUserId');
    divIdUserText = document.createElement('div');
    divIdUserText.className = 'd-flex justify-content-center align-items-center';
    divIdUserText.style = "font-size: 20px; font-weight: bold; border: 1px solid";
    userId = Math.floor(Math.random() * 100000); // Temporal (bueno todo es temporal pero este es temporal del temporal)
    divIdUserText.textContent = `User ID: ${userId}`; 
    divIdUser.appendChild(divIdUserText);

    // Diva para ide del pedido Centrado
    divIdPedido = document.getElementById('pedidoId');
    divIdPedidoText = document.createElement('div');
    divIdPedidoText.className = 'd-flex justify-content-center align-items-center';
    divIdPedidoText.style = "font-size: 20px; font-weight: bold; border: 1px solid";
    pedidoId = Math.floor(Math.random() * 100000);
    divIdPedidoText.textContent = `Pedido ID: ${pedidoId}`; // El id es random pero tendra que ser un id de mongoDB
    divIdPedido.appendChild(divIdPedidoText);

    pedidoElecciones.push(userId);
    pedidoElecciones.push(pedidoId);
    pedidoElecciones.push([]);

    // Opciones de pedido
    divPedidoOptions = document.getElementById('pedidoMenuOpcs');
    menu.forEach((value, key) => {
        div = document.createElement('div');
        div.className = 'd-flex flex-row align-items-center ml-1 border';
        text = document.createElement('p');
        text.className = 'mt-3 border';
        text.textContent = key;
        text.style.width = '90px';
        div.appendChild(text);
        value.forEach(item => {
            btnSon = document.createElement('button');
            btnSon.textContent = `${item.nombre}`;
            btnSon.className = 'mx-3 btn btn-primary';
            btnSon.style = 'border: 1px solid red; transition: 0.5s ease';
            div.appendChild(btnSon);
        })
        divPedidoOptions.appendChild(div);
    })
    divPedidoOptions.addEventListener('click', (event) => {
        if (event.target.tagName === 'BUTTON') {
            event.target.className = 'mx-3 btn btn-success';
            pedidoElecciones[2].push(event.target.textContent);
            setTimeout(() => {
                event.target.className = 'mx-3 btn btn-primary';
            }, 1500);
            console.log(pedidoElecciones);
        }
    })


    
}

async function initTest(){
    const testMenu = await getMenu();
    loadMenu(testMenu);
    initPedido(testMenu);
}

// Al cargar la pagina
document.addEventListener('DOMContentLoaded', (event) => {
    initTest();
});


