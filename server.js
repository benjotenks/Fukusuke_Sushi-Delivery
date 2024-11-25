const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser')
const cors = require('cors');
const { ApolloServer, gql } = require('apollo-server-express');
const path = require('path');
const Mailjet = require('node-mailjet');

require('dotenv').config();


const User = require('./models/user');
const Pedido = require('./models/pedido');
const Producto = require('./models/producto');

// Uri de conexion a la base de datos
const uri = process.env.mongodbURI;

// Conexion con la base de datos
mongoose.connect(uri, {
    serverSelectionTimeoutMS: 30000, // 30 segundos
    //ssl: true,
}).then(() => {
    console.log('Conexión a la base de datos establecida');
}).catch(err => {
    console.error('Error de conexión a la base de datos:', err);
});

// Definir el esquema de la base de datos
const typeDefs = gql`
type User {
    id: ID!
    run: String!
    name: String!
    address: String!
    province: String!
    region: String!
    bornDate: String!
    sex: String!
    email: String!
    password: String!
    phone: String!
    type: String!
}
type Pedido {
    id: ID!
    user: User!
    userRun: String!
    carrito: [String!]!
    type: String!
    fecha: String!
    hora: String!
    total: Float!
}
type Producto {
    id: ID!
    nombre: String!
    ingredientes: String!
    precio: Float!
    categoria: String!
    imagen: String!
    aplicaDescuento: Boolean!
    descuento: Float!
    cantidad: Int!
}

type Alert {
    message: String
}
input UserInput {
    run: String!
    name: String!
    address: String!
    province: String!
    region: String!
    bornDate: String!
    sex: String!
    email: String!
    password: String!
    phone: String!
    type: String
}
input PedidoInput {
    user: ID!
    userRun: String!
    carrito: [String!]!
    type: String
    fecha: String
    hora: String
    total: Float!
}
input ProductoInput {
    nombre: String!
    ingredientes: String!
    precio: Float!
    categoria: String!
    imagen: String!
    aplicaDescuento: Boolean!
    descuento: Float!
    cantidad: Int!
}
type Query {
    getUsers: [User]
    findUserByEmail(email: String!, password: String!): User
    getUserByRun(run: String!): User
    checkEmail(email: String!): User

    getPedidos: [Pedido]
    getPedido(id: ID!): Pedido
    getOrdenesDespacho: [Pedido]
    getPedidosByUser(user: ID!): [Pedido]

    getProductos: [Producto]
    getProducto(nombre: String!): Producto
}
type Mutation {
    addUser(input: UserInput): User
    updateUser(
        id: ID!
        input: UserInput) : User
    deleteUser(id: ID!) : Alert

    addPedido(input: PedidoInput): Pedido
    updatePedidoType(id: ID!, type: String!): Pedido
    modifyDBTypeDespacho(id: ID!, type: String!, fecha: String!, hora: String!): Pedido
    cancelPedido(id: ID!): Alert

    addProducto(input: ProductoInput): Producto
    modifyProductoQuantity(id: ID!, quantity: Int!): Producto
    modifyProducto(id: ID!, input: ProductoInput): Producto
    deleteProducto(nombre: String!): Alert
}
`;
// Definir los resolvers
const resolvers = {
    Query: {
        // Usuarios Query
        async getUsers() {
            const users = await User.find();
            return users;
        },
        async findUserByEmail(_, { email, password }){
            const user = await User.findOne({ email });
            if (!user) {
                throw new Error('User not found');
            }
            if (user.password !== password) {
                throw new Error('Invalid credentials');
            }
            return user;
        },
        async getUserByRun(_, { run }) {
            const user = await User.findOne({ run });
            if (!user) {
                throw new Error('User not found');
            }
            return user;
        },
        async checkEmail(_, { email }) {
            const user = await User.findOne({ email });
            return user;
        },
        
        // Pedidos Query
        async getPedidos(_, { }) {
            const pedidos = await Pedido.find().populate('user');
            return pedidos;
        },
        async getPedidosByUser(_, { user }) {
            try {
                const pedidos = await Pedido.find({ user }).populate('user');
                return pedidos;
            } catch (error) {
                console.error('No se pudo obtener los pedidos: ', error);
                throw new Error(`No se pudo obtener los pedido: ${error.message}`);
            }
        },
        async getOrdenesDespacho(_, { }) {
            const pedidos = await Pedido.find({ type: 'por despachar' }).populate('user');
            return pedidos;
        },
        // Productos Query
        async getProductos(_, { }) {
            const productos = await Producto.find();
            return productos;
        },
        async getProducto(_, { nombre }) {
            const producto = await Producto.findOne({ nombre });
            if (!producto) {
                throw new Error('Producto not found');
            }
            return producto;
        },
        
    },
    Mutation: {
        // Usuarios Mutation
        async addUser(_, { input }) {
            try {
                const user = new User({
                    ...input,
                    type: 'user',
                });
                await user.save();
                return user;
            } catch (error) {
                console.error('Error adding user: ', error);
                throw new Error(`Failed to add user: ${error.message}`);
            }
        },
        async updateUser(_, { id, input }){
            const user = await User.findByIdAndUpdate(id, input, {new: true});
            return user;
        },
        async deleteUser(_, { id }){
            await User.deleteOne({ _id, id });
            return {
                message: 'User deleted'
            };
        },

        // Pedidos Mutation
        async addPedido(_, { input }) {
            const newPedido = new Pedido({
                ...input,
                fecha: new Date().toLocaleDateString(),
                hora: new Date().toLocaleTimeString(),
                type: 'pendiente', 
            });
            await newPedido.save();
            return newPedido;
        },
        async updatePedidoType(_, { id, type }) {
            try {
                // Validación de parámetros
                if (!id || !type) {
                    throw new Error("Faltan parámetros necesarios: id o type");
                }

                // Buscar y actualizar el pedido en la base de datos
                const pedido = await Pedido.findByIdAndUpdate(id, { type }, { new: true });

                // Si el pedido no se encuentra, lanzar un error
                if (!pedido) {
                    throw new Error("Pedido no encontrado");
                }

                // Devolver el pedido actualizado
                return pedido;
            } catch (error) {
                console.error("Error al actualizar el pedido: ", error);
                throw new Error(`Error al actualizar el pedido: ${error.message}`);
            }
        },
        async modifyDBTypeDespacho(_, { id, type, fecha, hora }) {
            const pedido = await Pedido.findByIdAndUpdate(id, { type, fecha, hora }, { new: true });
            return pedido;
        },
        async cancelPedido(_, { id }) {
            await Pedido.deleteOne({ _id: id });
            return {
                message: 'Pedido cancelado'
            };
        },

        // Productos Mutation
        async addProducto(_, { input }) {
            const producto = new Producto(input);
            await producto.save();
            return producto;
        },
        async modifyProductoQuantity(_, { id, quantity }) {
            const producto = await Producto.findById(id);
            if (!producto) {
                throw new Error('Product not found');
            }
            producto.cantidad = quantity;
            await producto.save();
            return producto;
        },
        async modifyProducto(_, { id, input }) {
            try {
                // Intentamos actualizar el producto
                const producto = await Producto.findByIdAndUpdate(id, input, { new: true });
        
                // Si no encontramos el producto, lanzamos un error
                if (!producto) {
                    throw new Error('Producto no encontrado');
                }
        
                // Retornamos el producto actualizado
                return producto;
            } catch (error) {
                // Si ocurre un error, registramos el error completo
                console.error("Error al modificar el producto:", error);
        
                // Si el error es un error de validación de Mongoose
                if (error.name === 'ValidationError') {
                    throw new Error(`Error de validación: ${error.message}`);
                }
        
                // Si el error está relacionado con la base de datos o cualquier otro tipo de error
                throw new Error(`Error desconocido: ${error.message}`);
            }
        },
        async deleteProducto(_, { nombre }) {
            await Producto.deleteOne({ nombre });
            return {
                message: 'Producto eliminado'
            };
        },
    }
};

// Se instancia la app 
const app = express();
app.use(bodyParser.json());


const mailjetClient = new Mailjet({
    apiKey: process.env.mailjetAPIKEY,
    apiSecret: process.env.mailjetSECRETKEY,
  });

// Se define el puerto en el que correra la aplicacion
const PORT = process.env.PORT;

// Se habilitan las soliiciudes CORS
const corsOptions = {
    origin: [`http://localhost:${PORT}`,
            `https://fukusuke-sushi-delivery.onrender.com`,
    ],
    credentials: true
}

app.use(cors(corsOptions));

async function startServer() {
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        cache: 'bounded',
        persistedQueries: false,
    });
    await server.start();
    server.applyMiddleware({ app, path: '/graphql' }); // Habilitamos Apollo en la aplicacion 
}

startServer().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
});

// Sirve archivos estáticos de la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Autenticar correo (codigo secreto)
app.post('/autenticacion/AutenticarCorreo', async (req, res) => {
    const { email, secretCode } = req.body;
    if (!email) {
        res.status(400).json({ message: 'Email is required' });
        return;
    }

    try {
        // Envía el correo
        await mailjetClient.post('send', { version: 'v3.1' }).request({
          Messages: [
            {
              From: {
                Email: "b.elguetaperez@gmail.com", // Cambia a tu correo
                Name: "Fukusuke-sushi-delivery",
              },
              To: [
                {
                  Email: email,
                },
              ],
              Subject: "Código de Confirmación",
              TextPart: `Tu código de confirmación es:
    javascript
    Copiar código
              ${secretCode}. Por favor, introdúcelo para confirmar tu registro.`,
              HTMLPart: `<h3>¡Gracias por registrarte!</h3><p>Tu código de confirmación es: <strong>${secretCode}</strong>.</p>`,
            },
          ],
        });
    
        // Responde al cliente (frontend)
        res.status(200).send({ message: 'Correo enviado con éxito', secretCode }); // Opcional: guarda el código en la base de datos en lugar de devolverlo.
    
      } catch (error) {
        console.error('Error enviando correo:', error);
        res.status(500).send({ message: 'Error enviando correo' });
      }     
});

// Verificar dirección
app.post('/autenticacion/VerificarDireccion', async (req, res) => {
    const { direccion } = req.body;
    if (!direccion) {
        res.status(400).json({ message: 'Direccion is required' });
        return;
    }
    
    try {
        const url = `https://us1.locationiq.com/v1/search.php?key=${process.env.locationIQApiKey}&q=${encodeURIComponent(direccion)}&format=json`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.error) {
            res.status(400).json({ message: 'Invalid address' });
            return;
        }
        const { lat, lon, display_name } = data[0];
        res.status(200).json({ lat, lon, display_name });
    } catch (error) {
        console.error('Error encontrando localizacion:', error);
        res.status(500).send({ message: 'Error encontrando localizacion' });
    }

});

// Redirigir a index.html al acceder a la raíz (/)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'index.html'));
});
  
// Ruta dinámica para otras páginas HTML en /public/html
app.get('/:page', (req, res) => {
    const page = req.params.page;
    const filePath = path.join(__dirname, 'public', 'html', `${page}.html`);

    res.sendFile(filePath, (err) => {
        if (err) {
        res.status(404).send('Página no encontrada');
        }
    });
});