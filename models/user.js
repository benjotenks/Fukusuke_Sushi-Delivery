const mongoose = require('mongoose');

//Creamos el esquema de User con sus requisitos por caso
const userSchema = new mongoose.Schema({
    ID: {
        type: String,
        requires: true
    },
    run: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    adress: {
        type: String,
        required: true
    },
    province: {
        type: String,
        required: true
    },
    region: {
        type: String,
        required: true
    },
    bornDate: {
        type: String,
        required: true
    },
    sex: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
})

// Exportamos el modelo User hacia la base de datos
module.exports = mongoose.model('User', userSchema);