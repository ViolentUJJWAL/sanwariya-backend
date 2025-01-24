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
        origin: ["*", "http://localhost:5173", "http://localhost:5174"],
    }
));


app.use('/api/v1/user', require('./routes/user.routes'));
app.use('/api/v1/admin', require('./routes/admin.routes'));

module.exports = app;