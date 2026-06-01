let calendar;
let myEvents = JSON.parse(localStorage.getItem('events')) || [];
let deleteId = null;

document.addEventListener('DOMContentLoaded', function() {
    initClock();
    initTheme();
    initCalendar();
    initModal();
    saveAndRefresh();
    updateNotifUI();

    setInterval(checkNotifications, 1000);

    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('eventTime').value = now.toISOString().slice(0, 16);
});

function requestNotificationPermission() {
    if (!("Notification" in window)) {
        alert("This browser does not support notifications.");
        return;
    }
    Notification.requestPermission().then(permission => {
        updateNotifUI();
        if (permission === "granted") {
            new Notification("SyncSchedule Pro", { 
                body: "Alerts are now active!", 
                icon: "SYNC.png" 
            });
        }
    });
}

function updateNotifUI() {
    const btn = document.getElementById('notifBtn');
    if (!btn) return;
    if (Notification.permission === "granted") {
        btn.innerHTML = "✅ Alerts Active";
        btn.classList.add('active');
    } else if (Notification.permission === "denied") {
        btn.innerHTML = "🚫 Alerts Blocked";
        btn.style.opacity = "0.6";
    }
}

function checkNotifications() {
    // REMOVED: The strict notification permission block so the function executes on all devices
    const now = Date.now();
    let hasUpdates = false;

    myEvents.forEach(event => {
        const eventTime = new Date(event.start).getTime();
        
        if (now >= eventTime && !event.notified) {
            // Fix 1: Desktop Push Notification System (Fallback for supported environments like Mac Safari)
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification("SyncSchedule Reminder", {
                    body: `Starting Now: ${event.title}`,
                    icon: "SYNC.png",
                    requireInteraction: true
                });
            }
            
            // Fix 2: Global Cross-Browser Visual Alert Screen (Works flawlessly on Phone, Chrome, Safari)
            showEventAlert(event.title);

            event.notified = true;
            hasUpdates = true;
        }
    });

    if (hasUpdates) {
        localStorage.setItem('events', JSON.stringify(myEvents));
        renderUpcomingList();
    }
}

// Function to handle showing the visual alert screen overlay
// Function to handle showing the visual alert screen overlay
function showEventAlert(taskTitle) {
    const alertModal = document.getElementById('alertModal');
    const alertBody = document.getElementById('alertModalBody');
    const dismissBtn = document.getElementById('dismissAlertBtn');
    
    if (!alertModal || !alertBody || !dismissBtn) return;

    // Inject the task title dynamically into the alert screen text
    alertBody.innerText = taskTitle;
    // Display the modal instantly
    alertModal.style.display = 'flex';

    // 🔊 NEW: Trigger the audio alert
    playAlertSound();

    // Event listener to close the notification when acknowledged
    dismissBtn.onclick = () => {
        alertModal.style.display = 'none';
    };
}

// NEW: Helper function to play a crisp notification chime
function playAlertSound() {
    // Uses a clean, royalty-free digital chime URL. 
    // You can swap this URL out for a local file (e.g., 'alert.mp3') if preferred!
    const audio = new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_7356260c64.mp3');
    
    audio.volume = 0.6; // Adjust volume from 0.0 to 1.0
    
    audio.play().catch(error => {
        // Mobile browsers sometimes block audio autoplay until a user interacts 
        // with the screen at least once. This catch block prevents the app from crashing.
        console.log("Audio playback blocked by mobile browser autoplay restrictions:", error);
    });
}
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.innerText = savedTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.innerText = newTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
    });
}

function updateClockDisplay() {
    const now = new Date();
    document.getElementById('liveClock').innerText = now.toLocaleTimeString('en-US');
}

function initClock() {
    updateClockDisplay(); // Run once immediately to avoid 1-second blank flash
    setInterval(updateClockDisplay, 1000);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('dateDisplay').innerText = new Date().toLocaleDateString('en-US', options);
}

function initCalendar() {
    const calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,listWeek' },
        events: myEvents,
        height: 'auto',
        editable: true,
        eventClick: (info) => showDeleteModal(info.event.id),
        // Persist drag, drop, and resize adjustments back into your array
        eventDrop: (info) => handleEventMove(info.event),
        eventResize: (info) => handleEventMove(info.event)
    });
    calendar.render();
}

function handleEventMove(fcEvent) {
    const match = myEvents.find(e => e.id === fcEvent.id);
    if (match) {
        match.start = fcEvent.start.toISOString();
        // Silences past alerts if dragged backward, or rearms it if dragged to the future
        match.notified = new Date(match.start).getTime() < Date.now();
        saveAndRefresh();
    }
}

function addSchedule() {
    const titleInput = document.getElementById('eventTitle');
    const title = titleInput.value;
    const time = document.getElementById('eventTime').value;
    const color = document.getElementById('eventCategory').value;

    if (!title) return alert("Please enter a task name!");

    const eventStartTime = time ? new Date(time).getTime() : Date.now();

    const newEvent = {
        id: Date.now().toString(),
        title: title,
        start: time || new Date().toISOString(),
        backgroundColor: color,
        borderColor: color,
        textColor: '#ffffff',
        notified: eventStartTime < Date.now() // Instantly silences notification if set in the past
    };

    myEvents.push(newEvent);
    calendar.addEvent(newEvent);
    saveAndRefresh();
    titleInput.value = "";
}

function showDeleteModal(id) {
    deleteId = id;
    document.getElementById('customModal').style.display = 'flex';
}

function initModal() {
    const modal = document.getElementById('customModal');
    document.getElementById('cancelBtn').onclick = () => modal.style.display = 'none';
    document.getElementById('confirmBtn').onclick = () => {
        if (deleteId) {
            myEvents = myEvents.filter(e => e.id !== deleteId);
            const fcEvent = calendar.getEventById(deleteId);
            if (fcEvent) fcEvent.remove();
            saveAndRefresh();
            modal.style.display = 'none';
        }
    };
}

function saveAndRefresh() {
    localStorage.setItem('events', JSON.stringify(myEvents));
    updateOverview();
    renderUpcomingList();
}

function updateOverview() {
    document.getElementById('taskCount').innerText = myEvents.length;
    document.getElementById('urgentCount').innerText = myEvents.filter(e => e.backgroundColor === '#ef4444').length;
    document.getElementById('listCount').innerHTML = `&nbsp;${myEvents.length}&nbsp;`;
}

function renderUpcomingList() {
    const list = document.getElementById('taskList');
    list.innerHTML = "";
    if (myEvents.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted)">No tasks</div>`;
        return;
    }
    [...myEvents].sort((a,b) => new Date(a.start) - new Date(b.start)).forEach(event => {
        const div = document.createElement('div');
        div.className = 'task-item';
        div.style.borderLeftColor = event.backgroundColor;
        
        // Added an inline delete button to utilize your CSS 'justify-content: space-between'
        div.innerHTML = `
            <div>
                <strong>${event.title}</strong><br>
                <small>${new Date(event.start).toLocaleString()}</small>
            </div>
            <button class="inline-del-btn" onclick="showDeleteModal('${event.id}')" title="Delete Task">❌</button>
        `;
        list.appendChild(div);
    });
}