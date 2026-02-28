// Simple Auth
function login() {
    const pwd = document.getElementById('password').value;
    if (pwd === 'admin123') { // Simple placeholder auth
        document.getElementById('login-modal').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        initDashboard();
    } else {
        alert('Incorrect Password! Try "admin123"');
    }
}

// Theme Toggle
function toggleTheme() {
    if (document.getElementById('checkbox').checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
        chart.options.scales.x.grid.color = '#414868';
        chart.options.scales.y.grid.color = '#414868';
    } else {
        document.documentElement.removeAttribute('data-theme');
        chart.options.scales.x.grid.color = '#e2e8f0';
        chart.options.scales.y.grid.color = '#e2e8f0';
    }
    chart.update();
}

// Global Variables
let chart;
let energyData = [];
let anomalyCount = 0;
let dailyTotalkWh = 0;
const COST_PER_KWH = 0.15; // Assume $0.15 per kWh

function initDashboard() {
    const ctx = document.getElementById('energyChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Power Consumption (W)',
                data: [],
                borderColor: '#4361ee',
                borderWidth: 2,
                tension: 0.4,
                pointBackgroundColor: [],
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true }
            },
            animation: {
                duration: 0
            }
        }
    });

    // Start simulation since we don't have a real device hooked up
    setInterval(simulateDataInput, 2000);
}

function updateDashboard(data) {
    const now = new Date().toLocaleTimeString();
    
    // Update Chart
    if (chart.data.labels.length > 20) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
        chart.data.datasets[0].pointBackgroundColor.shift();
    }

    chart.data.labels.push(now);
    chart.data.datasets[0].data.push(data.power);
    
    if (data.is_anomaly) {
        chart.data.datasets[0].pointBackgroundColor.push('#ef233c');
        anomalyCount++;
        document.getElementById('anomaly-count').innerText = anomalyCount;
        addAlert(`Power spike detected: ${data.power.toFixed(2)} W`, now);
    } else {
        chart.data.datasets[0].pointBackgroundColor.push('#4361ee');
    }
    chart.update();

    // Update Stats
    document.getElementById('current-power').innerText = `${data.power.toFixed(2)} W`;
    
    // Simulate integration for daily total (Power * Time)
    dailyTotalkWh += (data.power / 1000) * (2/3600); // 2 seconds in hours
    document.getElementById('daily-total').innerText = `${dailyTotalkWh.toFixed(4)} kWh`;
    
    // Estimate Bill
    const monthlyBill = dailyTotalkWh * 30 * COST_PER_KWH;
    document.getElementById('monthly-bill').innerText = `$${monthlyBill.toFixed(2)}`;
    
    // Save for export
    energyData.push({...data, time: now});
}

function addAlert(message, time) {
    const list = document.getElementById('alerts-list');
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert-item';
    alertDiv.innerHTML = `
        <span class="anomaly-val"><i class="fas fa-exclamation-circle"></i> ${message}</span>
        <span class="alert-time">${time}</span>
    `;
    list.prepend(alertDiv);
    if(list.children.length > 5) {
        list.removeChild(list.lastChild);
    }
}

function exportCSV() {
    if (energyData.length === 0) return alert('No data to export!');
    
    const headers = ['Time', 'Device_ID', 'Voltage', 'Current', 'Power', 'Is_Anomaly'];
    const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n"
        + energyData.map(e => `${e.time},${e.device_id},${e.voltage},${e.current},${e.power},${e.is_anomaly}`).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "energy_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// MOCK DATA GENERATOR (Simulating Backend Integration)
// In production, this would use fetch() to hit the FastAPI backend
let mockReadings = [];
function simulateDataInput() {
    // Simulate base load of 100W with some noise
    let power = 100 + (Math.random() * 20 - 10);
    
    // Introduce random spike (anomaly) 5% of the time
    if (Math.random() < 0.05) {
        power = power * (2 + Math.random());
    }

    const payload = {
        device_id: 'ESP32_01',
        voltage: 220,
        current: power / 220,
        power: power
    };

    // In a real app we'd POST to backend:
    /*
    fetch('http://localhost:8000/api/data', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    }).then(res => res.json()).then(res => updateDashboard(res.processed_data));
    */

   // For immediate frontend demo functionality, we simulate the backend logic here:
   mockReadings.push(power);
   let is_anomaly = false;
   if(mockReadings.length >= 20) {
       let window = mockReadings.slice(-20);
       let mean = window.reduce((a,b) => a+b, 0) / 20;
       let stdDev = Math.sqrt(window.map(x => Math.pow(x - mean, 2)).reduce((a,b) => a+b,0) / 20);
       if (power > mean + (2 * stdDev)) is_anomaly = true;
   }

   updateDashboard({
       ...payload,
       is_anomaly
   });
}
