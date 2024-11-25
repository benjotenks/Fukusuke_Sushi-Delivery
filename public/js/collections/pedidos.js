async function getPedidos() {
    const userId = (administradorActiveAccount ? administradorActiveAccount.id : User.get("userId"));
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

    // 20 minutos = 20 * 60 * 1000 milisegundos
    const twentyMinutes = 20 * 60 * 1000;
    // 1 hora = 60 minutos * 60 segundos * 1000 milisegundos
    const oneHour = 60 * 60 * 1000;
    // 2 horas = 2 * 60 minutos * 60 segundos * 1000 milisegundos
    const twoHours = 2 * 60 * 60 * 1000;

    // Si la diferencia es entre 0 y 20 minutos, devuelve el tipo original
    if (timeDifference <= twentyMinutes) {
        return type;
    }

    // Si la diferencia está entre 20 minutos y 1 hora, devuelve "en camino"
    if (timeDifference > twentyMinutes && timeDifference <= oneHour) {
        type = 'en camino';
    }

    // Si ha pasado más de 1 hora, con 75% de probabilidad es "entregado" y 25% "en camino atrasado"
    if (timeDifference > oneHour && timeDifference <= twoHours) {
        type = Math.random() < 0.75 ? 'entregado' : 'en camino atrasado';
    }

    // Si han pasado más de 2 horas, asegura que esté "entregado"
    if (timeDifference > twoHours) {
        type = 'entregado';
    }

    return type; // En caso de que no entre en ninguna de las condiciones, devuelve el tipo original
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

async function prepareCart() {
    const userId = administradorActiveAccount ? administradorActiveAccount.id : User.get("userId") ; // Obtener el userId
    const userRun = administradorActiveAccount ? administradorActiveAccount.run : User.get("userRun"); // Obtener el userRun
    console.log('userRun: ', userRun);
    const preparedCart =  Array.from(cart.values()).map(item => JSON.stringify(item));
    const total = Array.from(cart.values()).reduce((acc, item) => acc + item.price * item.quantity, 0);
    if (!userId) {
        alert('Loguéese primero'); // Mostrar alerta al usuario
        throw new Error('El usuario no está logueado'); // Lanzar un error para detener la ejecución
    }
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
        getPedidos();
        hideModal(bootstrap.Modal.getInstance(document.getElementById('cartModal'))); // Ocultar el modal
        new bootstrap.Modal(document.getElementById('pedidosUsuarioModal')).show() // Mostrar el modal de pedidos
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
        await getPedidos();

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
    if (!administradorActiveAccount) {
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