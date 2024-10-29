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
                    query findUserByEmail($email: String!, $password: String!) {
                        findUserByEmail(email: $email, password: $password) {
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
        if (result.data && result.data.findUserByEmail) {
            userId = result.data.findUserByEmail.id;
            pedidoElecciones[0] = userId;
            User = result.data.findUserByEmail;
            document.getElementById('pedidoUserId').children[0].textContent = 'User id: ' + userId;
        } else {
            console.log('User not found or invalid credentials');
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
})