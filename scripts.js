// Initialize the map
const map = L.map('map').setView([0, 0], 13);
const marker = L.marker([0, 0]).addTo(map);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

// Include GPS.js
const gps = new GPS();

// Variables to track satellites
let satellitesConnected = 0;

// MQTT client setup and connection
const brokerURL = "wss://mqtt.eclipseprojects.io/mqtt"; // WebSocket URL for the MQTT broker
const topic = "/pollen"; // Topic to subscribe to
const client = mqtt.connect(brokerURL);

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

client.on('message', (topic, message) => {
    console.log(`Received message from topic ${topic}:`, message.toString());
    const data = JSON.parse(message.toString());
    updateDashboard(data); // Update the dashboard
    updateChartData(data); // Update the charts
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
        const nmeaSentences = data.gps.split('\n'); // Split the NMEA string into sentences

        nmeaSentences.forEach(sentence => {
            gps.update(sentence); // Process each sentence

            // Check for satellites connected in GPGGA
            if (sentence.startsWith('$GPGGA')) {
                const parts = sentence.split(',');
                satellitesConnected = parseInt(parts[7], 10) || 0; // Extract satellites connected
            }
        });

        const latitude = gps.state.lat || null;
        const longitude = gps.state.lon || null;
        const altitude = gps.state.alt || '--';
        const speed = gps.state.speed || '--';

        document.getElementById('latitude').textContent = latitude !== null ? latitude.toFixed(6) : '--';
        document.getElementById('longitude').textContent = longitude !== null ? longitude.toFixed(6) : '--';
        document.getElementById('altitude').textContent = altitude !== '--' ? altitude.toFixed(1) : '--';
        document.getElementById('speed').textContent = speed !== '--' ? (speed * 1.852).toFixed(1) : '--';
        document.getElementById('satellites-connected').textContent = satellitesConnected;

        if (latitude !== null && longitude !== null) {
            marker.setLatLng([latitude, longitude]);
            map.setView([latitude, longitude], 13);
        }
    }

    // Update Power Data
    if (data.power) {
        const vsol = (data.power.Vsol / 1000).toFixed(2); // Convert to volts
        const vbat = (data.power.Vbat / 1000).toFixed(2); // Convert to volts
        const isol = data.power.Isol.toFixed(0);
        const ibat = Math.abs(data.power.Ibat); // Ensure current is positive
        const isCharging = data.power.is_charging ? "🟢" : "🔴";
        const pgood = data.power.pgood ? "🟢" : "🔴";

        // Battery percentage calculation
        const Vmax = 4.2; // Maximum battery voltage
        const Vmin = 3.0; // Minimum battery voltage
        const maxCapacity = 2000; // Replace with your battery's capacity in mAh
        let batteryPercentage = ((vbat - Vmin) / (Vmax - Vmin)) * 100;
        batteryPercentage = Math.max(0, Math.min(100, batteryPercentage)); // Clamp between 0 and 100

        // Remaining battery capacity (mAh)
        const remainingCapacity = (maxCapacity * batteryPercentage) / 100;

        // Estimate remaining time (hours)
        let timeLeftHours = remainingCapacity / ibat;
        if (!isFinite(timeLeftHours) || ibat === 0) timeLeftHours = "--"; // Handle division by zero

        // Convert to days
        const timeLeftDays = timeLeftHours !== "--" ? (timeLeftHours / 24).toFixed(1) : "--";

        // Update HTML elements
        document.getElementById('vsol').textContent = vsol;
        document.getElementById('vbat').textContent = vbat;
        document.getElementById('isol').textContent = isol;
        document.getElementById('ibat').textContent = ibat.toFixed(0);
        document.getElementById('isCharging').textContent = isCharging;
        document.getElementById('pgood').textContent = pgood;
        document.getElementById('battery-percentage').textContent = batteryPercentage.toFixed(0);

        // Display time left
        document.getElementById('time-left').textContent = timeLeftHours !== "--" 
            ? `${timeLeftHours.toFixed(1)} hours (${timeLeftDays} days)` 
            : "--";
    }
}

// Initialize Sensor Chart
const ctx = document.getElementById('sensorChart').getContext('2d');
const sensorChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                label: 'Box Temperature (°C)',
                data: [],
                borderColor: 'rgba(86, 204, 242, 1)',
                borderWidth: 2,
                fill: false,
                yAxisID: 'y-temp',
            },
            {
                label: 'Box Humidity (%)',
                data: [],
                borderColor: 'rgba(242, 204, 86, 1)',
                borderWidth: 2,
                fill: false,
                yAxisID: 'y-humidity',
            },
            {
                label: 'Outside Temperature (°C)',
                data: [],
                borderColor: 'rgba(86, 255, 86, 1)',
                borderWidth: 2,
                fill: false,
                yAxisID: 'y-temp',
            },
            {
                label: 'Outside Humidity (%)',
                data: [],
                borderColor: 'rgba(204, 86, 242, 1)',
                borderWidth: 2,
                fill: false,
                yAxisID: 'y-humidity',
            },
        ],
    },
    options: {
        responsive: true,
        plugins: {
            tooltip: {
                enabled: true, // Ensure tooltips are enabled
                mode: 'nearest', // Highlight the nearest data point
                intersect: false, // Show the tooltip even when not directly over a data point
                animation: {
                    duration: 0, // Disable tooltip animation for instant display
                },
            },
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
            'y-temp': {
                type: 'linear',
                position: 'left',
                title: { display: true, text: 'Temperature (°C)', color: '#ffffff' },
                ticks: { color: '#ffffff' },
            },
            'y-humidity': {
                type: 'linear',
                position: 'right',
                title: { display: true, text: 'Humidity (%)', color: '#ffffff' },
                ticks: { color: '#ffffff' },
            },
        },
    },
});

// Initialize Power Chart
const powerCtx = document.getElementById('powerChart').getContext('2d');
const powerChart = new Chart(powerCtx, {
    type: 'line',
    data: {
        labels: [], 
        datasets: [
            {
                label: 'Solar Voltage (V)',
                data: [],
                borderColor: 'rgba(255, 165, 0, 1)',
                borderWidth: 2,
                fill: false,
                yAxisID: 'y-voltage',
            },
            {
                label: 'Solar Current (mA)',
                data: [],
                borderColor: 'rgba(75, 0, 130, 1)',
                borderWidth: 2,
                fill: false,
                yAxisID: 'y-current',
            },
            {
                label: 'Battery Voltage (V)',
                data: [],
                borderColor: 'rgba(255, 69, 0, 1)',
                borderWidth: 2,
                fill: false,
                yAxisID: 'y-voltage',
            },
            {
                label: 'Battery Current (mA)',
                data: [],
                borderColor: 'rgba(148, 0, 211, 1)',
                borderWidth: 2,
                fill: false,
                yAxisID: 'y-current',
            },
            {
                label: 'Battery Percentage (%)',
                data: [], // Dataset for battery percentage
                borderColor: 'rgba(50, 205, 50, 1)',
                borderWidth: 2,
                fill: false,
                yAxisID: 'y-percentage', // Link to the fixed y-axis
            },
            {
                label: 'Is Charging (1 = Yes, 0 = No)',
                data: [],
                borderColor: 'rgba(86, 204, 242, 1)',
                borderWidth: 2,
                fill: false,
                yAxisID: 'y-current',
            },
            {
                label: 'PGood (1 = Yes, 0 = No)',
                data: [],
                borderColor: 'rgba(255, 215, 0, 1)',
                borderWidth: 2,
                fill: false,
                yAxisID: 'y-current',
            },
        ],
    },
    options: {
        responsive: true,
        plugins: {
            tooltip: {
                enabled: true, // Ensure tooltips are enabled
                mode: 'nearest', // Highlight the nearest data point
                intersect: false, // Show the tooltip even when not directly over a data point
                animation: {
                    duration: 0, // Disable tooltip animation for instant display
                },
            },
            legend: {
                position: 'top',
                labels: {
                    font: { size: 14 },
                    color: 'rgba(255, 255, 255, 0.8)',
                },
            },
        },
        scales: {
            x: {
                title: { display: true, text: 'Time', color: '#ffffff' },
                ticks: { color: '#ffffff' },
            },
            'y-voltage': {
                type: 'linear',
                position: 'left',
                title: { display: true, text: 'Voltage (V)', color: '#ffffff' },
                ticks: { color: '#ffffff' },
            },
            'y-current': {
                type: 'linear',
                position: 'right',
                title: { display: true, text: 'Current (mA) & Indicators', color: '#ffffff' },
                ticks: { color: '#ffffff' },
            },
            'y-percentage': {
                type: 'linear',
                position: 'right',
                offset: true, // Adds spacing to avoid overlap
                title: { display: true, text: 'Battery Percentage (%)', color: '#ffffff' },
                ticks: {
                    color: '#ffffff',
                    callback: (value) => `${value}%`, // Show percentage on the axis
                    min: 0, // Fixed minimum value
                    max: 100, // Fixed maximum value
                    stepSize: 10, // Adds regular steps for better readability
                },
                suggestedMin: 0,
                suggestedMax: 100,
            },
        },
    },
});

// Function to update both charts with data
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
        const vsol = data.power.Vsol / 1000;
        const vbat = data.power.Vbat / 1000;
        const isol = data.power.Isol;
        const ibat = data.power.Ibat;

        // Battery percentage calculation
        const Vmax = 4.2;
        const Vmin = 3.0;
        let batteryPercentage = ((vbat - Vmin) / (Vmax - Vmin)) * 100;
        batteryPercentage = Math.max(0, Math.min(100, batteryPercentage)); // Clamp between 0 and 100

        // Add data points to the chart
        powerChart.data.labels.push(now);
        powerChart.data.datasets[0].data.push(vsol);
        powerChart.data.datasets[1].data.push(isol);
        powerChart.data.datasets[2].data.push(vbat);
        powerChart.data.datasets[3].data.push(ibat);
        powerChart.data.datasets[4].data.push(batteryPercentage);
        powerChart.data.datasets[5].data.push(data.power.is_charging ? 1 : 0);
        powerChart.data.datasets[6].data.push(data.power.pgood ? 1 : 0);

        // Remove old data points if the dataset grows too large
        if (powerChart.data.labels.length > 100) {
            powerChart.data.labels.shift();
            powerChart.data.datasets.forEach((dataset) => dataset.data.shift());
        }

        powerChart.update(); // Update the chart with new data
    }
}

// Function to toggle chart visibility
function toggleChart(chartContainerId) {
    const chartContainer = document.getElementById(chartContainerId);
    chartContainer.style.display = chartContainer.style.display === 'none' ? 'block' : 'none';
}

// Function to export sensor data to CSV
function exportSensorData() {
    const csvRows = [];
    const headers = ['Time', 'Box Temperature (°C)', 'Box Humidity (%)', 'Outside Temperature (°C)', 'Outside Humidity (%)'];
    csvRows.push(headers.join(','));

    const dataLength = sensorChart.data.labels.length;
    for (let i = 0; i < dataLength; i++) {
        const row = [
            sensorChart.data.labels[i],
            sensorChart.data.datasets[0].data[i] || '',
            sensorChart.data.datasets[1].data[i] || '',
            sensorChart.data.datasets[2].data[i] || '',
            sensorChart.data.datasets[3].data[i] || '',
        ];
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

// Function to export power data to CSV
function exportPowerData() {
    const csvRows = [];

    // Updated headers to include battery percentage and time left
    const headers = [
        'Time',
        'Solar Voltage (V)',
        'Solar Current (mA)',
        'Battery Voltage (V)',
        'Battery Current (mA)',
        'Battery Percentage (%)',
        'Time Left (hours)',
        'Is Charging (1=Yes 0=No)',
        'PGood (1=Yes 0=No)',
    ];
    csvRows.push(headers.join(',')); // Add headers to the CSV

    const dataLength = powerChart.data.labels.length;

    // Loop through the data and construct rows
    for (let i = 0; i < dataLength; i++) {
        const time = powerChart.data.labels[i];
        const solarVoltage = powerChart.data.datasets[0].data[i]?.toFixed(2) || '';
        const solarCurrent = powerChart.data.datasets[1].data[i]?.toFixed(0) || '';
        const batteryVoltage = powerChart.data.datasets[2].data[i]?.toFixed(2) || '';
        const batteryCurrent = powerChart.data.datasets[3].data[i]?.toFixed(0) || '';
        const batteryPercentage = powerChart.data.datasets[4].data[i]?.toFixed(0) || ''; // Add battery percentage

        // Calculate time left using battery percentage and current
        const batteryCapacity = 2000; // mAh, replace with battery capacity
        const remainingCapacity = (batteryCapacity * batteryPercentage) / 100; // Remaining capacity in mAh
        const batteryCurrentAbs = Math.abs(powerChart.data.datasets[3].data[i] || 0); // Ensure non-negative current
        const timeLeftHours = batteryCurrentAbs > 0 ? (remainingCapacity / batteryCurrentAbs).toFixed(1) : '--';

        const isCharging = powerChart.data.datasets[5].data[i] === 1 ? 1 : 0;
        const pGood = powerChart.data.datasets[6].data[i] === 1 ? 1 : 0;

        // Add row to CSV
        csvRows.push([
            time,
            solarVoltage,
            solarCurrent,
            batteryVoltage,
            batteryCurrent,
            batteryPercentage,
            timeLeftHours,
            isCharging,
            pGood,
        ].join(','));
    }

    // Convert rows to CSV content
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    // Create a temporary link element to download the file
    const link = document.createElement('a');
    link.href = url;
    link.download = 'power_data.csv'; // File name
    link.click();

    // Clean up URL object
    URL.revokeObjectURL(url);
}

// Function to handle chart resizing
function adjustCharts() {
    const width = window.innerWidth;
    const chartContainers = document.querySelectorAll('.chart-container');

    chartContainers.forEach(container => {
        const chartCanvas = container.querySelector('canvas');
        if (chartCanvas) {
            if (width < 768) {
                chartCanvas.style.height = '250px';
            } else {
                chartCanvas.style.height = '300px';
            }
        }
    });
}

// Call adjustCharts on page load and resize
window.addEventListener('load', adjustCharts);
window.addEventListener('resize', adjustCharts);

// Attach the export functions to the buttons
document.getElementById('exportDataButton').addEventListener('click', exportSensorData);
document.getElementById('exportPowerDataButton').addEventListener('click', exportPowerData);