const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const { ApolloServer, gql } = require('apollo-server-express');
const path = require('path');
require('dotenv').config();

// Uri de conexion a la base de datos
uri = process.env.mongodbURI;

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
type Query {
    getUsers: [User]
    getUser(id: ID!): User
}
type Mutation {
    addUser(input: UserInput!): User
    updateUser(
        id: ID!
        input: UserInput) : User
        deleteUser(id: ID!) : Alert
}
`;
// Definir los resolvers
const resolvers = {
    Query: {
        async getUsers() {
            const users = await User.find();
            return users;
        },
        async getUser(_, { id }){
            const user = await User.findById(id);
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
                throw new Error('Failed to add user');
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
        }
    }
};

// Se instancia la app 
const app = express();

// Se define el puerto en el que correra la aplicacion
const PORT = process.env.PORT;

// Se habilitan las soliiciudes CORS
const corsOptions = {
    origin: 'http://localhost:${PORT}',
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
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});