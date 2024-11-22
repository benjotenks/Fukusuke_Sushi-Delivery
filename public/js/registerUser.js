// Definir la URL base dependiendo del entorno (local o producción)


const funciono = true;
let secretCode = null;

async function confirmCodeConfirmation() {
    const email = document.getElementById('registerEmail').value;
    secretCode = Math.floor(100000 + Math.random() * 900000).toString(); // Código de 6 dígitos
    try {
        
        const response = await fetch('http://localhost:8090/autenticacion/AutenticarCorreo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, secretCode }),
        });
        
        const result = await response.json();
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to send confirmation email.');
    }
}

async function checkEmail(email) {
    try {
        const response = await fetch(`${baseUrl}/graphql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
                    query checkEmail($email: String!) {
                        checkEmail(email: $email) {
                            email
                        }
                    }
                `,
                variables: {
                    email: email,
                }
            }),
        });
        const result = await response.json();
        if (result.data && result.data.checkEmail) {
            return true;
        }
    } catch (error) {
        console.error('Error: ', error);
        return false;
    }
}

async function fullRegister(){
    const run = document.getElementById('registerRun').value;
    const name = document.getElementById('registerName').value;
    const address = document.getElementById('registerAddress').value;
    const province = document.getElementById('registerProvince').value;
    const region = document.getElementById('registerRegion').value;
    const bornDate = document.getElementById('registerBornDate').value;
    const sex = document.getElementById('registerSex').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const phone = document.getElementById('registerPhone').value;

    const existEmail = await checkEmail(email);
    if (existEmail) {
        alert('Email already exists.');
        return;
    }
    try {
        const response = await fetch(`${baseUrl}/graphql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
                    mutation addUser($input: UserInput) {
                        addUser(input: $input) {
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
                    input: {
                        run: run,
                        name: name,
                        address: address,
                        province: province,
                        region: region,
                        bornDate: bornDate,
                        sex: sex,
                        email: email,
                        password: password,
                        phone: phone,
                    }
                }
            })
            
        });
    } catch (error) {
        console.error('Error: ', error);
        
        funciono = false;
    }
    if (funciono) {
        await login(email, password);
    }
}

document.getElementById('registerUserForm').addEventListener('submit', (event) => {
    event.preventDefault();

    confirmCodeConfirmation();
    document.getElementById('ConfirmarCodigoConfirmacion').addEventListener('click', function() {
        if (document.getElementById('InputCodigoConfirmacion').value === secretCode) {
            fullRegister();
        }
    });
})