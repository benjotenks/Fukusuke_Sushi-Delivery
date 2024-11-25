async function getAccountByRun() {
    run = document.getElementById('runAdmin').value;
    if (!User.get("UserType") == "admin") {
        console.log("No eres admin");
        alert("No tienes permisos para realizar esta acción");
        return;
    }
    if (User.get("userRun") === run) {
        console.log("No puedes administrate a ti mismo aqui");
        alert("No puedes administrate a ti mismo aqui");
        return;
    }
    if (run == "") {
        console.log("Ingrese un run");
        alert("Ingrese un run");
        return;
    }

    const response = await fetch(`${baseUrl}/graphql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query:`
                query getUserByRun($run: String!) {
                    getUserByRun(run: $run) {
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
                    }}`,
                    variables: {
                        run: run,
                    },
        })
    });

    const result = await response.json();
    data = result.data.getUserByRun;
    if (!data) {
        console.log("No se encontró el usuario");
        alert("No se encontró el usuario");
        return;
    }
    administradorActiveAccount = Object.entries(data);
    administradorActiveAccount = {
        id: data.id,
        run: data.run,
        name: data.name,
        address: data.address,
        province: data.province,
        region: data.region,
        bornDate: data.bornDate,
        sex: data.sex,
        email: data.email,
        password: data.password,
        phone: data.phone,
        type: data.type,
    }
    getPedidos();
    
}

function changeAdministratorModal(data) {
    const modalBody = document.getElementById('administrarModalBody');
    const modalFooter = document.getElementById('administrarModalFooter');
    modalBody.innerHTML = '';
    modalFooter.innerHTML = '';
    if (data.length === 0) {
        modalBody.innerHTML = `
        <label>Run de la cuenta a administrar:</label>
        <input type="text" class="form-control" id="runAdmin" placeholder="Run">
        <div class="d-flex justify-content-center align-items-center my-2">
            <button type="button" class="btn btn-primary" id="confirmAdmin" onclick="getAccountByRun()">Confirmar</button>
        </div>
        `;
        modalFooter.innerHTML = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
        `;
    } else{
        modalBody.innerHTML = `
        <div class="d-flex flex-column position-relative scrollspy-example p-3" style="height: 300px; overflow-y: auto;" data-bs-spy="scroll" data-bs-target="#scrollspyMenu" data-bs-offset="0" tabindex="0">
            ${Object.entries(data).map(([key, value]) => `
                <label>${key}</label>
                <input type="text" class="form-control" id="administrator${key.toUpperCase()}" value="${value}" ${key == "id" ? "disabled" : ""}>
            `).join('')}
        </div>
        `;
        modalFooter.innerHTML = `
        <button type="button" class="btn btn-secondary" onclick="saveAdministradorActiveAccount()" id="saveAdministradorActiveAccount">Guardar</button>
        <button type="button" class="btn btn-warning" onclick="changeAdministratorActiveAccountModal()">Cambiar a otra cuenta</button>
        `;
    }
}

function saveAdministradorActiveAccount(){
    const id = document.getElementById('administratorID').value;
    const run = document.getElementById('administratorRUN').value;
    const name = document.getElementById('administratorNAME').value;
    const address = document.getElementById('administratorADDRESS').value;
    const province = document.getElementById('administratorPROVINCE').value;
    const region = document.getElementById('administratorREGION').value;
    const bornDate = document.getElementById('administratorBORNDATE').value;
    const sex = document.getElementById('administratorSEX').value;
    const email = document.getElementById('administratorEMAIL').value;
    const password = document.getElementById('administratorPASSWORD').value;
    const phone = document.getElementById('administratorPHONE').value;
    const type = document.getElementById('administratorTYPE').value;

    const data = {
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
    

    updateUser(data);
}

function changeAdministratorActiveAccountModal() {
    changeAdministratorModal([]);
}

async function administrarClientes() {
    const run = document.getElementById('runAdmin').value;
    if (run == "") {
        console.log("Ingrese un run");
        alert("Ingrese un run");
        return;
    }
    await getAccountByRun();
    const labelUsuario = document.getElementById('labelUsuarioHeader');
    labelUsuario.textContent = `${User.get("userRun")}  (${administradorActiveAccount.run})`;
}

async function administrarCuentas() {
    await getAccountByRun();
    changeAdministratorModal(administradorActiveAccount);
    if (administradorActiveAccount) document.getElementById('runAdmin').value = administradorActiveAccount.run;
    const cartTitle = document.getElementById('titleCarritoDeCompras');
    cartTitle.textContent = `Carrito de compras del usuario ${administradorActiveAccount.run}`;
}

async function modifyMenuItem(itemName, type) {
    if (type === 'add') {
        for (let [key, value] of Object.entries(menu)) {
            if (value.Nombre === itemName) {
                value.Cantidad += 1;
                await modifyProductoQuantity(value.ID, value.Cantidad);
                break;
            }
        }
    }
    if (type === 'sub') {
        for (let [key, value] of Object.entries(menu)) {
            if (value.Nombre === itemName) {
                value.Cantidad -= 1;
                await modifyProductoQuantity(value.ID, value.Cantidad);
                break;
            }
        }
    }
    if (type === 'all') {
        const modalTitle = document.getElementById('administradorTitleMenuItem');
        const modalBody = document.getElementById('administrarBodyMenuItem');
        modalTitle.innerHTML = ``;
        modalBody.innerHTML = ``;

        for (let [key, value] of Object.entries(menu)) {
            if (value.Nombre === itemName) {
                modalTitle.textContent = `Modificar ${itemName}`;
                modalBody.innerHTML = `
                    <div class="d-flex flex-column position-relative scrollspy-example p-3" style="height: 300px; overflow-y: auto;" data-bs-spy="scroll" data-bs-target="#scrollspyMenu" data-bs-offset="0" tabindex="0">
                        ${Object.entries(value).map(([key, val]) => `
                            <div class="d-flex flex-row justify-content-between align-items-center border my-2" style="border-radius: 0.375rem;">
                                <div class="row w-100 g-0">
                                    <div class="col-4 d-flex align-items-center">
                                        <p class="m-0" name="administradorMenuItemName">${key}</p>
                                    </div>
                                    <div class="col-8">
                                        ${key === 'Categoria' ? categorysDropdown(val) : 
                                        `<input type="text" class="form-control" id="administradorModifyMenuItem${key}" ${key === 'ID' ? 'disabled' : ''} value="${val}">`}                                        
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                `;
            }
        }
    }
    await administradorModalBodyProductos();
}

function categorysDropdown(val) {
    return `
        <div class="dropdown">
            <button class="btn btn-secondary dropdown-toggle w-100 g-0" type="button" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-expanded="false">${val}</button>
            <ul class="dropdown-menu w-100" aria-labelledby="dropdownMenuButton">
                ${categories.map((category) => `
                    <li><a class="dropdown-item" href="#" onclick="updateDropdownButton(this)" id="administradorModifyMenuItemCategoria">${category}</a></li>
                `).join('')}
            </ul>
        </div>
    `;
} 

function updateDropdownButton(element) {
    const dropdownButton = element.closest('.dropdown').querySelector('.dropdown-toggle');
    dropdownButton.textContent = element.textContent; // Cambia el texto del botón
}

async function administratorSaveChangesMenuItem(){
    let id = document.getElementById('administradorModifyMenuItemID').value;
    let nombre = document.getElementById('administradorModifyMenuItemNombre').value;
    let ingredientes = document.getElementById('administradorModifyMenuItemIngredientes').value;
    let precio = document.getElementById('administradorModifyMenuItemPrecio').value;
    let categoria = document.getElementById('dropdownMenuButton').textContent;
    let imagen = document.getElementById('administradorModifyMenuItemImagen').value;
    let aplicaDescuento = document.getElementById('administradorModifyMenuItemAplicaDescuento').value;
    let descuento = document.getElementById('administradorModifyMenuItemDescuento').value;
    let cantidad = document.getElementById('administradorModifyMenuItemCantidad').value;

    

    const data = {
        id,
        nombre,
        ingredientes,
        precio,
        categoria,
        imagen,
        aplicaDescuento,
        descuento,
        cantidad
    }

    await modifyProducto(id, data);
    
    menu.forEach((item) => {
        if (item.ID === id) {
            item.Nombre = nombre;
            item.Ingredientes = ingredientes;
            item.Precio = precio;
            item.Categoria = categoria;
            item.Imagen = imagen;
            item.AplicaDescuento = aplicaDescuento;
            item.Descuento = descuento;
            item.Cantidad = cantidad
        }
    })

    await initMenu();
    
}

async function anularComprasUsuario() {
    const run = administradorActiveAccount.run || document.getElementById('runAdmin').value;
    if (run == "") {
        console.log("Ingrese un run");
        alert("Ingrese un run");
        return;
    }
    const title = document.getElementById('titlePedidosUsuario');
    title.textContent = `Pedidos del usuario ${run}`;
    await getAccountByRun();
    await getPedidos();
    hideModal(bootstrap.Modal.getInstance(document.getElementById('administrar')));
    new bootstrap.Modal(document.getElementById('pedidosUsuarioModal')).show();

}

function administradorModalBodyProductos(){
    const modalBody = document.getElementById('administrarModalBody');
    modalBody.innerHTML = ``; // Limpiar el modal
    modalBody.innerHTML = `
        <div class="d-flex flex-column">
            ${categories.map((category) => `
                <div class="d-flex flex-column my-3" style="border-top: 1px solid gray; border-bottom: 1px solid gray;">
                    <h3>${category}</h3>
                    ${menu.filter((item) => item.Categoria === category).map((item) => `
                        <div class="d-flex flex-row justify-content-between align-items-center border">
                            <div class="d-flex col-3 align-items-center" style="flex-grow: 1; height: 100%;">
                                <p class="m-0" name="administradorMenuItemName"">${item.Nombre}</p>
                            </div>
                            <div class="d-flex col-4 justify-content-center align-items-center" style="flex-grow: 1; height: 100%;">
                                <p class="m-0" name="administradorMenuItemQuantity">$${item.Cantidad}</p>
                            </div>
                            <div class="d-flex flex-end justify-content-center align-items-center">
                                <button type="button" class="cartButton text-success" onclick="modifyMenuItem('${item.Nombre}', 'add')">
                                    <i class="bi bi-plus-circle-fill"></i>
                                </button>
                                <button type="button" class="cartButton text-primary" onclick="modifyMenuItem('${item.Nombre}', 'sub')">
                                    <i class="bi bi-dash-circle-fill"></i>
                                </button>
                                <button type="button" class="cartButton text-warning" data-bs-toggle="modal" data-bs-target="#administradorModificarMenuItem" onclick="modifyMenuItem('${item.Nombre}', 'all')">
                                    <i class="bi bi-pencil-fill"></i>
                                </button>
                                <button type="button" class="cartButton text-danger" onclick="deleteProduct('${item.Nombre}')">
                                    <i class="bi bi-trash-fill"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `).join('')}
        </div>
    `;
}