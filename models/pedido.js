const mongoose = require('mongoose');

// Creamos el esquema de pedido con lo necesario para manejarlo
const pedidoSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    userRun: {
        type: String,
        required: true,
    },
    carrito: {
        type: [String], // Lista de cadenas
        required: true,
    },
});

// Exportar el modelo de pedido
module.exports = mongoose.model('Pedido', pedidoSchema);
