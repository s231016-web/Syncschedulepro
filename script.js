let calendar;
let myEvents = JSON.parse(localStorage.getItem('events')) || [];

document.addEventListener('DOMContentLoaded', function() {
    // --- Dark Mode Logic ---
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    // Apply theme immediately on load
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButton(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeButton(newTheme);
    });

    function updateThemeButton(theme) {
        themeToggle.innerText = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
    }

    // --- Calendar Logic ---
    const calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,listWeek'
        },
        events: myEvents,
        height: 'auto',
        eventClick: (info) => {
            if(confirm("Delete this task?")) removeTask(info.event.id);
        }
    });
    calendar.render();

    // --- Clock & Initial State ---
    setInterval(() => {
        document.getElementById('liveClock').innerText = new Date().toLocaleTimeString();
    }, 1000);

    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('eventTime').value = now.toISOString().slice(0, 16);
    
    refreshTaskList();
});

function addSchedule() {
    const title = document.getElementById('eventTitle').value;
    const time = document.getElementById('eventTime').value;
    if (!title || !time) return;

    const newEvent = { id: Date.now().toString(), title, start: time };
    myEvents.push(newEvent);
    
    calendar.addEvent(newEvent);
    localStorage.setItem('events', JSON.stringify(myEvents));
    
    document.getElementById('eventTitle').value = "";
    refreshTaskList();
}

function removeTask(id) {
    myEvents = myEvents.filter(e => e.id !== id);
    localStorage.setItem('events', JSON.stringify(myEvents));
    calendar.getEventById(id).remove();
    refreshTaskList();
}

function refreshTaskList() {
    const list = document.getElementById('taskList');
    list.innerHTML = "";

    if (myEvents.length === 0) {
        list.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">No tasks scheduled.</p>`;
        return;
    }

    myEvents.sort((a, b) => new Date(a.start) - new Date(b.start)).forEach(event => {
        const date = new Date(event.start).toLocaleString([], {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const div = document.createElement('div');
        div.className = 'task-item';
        div.innerHTML = `
            <div class="task-info">
                <strong>${event.title}</strong>
                <span style="font-size: 0.8rem; color: var(--text-muted)">${date}</span>
            </div>
            <button class="delete-btn" onclick="removeTask('${event.id}')" style="background:none; border:none; cursor:pointer; color:var(--text-muted); font-size:1.2rem;">&times;</button>
        `;
        list.appendChild(div);
    });
}
