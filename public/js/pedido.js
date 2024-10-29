document.getElementById('pedido').addEventListener('submit', async (event) =>{
    event.preventDefault();

    User; // <- Proviene de server.js al require
    pedidoId; // solo lo declaro para no olvidarlo
    pedidoElecciones; // solo lo declaro para no olvidarlo
    if (!User) {
        alert('Loguéese primero'); // Mostrar alerta al usuario
        throw new Error('El usuario no está logueado'); // Lanzar un error para detener la ejecución
    }
    try {
        // Crea el Schema Primero
    } catch (error){
        console.log('Error: ', error);
    }

});