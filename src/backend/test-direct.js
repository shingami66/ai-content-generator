const { MongoClient, ServerApiVersion } = require('mongodb');

// Hardcoding the URI for final verification of the credentials and network
// Hardcoding a direct shard URI to bypass SRV issues
const uri = "mongodb://mozfer524:Mstra%40123@ac-lucxf1e-shard-00-01.lmxwqmv.mongodb.net:27017/ai_db?replicaSet=atlas-lucxf1e-shard-0&ssl=true&authSource=admin&appName=Cluster524";


const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    family: 4
});

async function run() {
    try {
        console.log('Attempting direct connection to MongoDB Atlas...');
        await client.connect();
        console.log('Connected! Pinging...');
        await client.db("admin").command({ ping: 1 });
        console.log("✅ SUCCESS: Connected to MongoDB Atlas!");
    } catch (error) {
        console.error("❌ DIRECT CONNECTION ERROR:", error);
    } finally {
        await client.close();
    }
}

run();
