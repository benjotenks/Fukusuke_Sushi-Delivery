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

// Carga el menu desde los archivos menu.csv y categorys.txt
function loadMenu(){
    // Cargar las categorias
    fetch('/menuData/categorys.txt') // Ruta a categorys.txt en el directorio raíz
    .then(response => {
        // Verificar si la respuesta fue exitosa
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        // Convertir la respuesta a texto
        return response.text(); // Convertir la respuesta a texto
    })
    // Procesar el texto obtenido
    .then(data => {
        const categories = data.split('\n')
            .map(line => line.trim()) // Eliminar espacios en blanco y caracteres al inicio/final
            .filter(line => line !== ''); // Filtrar líneas vacías
        // Cargar el menu
        fetch('/menuData/menu.csv')
        .then(response => {
            // Verificar si la respuesta fue exitosa
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            // Convertir la respuesta a texto
            return response.text();
        })
        // Procesar el texto obtenido
        .then(data => {
            const menuItems = data.split('\n')
                .map(line => line.split('\t')) // Convertir cada línea en un array
                .map(([id, Nombre, Descripcion, Precio, Categoria, Imagen]) => ({
                    id, 
                    nombre: Nombre, 
                    descripcion: Descripcion, 
                    precio: Precio, 
                    categoria: Categoria, 
                    imagen: Imagen
                }))
                .filter(item => 
                    Object.values(item).every(value => value.trim() !== ""));
            // Agrupar los items del menu por categoría
            const menuMap = new Map();
            menuItems.forEach((item, index) => {
                if (index === 0) return; // Saltar el primer elemento
            
                if (!menuMap.has(item.categoria)) {
                    menuMap.set(item.categoria, []);
                }
                menuMap.get(item.categoria).push(item);
            });
            // Crea las cartas del menu en base a las categorias
            divsMenuOpctions = document.getElementById('menu-options');
            divsMenuOptionsChilds = Array.from(divsMenuOpctions.children);
            divsMenuOptionsChilds.forEach((div, index) => {
                menuMap.get(categories[index]).forEach(item => {
                    const divSon = document.createElement('div');
                    divSon.textContent = categories[index];
                    divSon.style = "text-align: center; justify-content: center; font-size: 20px; font-weight: bold; border: 1px solid";
                    div.appendChild(divSon);
                    div.appendChild(createCard(item.nombre, item.descripcion, item.precio, ('/menuData/imagenes/' + item.imagen)));
                });
            });
        });
    })
    // Capturar errores
    .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
    });

}

// Al cargar la pagina se carga el menu
document.addEventListener('DOMContentLoaded', (event) => {
    loadMenu();
});