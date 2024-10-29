const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const { ApolloServer, gql } = require('apollo-server-express');
const path = require('path');
require('dotenv').config();


const User = require('./models/user');
const Pedido = require('./models/pedido');

// Uri de conexion a la base de datos
const uri = process.env.mongodbURI;

// Conexion con la base de datos
mongoose.connect(uri, {
    serverSelectionTimeoutMS: 30000, // 30 segundos
    ssl: true,
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
}
type Pedido {
    id: ID!
    user: User!
    pedidoElecciones: [String!]!
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
}
input PedidoInput {
    user: ID!
    pedidoElecciones: [String!]!
}
type Query {
    getUsers: [User]
    findUserByEmail(email: String!, password: String!): User

    getPedidos: [Pedido]
    getPedido(id: ID!): Pedido
}
type Mutation {
    addUser(input: UserInput): User
    updateUser(
        id: ID!
        input: UserInput) : User
    deleteUser(id: ID!) : Alert

    addPedido(input: PedidoInput): Pedido
}
`;
// Definir los resolvers
const resolvers = {
    Query: {
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
    },
    Mutation: {
        async addUser(_, { input }) {
            try {
                const user = new User(input);
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

        async addPedido(_, { input }) {
            const newPedido = new Pedido(input);
            await newPedido.save();
            return newPedido;
        }
    }
};

// Se instancia la app 
const app = express();

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


// Se redirige a index.html para mostrar algo
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html/index.html'));
});