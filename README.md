# Smart Energy Anomaly Detection System

A complete IoT-based Energy Anomaly Detection system. The system ingests power measurements, detects abnormal usage spikes using moving average and Z-score calculations, and visualizes the data cleanly on a modern web dashboard.

## 📁 Folder Structure

```
smart energy anomaly/
│
├── backend/
│   ├── main.py                # FastAPI Application Code
│   ├── requirements.txt       # Python dependencies
│   └── firebase_config.json   # (Create this file with your Firebase Admin Credentials)
│
├── frontend/
│   ├── index.html             # Dashboard UI
│   ├── style.css              # Custom styling (Dark mode support)
│   └── script.js              # Business logic, Chart.js, mock simulator
│
└── README.md                  # This documentation file
```

## 🛠 Prerequisites

1. Python 3.8+
2. Node.js (Optional, if using a web server like `http-server` to run the frontend)
3. Firebase Project (Realtime Database activated)

## 🚀 Setup Instructions

### 1. Firebase Integration Steps

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project named "SmartEnergyApp".
3. Navigate to **Build > Realtime Database** and create a database. Set the rules to test mode.
4. Navigate to **Project Settings** (Gear icon) > **Service Accounts**.
5. Click **Generate new private key**. this will download a JSON file.
6. Rename the downloaded file to `firebase_config.json` and place it inside the `/backend` folder.
7. Note down your `<databaseURL>` from the Realtime Database page and update it in `backend/main.py`.

#### Firebase JSON Structure Design
Once data flows, Firebase will structure it automatically as follows:
```json
{
  "raw_data": {
    "push_id_1": { "device_id": "ESP32_01", "voltage": 220, "current": 0.45, "power": 100, "timestamp": "..." }
  },
  "processed_data": {
    "push_id_1": { "device_id": "ESP32_01", "power": 100, "is_anomaly": false, "timestamp": "..." }
  },
  "anomalies": {
    "push_id_2": { "device_id": "ESP32_01", "power": 450, "is_anomaly": true, "timestamp": "..." }
  },
  "daily_summary": {
    "2023-10-15": { "total_kwh": 5.2, "anomaly_count": 3 }
  }
}
```

### 2. Backend Setup

1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a Virtual Environment (Optional but recommended):
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Mac/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the API Server:
   ```bash
   uvicorn main:app --reload
   ```
   The backend API will run at `http://localhost:8000`.

### 3. Frontend Setup

1. Simply open `/frontend/index.html` in your web browser. 
2. Ensure you have internet access to fetch Chart.js and FontAwesome CDNs.
3. The dashboard has a simulated device feeding data directly into the UI. **Password is `admin123`**.
   *(Note: To connect the frontend exactly to the backend, uncomment the `fetch()` block in `script.js` inside the `simulateDataInput()` function, and comment out the mock logic beneath it.)*

## 🌟 Features Included

* **Dashboard**: Uses Chart.js for real-time live data visualization. Built-in light/dark theme toggler.
* **Math & Logic**: FastAPI calculates the rolling mean (window of 20) and flags an anomaly if the current value is `> mean + (2 * std_dev)`.
* **Export CSV**: Users can export the simulated/real datasets as a clean CSV file directly from the browser.
* **Auth**: Simple login modal integration.

## 📝 Moving Forward to Real Hardware

When programming your ESP32, use the `WiFi.h` and `HTTPClient.h` libraries to make a POST request carrying a JSON payload (`{ "device_id":"...", "voltage": ..., "current": ..., "power":... }`) straight to your Python FastAPI backend endpoint: `http://<YOUR_COMPUTER_IP>:8000/api/data`.

