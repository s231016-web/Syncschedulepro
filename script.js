let calendar;
let myEvents = JSON.parse(localStorage.getItem('events')) || []; 

document.addEventListener('DOMContentLoaded', function() {
    // 1. Theme Logic
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeButton(currentTheme);

    themeToggle.addEventListener('click', () => {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeButton(newTheme);
    });

    // 2. Calendar Logic
    const calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        events: myEvents,
        headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,listWeek' },
        height: 'auto',
        eventClick: (info) => { if(confirm("Delete task?")) removeTask(info.event.id); }
    });
    calendar.render();

    // 3. Setup UI
    setInterval(() => { document.getElementById('liveClock').innerText = new Date().toLocaleTimeString(); }, 1000);
    setDefaultTime();
    refreshTaskList();
});

function updateThemeButton(theme) {
    document.getElementById('themeToggle').innerText = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
}

function setDefaultTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('eventTime').value = now.toISOString().slice(0, 16);
}

function addSchedule() {
    const title = document.getElementById('eventTitle').value;
    const time = document.getElementById('eventTime').value;
    if (!title || !time) return;

    const newEvent = { id: Date.now().toString(), title, start: time };
    myEvents.push(newEvent);
    saveAndRefresh(newEvent);
    document.getElementById('eventTitle').value = "";
}

function removeTask(id) {
    myEvents = myEvents.filter(e => e.id !== id);
    calendar.getEventById(id).remove();
    saveAndRefresh();
}

function saveAndRefresh(newEvent = null) {
    if (newEvent) calendar.addEvent(newEvent);
    localStorage.setItem('events', JSON.stringify(myEvents));
    refreshTaskList();
}

function refreshTaskList() {
    const list = document.getElementById('taskList');
    list.innerHTML = myEvents.length === 0 ? "<p style='color:var(--text-muted);'>No tasks.</p>" : "";
    
    myEvents.sort((a, b) => new Date(a.start) - new Date(b.start)).forEach(event => {
        const date = new Date(event.start).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const div = document.createElement('div');
        div.className = 'task-item';
        div.innerHTML = `<div><strong>${event.title}</strong><span>${date}</span></div>
                         <button class="delete-btn" onclick="removeTask('${event.id}')">&times;</button>`;
        list.appendChild(div);
    });
}
