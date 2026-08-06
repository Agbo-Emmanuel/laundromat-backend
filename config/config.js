const mongoose = require('mongoose');

require('dotenv').config();

const db = process.env.DB;

mongoose.connect(db)
.then(() =>{
    console.log('Database connection established')
})
.catch((err) =>{
    console.log(`Error connecting to database: ${err.message}`);
});