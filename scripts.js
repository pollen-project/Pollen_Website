// Initialize the map
const map = L.map('map').setView([0, 0], 13);
const marker = L.marker([0, 0]).addTo(map);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

// MQTT client setup
const brokerURL = "ws://mqtt.eclipseprojects.io/mqtt"; // WebSocket URL for the MQTT broker
const topic = "/pollen"; // Topic to subscribe to

// Connect to the MQTT broker
const client = mqtt.connect(brokerURL);

// Handle connection success
client.on('connect', () => {
    console.log("Connected to MQTT broker");
    client.subscribe(topic, (err) => {
        if (err) {
            console.error("Failed to subscribe to topic:", err);
        } else {
            console.log(`Subscribed to topic: ${topic}`);
        }
    });
});

// Handle incoming messages
client.on('message', (topic, message) => {
    console.log(`Received message from topic ${topic}:`, message.toString());
    const data = JSON.parse(message.toString()); // Assuming the data is sent in JSON format
    updateDashboard(data); // Update the dashboard with the received data
    updateChartData(data); // Update the charts with the received data
});

// Function to update the dashboard
function updateDashboard(data) {
    // Update Sensor Data
    if (data.dht22) {
        document.getElementById('temp1').textContent = data.dht22[0]?.temperature?.toFixed(1) || '--';
        document.getElementById('humidity1').textContent = data.dht22[0]?.humidity?.toFixed(1) || '--';
        document.getElementById('temp2').textContent = data.dht22[1]?.temperature?.toFixed(1) || '--';
        document.getElementById('humidity2').textContent = data.dht22[1]?.humidity?.toFixed(1) || '--';
    }

    // Update GPS Data
    if (data.gps) {
        const { latitude, longitude, altitude, speed, satellites_in_view, satellites_connected } = data.gps;
        document.getElementById('latitude').textContent = latitude?.toFixed(6) || '--';
        document.getElementById('longitude').textContent = longitude?.toFixed(6) || '--';
        document.getElementById('altitude').textContent = altitude?.toFixed(1) || '--';
        document.getElementById('speed').textContent = speed?.toFixed(1) || '--';
        document.getElementById('satellites-view').textContent = satellites_in_view || '--';
        document.getElementById('satellites-connected').textContent = satellites_connected || '--';

        // Update the map
        marker.setLatLng([latitude, longitude]);
        map.setView([latitude, longitude], 13);
    }

    // Update Power Data
    if (data.power) {
        // Convert milliVolts to Volts
        const vsol = (data.power.Vsol / 1000).toFixed(2); // Convert to Volts
        const vbat = (data.power.Vbat / 1000).toFixed(2); // Convert to Volts
        const isol = (data.power.Isol).toFixed(0);
        const ibat = (data.power.Ibat).toFixed(0); 

        // Update HTML elements
        document.getElementById('vsol').textContent = vsol;
        document.getElementById('vbat').textContent = vbat;
        document.getElementById('isol').textContent = isol;
        document.getElementById('ibat').textContent = ibat;
        document.getElementById('isCharging').textContent = data.power.is_charging ? "🟢" : "🔴";
    }
}

// Initialize Sensor Chart.js
const ctx = document.getElementById('sensorChart').getContext('2d');
const sensorChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [], // Time labels
        datasets: [
            {
                label: 'Box Temperature (°C)',
                data: [],
                borderColor: 'rgba(86, 204, 242, 1)', // Blue
                borderWidth: 2,
                fill: false,
                yAxisID: 'y-temp', // Bind this dataset to the temperature axis
            },
            {
                label: 'Box Humidity (%)',
                data: [],
                borderColor: 'rgba(242, 204, 86, 1)', // Yellow
                borderWidth: 2,
                fill: false,
                yAxisID: 'y-humidity', // Bind this dataset to the humidity axis
            },
            {
                label: 'Outside Temperature (°C)',
                data: [],
                borderColor: 'rgba(86, 255, 86, 1)', // Green
                borderWidth: 2,
                fill: false,
                yAxisID: 'y-temp', // Bind this dataset to the temperature axis
            },
            {
                label: 'Outside Humidity (%)',
                data: [],
                borderColor: 'rgba(204, 86, 242, 1)', // Purple
                borderWidth: 2,
                fill: false,
                yAxisID: 'y-humidity', // Bind this dataset to the humidity axis
            },
        ],
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: { font: { size: 14 }, color: 'rgba(255, 255, 255, 0.8)' },
            },
        },
        scales: {
            x: {
                title: { display: true, text: 'Time', color: '#ffffff' },
                ticks: { color: '#ffffff' },
            },
            y: { // Default Y-axis (disable it)
                display: false, // Completely hide the default Y-axis
            },
            'y-temp': { // Temperature Y-axis
                type: 'linear',
                position: 'left',
                title: { display: true, text: 'Temperature (°C)', color: '#ffffff' },
                ticks: { color: '#ffffff' },
                grid: {
                    drawOnChartArea: true, // Enable gridlines for temperature
                },
            },
            'y-humidity': { // Humidity Y-axis
                type: 'linear',
                position: 'right',
                title: { display: true, text: 'Humidity (%)', color: '#ffffff' },
                ticks: { color: '#ffffff' },
                grid: {
                    drawOnChartArea: false, // Disable gridlines for humidity
                },
            },
        },
    },
});

// Initialize Power Chart
const powerCtx = document.getElementById('powerChart').getContext('2d');
const powerChart = new Chart(powerCtx, {
    type: 'line',
    data: {
        labels: [], // Time labels
        datasets: [
            {
                label: 'Solar Voltage (V)',
                data: [],
                borderColor: 'rgba(255, 165, 0, 1)', // Orange
                borderWidth: 2,
                fill: false,
                yAxisID: 'y-voltage', // Bind this dataset to the voltage axis
            },
            {
                label: 'Battery Voltage (V)',
                data: [],
                borderColor: 'rgba(75, 0, 130, 1)', // Indigo
                borderWidth: 2,
                fill: false,
                yAxisID: 'y-voltage', // Bind this dataset to the voltage axis
            },
            {
                label: 'Solar Current (mA)',
                data: [],
                borderColor: 'rgba(255, 69, 0, 1)', // Red
                borderWidth: 2,
                fill: false,
                yAxisID: 'y-current', // Bind this dataset to the current axis
            },
            {
                label: 'Battery Current (mA)',
                data: [],
                borderColor: 'rgba(148, 0, 211, 1)', // Violet
                borderWidth: 2,
                fill: false,
                yAxisID: 'y-current', // Bind this dataset to the current axis
            },
            {
                label: 'Is Charging (1 = Yes, 0 = No)',
                data: [],
                borderColor: 'rgba(86, 204, 242, 1)', // Blue
                borderWidth: 2,
                fill: false,
                pointStyle: 'circle',
                pointRadius: 3,
                yAxisID: 'y-current', // Bind this dataset to the current axis
            },
        ],
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: { font: { size: 14 }, color: 'rgba(255, 255, 255, 0.8)' },
            },
        },
        scales: {
            x: {
                title: { display: true, text: 'Time', color: '#ffffff' },
                ticks: { color: '#ffffff' },
            },
            y: { // Default Y-axis (disable it)
                display: false, // Completely hide the default Y-axis
            },
            'y-voltage': { // Voltage Y-axis
                type: 'linear',
                position: 'left',
                title: { display: true, text: 'Voltage (V)', color: '#ffffff' },
                ticks: { color: '#ffffff' },
                grid: {
                    drawOnChartArea: true, // Enable gridlines for voltage
                },
            },
            'y-current': { // Current and Is Charging Y-axis
                type: 'linear',
                position: 'right',
                title: { display: true, text: 'Current (mA) & Is Charging (0/1)', color: '#ffffff' },
                ticks: { color: '#ffffff' },
                grid: {
                    drawOnChartArea: false, // Disable gridlines for current
                },
            },
        },
    },
});

// Update Chart with Fetched Data
function updateChartData(data) {
    const now = new Date().toLocaleTimeString();

    // Update Sensor Chart
    if (data.dht22) {
        const boxTemp = data.dht22[0]?.temperature || null;
        const boxHumidity = data.dht22[0]?.humidity || null;
        const outsideTemp = data.dht22[1]?.temperature || null;
        const outsideHumidity = data.dht22[1]?.humidity || null;

        sensorChart.data.labels.push(now);
        sensorChart.data.datasets[0].data.push(boxTemp);
        sensorChart.data.datasets[1].data.push(boxHumidity);
        sensorChart.data.datasets[2].data.push(outsideTemp);
        sensorChart.data.datasets[3].data.push(outsideHumidity);

        if (sensorChart.data.labels.length > 100) {
            sensorChart.data.labels.shift();
            sensorChart.data.datasets.forEach(dataset => dataset.data.shift());
        }

        sensorChart.update();
    }

    // Update Power Chart
    if (data.power) {
        const vsol = data.power?.Vsol / 1000; // Convert to Volts
        const vbat = data.power?.Vbat / 1000; // Convert to Volts
        const isol = data.power?.Isol; 
        const ibat = data.power?.Ibat; 
        const isCharging = data.power?.is_charging ? 1 : 0;

        powerChart.data.labels.push(now);
        powerChart.data.datasets[0].data.push(vsol);
        powerChart.data.datasets[1].data.push(isol);
        powerChart.data.datasets[2].data.push(vbat);
        powerChart.data.datasets[3].data.push(ibat);
        powerChart.data.datasets[4].data.push(isCharging);

        if (powerChart.data.labels.length > 100) {
            powerChart.data.labels.shift();
            powerChart.data.datasets.forEach(dataset => dataset.data.shift());
        }

        powerChart.update();
    }
}

// Function to export sensor data as CSV
function exportSensorData() {
    const csvRows = [];
    const headers = ['Time', ...sensorChart.data.datasets.map(dataset => dataset.label)];
    csvRows.push(headers.join(','));

    const dataLength = sensorChart.data.labels.length;
    for (let i = 0; i < dataLength; i++) {
        const row = [sensorChart.data.labels[i]];
        sensorChart.data.datasets.forEach(dataset => {
            row.push(dataset.data[i]);
        });
        csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'sensor_data.csv';
    link.click();

    URL.revokeObjectURL(url);
}

// Attach the export function to the Sensor Data button
document.getElementById('exportDataButton').addEventListener('click', exportSensorData);

// Function to export power data as CSV
function exportPowerData() {
    const csvRows = [];
    const headers = ['Time', 'Solar Voltage (V)', 'Solar Current (mA)', 'Battery Voltage (V)', 'Battery Current (mA)', 'Is Charging (1=Yes, 0=No)'];
    csvRows.push(headers.join(','));

    const dataLength = powerChart.data.labels.length;
    for (let i = 0; i < dataLength; i++) {
        const row = [
            powerChart.data.labels[i],
            (powerChart.data.datasets[0].data[i] || 0).toFixed(2), // Solar Voltage in Volts
            (powerChart.data.datasets[1].data[i] || 0).toFixed(0), // Solar Current in mA
            (powerChart.data.datasets[2].data[i] || 0).toFixed(2), // Battery Voltage in Volts
            (powerChart.data.datasets[3].data[i] || 0).toFixed(0), // Battery Current in mA
            powerChart.data.datasets[4].data[i], // Is Charging (binary)
        ];
        csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'power_data.csv';
    link.click();

    URL.revokeObjectURL(url);
}

// Attach the export function to the Power Data button
document.getElementById('exportPowerDataButton').addEventListener('click', exportPowerData);