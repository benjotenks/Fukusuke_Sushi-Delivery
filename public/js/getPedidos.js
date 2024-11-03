async function getPedidos() {
    const userId = User.get("userId");
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
                        }
                    }
                `, 
                variables: {
                    user: userId,
                }
            })
        });

        const result = await response.json();

        

        if (result.data && result.data.getPedidosByUser) {
            result.data.getPedidosByUser.forEach((pedido, index) => {
                pedidosUsuario.set(index, {
                    pedidoId: pedido.id,
                    userId: pedido.user.id,
                    userRun: pedido.userRun,
                    carrito: pedido.carrito,
                });
            });
            initPedidosUser();
            
        }

    } catch (error) {
        console.log('Error: ', error);
        throw new Error('No se pudo obtener los pedidos');
    }
}
