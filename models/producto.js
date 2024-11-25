const mongoose = require('mongoose');

// Creamos el esquema de pedido con lo necesario para manejarlo
const productoSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
    ingredientes: {
        type: String,
        required: true
    },
    precio: {
        type: Number,
        required: true
    },
    categoria: {
        type: String,
        required: true
    },
    imagen: {
        type: String,
        required: true
    },
    aplicaDescuento: {
        type: Boolean,
        required: true
    },
    descuento: {
        type: Number,
        required: true
    },
    cantidad: {
        type: Number,
        required: true
    },
});

// Exportar el modelo de producto
module.exports = mongoose.model('Producto', productoSchema);
