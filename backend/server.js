const express = require('express');
const cors = require('cors');

const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const bodyParser = require('body-parser');


dotenv.config({ path: './.env' });

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const corsOptions = {
    origin: 'http://localhost:3000',
    methods: 'GET, POST, PUT, DELETE',
    credentials: true,  // Add this line to allow credentials
    allowedHeaders: 'Content-Type, Authorization',
};

app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});


const mongoose = require('mongoose');
mongoose
    .connect(process.env.REACT_APP_Mongolink)
    .then(() => {
        console.log('Connected to MongoDB');
        const port = 5000;

        app.use('/', authRoutes);

        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
    });
