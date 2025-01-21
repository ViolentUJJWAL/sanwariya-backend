const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors(
    {
        origin: '*'
    }
));


app.get('/', (req, res) => {
    res.send('Hello World!');
});

module.exports = app;