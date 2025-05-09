const mqtt = require("mqtt")
const { MongoClient } = require('mongodb')
const express = require('express')
const cors = require('cors')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const app = express()
const port = 3000

const brokerURL = "mqtts://mqtt.eclipseprojects.io";
const topic = "/pollen";
let mqttClient;

const mongoURL = process.env.MONGO_URL
const mongoClient = new MongoClient(mongoURL);
let history;
let devices;

const uploadsPath = process.env.UPLOADS_PATH ?? path.join(__dirname, 'uploads/')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsPath)
    },
    filename: (req, file, cb) => {
        const deviceName = file.originalname ?? 'unknown'
        const filename = deviceName + '.jpg'

        req.deviceName = deviceName

        cb(null, filename)
    }
})

const upload = multer({ storage });

async function on_connect() {
    console.log("Connected to MQTT broker");

    mqttClient.subscribe(topic, (err) => {
        if (err) {
            console.error("Failed to subscribe to topic:", err);
        } else {
            console.log(`Subscribed to topic: ${topic}`);
        }
    });
}

async function on_message(topic, message) {
    try {
        const timestamp = new Date()
        const data = JSON.parse(message.toString())
        const device = await devices.findOne({name: "Test box"}) ?? {}

        data.timestamp = timestamp
        device.timestamp = timestamp

        if ("dht22" in data && Array.isArray(data.dht22)) {
            data.dht22 = data.dht22.map(v => v.rh > 100 ? ({t: null, rh: null}) : v)
            device.dht22 = data.dht22.map((v, i) => !v.rh && device.dht22?.length > i ? device.dht22[i] : v)
        }

        if ("power" in data) {
            device.power = data.power
        }

        if ("gps" in data) {
            device.gps = data.gps
        }

        await devices.updateOne(
            {
                name: "Test box"
            },
            {
                "$set": {
                    name: "Test box",
                    ...device
                }
            },
            {
                upsert: true
            })
        await history.insertOne(data);
    }
    catch (e) {}
}

(async () => {
    await mongoClient.connect()
    const db = mongoClient.db("pollen")
    devices = db.collection('devices')
    history = db.collection('monitoring')

    mqttClient = mqtt.connect(brokerURL)
    mqttClient.on('connect', on_connect)
    mqttClient.on('message', on_message)
})()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/api/devices', async (req, res) => {
    res.json(await devices.find()
        .toArray())
})

app.get('/api/history', async (req, res) => {
    const deviceName = req.query.device
    const filters = {}

    if (deviceName) {
        filters.name = deviceName
    }

    if ("from" in req.query && "until" in req.query) {
        filters.timestamp = {
            $gte: new Date(req.query.from),
            $lt: new Date(req.query.until)
        }
    }

    res.json(await history.find(filters)
        .sort({timestamp: -1})
        .limit(100)
        .toArray())
})

app.post('/api/upload', upload.single('image'), async (req, res) => {
    const { file, body, deviceName } = req

    if (!file || !body.data) {
        return res.sendStatus(400)
    }

    const metadata = JSON.parse(body.data)
    const timestamp = metadata.timestamp ? new Date(metadata.timestamp) : new Date()
    const timestampString = timestamp.toISOString().slice(0, 19).replaceAll(':', '-')
    const filename = deviceName + '_' + timestampString + '.jpg'

    if (file) {
        fs.renameSync(file.path, file.path.replace(file.filename, filename))
    }

    const latestDeviceData = {
        name: deviceName,
        lastImage: filename,
        timestamp,
    }

    if (typeof metadata.temperature === 'number') {
        latestDeviceData.temperature = metadata.temperature
    }

    if (typeof metadata.humidity === 'number') {
        latestDeviceData.humidity = metadata.humidity
    }

    if (metadata.gps && metadata.gps.latitude !== 0 && metadata.gps.longitude !== 0 && metadata.gps.altitude !== null) {
        latestDeviceData.gps = metadata.gps
    }

    if (typeof metadata.detectedPollenCount === 'number') {
        latestDeviceData.detectedPollenCount = metadata.detectedPollenCount
        latestDeviceData.estimatedPollenCount = metadata.detectedPollenCount
        latestDeviceData.detections = metadata.detections
    }

    try {
        await devices.updateOne(
            {
                name: deviceName
            },
            {
                "$set": latestDeviceData,
            },
            {
                upsert: true
            })

        await history.insertOne({
            name: deviceName,
            image: filename,
            timestamp,
            temperature: metadata.temperature,
            humidity: metadata.humidity,
            gps: metadata.gps,
            detections: metadata.detections,
            detectedPollenCount: metadata.detectedPollenCount,
            estimatedPollenCount: metadata.detectedPollenCount,
        })
    }
    catch(err) {
        console.error(err)
        return res.status(500).json({ error: 'Internal server error' })
    }

    res.sendStatus(200)
})

app.get('/images/:filename', (req, res) => {
  const filename = req.params.filename
  const filePath = path.join(uploadsPath, filename)

  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ error: 'File not found' })
    }

    // Serve the file
    res.sendFile(filePath)
  })
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
