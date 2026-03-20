let calendar;
let myEvents = JSON.parse(localStorage.getItem('events')) || [];
let deleteId = null;

document.addEventListener('DOMContentLoaded', function() {
    initClock();
    initTheme();
    initCalendar();
    initModal();
    saveAndRefresh(); // Ensure overview updates on initial load

    // Start notification checker (every 30 seconds)
    setInterval(checkNotifications, 30000);

    // Set default input time to now
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('eventTime').value = now.toISOString().slice(0, 16);
});

// Helper to request notification permission via user gesture
function requestNotificationPermission() {
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
}

// Notification Logic
function checkNotifications() {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const now = new Date();
    myEvents.forEach(event => {
        const eventDate = new Date(event.start);
        // Calculate difference in minutes
        const diff = (eventDate - now) / 1000 / 60;
        
        // Notify if task is due within the next minute and hasn't been notified yet
        if (diff > 0 && diff <= 1 && !event.notified) {
            new Notification("Task Reminder", {
                body: `Time for: ${event.title}`,
                icon: "https://cdn-icons-png.flaticon.com/512/3114/3114812.png" // Placeholder icon
            });
            event.notified = true; // Mark as notified
            localStorage.setItem('events', JSON.stringify(myEvents));
        }
    });
}

// Theme Toggle
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.innerText = savedTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';

    themeToggle.addEventListener('click', () => {
        // Request permission on first interaction
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
        // Using the custom modal for calendar event clicks
        eventClick: (info) => showDeleteModal(info.event.id),
        eventDrop: (info) => {
            const idx = myEvents.findIndex(e => e.id === info.event.id);
            if(idx !== -1) {
                myEvents[idx].start = info.event.start.toISOString();
                saveAndRefresh();
            }
        }
    });
    calendar.render();
}

// Task CRUD
function addSchedule() {
    // Request permission on first interaction
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
        notified: false // New flag for notifications
    };

    myEvents.push(newEvent);
    calendar.addEvent(newEvent);
    saveAndRefresh(); // Automatically updates overview and storage
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
            // Remove from array
            myEvents = myEvents.filter(e => e.id !== deleteId);
            // Remove from FullCalendar UI
            const ev = calendar.getEventById(deleteId);
            if(ev) ev.remove();
            
            saveAndRefresh();
            modal.style.display = 'none';
            deleteId = null;
        }
    };
}

// State Management
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
    // Added spacing for the badge count
    listCountBadge.innerHTML = `&nbsp;${myEvents.length}&nbsp;`;
}

function renderUpcomingList() {
    const list = document.getElementById('taskList');
    list.innerHTML = "";

    if (myEvents.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted)">No upcoming tasks</div>`;
        return;
    }

    // Sort by date and render
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

// Clock UI
function initClock() {
    setInterval(() => {
        document.getElementById('liveClock').innerText = new Date().toLocaleTimeString('en-US');
    }, 1000);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('dateDisplay').innerText = new Date().toLocaleDateString('en-US', options);
    
    // UI adjustment: Add right margin to clock display to separate from dark mode button
    const liveClock = document.getElementById('liveClock');
    if (liveClock) liveClock.style.marginRight = '15px';
}
