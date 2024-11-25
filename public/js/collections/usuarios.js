const funciono = true;
let secretCode = null;
let readyToRegister = false;

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
        if (!await compararDireccionConLocal(address + ', ' + province + ', ' + region)) {
            alert('El usuario no puede recibir delivery en esta dirección');
        }
    }
}

async function checkEverythingForRegister() {
    let comprobacion = true;
    const address = document.getElementById('registerAddress').value + ', '
        + document.getElementById('registerProvince').value + ', '
        + document.getElementById('registerRegion').value;

    if (!await checkAdress(address)) {
        comprobacion = false;
    }
    if (!await confirmCodeConfirmation()){
        comprobacion = false;
    }
    if (!comprobacion) {
        failRegister();
    }
    return comprobacion;
} 

async function checkAdress(address) {
    if (!await verificarDireccion(address)) {
        return false;
    }
    else return true;
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

async function confirmCodeConfirmation() {
    const email = document.getElementById('registerEmail').value;
    secretCode = Math.floor(100000 + Math.random() * 900000).toString(); // Código de 6 dígitos
    console.log(secretCode);
    try {
        
        const response = await fetch('http://localhost:8090/autenticacion/AutenticarCorreo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, secretCode }),
        });
        
        const result = await response.json();
        if (response.status === 200) {
            return true;
        }
        else {
            alert('Failed to send confirmation email.');
            return false;
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to send confirmation email.');
        return false;
    }
}

function failRegister(){
    hideModal(bootstrap.Modal.getInstance(document.getElementById('codigoConfirmacion')));
    new bootstrap.Modal(document.getElementById('registerModal')).show();
}

async function login(email, password) {
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');

    // Poner valores en los campos
    emailInput.value = email;
    passwordInput.value = password;

    // Llama a la función de login o ejecuta otra lógica
    document.getElementById('loginUserForm').dispatchEvent(new Event('submit'));
}

function logOut() {
    hideModal(bootstrap.Modal.getInstance(document.getElementById('profileModal')));
    User = new Map();
    administradorActiveAccount = null;
    const navUser = document.getElementById('userDropdown');
    navUser.innerHTML = `
    <a class="nav-link text-white d-flex flex-row dropdown-toggle" id="navUserDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false" style="cursor:pointer;">
        <i class="bi bi-person-fill nav-icon"></i>
        <div class="d-flex flex-column align-items-center" style="margin:0; padding: 0;">
            Usuario
        </div>
    </a>
    <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navUserDropdown">
        <li>
            <button type="button" class="dropdown-item" data-bs-toggle="modal" data-bs-target="#loginModal">Iniciar Sesión</button>
        </li>
        <li>
            <button type="button" class="dropdown-item" data-bs-toggle="modal" data-bs-target="#registerModal">Registrarse</button>
        </li>
    </ul>
    `;
    const cartTitle = document.getElementById('titleCarritoDeCompras');
    cartTitle.textContent = `Carrito de compras`;
    const pedidosTitle = document.getElementById('titlePedidosUsuario');
    pedidosTitle.textContent = `Mis Pedidos`;
    initButtons();
}

async function updateUser(items){
    const id = items.id
    const run = items.run;
    const name = items.name;
    const address = items.address;
    const province = items.province;
    const region = items.region;
    const bornDate = items.bornDate;
    const sex = items.sex;
    const email = items.email;
    const password = items.password;
    const phone = items.phone;
    const type = items.type;

    try {
        const response = await fetch(`${baseUrl}/graphql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
                    mutation UpdateUser($id: ID!, $input: UserInput!) {
                        updateUser(id: $id, input: $input) {
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
                            type
                        }
                    }`,
                variables: 
                {
                    id,
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
                        type: type
                    }
                }
            })
        });

        const result = await response.json();

        administradorActiveAccount = {
            id,
            run,
            name,
            address,
            province,
            region,
            bornDate,
            sex,
            email,
            password,
            phone,
            type
        };
        const saveBtn = document.getElementById('saveAdministradorActiveAccount');
        saveBtn.classList.toggle('btn-secondary');
        saveBtn.classList.toggle('btn-success');
        setTimeout(() => {
            saveBtn.classList.toggle('btn-secondary');
            saveBtn.classList.toggle('btn-success');
        }, 500);
        
    } catch (error) {
        console.log('Error: ', error);
        const saveBtn = document.getElementById('saveAdministradorActiveAccount');
        saveBtn.classList.toggle('btn-secondary');
        saveBtn.classList.toggle('btn-warning');
        setTimeout(() => {
            saveBtn.classList.toggle('btn-secondary');
            saveBtn.classList.toggle('btn-warning');
        }, 500);
        throw new Error('Error al actualizar el usuario');
    }

    

}

document.getElementById('registerUserForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    document.getElementById('ConfirmarCodigoConfirmacion').addEventListener('click', function() {
        if (document.getElementById('InputCodigoConfirmacion').value === secretCode) {
            if (readyToRegister) fullRegister();
            else alert('Porfavor complete todos los campos correctamente');
        }
    });

    readyToRegister = await checkEverythingForRegister();

})

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
                            type
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
                ["userType", result.data.findUserByEmail.type],
            ]);

            colorUser = defineColorUser(User.get("userType"));
            changeNavUser(User.get("userRun"));
            getPedidos();
            
            hideModal(bootstrap.Modal.getInstance(document.getElementById('loginModal')));
            hideModal(bootstrap.Modal.getInstance(document.getElementById('codigoConfirmacion')));
            //document.getElementById('pedidoUserId').children[0].textContent = 'User id: ' + userId;
        } else {
            console.log(result)
            console.log('User not found or invalid credentials');
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
})