import express from 'express';
import cors from 'cors';
import { db } from './models/index.js';
import {authRouter} from './routes/auth.route.js';
import endPoints from 'express-list-endpoints';

const app = express();

// Middleware
app.use(cors());

//parse requests of content type 'application/json'
app.use(express.json());

//parse requests of content type 'application/x-www-form-urlencoded'
app.use(express.urlencoded({extended: true}));

//Authenticate database
db.sequelize
.authenticate()
.then(() => {
    console.log('Connection has been established successfully.');
})
.catch(err => {
    console.error('Unable to connect to the database:', err);
});
app.use('/api/v1/auth', authRouter)

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`)
});