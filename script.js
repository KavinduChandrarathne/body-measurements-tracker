// DOM Elements
const modal = document.getElementById("measurementModal");
const addBtn = document.getElementById("addBtn");
const closeBtn = document.querySelector(".close");
const form = document.getElementById("measurementForm");
const historySection = document.getElementById("historySection");
const historyTable = document.getElementById("historyTable");
const closeHistoryBtn = document.getElementById("closeHistoryBtn");

// Modal controls
addBtn.onclick = () => {
    modal.style.display = "block";
    document.body.style.overflow = "hidden";
};

closeBtn.onclick = () => {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
};

window.onclick = (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    }
};

// Storage functions
const API_BASE_URL = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';

function getLocalMeasurements() {
    try {
        return JSON.parse(localStorage.getItem('measurements')) || [];
    } catch (error) {
        return [];
    }
}

function saveLocalMeasurements(data) {
    localStorage.setItem('measurements', JSON.stringify(data));
}

async function getMeasurements() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/measurements`);
        if (!response.ok) {
            throw new Error('Failed to load measurements');
        }
        return response.json();
    } catch (error) {
        return getLocalMeasurements();
    }
}

async function saveMeasurements(data) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/measurements`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Failed to save measurements');
        }

        return response.json();
    } catch (error) {
        const existing = getLocalMeasurements();
        existing.push(data);
        saveLocalMeasurements(existing);
        return existing;
    }
}

// Update latest measurements display
async function updateLatest() {
    try {
        const data = await getMeasurements();

        if (data.length === 0) {
            document.getElementById("latestData").innerHTML = `
                <p style="grid-column: 1 / -1; text-align: center; color: #94a3b8; padding: 20px 0;">
                    No measurements recorded yet.<br>
                    Click "Add Measurements" to get started!
                </p>
            `;
            return;
        }

        const latest = data[data.length - 1];

        document.getElementById("latestData").innerHTML = `
            <p><b>Date:</b> ${latest.date}</p>
            <p><b>1 - Upper arm:</b> ${latest.arm} cm</p>
            <p><b>2 - Chest:</b> ${latest.chest} cm</p>
            <p><b>3 - Abdomen:</b> ${latest.abdomen} cm</p>
            <p><b>4 - Waist:</b> ${latest.waist} cm</p>
            <p><b>5 - Lower hip:</b> ${latest.lowerHip || latest.thigh || ""} cm</p>
            <p><b>6 - Thigh:</b> ${latest.thigh || latest.lowerHip || ""} cm</p>
            <p><b>Weight:</b> ${latest.weight} kg</p>
        `;
    } catch (error) {
        document.getElementById("latestData").innerHTML = `<p style="color: #ef4444;">Could not load measurements.</p>`;
    }
}

// Form submission
form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const newEntry = {
        date: new Date().toLocaleDateString(),
        arm: document.getElementById("arm").value,
        chest: document.getElementById("chest").value,
        abdomen: document.getElementById("abdomen").value,
        waist: document.getElementById("waist").value,
        lowerHip: document.getElementById("lowerHip").value,
        thigh: document.getElementById("thigh").value,
        weight: document.getElementById("weight").value
    };

    try {
        await saveMeasurements(newEntry);
        await updateLatest();
        form.reset();
        modal.style.display = "none";
        document.body.style.overflow = "auto";

        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.textContent = "✓ Saved!";
        btn.style.background = "linear-gradient(135deg, #22c55e, #16a34a)";
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = "";
        }, 1500);
    } catch (error) {
        alert('Could not save measurements.');
    }
});

// View history
document.getElementById("viewBtn").addEventListener("click", async () => {
    try {
        const data = await getMeasurements();

        if (data.length === 0) {
            historyTable.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px; color: #94a3b8;">
                        No measurements recorded yet.
                    </td>
                </tr>
            `;
            historySection.style.display = "block";
            return;
        }

        historyTable.innerHTML = "";
        data.forEach(item => {
            historyTable.innerHTML += `
                <tr>
                    <td><b>${item.date}</b></td>
                    <td>${item.arm}</td>
                    <td>${item.chest}</td>
                    <td>${item.abdomen}</td>
                    <td>${item.waist}</td>
                    <td>${item.lowerHip || item.thigh || ""}</td>
                    <td>${item.thigh || item.lowerHip || ""}</td>
                    <td>${item.weight}</td>
                </tr>
            `;
        });

        historySection.style.display = "block";
        historySection.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
        historyTable.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #ef4444;">
                    Could not load history.
                </td>
            </tr>
        `;
        historySection.style.display = "block";
    }
});

// Close history
if (closeHistoryBtn) {
    closeHistoryBtn.addEventListener("click", () => {
        historySection.style.display = "none";
    });
}

// Initialize
updateLatest();