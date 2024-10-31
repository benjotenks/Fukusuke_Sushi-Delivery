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
                            run
                            name
                            address
                            province
                            region
                            bornDate
                            sex
                            email
                            password
                            phone
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
            User = new Map([
                ["userId", result.data.findUserByEmail.id],
                ["userName", result.data.findUserByEmail.name],
                ["userRun", result.data.findUserByEmail.run],
                ["userAddress", result.data.findUserByEmail.address],
                ["userProvince", result.data.findUserByEmail.province],
                ["userRegion", result.data.findUserByEmail.region],
                ["userBornDate", result.data.findUserByEmail.bornDate],
                ["userSex", result.data.findUserByEmail.sex],
                ["userEmail", result.data.findUserByEmail.email],
                ["userPassword", result.data.findUserByEmail.password],
                ["userPhone", result.data.findUserByEmail.phone],
            ]);

            
            changeNavUser(User.get("userRun"));
            
            hideModal(bootstrap.Modal.getInstance(document.getElementById('loginModal')));
            //document.getElementById('pedidoUserId').children[0].textContent = 'User id: ' + userId;
        } else {
            console.log('User not found or invalid credentials');
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
})