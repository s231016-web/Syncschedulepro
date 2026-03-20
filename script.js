let calendar;
let myEvents = JSON.parse(localStorage.getItem('events')) || [];
let deleteId = null;

document.addEventListener('DOMContentLoaded', function() {
    initClock();
    initTheme();
    initCalendar();
    initModal();
    refreshTaskList();
    
    // Set default time to now
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('eventTime').value = now.toISOString().slice(0, 16);
});

// Theme Logic
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

// Calendar Logic
function initCalendar() {
    const calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'en', // Changed to English
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
                saveAndRefresh();
            }
        }
    });
    calendar.render();
}

// Task Operations
function addSchedule() {
    const title = document.getElementById('eventTitle').value;
    const time = document.getElementById('eventTime').value;
    const color = document.getElementById('eventCategory').value;

    if (!title) return alert("Please enter a task name!");

    const newEvent = {
        id: Date.now().toString(),
        title: title,
        start: time || new Date().toISOString(),
        backgroundColor: color,
        borderColor: color,
        textColor: '#ffffff'
    };

    myEvents.push(newEvent);
    calendar.addEvent(newEvent);
    saveAndRefresh();
    document.getElementById('eventTitle').value = "";
}

function showDeleteModal(id) {
    deleteId = id;
    document.getElementById('customModal').style.display = 'flex';
}

function initModal() {
    document.getElementById('cancelBtn').onclick = () => {
        document.getElementById('customModal').style.display = 'none';
    };
    document.getElementById('confirmBtn').onclick = () => {
        myEvents = myEvents.filter(e => e.id !== deleteId);
        const ev = calendar.getEventById(deleteId);
        if(ev) ev.remove();
        saveAndRefresh();
        document.getElementById('customModal').style.display = 'none';
    };
}

function saveAndRefresh() {
    localStorage.setItem('events', JSON.stringify(myEvents));
    refreshTaskList();
}

function refreshTaskList() {
    const list = document.getElementById('taskList');
    const taskCount = document.getElementById('taskCount');
    const urgentCount = document.getElementById('urgentCount');
    const listCount = document.getElementById('listCount');
    
    list.innerHTML = "";
    taskCount.innerText = myEvents.length;
    urgentCount.innerText = myEvents.filter(e => e.backgroundColor === '#ef4444').length;
    listCount.innerText = myEvents.length;

    if (myEvents.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted)">No tasks found</div>`;
        return;
    }

    [...myEvents].sort((a,b) => new Date(a.start) - new Date(b.start)).forEach(event => {
        const date = new Date(event.start).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        const div = document.createElement('div');
        div.className = 'task-item';
        div.style.borderLeftColor = event.backgroundColor;
        div.onclick = () => calendar.gotoDate(new Date(event.start));
        div.innerHTML = `
            <div style="flex:1">
                <strong style="display:block">${event.title}</strong>
                <small style="color:var(--text-muted)">${date}</small>
            </div>
            <button onclick="event.stopPropagation(); showDeleteModal('${event.id}')" 
                    style="background:none; border:none; color:#ef4444; font-size:1.5rem; cursor:pointer;">&times;</button>
        `;
        list.appendChild(div);
    });
}

function initClock() {
    setInterval(() => {
        document.getElementById('liveClock').innerText = new Date().toLocaleTimeString('en-US');
    }, 1000);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('dateDisplay').innerText = new Date().toLocaleDateString('en-US', options);
}
