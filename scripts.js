// ======================
// Map Initialization
// ======================
const map = L.map('map').setView([0, 0], 13);
const marker = L.marker([0, 0]).addTo(map);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

// ======================
// GPS Setup
// ======================
const gps = new GPS();
let satellitesConnected = 0; // Track connected satellites

// ======================
// MQTT Client Setup
// ======================
const brokerURL = "wss://mqtt.eclipseprojects.io/mqtt";
const topic = "/pollen";
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
    const data = JSON.parse(message.toString());
    console.log(`Received data:`, data);
    updateDashboard(data);
    updateChartData(data);
});

// ======================
// Dashboard Update
// ======================
function updateDashboard(data) {
    // Update sensor data
    if (data.dht22) {
        document.getElementById('temp1').textContent = data.dht22[0]?.temperature?.toFixed(1) || '--';
        document.getElementById('humidity1').textContent = data.dht22[0]?.humidity?.toFixed(1) || '--';
        document.getElementById('temp2').textContent = data.dht22[1]?.temperature?.toFixed(1) || '--';
        document.getElementById('humidity2').textContent = data.dht22[1]?.humidity?.toFixed(1) || '--';
    }

    // Update GPS data
    if (data.gps) {
        const nmeaSentences = data.gps.split('\n');
        nmeaSentences.forEach(sentence => gps.update(sentence));
        const latitude = gps.state.lat || null;
        const longitude = gps.state.lon || null;
        document.getElementById('latitude').textContent = latitude ? latitude.toFixed(6) : '--';
        document.getElementById('longitude').textContent = longitude ? longitude.toFixed(6) : '--';
        if (latitude && longitude) {
            marker.setLatLng([latitude, longitude]);
            map.setView([latitude, longitude], 13);
        }
    }

    // Update power and battery data
    if (data.power) {
        const Vsol = (data.power.Vsol / 1000).toFixed(2) || '--'; // Solar Voltage in volts
        const Isol = data.power.Isol?.toFixed(0) || '--'; // Solar Current in mA
        const Vbat = data.power.Vbat / 1000; // Battery Voltage in volts
        const Ibat = data.power.Ibat || 0; // Battery Current in mA
    
        // Update power data card
        document.getElementById('vsol').textContent = Vsol;
        document.getElementById('isol').textContent = Isol;
        document.getElementById('vbat').textContent = Vbat.toFixed(2) || '--';
        document.getElementById('ibat').textContent = Ibat.toFixed(0) || '--'; // Display in mA
    
        // Battery parameters (adjust if multiple cells in series)
        const batteryCapacity = 1800; // Battery capacity in mAh (single cell)
        const minVoltage = 3.0; // Minimum battery voltage (single cell)
        const maxVoltage = 4.2; // Maximum battery voltage (single cell)
    
        // Calculate battery percentage
        const batteryPercentage = Math.max(
            0,
            Math.min(100, ((Vbat - minVoltage) / (maxVoltage - minVoltage)) * 100)
        ).toFixed(0);
    
        // Calculate remaining capacity in mAh
        const remainingCapacity = (batteryPercentage / 100) * batteryCapacity;
    
        // Calculate time left, even when charging
        let timeLeft = '--';
        if (Ibat !== 0) {
            // Convert Ibat from mA to A for calculations
            const adjustedIbat = Math.abs(Ibat / 1000); // Ensure positive current in A
            if (adjustedIbat > 0) {
                const hoursLeft = (remainingCapacity / (adjustedIbat * 1000)).toFixed(2); // Convert Ah to mAh
                const daysLeft = (hoursLeft / 24).toFixed(1); // Days
                timeLeft = `${hoursLeft} hours (${daysLeft} days)`;
            }
        }
    
        // Update DOM elements
        document.getElementById('battery-percentage').textContent = batteryPercentage || '--';
        document.getElementById('time-left').textContent = timeLeft;
        document.getElementById('isCharging').textContent = data.power.is_charging ? "🟢" : "🔴";
        document.getElementById('pgood').textContent = data.power.pgood ? "🟢" : "🔴";
    
        // Debugging logs
        console.log(`Battery Percentage: ${batteryPercentage}%`);
        console.log(`Remaining Capacity: ${remainingCapacity} mAh`);
        console.log(`Current (Ibat): ${Ibat} mA`);
        console.log(`Converted Current (Ibat in A): ${(Ibat / 1000).toFixed(4)} A`);
        console.log(`Time Left: ${timeLeft}`);
    }
}

// ======================
// Chart Initialization
// ======================
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
                enabled: true,
                mode: 'nearest',
                intersect: false,
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

// ======================
// Power Chart Initialization
// ======================
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
        ],
    },
    options: {
        responsive: true,
        plugins: {
            tooltip: {
                enabled: true,
                mode: 'nearest',
                intersect: false,
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
                title: { display: true, text: 'Current (mA)', color: '#ffffff' },
                ticks: { color: '#ffffff' },
            },
        },
    },
});

// ======================
// Battery Chart Initialization
// ======================
const batteryCtx = document.getElementById('batteryChart').getContext('2d');
const batteryChart = new Chart(batteryCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                label: 'Battery Percentage (%)',
                data: [],
                borderColor: 'rgba(50, 205, 50, 1)',
                borderWidth: 2,
                fill: false,
                yAxisID: 'y-percentage',
            },
            {
                label: 'Is Charging (1 = Yes, 0 = No)',
                data: [],
                borderColor: 'rgba(86, 204, 242, 1)',
                borderWidth: 2,
                fill: false,
                yAxisID: 'y-binary',
            },
            {
                label: 'PGood (1 = Yes, 0 = No)',
                data: [],
                borderColor: 'rgba(255, 215, 0, 1)',
                borderWidth: 2,
                fill: false,
                yAxisID: 'y-binary',
            },
        ],
    },
    options: {
        responsive: true,
        plugins: {
            tooltip: {
                enabled: true,
                mode: 'nearest',
                intersect: false,
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
            'y-percentage': {
                type: 'linear',
                position: 'left',
                title: { display: true, text: 'Percentage (%)', color: '#ffffff' },
                ticks: { color: '#ffffff' },
                min: 0,
                max: 100,
            },
            'y-binary': {
                type: 'linear',
                position: 'right',
                title: { display: true, text: 'Binary Indicators', color: '#ffffff' },
                ticks: { color: '#ffffff', stepSize: 1 },
                min: 0,
                max: 1,
            },
        },
    },
});

// ======================
// Chart Data Update
// ======================
function updateChartData(data) {
    const now = new Date().toLocaleTimeString();

    // Update Sensor Chart
    if (data.dht22) {
        sensorChart.data.labels.push(now);
        sensorChart.data.datasets[0].data.push(data.dht22[0]?.temperature || null);
        sensorChart.data.datasets[1].data.push(data.dht22[0]?.humidity || null);
        sensorChart.data.datasets[2].data.push(data.dht22[1]?.temperature || null);
        sensorChart.data.datasets[3].data.push(data.dht22[1]?.humidity || null);

        if (sensorChart.data.labels.length > 100) {
            sensorChart.data.labels.shift();
            sensorChart.data.datasets.forEach(dataset => dataset.data.shift());
        }

        sensorChart.update();
    }

    // Update Power Chart
    if (data.power) {
        powerChart.data.labels.push(now);
        powerChart.data.datasets[0].data.push(data.power.Vsol / 1000);
        powerChart.data.datasets[1].data.push(data.power.Isol);
        powerChart.data.datasets[2].data.push(data.power.Vbat / 1000);
        powerChart.data.datasets[3].data.push(data.power.Ibat);

        if (powerChart.data.labels.length > 100) {
            powerChart.data.labels.shift();
            powerChart.data.datasets.forEach(dataset => dataset.data.shift());
        }

        powerChart.update();
    }

    // Update Battery Chart
    if (data.power) {
        const vbat = data.power.Vbat / 1000;
        const isCharging = data.power.is_charging ? 1 : 0; // Binary value
        const pgood = data.power.pgood ? 1 : 0; // Binary value
        const batteryPercentage = Math.max(0, Math.min(100, ((vbat - 3) / (4.2 - 3)) * 100));

        // Add to battery chart
        batteryChart.data.labels.push(now);
        batteryChart.data.datasets[0].data.push(batteryPercentage);
        batteryChart.data.datasets[1].data.push(isCharging); // Ensure 1/0 value is pushed
        batteryChart.data.datasets[2].data.push(pgood); // Ensure 1/0 value is pushed

        if (batteryChart.data.labels.length > 100) {
            batteryChart.data.labels.shift();
            batteryChart.data.datasets.forEach(dataset => dataset.data.shift());
        }

        batteryChart.update();
    }
}
// ======================
// Export to CSV
// ======================
function exportSensorData() {
    const csvRows = [];
    const headers = ['Time', 'Box Temperature (°C)', 'Box Humidity (%)', 'Outside Temperature (°C)', 'Outside Humidity (%)'];
    csvRows.push(headers.join(','));

    sensorChart.data.labels.forEach((label, i) => {
        const row = [
            label,
            sensorChart.data.datasets[0].data[i] || '',
            sensorChart.data.datasets[1].data[i] || '',
            sensorChart.data.datasets[2].data[i] || '',
            sensorChart.data.datasets[3].data[i] || '',
        ];
        csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sensor_data.csv';
    link.click();
}

function exportPowerData() {
    const csvRows = [];
    const headers = ['Time', 'Solar Voltage (V)', 'Solar Current (mA)', 'Battery Voltage (V)', 'Battery Current (mA)', 'Battery Percentage (%)', 'Is Charging', 'PGood'];
    csvRows.push(headers.join(','));

    powerChart.data.labels.forEach((label, i) => {
        const row = [
            label,
            powerChart.data.datasets[0].data[i]?.toFixed(2) || '',
            powerChart.data.datasets[1].data[i]?.toFixed(0) || '',
            powerChart.data.datasets[2].data[i]?.toFixed(2) || '',
            powerChart.data.datasets[3].data[i]?.toFixed(0) || '',
            batteryChart.data.datasets[0].data[i]?.toFixed(0) || '',
            batteryChart.data.datasets[1].data[i],
            batteryChart.data.datasets[2].data[i],
        ];
        csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'power_data.csv';
    link.click();
}

function exportBatteryData() {
    const csvRows = [];
    const headers = ['Time', 'Battery Percentage (%)', 'Is Charging', 'PGood'];
    csvRows.push(headers.join(',')); // Add header row

    // Loop through chart data to generate CSV rows
    batteryChart.data.labels.forEach((label, i) => {
        const row = [
            label,
            batteryChart.data.datasets[0].data[i]?.toFixed(0) || '--', // Battery Percentage
            batteryChart.data.datasets[1].data[i] || '0', // Is Charging (1/0)
            batteryChart.data.datasets[2].data[i] || '0', // PGood (1/0)
        ];
        csvRows.push(row.join(',')); // Add row to CSV
    });

    // Create and download the CSV file
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'battery_data.csv';
    link.click();
}

// ======================
// Toggle Chart Visibility
// ======================
function toggleChart(chartContainerId) {
    const chartContainer = document.getElementById(chartContainerId);
    if (chartContainer) {
        // Toggle visibility
        if (chartContainer.style.display === 'none') {
            chartContainer.style.display = 'block';
        } else {
            chartContainer.style.display = 'none';
        }
    } else {
        console.error(`Chart container with id "${chartContainerId}" not found.`);
    }
}

function toggleChartWithResize(chartContainerId) {
    const chartContainer = document.getElementById(chartContainerId);
    if (chartContainer) {
        if (chartContainer.style.display === 'none') {
            chartContainer.style.display = 'block';
        } else {
            chartContainer.style.display = 'none';
        }

        // Resize the chart after toggling visibility
        if (chartContainerId === 'sensorChartContainer' && sensorChart) {
            sensorChart.resize();
        } else if (chartContainerId === 'powerChartContainer' && powerChart) {
            powerChart.resize();
        } else if (chartContainerId === 'batteryChartContainer' && batteryChart) {
            batteryChart.resize();
        }
    } else {
        console.error(`Chart container with id "${chartContainerId}" not found.`);
    }
}

// ======================
// Attach Events to Buttons
// ======================
document.getElementById('exportDataButton').addEventListener('click', exportSensorData);
document.getElementById('exportPowerDataButton').addEventListener('click', exportPowerData);
document.getElementById('exportBatteryDataButton').addEventListener('click', exportBatteryData);

// Add toggle button handlers
document.getElementById('toggleSensorChart').addEventListener('click', () => toggleChartWithResize('sensorChartContainer'));
document.getElementById('togglePowerChart').addEventListener('click', () => toggleChartWithResize('powerChartContainer'));
document.getElementById('toggleBatteryChart').addEventListener('click', () => toggleChartWithResize('batteryChartContainer'));