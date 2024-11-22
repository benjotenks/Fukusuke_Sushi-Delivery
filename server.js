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
    userRun: String!
    carrito: [String!]!
}
type Query {
    getUsers: [User]
    findUserByEmail(email: String!, password: String!): User
    getUserByRun(run: String!): User
    checkEmail(email: String!): User

    getPedidos: [Pedido]
    getPedido(id: ID!): Pedido
    getPedidosByUser(user: ID!): [Pedido]
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
        async getPedidosByUser(_, { user }) {
            try {
                const pedidos = await Pedido.find({ user }).populate('user');
                return pedidos;
            } catch (error) {
                console.error('No se pudo obtener los pedidos: ', error);
                throw new Error(`No se pudo obtener los pedido: ${error.message}`);
            }
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
    },
    Mutation: {
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

        async addPedido(_, { input }) {
            const newPedido = new Pedido(input);
            await newPedido.save();
            return newPedido;
        }
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