const { MongoClient } = require("mongodb");

const url = "mongodb://localhost:27017";
const client = new MongoClient(url);

const dbName = "alunos";

async function connect() {
    await client.connect();
    console.log("MongoDB conectado");
    return client.db(dbName);
}

module.exports = connect;