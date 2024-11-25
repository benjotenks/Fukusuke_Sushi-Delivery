async function generarReporteVentas(){ 
    const ventas = await getPedidos();

    items = new Map();

    total = 0;

    ventas.map((venta) => {
        venta.carrito.map((item) => {
            item = JSON.parse(item);  // Convierte un string con formato JSON en un array
            if(items.has(item.title)){
                const existingItem = items.get(item.title);
                items.set(item.title, {
                    quantity: existingItem.quantity + item.quantity,
                    price: existingItem.price + item.price
                });
            } else {
                items.set(item.title, {
                    quantity: item.quantity,
                    price: item.price
                });
            }
            total += item.price; // El precio a esta calculdado por cantidad
            
        })
    })

    // Convertir los datos para el gráfico
    const productNames = Array.from(items.keys());
    const totalPrices = Array.from(items.values()).map(item => item.price);

    // Obtener el contexto del canvas
    const ctx = document.getElementById('ventasChart').getContext('2d');
    
    // Si ya existe un gráfico, destrúyelo antes de crear uno nuevo
    if (window.myChart) {
        window.myChart.destroy();
    }

    // Crear el gráfico
    window.myChart = new Chart(ctx, {
        type: 'bar', // Tipo de gráfico
        data: {
            labels: productNames, // Etiquetas de los productos
            datasets: [{
                label: 'Ventas Totales por Producto',
                data: totalPrices,
                backgroundColor: 'rgba(0, 123, 255, 0.5)', // Color de las barras
                borderColor: 'rgba(0, 123, 255, 1)', // Color del borde de las barras
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true, // Comienza el eje Y en cero
                }
            }
        }
    });

    const totalInModal = document.getElementById('totalReporteVentasModalBody');
    totalInModal.textContent = `Total de ventas: $${total}`;

}
