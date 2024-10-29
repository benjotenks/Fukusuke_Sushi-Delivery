document.getElementById('pedido').addEventListener('submit', async (event) =>{
    event.preventDefault();

    User; // Declarar userId
    pedidoElecciones; // solo lo declaro para no olvidarlo
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
                            user
                            pedidoElecciones
                        }
                    }
                `,
                variables: {
                    input: {
                        user: userId,
                        pedidoElecciones: pedidoElecciones,
                    }
                }
            })
        });
        
        const result = await response.json(); // Convertir la respuesta a JSON
        if (result.data && result.data.addPedido) {
            console.log('Pedido agregado:', result.data.addPedido);
        }
    } catch (error){
        console.log('Error: ', error);
    }

});