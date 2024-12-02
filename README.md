# 🌾 Pollen Website

Welcome to the **Pollen Website**, a real-time IoT dashboard designed to monitor and display sensor data for environmental and power parameters. This project is part of the **Pollen Project** and showcases the integration of IoT devices, real-time data visualization, and a user-friendly interface.

---

## 🚀 Features

### 🌤️ **Sensor Data**
- **Box Temperature & Humidity**: Displays the temperature and humidity levels inside the pollen collection box.
- **Outside Temperature & Humidity**: Shows environmental temperature and humidity outside the box.
- **Historical Data Visualization**:
  - Interactive graph for temperature and humidity trends.
  - Export historical data to CSV for further analysis.

### ⚡ **Power Data**
- **Solar Voltage & Current**: Real-time monitoring of solar panel performance.
- **Battery Voltage & Current**: Tracks battery health and charging status.
- **Battery Percentage & Time Left**:
  - Calculates remaining battery capacity in percentage.
  - Estimates time left before the battery is depleted.
- **Indicators**:
  - **Charging Status**: Displays if the battery is charging (`🟢` or `🔴`).
  - **PGood Status**: Indicates power supply status.
- **Historical Data Visualization**:
  - Interactive graph for power-related trends (voltage, current, battery percentage).
  - Export historical power data to CSV.

### 🛰️ **GPS Data**
- **Location Tracking**: Displays latitude, longitude, and altitude of the device in real time.
- **Speed**: Tracks the speed of the device.
- **Satellites Connected**: Displays the number of satellites connected to the GPS module.
- **Interactive Map**: A live map showing the current location of the device.

---

## 🌐 Live Demo

You can access the live version of this website at:
[**Pollen Website**](https://pollen-project.github.io/Pollen_Website/)

---

## 📂 Project Structure

- **`index.html`**: The main HTML structure for the website.
- **`styles.css`**: Styling and animations for the user interface.
- **`scripts.js`**: Handles real-time data updates, charts, and MQTT communication.
- **`data.json`**: Example dataset for testing purposes.
- **`Pollen_Logo.png`**: Logo of the Pollen Project.

---

## ⚙️ How It Works

1. **Data Collection**:
   - IoT sensors (DHT22, GPS, Power modules) gather real-time data.
   - Data is sent to the MQTT broker (`mqtt.eclipseprojects.io`).

2. **Data Processing**:
   - Data is parsed and processed using JavaScript.
   - The dashboard dynamically updates with the latest sensor readings.

3. **Visualization**:
   - **Charts**: Powered by Chart.js, the graphs visualize historical trends.
   - **Map**: Powered by Leaflet.js for real-time location tracking.

4. **Export Options**:
   - Export sensor and power data as CSV files with the click of a button.

---

## 🛠️ Technologies Used

- **Frontend**: 
  - HTML5, CSS3, JavaScript (Vanilla)
- **Libraries**:
  - [Leaflet.js](https://leafletjs.com/) - Interactive maps.
  - [Chart.js](https://www.chartjs.org/) - Data visualization.
  - [MQTT.js](https://github.com/mqttjs/MQTT.js) - MQTT client for real-time communication.
  - [GPS.js](https://github.com/infusion/GPS.js) - NMEA parsing for GPS data.
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
    "Vsol": 8.21,
    "Isol": 7.81,
    "Vbat": 16.58,
    "Ibat": 0.76,
    "is_charging": true
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

- **Email**: your-email@example.com
- **LinkedIn**: [Maurits Puggaard](https://www.linkedin.com/in/maurits-puggaard/)

---

Thank you for visiting the **Pollen Website**! 🌱
