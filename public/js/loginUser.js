// Definir la URL base dependiendo del entorno (local o producción)
document.getElementById('loginUserForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${baseUrl}/graphql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query:`
                    query getUser($email: String!, $password: String!) {
                        getUser(email: $email, password: $password) {
                            id
                            email
                            password    
                        }
                    }
                    `,
                    variables: {
                        email: email,
                        password: password,
                    }
            })
        });

        const result = await response.json(); // Convertir la respuesta a JSON

        // Comprobar si se obtuvo un usuario
        if (result.data && result.data.getUser) {
            console.log('User id: ', result.data.getUser.id);
            userId = result.data.getUser.id;
            document.getElementById('pedidoUserId').children[0].textContent = 'User id: ' + userId;
        } else {
            console.log('User not found or invalid credentials');
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
})