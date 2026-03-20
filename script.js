// 取得 DOM 元素
const taskInput = document.querySelector('#task-input');
const addTaskBtn = document.querySelector('#add-task-btn');
const taskList = document.querySelector('#task-list');

// 1. 初始化：從 LocalStorage 載入資料
document.addEventListener('DOMContentLoaded', getTasks);

// 2. 新增任務功能
addTaskBtn.addEventListener('click', () => {
    if (taskInput.value === "") return;
    
    const taskObj = {
        id: Date.now(),
        text: taskInput.value,
        completed: false
    };
    
    createTaskElement(taskObj);
    saveLocalTask(taskObj);
    taskInput.value = "";
});

// 3. 渲染任務到畫面上
function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    li.innerHTML = `
        <span onclick="toggleComplete(${task.id})">${task.text}</span>
        <button class="delete-btn" onclick="deleteTask(${task.id}, this)">刪除</button>
    `;
    taskList.appendChild(li);
}

// 4. 儲存至 LocalStorage
function saveLocalTask(task) {
    let tasks = localStorage.getItem('tasks') ? JSON.parse(localStorage.getItem('tasks')) : [];
    tasks.push(task);
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// 5. 刪除與狀態切換功能 (需實作對應邏輯來更新 LocalStorage)
function deleteTask(id, el) {
    el.parentElement.remove();
    let tasks = JSON.parse(localStorage.getItem('tasks'));
    tasks = tasks.filter(t => t.id !== id);
    localStorage.setItem('tasks', JSON.stringify(tasks));
}
