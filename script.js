let calendar;
let myEvents = JSON.parse(localStorage.getItem('events')) || [];
let deleteId = null;

document.addEventListener('DOMContentLoaded', function() {
    initClock();
    initTheme();
    initCalendar();
    initModal();
    saveAndRefresh();

    // Start notification checker (High frequency: every 1 second for zero delay)
    setInterval(checkNotifications, 1000);

    // Set default input time to now
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('eventTime').value = now.toISOString().slice(0, 16);
});

// Helper to request notification permission via user gesture
// Replace your existing requestNotificationPermission function
function requestNotificationPermission() {
    if (!("Notification" in window)) {
        alert("This browser does not support desktop notifications.");
        return;
    }

    // Check if we are in a secure context (localhost or https)
    if (!window.isSecureContext) {
        alert("Notifications require a secure context. Please run this via a local server (like VS Code Live Server) instead of opening the file directly.");
        return;
    }

    Notification.requestPermission().then(permission => {
        if (permission === "granted") {
            new Notification("SyncSchedule Pro", { 
                body: "Notifications are now active!",
                icon: "SYNC.png" 
            });
            updateNotifBadge(); // Update UI if you added the badge from the previous step
        } else if (permission === "denied") {
            alert("Notifications are blocked. Please click the lock icon in your browser address bar to allow them.");
        }
    });
}

// Updated checkNotifications to use your SYNC.png icon
function checkNotifications() {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const now = new Date().getTime();
    let hasUpdates = false;

    myEvents.forEach(event => {
        const eventTime = new Date(event.start).getTime();
        // Trigger if current time is within 1 second of event time
        if (!event.notified && Math.abs(now - eventTime) < 1000) {
            new Notification("SyncSchedule Task", {
                body: `Starting now: ${event.title}`,
                icon: "SYNC.png",
                requireInteraction: true // Keeps notification visible until clicked
            });
            event.notified = true;
            hasUpdates = true;
        }
    });

    if (hasUpdates) {
        localStorage.setItem('events', JSON.stringify(myEvents));
    }
}

function sendNotification(event) {
    try {
        const n = new Notification("Task Reminder", {
            body: `It's time for: ${event.title}`,
            icon: "https://cdn-icons-png.flaticon.com/512/3114/3114812.png",
            tag: event.id,
            requireInteraction: true
        });
        
        n.onclick = function() {
            window.focus();
            this.close();
        };
        console.log(`Notification sent exactly at: ${new Date().toLocaleTimeString()}`);
    } catch (e) {
        console.error("Failed to send notification:", e);
    }
}

// Theme Toggle
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.innerText = savedTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';

    themeToggle.addEventListener('click', () => {
        requestNotificationPermission();
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.innerText = newTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
    });
}

// Calendar Setup
function initCalendar() {
    const calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'en',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,listWeek'
        },
        events: myEvents,
        height: 'auto',
        editable: true,
        eventClick: (info) => showDeleteModal(info.event.id),
        eventDrop: (info) => {
            const idx = myEvents.findIndex(e => e.id === info.event.id);
            if(idx !== -1) {
                myEvents[idx].start = info.event.start.toISOString();
                myEvents[idx].notified = false; // Reset notification if moved to future
                saveAndRefresh();
            }
        }
    });
    calendar.render();
}

// Task CRUD
function addSchedule() {
    requestNotificationPermission();

    const titleInput = document.getElementById('eventTitle');
    const title = titleInput.value;
    const time = document.getElementById('eventTime').value;
    const color = document.getElementById('eventCategory').value;

    if (!title) return alert("Please enter a task name!");

    const newEvent = {
        id: Date.now().toString(),
        title: title,
        start: time || new Date().toISOString(),
        backgroundColor: color,
        borderColor: color,
        textColor: '#ffffff',
        notified: false
    };

    myEvents.push(newEvent);
    calendar.addEvent(newEvent);
    saveAndRefresh();
    titleInput.value = "";
    
    // Debug log to confirm scheduled time
    console.log(`Task "${title}" scheduled for: ${new Date(newEvent.start).toLocaleString()}`);
}

function showDeleteModal(id) {
    deleteId = id;
    document.getElementById('customModal').style.display = 'flex';
}

function initModal() {
    const modal = document.getElementById('customModal');
    document.getElementById('cancelBtn').onclick = () => {
        modal.style.display = 'none';
        deleteId = null;
    };
    
    document.getElementById('confirmBtn').onclick = () => {
        if (deleteId) {
            myEvents = myEvents.filter(e => e.id !== deleteId);
            const ev = calendar.getEventById(deleteId);
            if(ev) ev.remove();
            saveAndRefresh();
            modal.style.display = 'none';
            deleteId = null;
        }
    };
}

function saveAndRefresh() {
    localStorage.setItem('events', JSON.stringify(myEvents));
    updateOverview();
    renderUpcomingList();
}

function updateOverview() {
    const taskCount = document.getElementById('taskCount');
    const urgentCount = document.getElementById('urgentCount');
    const listCountBadge = document.getElementById('listCount');
    
    const urgentTasks = myEvents.filter(e => e.backgroundColor === '#ef4444').length;
    
    taskCount.innerText = myEvents.length;
    urgentCount.innerText = urgentTasks;
    listCountBadge.innerHTML = `&nbsp;${myEvents.length}&nbsp;`;
}

function renderUpcomingList() {
    const list = document.getElementById('taskList');
    list.innerHTML = "";

    if (myEvents.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted)">No upcoming tasks</div>`;
        return;
    }

    [...myEvents].sort((a,b) => new Date(a.start) - new Date(b.start)).forEach(event => {
        const dateStr = new Date(event.start).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        
        const div = document.createElement('div');
        div.className = 'task-item';
        div.style.borderLeftColor = event.backgroundColor;
        div.onclick = () => calendar.gotoDate(new Date(event.start));
        
        div.innerHTML = `
            <div style="flex:1">
                <strong style="display:block">${event.title}</strong>
                <small style="color:var(--text-muted)">${dateStr}</small>
            </div>
            <button onclick="event.stopPropagation(); showDeleteModal('${event.id}')" 
                    style="background:none; border:none; color:#ef4444; font-size:1.5rem; cursor:pointer; padding: 0 10px;">&times;</button>
        `;
        list.appendChild(div);
    });
}

function initClock() {
    setInterval(() => {
        const now = new Date();
        document.getElementById('liveClock').innerText = now.toLocaleTimeString('en-US');
    }, 1000);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('dateDisplay').innerText = new Date().toLocaleDateString('en-US', options);
    
    const liveClock = document.getElementById('liveClock');
    if (liveClock) liveClock.style.marginRight = '15px';
}
// Add to your existing script.js

// 1. Updated Permission Request with UI feedback
// 1. Updated Permission Function with Debug Alerts
function requestNotificationPermission() {
    if (!("Notification" in window)) {
        alert("This browser does not support notifications.");
        return;
    }

    // Check if site is served via file:// (Notifications will NOT work)
    if (window.location.protocol === 'file:') {
        alert("CRITICAL: Notifications only work when running on a server (e.g., VS Code Live Server). They do not work if you double-click the .html file from your folder.");
        return;
    }

    Notification.requestPermission().then(permission => {
        updateNotifUI();
        if (permission === "granted") {
            new Notification("SyncSchedule Pro", { 
                body: "Success! Notifications are enabled.",
                icon: "SYNC.png" 
            });
        } else if (permission === "denied") {
            alert("Permission Denied. Please click the 'Lock' icon next to the URL in your browser address bar and set Notifications to 'Allow'.");
        }
    });
}

// 2. UI Update for the Badge
function updateNotifUI() {
    const badge = document.getElementById('notifBadge');
    if (!badge) return;
    
    if (Notification.permission === "granted") {
        badge.innerHTML = "✅ Alerts Active";
        badge.style.background = "#10b981";
    } else if (Notification.permission === "denied") {
        badge.innerHTML = "🚫 Alerts Blocked";
        badge.style.background = "#ef4444";
    }
}

// 3. Updated checkNotifications to use SYNC.png
function checkNotifications() {
    if (Notification.permission !== "granted") return;

    const now = new Date().getTime();
    let hasUpdates = false;

    myEvents.forEach(event => {
        const eventTime = new Date(event.start).getTime();
        
        // Exact match check (within 2 seconds of the scheduled time)
        if (Math.abs(now - eventTime) < 2000 && !event.notified) {
            new Notification("Task Reminder", {
                body: `Time for: ${event.title}`,
                icon: "SYNC.png", // Using your uploaded image
                requireInteraction: true
            });
            event.notified = true;
            hasUpdates = true;
        }
    });

    if (hasUpdates) {
        localStorage.setItem('events', JSON.stringify(myEvents));
    }
}

// 4. Update the DOMContentLoaded listener
document.addEventListener('DOMContentLoaded', function() {
    initClock();
    initTheme();
    initCalendar();
    initModal();
    saveAndRefresh();
    updateNotifUI(); // Check status on load

    setInterval(checkNotifications, 1000);
});
