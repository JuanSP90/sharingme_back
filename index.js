const mongoose = require('mongoose');
require('dotenv').config();
const Users = require("./routes/usersRoute");
const express = require('express');
const https = require('https');
const fs = require('fs');
const cors = require('cors'); // Agrega esta línea

const app = express();
const port = 3001;

const options = {
    key: fs.readFileSync('./certificates/key.pem'),
    cert: fs.readFileSync('./certificates/cert.pem')
}

app.use(cors()); // Habilita CORS
app.use(express.json());

app.use("/users", Users);

async function main() {
    return await mongoose.connect(process.env.CONNECTIONDB);
}

main()
    .then(() => console.log('Estamos conectados a la DB'))
    .catch(err => console.log(err));

https.createServer(options, app).listen(port, '0.0.0.0', () => {
    console.log(`Backend de SharingMe emitiendo por el puerto ${port}`);
});
