async function getMenuFromMongo() {
    try {
        const response = await fetch(`${baseUrl}/graphql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
                    query getProductos {
                        getProductos {
                            id
                            nombre
                            categoria
                            ingredientes
                            precio
                            imagen
                            aplicaDescuento
                            descuento
                            cantidad
                        }
                    }
                `,
                variables: {
                    // No hay variables
                }
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text(); // Lee el cuerpo del error
            console.error(`Error en la API (status: ${response.status}):`, errorText);
            return [];
        }

        const result = await response.json();
        const data = result.data.getProductos;;
        const mappedMenuItems = data.map(product => ({
            ID: product.id,
            Nombre: product.nombre,
            Ingredientes: product.ingredientes,
            Precio: product.precio,
            Categoria: product.categoria,
            Imagen: product.imagen,
            AplicaDescuento: product.aplicaDescuento,
            Descuento: product.descuento,
            Cantidad: product.cantidad,
        }));

        return mappedMenuItems;

    } catch (error) {
        console.error(error);
    }
}

async function verifyData(menuItems) {
    menuItems.map(async (item) => {
        const product = await getProduct(item);
        if (!!product) { // Si se encontro el producto en la base de datos
            item.ID = product.id;
            item.Categoria = product.categoria;
            item.Ingredientes = product.ingredientes;
            item.Precio = product.precio;
            item.Imagen = product.imagen;
            item.AplicaDescuento = product.aplicaDescuento;
            item.Descuento = product.descuento;
            item.Cantidad = product.cantidad;
        } else {
            addProduct(item);
        }
    })
    return menuItems;
}

async function getProduct(product) {
    try {
        const response = await fetch(`${baseUrl}/graphql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
                    query getProducto($nombre: String!) {
                        getProducto(nombre: $nombre) {
                            id
                            nombre
                            ingredientes
                            precio
                            categoria
                            imagen
                            aplicaDescuento
                            descuento
                            cantidad
                        }
                    }
                `,
                variables: {
                    nombre: product.Nombre,
                },
            })
        });

        const data = await response.json();
        const dataBaseProduct = data.data ? data.data.getProducto : null;
        return dataBaseProduct;

    } catch (error) {
        console.error(error);
        return false;
    }
}

async function addProduct(product) {
    const aplicaDescuento = product.AplicaDescuento === 'Si';
    try {
        const response = await fetch(`${baseUrl}/graphql`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                query: `
                    mutation addProducto($input: ProductoInput!) {
                        addProducto(input: $input) {
                            nombre
                            ingredientes
                            precio
                            categoria
                            imagen
                            aplicaDescuento
                            descuento
                            cantidad                       
                        }
                    }
                `,
                variables: {
                    input: {
                        nombre: product.Nombre,
                        ingredientes: product.Ingredientes,
                        precio: product.Precio,
                        categoria: product.Categoria,
                        imagen: product.Imagen,
                        aplicaDescuento: aplicaDescuento,
                        descuento: product.Descuento,
                        cantidad: product.Cantidad,
                    }
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text(); // Lee el cuerpo del error
            console.error(`Error en la API (status: ${response.status}):`, errorText);
            return false;
        }

        const data = await response.json();

    } catch (error) {
        console.log(error);
    }
}

async function modifyProductoQuantity(id, quantity) {
    try {
        const response = await fetch(`${baseUrl}/graphql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
                    mutation modifyProductoQuantity($id: ID!, $quantity: Int!) {
                        modifyProductoQuantity(id: $id, quantity: $quantity){
                            id
                        }
                    }
                `,
                variables: {
                    id: id,
                    quantity: quantity,
                }
            })
        });

        const result = await response.json();
        if (!result.data) {
            console.error('No se pudo actualizar el producto');
            return;
        }
    } catch (error) {
        console.error(error);
    }
}

async function modifyProducto(id, product) {
    try {

        product.precio = parseFloat(product.precio);
        product.descuento = parseFloat(product.descuento);
        product.cantidad = parseInt(product.cantidad, 10);
        product.aplicaDescuento = product.aplicaDescuento === 'true';

        const response = await fetch(`${baseUrl}/graphql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
                    mutation MdifyProducto($id: ID!, $input: ProductoInput!) {
                        modifyProducto(id: $id, input: $input){
                            id
                            nombre
                            ingredientes
                            precio
                            categoria
                            imagen
                            aplicaDescuento
                            descuento
                            cantidad
                        }
                    }
                `, 
                variables: {
                    id: id,
                    input: {
                        nombre: product.nombre,
                        ingredientes: product.ingredientes,
                        precio: product.precio,
                        categoria: product.categoria,
                        imagen: product.imagen,
                        aplicaDescuento: product.aplicaDescuento,
                        descuento: product.descuento,
                        cantidad: product.cantidad,
                    }
                }
            })
        })

        if (!response.ok) {
            const errorDetails = await response.json(); // Aquí puedes ver el cuerpo del error
            console.error("Error en la respuesta de la API:", errorDetails);
            throw new Error(`Error en la API: ${errorDetails.message || 'Desconocido'}`);
        }
        
        const result = await response.json();
        if (result.errors) {
            console.error("Errores en la respuesta de la API:", result.errors);
            throw new Error(`Error de la API: ${result.errors.map(e => e.message).join(', ')}`);
        }
    } catch (error) {
        console.error(error);
    }
}

async function deleteProduct(nombre) {
    try {
        const response  = await fetch(`${baseUrl}/graphql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
                    mutation deleteProducto($nombre: String!) {
                        deleteProducto(nombre: $nombre){
                            message
                        }
                    }
                `,
                variables: {
                    nombre: nombre,
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text(); // Lee el cuerpo del error
            console.error(`Error en la API (status: ${response.status}):`, errorText);
            return false;
        }

        const result = await response.json();
        alert(result.data.deleteProducto.message);
        menu.forEach((item) => {
            if (item.Nombre === nombre) {
                menu.splice(menu.indexOf(item), 1);
            }
        })
        await initMenu();
        await administradorModalBodyProductos();
    } catch (error) {
        console.error(error);
    }
}