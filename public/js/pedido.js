async function prepareCart(btn) {
    btn.addEventListener('click', async (event) =>{
        event.preventDefault();

        const userId = User.get("userId"); // Obtener el userId
        const userRun = User.get("userRun"); // Obtener el userRun
        preparedCart =  Array.from(cart.values()).map(item => JSON.stringify(item));
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
                            }
                        }
                    `,
                    variables: {
                        input: {
                            user: userId,
                            userRun: userRun,
                            carrito: preparedCart,
                        }
                    }
                })
            });
            
            const result = await response.json(); // Convertir la respuesta a JSON
            getPedidos();
            hideModal(bootstrap.Modal.getInstance(document.getElementById('cartModal'))); // Ocultar el modal
            document.getElementById('pedidosUsuariosBtn').dispatchEvent(new Event('click')); // Mostrar los pedidos del usuario
        } catch (error){
            console.log('Error: ', error);
        }
    
    });    
}
