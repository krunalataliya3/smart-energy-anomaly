from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, db
import datetime
import numpy as np

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firebase (Requires actual credentials to run)
# cred = credentials.Certificate('firebase_config.json')
# firebase_admin.initialize_app(cred, {
#     'databaseURL': 'https://your-project-id.firebaseio.com/'
# })

class EnergyData(BaseModel):
    device_id: str
    voltage: float
    current: float
    power: float
    timestamp: str = None

# In-memory storage for rolling window
recent_readings = []

def calculate_anomaly(reading: float, window_size: int = 20, threshold_multiplier: float = 2.0) -> bool:
    global recent_readings
    
    # Calculate moving average and z-score
    if len(recent_readings) < window_size:
        recent_readings.append(reading)
        return False
        
    mean = np.mean(recent_readings[-window_size:])
    std_dev = np.std(recent_readings[-window_size:])
    
    # Update sliding window
    recent_readings.append(reading)
    if len(recent_readings) > window_size * 2: # Keep list bounded
        recent_readings.pop(0)
    
    if std_dev == 0:
        return False
        
    # Anomaly condition: value > mean + 2 * std_dev
    if reading > mean + (threshold_multiplier * std_dev):
        return True
        
    return False

@app.post("/api/data")
async def receive_data(data: EnergyData):
    if not data.timestamp:
        data.timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
    is_anomaly = calculate_anomaly(data.power)
    
    # Processed data payload
    processed = data.model_dump()
    processed['is_anomaly'] = is_anomaly
    
    # Store in Firebase (Uncomment below when Firebase config is ready)
    # try:
    #     # Store raw data
    #     db.reference('raw_data').push(data.model_dump())
    #     
    #     # Store processed data
    #     db.reference('processed_data').push(processed)
    #     
    #     # If anomaly, store in anomalies node
    #     if is_anomaly:
    #         db.reference('anomalies').push(processed)
    #         
    # except Exception as e:
    #     print(f"Firebase Error: {e}")
        
    return {"status": "success", "processed_data": processed}

@app.get("/api/status")
async def get_system_status():
    return {"status": "healthy", "uptime": "ok"}
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
