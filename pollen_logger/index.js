const mqtt = require("mqtt");
const { MongoClient } = require('mongodb');
const express = require('express')
const app = express()
const port = 3000

const brokerURL = "ws://mqtt.eclipseprojects.io/mqtt";
const topic = "/pollen";
const mqttClient = mqtt.connect(brokerURL);

const mongoURL = process.env.MONGO_URL
const mongoClient = new MongoClient(mongoURL);
let collection;

mqttClient.on('connect', async () => {
    console.log("Connected to MQTT broker");

    await mongoClient.connect();
    collection = mongoClient.db("pollen").collection('monitoring');

    mqttClient.subscribe(topic, (err) => {
        if (err) {
            console.error("Failed to subscribe to topic:", err);
        } else {
            console.log(`Subscribed to topic: ${topic}`);
        }
    });
});

mqttClient.on('message', async (topic, message) => {
    try {
        const data = JSON.parse(message.toString());
        data["timestamp"] = new Date();
        await collection.insertOne(data);
    }
    catch (e) {}
});

app.get('/', async (req, res) => {
    const filters = {}

    if ("from" in req.query && "until" in req.query) {
        filters.timestamp = {
            $gte: new Date(req.query.from),
            $lt: new Date(req.query.until)
        }
    }

    res.json(await collection.find(filters)
    .sort({timestamp: -1})
    .limit(100)
    .toArray())
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
