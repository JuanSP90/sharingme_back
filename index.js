const mongoose = require('mongoose');
require('dotenv').config();
const Users = require("./routes/usersRoute");
const express = require('express');
const https = require('https');
const fs = require('fs');

const app = express();
const port = 3001;
app.use(express.json());
const options = {
    key: fs.readFileSync('./certificates/key.pem'),
    cert: fs.readFileSync('./certificates/cert.pem')
}


// CORS
// app.use((req, res, next) => {
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
//     next();
// });

app.use("/users", Users);

async function main() {
    return await mongoose.connect(process.env.CONNECTIONDB);
}

main()
    .then(() => console.log('Estamos conectados a la DB'))
    .catch(err => console.log(err));

https.createServer(options, (req, res) => {
    ;
}).listen(port, () => { console.log(`Backend de SharingMe emitiendo por el puerto ${port}`) });
