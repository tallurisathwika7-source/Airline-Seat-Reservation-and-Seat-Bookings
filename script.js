let currentLang = 'en';
const passengerId = 1; // Change later with login

// Translation
function t(key) {
    fetch(`../backend/admin.php?action=get_translation&lang=${currentLang}&key=${key}`)
        .then(r => r.json())
        .then(data => {
            const els = document.querySelectorAll(`[data-key="${key}"]`);
            els.forEach(el => el.textContent = data.value);
        });
}

// Load translations
document.getElementById('lang').addEventListener('change', (e) => {
    currentLang = e.target.value;
    ['welcome', 'flight_status', 'seat_map'].forEach(t);
});

// Flight Status Real-Time
function loadFlights() {
    fetch('../backend/flights.php?action=get_flights')
        .then(r => r.json())
        .then(flights => {
            const list = document.getElementById('flights-list');
            list.innerHTML = flights.map(f => `
                <div><strong>${f.flight_number}</strong>: ${f.departure_city} → ${f.arrival_city} 
                | Gate: ${f.gate} | Status: <strong>${f.status}</strong> 
                ${f.delay_minutes > 0 ? `| Delay: ${f.delay_minutes} min` : ''}</div>
            `).join('');
        });
}
setInterval(loadFlights, 8000);
loadFlights();

// Seat Map
let selectedSeat = null;
function loadSeats() {
    fetch('../backend/flights.php?action=get_seats&flight_id=1')
        .then(r => r.json())
        .then(seats => {
            const grid = document.getElementById('seat-map');
            grid.innerHTML = '';
            seats.forEach(s => {
                const div = document.createElement('div');
                div.className = `seat ${s.seat_type.toLowerCase()} ${s.is_occupied ? 'occupied' : ''}`;
                div.textContent = s.seat_number;
                if (!s.is_occupied) {
                    div.onclick = () => {
                        if (selectedSeat) selectedSeat.classList.remove('selected');
                        div.classList.add('selected');
                        selectedSeat = s.seat_number;
                    };
                }
                grid.appendChild(div);
            });
        });
}
loadSeats();

document.getElementById('reserve-btn').onclick = () => {
    if (!selectedSeat) return alert("Please select a seat");
    fetch('../backend/flights.php?action=reserve_seat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `flight_id=1&seat=${selectedSeat}&passenger_id=${passengerId}`
    }).then(() => {
        alert("Seat reserved!");
        loadSeats();
    });
};

// QR Scanner
let video = document.getElementById('video');
let scanning = false;

function startScanner() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => {
            video.srcObject = stream;
            video.style.display = 'block';
            video.play();
            scanning = true;
            requestAnimationFrame(tick);
        });
}

function tick() {
    if (!scanning) return;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, canvas.width, canvas.height);
        if (code) {
            scanning = false;
            video.srcObject.getTracks().forEach(t => t.stop());
            video.style.display = 'none';
            fetchPassenger(code.data);
        }
    }
    requestAnimationFrame(tick);
}

function fetchPassenger(ref) {
    fetch(`../backend/admin.php?action=get_passenger_by_booking&ref=${ref}`)
        .then(r => r.json())
        .then(p => {
            if (p.error) {
                document.getElementById('passenger-info').innerHTML = `<p>Passenger not found: ${ref}</p>`;
                return;
            }
            document.getElementById('passenger-info').innerHTML = `
                <h3>${p.name} - ${p.booking_reference}</h3>
                <p>Flight: ${p.flight_number} | Seat: ${p.seat || 'Not assigned'}</p>
                <p>Status: ${p.checked_in ? 'Checked In' : p.no_show ? 'No Show' : 'Not Checked In'}</p>
                <button onclick="checkIn(${p.id}, true)">Mark Checked In</button>
                <button onclick="checkIn(${p.id}, false)">Mark No Show</button>
            `;
        });
}

function checkIn(id, checked) {
    fetch('../backend/admin.php?action=check_in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `id=${id}&checked=${checked}`
    }).then(() => alert(checked ? "Checked In!" : "Marked as No Show"));
}

// Init
['welcome', 'flight_status', 'seat_map'].forEach(t);