async function obtenerOrdenesDespachoModal() {
    const ordenes = await getOrdenesDespacho();

    const modalBody = document.getElementById('obtenerOrdenesDespachoModalBody');
    modalBody.innerHTML = '';

    if (ordenes.length === 0) {
        modalBody.innerHTML = `<div class="alert alert-warning">No hay ordenes pendientes de despacho</div>`;
        return
    }
    modalBody.innerHTML = `
    ${ordenes.map(orden => `
        <div class="row border rounded py-2">
            <div class="col-4">
                <strong>Fecha:</strong> ${orden.fecha}<br>
                <strong>Hora:</strong> ${orden.hora}
            </div>
            <div class="col-4">
                <strong>Usuario:</strong> ${orden.user.name}<br>
                <strong>Dirección:</strong> ${orden.user.address}
            </div>
            <div class="col-4">
                <strong>Total:</strong> $${orden.total}<br>
                <strong>Estado:</strong> ${orden.type}
            </div>
            <div class="col-12 mt-2">
                <strong>Carrito:</strong>
                <ul>
                    ${orden.carrito.map(item => {
                        const producto = JSON.parse(item); // Convierte el string a objeto JSON
                        return `<li>${producto.title} - $${producto.price} x ${producto.quantity}</li>`;
                    }).join('')}
                </ul>
            </div>
            <div class="col-12 mt-2 d-flex justify-content-center align-items-center">
                <button class="btn btn-primary" onclick="despacharOrden('${orden.id}')">Despachar Orden</button>
            </div>
        </div>    
    `).join('')}
    `;
}

async function despacharOrden(id) {
    const fechaDespacho = new Date().toLocaleDateString();
    const horaDespacho = new Date().toLocaleTimeString();
    modifyDBTypeDespacho(id, 'en camino', fechaDespacho, horaDespacho);
    obtenerOrdenesDespachoModal();
}