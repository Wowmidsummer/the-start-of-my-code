const FULL_TIME = 25 * 60;
let remaining = FULL_TIME;
let ticking = false;
let rafId = null;
let lastTick = null;

const timeDisplay = document.getElementById('time-display');
const timeStatus = document.getElementById('time-status');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const ring = document.querySelector('.ring-progress');

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function setRingProgress(sec) {
  const circumference = 2 * Math.PI * 102;
  const ratio = 1 - sec / FULL_TIME;
  ring.style.strokeDasharray = `${circumference}`;
  ring.style.strokeDashoffset = `${circumference * ratio}`;
}

function render() {
  timeDisplay.textContent = formatTime(remaining);
  setRingProgress(remaining);
}

function step(now) {
  if (!ticking) return;
  if (!lastTick) lastTick = now;
  const delta = Math.floor((now - lastTick) / 1000);
  if (delta > 0) {
    remaining = Math.max(0, remaining - delta);
    lastTick = now;
    render();
    if (remaining === 0) {
      ticking = false;
      timeStatus.textContent = '已完成本段番茄';
      return;
    }
  }
  rafId = requestAnimationFrame(step);
}

function startTimer() {
  if (ticking) return;
  ticking = true;
  lastTick = null;
  timeStatus.textContent = '专注中...';
  rafId = requestAnimationFrame(step);
}

function pauseTimer() {
  ticking = false;
  if (rafId) cancelAnimationFrame(rafId);
  timeStatus.textContent = '已暂停';
}

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);

render();
