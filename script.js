let calendar;
let myEvents = JSON.parse(localStorage.getItem('events')) || [];
let deleteId = null;

document.addEventListener('DOMContentLoaded', function() {
    initClock();
    initTheme();
    initCalendar();
    initModal();
    saveAndRefresh();
    updateNotifUI(); // Update UI status button on load

    // Start notification checker (High frequency: every 1 second for zero delay)
    setInterval(checkNotifications, 1000);

    // Set default input time to now
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('eventTime').value = now.toISOString().slice(0, 16);
});

// Helper to request notification permission via user gesture
function requestNotificationPermission() {
    if (!("Notification" in window)) {
        alert("This browser does not support desktop notifications.");
        return;
    }
    
    if (window.location.protocol === 'file:') {
        alert("Note: Browsers block notifications on local file paths (file:///). Please run this via a local server (like VS Code Live Server) for notifications to function.");
    }
    
    Notification.requestPermission().then(permission => {
        updateNotifUI();
        if (permission === "granted") {
            new Notification("SyncSchedule Pro", { 
                body: "Notifications are now active!",
                icon: "SYNC.png"
            });
        } else if (permission === "denied") {
            alert("Permissions blocked. Click the lock/settings icon next to your browser's address bar URL to reset permissions.");
        }
    });
}

// Update the visible state of the notification status button
function updateNotifUI() {
    const btn = document.getElementById('notifBtn');
    if (!btn) return;
    
    if (!("Notification" in window)) {
        btn.innerHTML = "🚫 Not Supported";
        btn.style.background = "#ef4444";
        return;
    }
    
    if (Notification.permission === "granted") {
        btn.innerHTML = "✅ Alerts Active";
        btn.style.background = "#10b981";
    } else if (Notification.permission === "denied") {
        btn.innerHTML = "🚫 Alerts Blocked";
        btn.style.background = "#ef4444";
    } else {
        btn.innerHTML = "🔔 Enable Alerts";
        btn.style.background = "#6366f1";
    }
}

// Improved Notification Logic - Real-time Precision
function checkNotifications() {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const now = new Date().getTime();
    let hasUpdates = false;

    myEvents.forEach(event => {
        const eventTime = new Date(event.start).getTime();
        
        // Exact real-time match (within 2 seconds precision)
        if (Math.abs(now - eventTime) < 2000 && !event.notified) {
            sendNotification(event);
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
            icon: "SYNC.png",
            tag: event.id,
            requireInteraction: true
        });
        
        n.onclick = function() {
            window.focus();
            this.close();
        };
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
            const idx = myEvents.findIndex(e => e.id.toString() === info.event.id.toString());
            if(idx !== -1) {
                myEvents[idx].start = info.event.start.toISOString();
                myEvents[idx].notified = false; 
                saveAndRefresh();
            }
        }
    });
    calendar.render();
}

// Task CRUD
function addSchedule() {
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
            // FIX: Explicit string conversion fixes the structural number-vs-string mismatch bug
            myEvents = myEvents.filter(e => e.id.toString() !== deleteId.toString());
            
            const ev = calendar.getEventById(deleteId.toString());
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
