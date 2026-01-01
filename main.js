const modes = {
  pomodoro: {
    type: 'countdown',
    label: '倒计时',
    nextText: '下一个：休息 5 分钟',
    defaultMinutes: 25,
  },
  stopwatch: {
    type: 'countup',
    label: '正计时',
    nextText: '累计中',
  },
};

const FULL_RING_RADIUS = 102;
const RING_LENGTH = 2 * Math.PI * FULL_RING_RADIUS;

const state = {
  active: 'pomodoro',
  running: false,
  remaining: modes.pomodoro.defaultMinutes * 60,
  elapsed: 0,
  lastTick: null,
};

const timeDisplay = document.getElementById('time-display');
const timeStatus = document.getElementById('time-status');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const ring = document.querySelector('.ring-progress');
const modeButtons = [...document.querySelectorAll('.pill-btn[data-mode]')];
const modeLabel = document.getElementById('mode-label');
const countInput = document.getElementById('count-input');
const stopwatchRead = document.getElementById('stopwatch-read');
const taskList = document.getElementById('task-list');
const donut = document.getElementById('donut');
const donutLegend = document.getElementById('donut-legend');
const barChart = document.getElementById('bar-chart');

let rafId = null;

const tasks = [
  { id: 1, name: '项目：深度专注', plan: '预计 1 番茄', seconds: 1500, editing: false },
  { id: 2, name: '文档整理', plan: '预计 2 番茄', seconds: 1800, editing: false },
  { id: 3, name: '方案复盘', plan: '预计 1 番茄', seconds: 1500, editing: false },
  { id: 4, name: '阅读笔记', plan: '预计 1 番茄', seconds: 1200, editing: false },
];

const weeklyData = [28, 34, 48, 60, 46, 72, 90];

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function setRingProgress(progressRatio) {
  const offset = RING_LENGTH * (1 - Math.min(1, Math.max(0, progressRatio)));
  ring.style.strokeDasharray = `${RING_LENGTH}`;
  ring.style.strokeDashoffset = `${offset}`;
}

function renderTimer() {
  const activeMode = modes[state.active];
  if (activeMode.type === 'countdown') {
    timeDisplay.textContent = formatTime(state.remaining);
    const total = countInput.valueAsNumber > 0 ? countInput.valueAsNumber * 60 : modes.pomodoro.defaultMinutes * 60;
    const ratio = 1 - state.remaining / total;
    setRingProgress(ratio);
  } else {
    timeDisplay.textContent = formatTime(state.elapsed);
    setRingProgress(Math.min(1, (state.elapsed % 3600) / 3600));
  }
  timeStatus.textContent = activeMode.nextText;
  modeLabel.textContent = activeMode.label;
  stopwatchRead.textContent = formatTime(state.elapsed);
}

function step(now) {
  if (!state.running) return;
  if (!state.lastTick) state.lastTick = now;
  const delta = Math.floor((now - state.lastTick) / 1000);
  if (delta > 0) {
    state.lastTick = now;
    if (modes[state.active].type === 'countdown') {
      state.remaining = Math.max(0, state.remaining - delta);
      if (state.remaining === 0) {
        state.running = false;
        timeStatus.textContent = '已完成本段番茄';
      }
    } else {
      state.elapsed = state.elapsed + delta;
    }
    renderTimer();
  }
  rafId = requestAnimationFrame(step);
}

function startTimer() {
  if (state.running) return;
  state.running = true;
  state.lastTick = null;
  timeStatus.textContent = modes[state.active].type === 'countdown' ? '专注中...' : '累计中...';
  rafId = requestAnimationFrame(step);
}

function pauseTimer() {
  state.running = false;
  if (rafId) cancelAnimationFrame(rafId);
  timeStatus.textContent = '已暂停';
}

function resetTimer() {
  state.running = false;
  if (rafId) cancelAnimationFrame(rafId);
  state.remaining = (countInput.valueAsNumber || modes.pomodoro.defaultMinutes) * 60;
  state.elapsed = 0;
  state.lastTick = null;
  renderTimer();
}

function switchMode(mode) {
  state.active = mode;
  state.running = false;
  if (rafId) cancelAnimationFrame(rafId);
  state.remaining = (countInput.valueAsNumber || modes.pomodoro.defaultMinutes) * 60;
  state.lastTick = null;
  modeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
  renderTimer();
}

function renderTasks() {
  taskList.innerHTML = '';
  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = `task-item${task.editing ? ' editing' : ''}`;

    const main = document.createElement('div');
    main.className = 'task-main';

    const dot = document.createElement('span');
    dot.className = 'task-dot';

    const text = document.createElement('div');
    text.className = 'task-text';

    const nameInput = document.createElement('input');
    nameInput.className = 'task-name-input';
    nameInput.value = task.name;
    nameInput.readOnly = !task.editing;
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveTaskName(task.id, nameInput.value);
      }
    });
    nameInput.addEventListener('blur', () => {
      if (task.editing) saveTaskName(task.id, nameInput.value);
    });

    const note = document.createElement('div');
    note.className = 'task-note';
    note.textContent = task.plan;

    text.appendChild(nameInput);
    text.appendChild(note);

    main.appendChild(dot);
    main.appendChild(text);

    const buttons = document.createElement('div');
    buttons.className = 'task-buttons';

    const editBtn = document.createElement('button');
    editBtn.className = 'icon-btn';
    editBtn.innerHTML = '<span class="icon-edit"></span>';
    editBtn.title = task.editing ? '保存' : '修改';
    editBtn.addEventListener('click', () => {
      if (task.editing) {
        saveTaskName(task.id, nameInput.value);
      } else {
        task.editing = true;
        renderTasks();
      }
    });

    const playBtn = document.createElement('button');
    playBtn.className = 'icon-btn';
    playBtn.innerHTML = '<span class="icon-play"></span>';
    playBtn.title = '开始该任务';

    buttons.appendChild(editBtn);
    buttons.appendChild(playBtn);

    li.appendChild(main);
    li.appendChild(buttons);
    taskList.appendChild(li);
  });
}

function saveTaskName(id, value) {
  const t = tasks.find(item => item.id === id);
  if (!t) return;
  t.name = value.trim() || t.name;
  t.editing = false;
  renderTasks();
  renderDonut();
}

function addTask() {
  const newId = Math.max(...tasks.map(t => t.id)) + 1;
  tasks.push({ id: newId, name: '新任务', plan: '预计 1 番茄', seconds: 1200, editing: true });
  renderTasks();
}

function renderDonut() {
  const total = tasks.reduce((sum, t) => sum + t.seconds, 0) || 1;
  let start = 0;
  const colors = ['var(--accent)', '#c8d2ec', '#9db4e8', '#8aa3e1', '#6d89d8'];
  const stops = tasks.map((t, idx) => {
    const angle = (t.seconds / total) * 360;
    const end = start + angle;
    const seg = `${colors[idx % colors.length]} ${start.toFixed(1)}deg ${end.toFixed(1)}deg`;
    start = end;
    return seg;
  });
  donut.style.background = `conic-gradient(${stops.join(',')})`;
  donutLegend.innerHTML = '';
  tasks.slice(0, 5).forEach((t, idx) => {
    const span = document.createElement('span');
    span.innerHTML = `<span class="dot" style="background:${colors[idx % colors.length]}"></span>${t.name}`;
    donutLegend.appendChild(span);
  });
}

function renderBars() {
  barChart.innerHTML = '';
  weeklyData.forEach(height => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = `${height}%`;
    barChart.appendChild(bar);
  });
}

modeButtons.forEach(btn => {
  btn.addEventListener('click', () => switchMode(btn.dataset.mode));
});
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
countInput.addEventListener('change', () => {
  if (state.active === 'pomodoro') {
    state.remaining = (countInput.valueAsNumber || modes.pomodoro.defaultMinutes) * 60;
    renderTimer();
  }
});
document.getElementById('add-task').addEventListener('click', addTask);

renderTimer();
renderTasks();
renderDonut();
renderBars();
