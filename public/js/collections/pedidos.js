async function getPedidos(){
    try {
        const response = await fetch(`${baseUrl}/graphql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
                    query getPedidos{
                        getPedidos{
                            id
                            user {
                                id
                                name
                            }
                            userRun
                            carrito
                            type
                            fecha
                            hora
                            total
                        }
                    }
                `,
                variables: {
                    // No se requieren variables
                }
            })
        });

        const result = await response.json();
        const data = result.data.getPedidos;
        return data;
    } catch(error) {
        console.log('Error: ', error);
    }
}

async function getPeiddoPorUserId() {
    const userId = (administrandoAccount ? administrandoAccount.id : User.get("userId"));
    try {
        const response = await fetch(`${baseUrl}/graphql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
                    query getPedidosByUser($user: ID!) {
                        getPedidosByUser(user: $user) {
                            id
                            user {
                                id
                            }
                            userRun
                            carrito
                            type
                            fecha
                            hora
                            total
                        }
                    }
                `, 
                variables: {
                    user: userId,
                }
            })
        });

        const result = await response.json();

        
        pedidosUsuario = new Map();
        if (result.data && result.data.getPedidosByUser) {
            result.data.getPedidosByUser.forEach((pedido, index) => {
                pedidosUsuario.set(index, {
                    pedidoId: pedido.id,
                    userId: pedido.user.id,
                    userRun: pedido.userRun,
                    carrito: pedido.carrito,
                    type: pedido.type,
                    fecha: pedido.fecha,
                    hora: pedido.hora,
                    total: pedido.total
                });
            });
            
            for (const [index, pedido] of pedidosUsuario.entries()) {
                const updatedType = await updateType(pedido.type, pedido.fecha, pedido.hora);
                if (updatedType !== pedidosUsuario.get(index).type) {
                    updateDBType(pedidosUsuario.get(index).pedidoId, updatedType);
                }
                pedidosUsuario.get(index).type = updatedType; // Actualiza el tipo en el Map
            }
            const pedidosArray = Array.from(pedidosUsuario);
            initPedidosUser(pedidosArray);
            
        }

    } catch (error) {
        console.log('Error: ', error);
        throw new Error('No se pudo obtener los pedidos');
    }
}

async function updateType(type, fecha, hora) {
    if (type === 'entregado') {
        return type;
    }

    // Convertir fecha de DD-MM-YYYY a YYYY-MM-DD
    const fechaParts = fecha.split('-'); // Supone que fecha es DD-MM-YYYY
    const formattedFecha = `${fechaParts[2]}-${fechaParts[1]}-${fechaParts[0]}`;

    // Convertir hora de "3:54:23 p. m." a "15:54:23" (24h)
    let formattedHora = hora.toLowerCase().replace(' p. m.', '').replace(' a. m.', ''); // Eliminar 'p. m.' o 'a. m.'
    const timeParts = formattedHora.split(':');
    let hours = parseInt(timeParts[0]);

    // Si es "p. m." y la hora es menor a 12, sumar 12 para convertir a 24 horas
    if (hora.includes('p. m.') && hours < 12) {
        hours += 12;
    }
    
    // Si es "a. m." y la hora es 12, convertir a 0 (medianoche)
    if (hora.includes('a. m.') && hours === 12) {
        hours = 0;
    }

    formattedHora = `${hours}:${timeParts[1]}:${timeParts[2]}`;

    // Formatea la fecha y la hora en el formato adecuado para new Date()
    const pedidoDateTimeStr = `${formattedFecha}T${formattedHora}`;
    const pedidoDateTime = new Date(pedidoDateTimeStr);

    const currentDateTime = new Date();
    
    // Calcula la diferencia de tiempo en milisegundos
    const timeDifference = currentDateTime - pedidoDateTime;

    // 10 minutos = 10 * 60 * 1000 milisegundos
    const tenMinutes = 10 * 60 * 1000;
    // 30 minutos = 30 * 60 * 1000 milisegundos
    const halfHour = 30 * 60 * 1000;

    // Si la diferencia es entre 0 y 10 minutos, devuelve el tipo original
    if (timeDifference >= tenMinutes && type === 'pendiente') {
        type = 'por despachar';
    }

    // Si ha pasado más de 30 minutos, asegura que esté "entregado"
    if (timeDifference > halfHour && type === 'en camino') {
        type = 'entregado';
    }

    return type; // Devuelve el tipo actualizado
}

async function updateDBType(id, type) {
    try {
        const response = await fetch(`${baseUrl}/graphql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
                    mutation updatePedidoType($id: ID!, $type: String!) {
                        updatePedidoType(id: $id, type: $type) {
                            id
                            type
                        }
                    }
                `,
                variables: {
                    id: id,
                    type: type,
                }
            })
        });
        if (!response.ok) {
            throw new Error(`Error al realizar la mutación: ${response.statusText}`);
        }

    } catch (error) {
        console.log('Error: ', error);
    }
}

async function modifyDBTypeDespacho(id, type, date, time) {
    try {
        const response = await fetch(`${baseUrl}/graphql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
                    mutation modifyDBTypeDespacho($id: ID!, $type: String!, $fecha: String!, $hora: String!) {
                        modifyDBTypeDespacho(id: $id, type: $type, fecha: $fecha, hora: $hora) {
                            id
                            type
                            fecha
                            hora
                        }
                    }
                `,
                variables: {
                    id: id,
                    type: type,
                    fecha: date,
                    hora: time,
                }
            })
        });
        if (!response.ok) {
            throw new Error(`Error al realizar la mutación: ${response.statusText}`);
        }
    }catch (error){
        console.log('error: ', error)
    }
}

async function pago(total){
    return new Promise((resolve, reject) => {
         // Crear un formulario
        const form = document.createElement('form');
        form.action = 'http://www.checkbox.cl/PaymentGateway/pay.php';
        form.method = 'post';

        // Crear los campos hidden
        const comercioId = document.createElement('input');
        comercioId.type = 'hidden';
        comercioId.name = 'comercio_id';
        comercioId.value = '821';
        form.appendChild(comercioId);

        const comercioLogo = document.createElement('input');
        comercioLogo.type = 'hidden';
        comercioLogo.name = 'comercio_logo';
        comercioLogo.value = '';
        form.appendChild(comercioLogo);

        const itemNombre = document.createElement('input');
        itemNombre.type = 'hidden';
        itemNombre.name = 'item_nombre';
        itemNombre.value = "Carrito Fukusuke-Sushi";  // Aquí pones el nombre del ítem
        form.appendChild(itemNombre);

        const itemId = document.createElement('input');
        itemId.type = 'hidden';
        itemId.name = 'item_id';
        itemId.value = '';  // Aquí pones el id del ítem
        form.appendChild(itemId);

        const itemPrecio = document.createElement('input');
        itemPrecio.type = 'hidden';
        itemPrecio.name = 'item_precio';
        itemPrecio.value = total;  // Aquí pones el precio del ítem
        form.appendChild(itemPrecio);

        const urlReturn = document.createElement('input');
        urlReturn.type = 'hidden';
        urlReturn.name = 'url_return';
        urlReturn.value = baseUrl;  // Aquí pones la URL de retorno
        form.appendChild(urlReturn);

        const urlCancel = document.createElement('input');
        urlCancel.type = 'hidden';
        urlCancel.name = 'url_cancel';
        urlCancel.value = baseUrl;  // Aquí pones la URL de cancelación
        form.appendChild(urlCancel);

        const urlH2H = document.createElement('input');
        urlH2H.type = 'hidden';
        urlH2H.name = 'url_h2h';
        urlH2H.value = '';  // Aquí pones la URL de h2h
        form.appendChild(urlH2H);

        const clienteNombres = document.createElement('input');
        clienteNombres.type = 'hidden';
        clienteNombres.name = 'cliente_nombres';
        clienteNombres.value = 'Benjamin Elgueta';  // Aquí pones el nombre del cliente
        form.appendChild(clienteNombres);

        const clienteRut = document.createElement('input');
        clienteRut.type = 'hidden';
        clienteRut.name = 'cliente_rut';
        clienteRut.value = '214959615';  // Aquí pones el RUT del cliente
        form.appendChild(clienteRut);

        const clienteEmail = document.createElement('input');
        clienteEmail.type = 'hidden';
        clienteEmail.name = 'cliente_email';
        clienteEmail.value = 'respaldocrack58@gmail.com';  // Aquí pones el correo del cliente
        form.appendChild(clienteEmail);

        // Crear el botón de envío
        const submitButton = document.createElement('input');
        submitButton.type = 'submit';
        submitButton.value = 'Pagar Online';
        form.appendChild(submitButton);

        // Agregar el formulario al DOM (puedes agregarlo donde desees)
        document.body.appendChild(form);

        // Escuchar el evento de "submit" para resolver la promesa
        form.addEventListener('submit', () => {
            // Aquí puedes colocar lógica para verificar que el pago se ha completado
            resolve();  // Resolver la promesa para continuar con el siguiente paso
        });

        // Enviar el formulario
        form.submit();
    });
}

async function prepareCart() {
    const userId = administrandoAccount ? administrandoAccount.id : User.get("userId") ; // Obtener el userId
    const userRun = administrandoAccount ? administrandoAccount.run : User.get("userRun"); // Obtener el userRun
    
    if (!userId) {
        alert('Loguéese primero'); // Mostrar alerta al usuario
        throw new Error('El usuario no está logueado'); // Lanzar un error para detener la ejecución
    }

    const preparedCart =  Array.from(cart.values()).map(item => JSON.stringify(item));
    const total = Array.from(cart.values()).reduce((acc, item) => acc + item.price * item.quantity, 0);

    // await pago(total); // Lo quito por problemas de retorno a la pagina

    try {
        const response = await fetch(`${baseUrl}/graphql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
                    mutation addPedido($input: PedidoInput) {
                        addPedido(input: $input) {
                            id
                            user {
                                id
                                name
                            }
                            carrito
                            total
                        }
                    }
                `,
                variables: {
                    input: {
                        user: userId,
                        userRun: userRun,
                        carrito: preparedCart,
                        total: total,
                    }
                }
            })
        });
        
        const result = await response.json(); // Convertir la respuesta a JSON
        cart = new Map(); // Limpiar el carrito
        getPeiddoPorUserId();
        hideModal(bootstrap.Modal.getInstance(document.getElementById('cartModal'))); // Ocultar el modal
        new bootstrap.Modal(document.getElementById('pedidosUsuarioModal')).show() // Mostrar el modal de pedidos
        updateCart(); // Actualizar el carrito en la UI
    } catch (error){
        console.log('Error: ', error);
    }
}

async function deletePedido(id) {
    const decodedId = decodeURIComponent(id); // Decodifica el ID si es necesario
    try {
        const response = await fetch(`${baseUrl}/graphql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
                    mutation cancelPedido($id: ID!) {
                        cancelPedido(id: $id){
                            message
                        }
                    }
                `,
                variables: {
                    id: decodedId,
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Error al realizar la mutación: ${response.statusText}`);
        }

        const data = await response.json();

        // Verificar si la mutación devolvió un mensaje de éxito
        if (data.errors) {
            throw new Error(`Error en la mutación: ${data.errors.map(error => error.message).join(', ')}`);
        }

        const message = data.data.cancelPedido.message; // Mensaje del servidor

        // Actualiza los pedidos después de la cancelación
        await getPeiddoPorUserId();

    } catch (error) {
        console.log('Error: ', error);
    }
}

function initPedidosUser(pedidos) {
    const pedidosUsuarioModalHeader = document.getElementById('titlePedidosUsuario');
    const pedidosUsuarioModalBody = document.getElementById('pedidosUsuarioModalBody');
    function borderColor(type){
        switch (type) {
            case 'pendiente':
                return 'border-warning';
            case 'en camino':
                return 'border-primary';
            case 'en camino atrasado':
                return 'border-danger';
            case 'entregado':
                return 'border-success';

            default:
                return 'border-secondary';
        }
    }
    if (!administrandoAccount) {
        pedidosUsuarioModalHeader.innerText = 'Mis Pedidos';
    }

    pedidosUsuarioModalBody.innerHTML = `
    <div class="d-flex flex-column position-relative scrollspy-example p-3" style="height: 300px; overflow-y: auto;" data-bs-spy="scroll" data-bs-target="#scrollspyMenu" data-bs-offset="0" tabindex="0">
        ${pedidosUsuario.size === 0 ? '<p class="text-center" style="font-weight: bold; font-style: italic;">No hay pedidos</p>' : ''}
        ${pedidos.reverse().map(([index, pedido]) => `
            <div class="d-flex flex-column border border-3 ${borderColor(pedido.type)} p-2 my-2">
                <div class="row my-2">
                    <div class="col-8 d-flex justify-content-center align-items-center">
                        <h3 style="text-align: center; font-style: italic; font-weight: bold; text-decoration: underline;">Pedido ${index + 1}</h3>
                    </div>
                    <div class="col-4 d-flex justify-content-center align-items-center">
                        <button class="btn btn-sm ${pedido.type === 'entregado' ? 'btn-secondary' : 'btn-danger'}" onclick="deletePedido('${encodeURIComponent(pedido.pedidoId)}')" ${pedido.type === 'entregado' ? 'disabled' : ''}>Cancelar</button>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-4 d-flex flex-column align-items-center">
                        <p style="font-weight: bold;">Run:</p>
                        <p class="ms-2" style="font-size: 0.9rem; font-style: italic;">${pedido.userRun}</p>
                    </div>
                    <div class="col-4 d-flex flex-column align-items-center">
                        <p style="font-weight: bold;">Tipo:</p>
                        <p class="ms-2" style="font-size: 0.9rem; font-style: italic;">${pedido.type === 'en camino atrasado' ? 'en camino' : pedido.type}</p>
                        <p class="ms-2" style="font-size: 0.9rem; font-style: italic;">${pedido.type === 'en camino atrasado' ? 'atrasado' : ''}</p>
                    </div>
                    <div class="col-4 d-flex flex-column align-items-center">
                        <p style="font-weight: bold;">Tiempo:</p>
                        <p class="ms-2" style="font-size: 0.9rem; font-style: italic;">${pedido.fecha}</p>
                        <p class="ms-2" style="font-size: 0.9rem; font-style: italic;">${pedido.hora}</p>
                    </div>
                </div>
                <p style="font-weight: bold;">Carrito:</p>
                <div class="row border-bottom">
                    <div class="col-4 mt-3 text-center" style="font-size: 0.9rem; font-weight: bold;">Nombre</div>
                    <div class="col-4 mt-3 text-center" style="font-size: 0.9rem; font-weight: bold;">Precio</div>
                    <div class="col-4 mt-3 text-center" style="font-size: 0.9rem; font-weight: bold;">Cantidad</div>
                </div>
                ${pedido.carrito.map((item) => {
                    const itemData = JSON.parse(item);
                    return `
                        <div class="row border-bottom">
                            <div class="col-4 mt-3 text-center" style="font-size: 0.9rem; font-style: italic;">${itemData.title}</div>
                            <div class="col-4 mt-3 text-center" style="font-size: 0.9rem; font-style: italic;">${itemData.price}</div>
                            <div class="col-4 mt-3 text-center" style="font-size: 0.9rem; font-style: italic;">${itemData.quantity}</div>
                        </div>
                    `;
                }).join('')}
                <div class="d-flex mt-3 flex-row justify-content-center align-items-center">
                    <p style="font-weight: bold;">Total:</p>
                    <p class="ms-2" style="font-size: 0.9rem; font-style: italic;">${pedido.total}</p>
                </div>
            </div>
        `).join('')}
    </div>
    `;
}