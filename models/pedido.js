const mongoose = require('mongoose');

// Creamos el esquema de pedido con lo necesario para manejarlo
const pedidoSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true 
    },
    pedidoId: {
        type: String,
        required: true
    },
    menuOpc: [{
        type: String,
        required: true
    }]
});

// Exportar el modelo de pedido
module.exports = mongoose.model('Pedido', pedidoSchema);
