let calendar;
let myEvents = []; 

document.addEventListener('DOMContentLoaded', function() {
    // Set default time to now
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('eventTime').value = now.toISOString().slice(0, 16);

    const calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,listWeek'
        },
        height: 'auto',
        eventClick: function(info) {
            if(confirm("Delete this task?")) {
                removeTask(info.event.id);
            }
        }
    });
    calendar.render();
    
    // Live Clock
    setInterval(() => {
        document.getElementById('liveClock').innerText = new Date().toLocaleTimeString();
    }, 1000);
});

function addSchedule() {
    const title = document.getElementById('eventTitle').value;
    const time = document.getElementById('eventTime').value;

    if (!title || !time) return;

    const id = Date.now().toString(); 
    const newEvent = { id: id, title: title, start: time };

    myEvents.push(newEvent);
    calendar.addEvent(newEvent);
    calendar.gotoDate(time);

    document.getElementById('eventTitle').value = "";
    refreshTaskList();
}

function removeTask(id) {
    myEvents = myEvents.filter(e => e.id !== id);
    const calendarEvent = calendar.getEventById(id);
    if (calendarEvent) calendarEvent.remove();
    refreshTaskList();
}

function refreshTaskList() {
    const list = document.getElementById('taskList');
    list.innerHTML = "";

    if (myEvents.length === 0) {
        list.innerHTML = "<p style='color:#94a3b8; font-size:0.9rem;'>No tasks scheduled.</p>";
        return;
    }

    myEvents.sort((a, b) => new Date(a.start) - new Date(b.start));

    myEvents.forEach(event => {
        const date = new Date(event.start).toLocaleString([], {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const div = document.createElement('div');
        div.className = 'task-item';
        div.innerHTML = `
            <div class="task-info">
                <strong>${event.title}</strong>
                <span>${date}</span>
            </div>
            <button class="delete-btn" onclick="removeTask('${event.id}')">&times;</button>
        `;
        list.appendChild(div);
    });
}