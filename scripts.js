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
    }

    // Update Power Data
    if (data.power) {
        document.getElementById('vsol').textContent = data.power.Vsol?.toFixed(2) || '--';
        document.getElementById('isol').textContent = data.power.Isol?.toFixed(2) || '--';
        document.getElementById('vbat').textContent = data.power.Vbat?.toFixed(2) || '--';
        document.getElementById('ibat').textContent = data.power.Ibat?.toFixed(2) || '--';
        document.getElementById('isCharging').textContent = data.power.is_charging ? "🟢" : "🔴";
    }

    // Update the Chart
    updateChartData(data);
}

// Initialize Chart.js
const ctx = document.getElementById('sensorChart').getContext('2d');
const sensorChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [], // Time labels
        datasets: [
            {
                label: 'Box Temperature (°C)',
                data: [],
                borderColor: 'rgba(86, 204, 242, 1)',
                borderWidth: 2,
                fill: false,
            },
            {
                label: 'Box Humidity (%)',
                data: [],
                borderColor: 'rgba(242, 204, 86, 1)',
                borderWidth: 2,
                fill: false,
            },
            {
                label: 'Outside Temperature (°C)',
                data: [],
                borderColor: 'rgba(86, 255, 86, 1)',
                borderWidth: 2,
                fill: false,
            },
            {
                label: 'Outside Humidity (%)',
                data: [],
                borderColor: 'rgba(204, 86, 242, 1)',
                borderWidth: 2,
                fill: false,
            },
            {
                label: 'Solar Voltage (Vsol)',
                data: [],
                borderColor: 'rgba(255, 165, 0, 1)', // Orange color
                borderWidth: 2,
                fill: false,
            },
            {
                label: 'Solar Current (Isol)',
                data: [],
                borderColor: 'rgba(255, 69, 0, 1)', // Red color
                borderWidth: 2,
                fill: false,
            },
            {
                label: 'Battery Voltage (Vbat)',
                data: [],
                borderColor: 'rgba(75, 0, 130, 1)', // Indigo color
                borderWidth: 2,
                fill: false,
            },
            {
                label: 'Battery Current (Ibat)',
                data: [],
                borderColor: 'rgba(148, 0, 211, 1)', // Violet color
                borderWidth: 2,
                fill: false,
            }
        ],
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    font: {
                        size: 14,
                    },
                    color: 'rgba(255, 255, 255, 0.8)'
                }
            }
        },
        scales: {
            x: {
                title: { display: true, text: 'Time', color: '#ffffff' },
                ticks: { color: '#ffffff' },
            },
            y: {
                title: { display: true, text: 'Values', color: '#ffffff' },
                ticks: { color: '#ffffff' },
            }
        }
    }
});

// Ensure Chart.js dynamically resizes with the card
window.addEventListener('resize', () => {
    sensorChart.resize();
});

// Update Chart with Fetched Data
function updateChartData(data) {
    const now = new Date().toLocaleTimeString();

    // Extract Box, Outside, and Power Data
    const boxTemp = data.dht22[0]?.temperature || null;
    const boxHumidity = data.dht22[0]?.humidity || null;
    const outsideTemp = data.dht22[1]?.temperature || null;
    const outsideHumidity = data.dht22[1]?.humidity || null;
    const vsol = data.power?.Vsol || null;
    const isol = data.power?.Isol || null;
    const vbat = data.power?.Vbat || null;
    const ibat = data.power?.Ibat || null;

    // Update Chart
    sensorChart.data.labels.push(now);
    sensorChart.data.datasets[0].data.push(boxTemp);
    sensorChart.data.datasets[1].data.push(boxHumidity);
    sensorChart.data.datasets[2].data.push(outsideTemp);
    sensorChart.data.datasets[3].data.push(outsideHumidity);
    sensorChart.data.datasets[4].data.push(vsol);
    sensorChart.data.datasets[5].data.push(isol);
    sensorChart.data.datasets[6].data.push(vbat);
    sensorChart.data.datasets[7].data.push(ibat);

    // Keep only the last 10 entries to prevent overcrowding
    if (sensorChart.data.labels.length > 100) {
        sensorChart.data.labels.shift();
        sensorChart.data.datasets.forEach(dataset => dataset.data.shift());
    }

    sensorChart.update();
}

// Function to export data as CSV
function exportData() {
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
    link.download = 'historical_data.csv';
    link.click();

    URL.revokeObjectURL(url);
}

// Attach event listener to the Export Data button
document.getElementById('exportDataButton').addEventListener('click', exportData);

// Fetch initial data and start real-time updates
fetchData();