# 🌾 Pollen Website

Welcome to the **Pollen Website**, a real-time IoT dashboard designed to monitor and visualize sensor, power, and GPS data for environmental tracking and analysis. This project is part of the **Pollen Project** and integrates IoT devices, real-time data processing, and a user-friendly interface.

---

## 🚀 Features

### 🌤️ **Sensor Data**
- **Box Temperature & Humidity**: Displays real-time temperature and humidity inside the pollen collection box.
- **Outside Temperature & Humidity**: Monitors environmental conditions outside the box.
- **Historical Data Visualization**:
  - Interactive line charts for temperature and humidity trends.
  - Export historical sensor data to CSV for further analysis.

### ⚡ **Power Data**
- **Solar Voltage & Current**: Tracks solar panel performance in real time.
- **Battery Voltage & Current**: Monitors battery health and performance.
- **Battery Percentage & Time Left**:
  - Calculates remaining battery capacity in percentage.
  - Estimates battery life duration based on current usage.
- **Indicators**:
  - **Charging Status**: Shows whether the battery is charging (`🟢` or `🔴`).
  - **PGood Status**: Indicates power supply health.
- **Historical Data Visualization**:
  - Charts for power-related trends, including voltage and current.
  - Export power data to CSV files.

### 🛰️ **GPS Data**
- **Location Tracking**: Displays latitude, longitude, altitude, and speed in real time.
- **Satellites Connected**: Number of satellites connected for enhanced accuracy.
- **Interactive Map**: Real-time location tracking using Leaflet.js.

---

## 🌐 Live Demo

Access the live version of the dashboard here:
[**Pollen Website**](https://pollen-project.github.io/Pollen_Website/)

---

## 📂 Project Structure

- **`index.html`**: The main HTML structure of the dashboard.
- **`styles.css`**: Custom styles for the interface, including animations and responsive design.
- **`scripts.js`**: Handles real-time updates, MQTT communication, and charting logic.
- **`data.json`**: Example dataset for testing.
- **`Pollen_Logo.png`**: Logo for branding the project.

---

## ⚙️ How It Works

1. **Data Collection**:
   - IoT sensors (DHT22, GPS, Power modules) collect real-time data.
   - Data is sent to an MQTT broker (`mqtt.eclipseprojects.io`).

2. **Data Processing**:
   - JavaScript processes MQTT messages and updates the dashboard dynamically.

3. **Visualization**:
   - **Charts**: Built using Chart.js for sensor, power, and battery data visualization.
   - **Map**: Powered by Leaflet.js for GPS tracking.

4. **Export Options**:
   - Export historical data (sensor, power, battery) to CSV with a single click.

---

## 🛠️ Technologies Used

- **Frontend**:
  - HTML5, CSS3, JavaScript
- **Libraries**:
  - [Leaflet.js](https://leafletjs.com/) - Interactive maps.
  - [Chart.js](https://www.chartjs.org/) - Data visualization.
  - [MQTT.js](https://github.com/mqttjs/MQTT.js) - MQTT client for real-time communication.
  - [GPS.js](https://github.com/infusion/GPS.js) - Parsing GPS data.
- **Hosting**:
  - GitHub Pages

---

## 🚀 Getting Started

Follow these steps to run the website locally:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/pollen-project/Pollen_Website.git
   cd Pollen_Website 

2. **Open in Browser**:
   - Simply open `index.html` in your browser.

3. **Serve Locally (optional)**:
   - Use a simple HTTP server to host the website locally:
     ```bash
     python -m http.server
     ```
   - Access the site at [http://localhost:8000](http://localhost:8000).

---

## 📈 Example Data

Here’s a sample of the JSON data the site processes:

```json
{
    "dht22": [
        {"temperature": 26.4, "humidity": 60.2},
        {"temperature": 27.9, "humidity": 49.8}
    ],
    "gps": {
        "latitude": 55.641491,
        "longitude": 12.080420,
        "altitude": 15.2,
        "speed": 0,
        "satellites_in_view": 8,
        "satellites_connected": 5
    },
    "power": {
        "Vsol": "8.21",
        "Isol": "781",
        "Vbat": "4.12",
        "Ibat": "176",
        "batteryPercentage": "75",
        "timeLeft": "3.50 hours (0.1 days)",
        "isCharging": true,
        "pgood": true
    }
}
```
---

## ✨ Highlights

- **Real-time updates**: The dashboard updates instantly with new data from the MQTT broker.
- **User-friendly design**: Intuitive interface with animations and interactive elements.
- **Data export**: Easily save data for further analysis.
- **Secure**: Enforces HTTPS via GitHub Pages.

---

## 🛡️ License

This project is licensed under the MIT License.

---

## 👩‍💻 Contributors

- **Maurits Puggaard**
- **Botond Horváth**

---

## 📧 Contact

Have questions or suggestions? Feel free to reach out:

- **Email**: student-botond@ruc.dk
- **LinkedIn**: [Botond Horváth](https://www.linkedin.com/in/botond-horvath/)

- **Email**: mvjp@ruc.dk
- **LinkedIn**: [Maurits Puggaard](https://www.linkedin.com/in/maurits-puggaard/)

---

Thank you for visiting the **Pollen Website**! 🌱
