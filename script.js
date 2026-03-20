// 取得 DOM 元素 (使用你原本的 ID)
const clockElement = document.getElementById('clock');
const themeToggle = document.getElementById('theme-toggle');
const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task');
const taskList = document.getElementById('task-list');

// === 1. 時鐘功能 (修復每秒更新) ===
function updateClock() {
    const now = new Date();
    clockElement.innerText = now.toLocaleTimeString('zh-TW', { hour12: false });
}
setInterval(updateClock, 1000);
updateClock();

// === 2. 深色模式 (修復切換邏輯) ===
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    // 儲存模式設定到本地
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// 載入時檢查模式
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
}

// === 3. 任務管理 (新增儲存與刪除) ===
function loadTasks() {
    const savedTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    savedTasks.forEach(taskText => renderTask(taskText));
}

function renderTask(text) {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.innerHTML = `
        <span>${text}</span>
        <button class="delete-btn">刪除</button>
    `;
    
    // 刪除按鈕邏輯
    li.querySelector('.delete-btn').addEventListener('click', () => {
        li.remove();
        saveTasks();
    });
    
    taskList.appendChild(li);
}

function saveTasks() {
    const tasks = [];
    document.querySelectorAll('.task-item span').forEach(span => {
        tasks.push(span.innerText);
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// 綁定新增按鈕
addTaskBtn.addEventListener('click', () => {
    const text = taskInput.value.trim();
    if (text) {
        renderTask(text);
        saveTasks();
        taskInput.value = '';
    }
});

// 支援 Enter 鍵新增
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTaskBtn.click();
});

// 初始化載入
loadTasks();
