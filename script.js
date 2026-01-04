// ==================== ULTRA-LIGHTWEIGHT TIMETABLE JS ====================
// Optimized for minimal MacBook resource usage

// ==================== CONSTANTS ====================
const NOTIFICATION_COOLDOWN = 2 * 60 * 1000; // 2 minutes
const UPDATE_INTERVAL = 1000; // Update time every second

// ==================== WEEKLY SUBJECT SCHEDULE ====================
const weeklySchedule = {
  0: { subject1: "DBMS", subject2: "DSA", subject3: "Calculus II", subject4: "DBMS (P)", subject5: "College Time" },
  1: { subject1: "Calculus II", subject2: "DSA (P)", subject3: "DBMS", subject4: "SEF", subject5: "College Time" },
  2: { subject1: "JAVA", subject2: "DBMS", subject3: "SEF", subject4: "PNS", subject5: "College Time" },
  3: { subject1: "DSA", subject2: "Calculus II", subject3: "JAVA", subject4: "PNS", subject5: "College Time" },
  4: { subject1: "Extra Study", subject2: "DSA", subject3: "JAVA (P)", subject4: "SEF", subject5: "College Time" },
  5: { subject1: "JAVA", subject2: "PNS", subject3: "Calculus II", subject4: "Extra Study", subject5: "College Time" },
  6: { subject1: "Free Day", subject2: "Free Day", subject3: "Free Day", subject4: "Free Day", subject5: "Free Day" }
};

// ==================== STATE ====================
let currentDay = new Date().getDay();
let timetable = buildTimetable();
const notified = new Set();

// ==================== HELPER FUNCTIONS ====================

function updateDisplay(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function formatTime(hours, minutes) {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function getTodaySubjects() {
  return weeklySchedule[new Date().getDay()];
}

function buildTimetable() {
  const subjects = getTodaySubjects();
  return [
    { time: "05:00", activity: "Freshing up" },
    { time: "05:20", activity: subjects.subject1 },
    { time: "06:10", activity: "Short break" },
    { time: "06:15", activity: subjects.subject2 },
    { time: "07:05", activity: "Morning walk" },
    { time: "07:45", activity: subjects.subject3 },
    { time: "08:35", activity: "Short break" },
    { time: "08:40", activity: subjects.subject4 },
    { time: "09:30", activity: "Lunch" },
    { time: "10:00", activity: subjects.subject5 },
    { time: "17:00", activity: "Evening snack" },
    { time: "17:20", activity: subjects.subject1 },
    { time: "18:10", activity: "Short break" },
    { time: "18:15", activity: subjects.subject2 },
    { time: "19:05", activity: "Dinner" },
    { time: "19:15", activity: subjects.subject3 },
    { time: "20:05", activity: "Short break" },
    { time: "20:10", activity: subjects.subject4 },
    { time: "21:00", activity: "Sleep" }
  ];
}

function timeToSeconds(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 3600 + m * 60;
}

function getCurrentEvent(currentSeconds) {
  let currentEvent = { name: "Free time", start: "", end: "", startSeconds: 0 };
  
  for (let i = 0; i < timetable.length; i++) {
    const item = timetable[i];
    const eventSeconds = timeToSeconds(item.time);
    
    if (currentSeconds >= eventSeconds) {
      if (i < timetable.length - 1) {
        const nextItem = timetable[i + 1];
        const nextEventSeconds = timeToSeconds(nextItem.time);
        
        if (currentSeconds < nextEventSeconds) {
          const [h, m] = item.time.split(':').map(Number);
          const [nextH, nextM] = nextItem.time.split(':').map(Number);
          
          currentEvent = {
            name: item.activity,
            start: formatTime(h, m),
            end: formatTime(nextH, nextM),
            startSeconds: eventSeconds
          };
          break;
        }
      } else {
        const [h, m] = item.time.split(':').map(Number);
        const firstEvent = timetable[0];
        const [firstH, firstM] = firstEvent.time.split(':').map(Number);
        
        currentEvent = {
          name: item.activity,
          start: formatTime(h, m),
          end: formatTime(firstH, firstM),
          startSeconds: eventSeconds
        };
        break;
      }
    }
  }
  
  return currentEvent;
}

function getNextEvent(currentSeconds) {
  for (let i = 0; i < timetable.length; i++) {
    const item = timetable[i];
    const eventSeconds = timeToSeconds(item.time);
    
    if (eventSeconds > currentSeconds) {
      const [h, m] = item.time.split(':').map(Number);
      
      let endTime = "";
      if (i < timetable.length - 1) {
        const nextItem = timetable[i + 1];
        const [nextH, nextM] = nextItem.time.split(':').map(Number);
        endTime = formatTime(nextH, nextM);
      } else {
        const firstEvent = timetable[0];
        const [firstH, firstM] = firstEvent.time.split(':').map(Number);
        endTime = formatTime(firstH, firstM);
      }
      
      return {
        name: item.activity,
        start: formatTime(h, m),
        end: endTime,
        startSeconds: eventSeconds
      };
    }
  }
  
  const firstEvent = timetable[0];
  const [h, m] = firstEvent.time.split(':').map(Number);
  
  let endTime = "";
  if (timetable.length > 1) {
    const secondEvent = timetable[1];
    const [secondH, secondM] = secondEvent.time.split(':').map(Number);
    endTime = formatTime(secondH, secondM);
  }
  
  return {
    name: firstEvent.activity,
    start: formatTime(h, m),
    end: endTime,
    startSeconds: timeToSeconds(firstEvent.time) + (24 * 3600)
  };
}

// ==================== NOTIFICATIONS ====================

let currentAlarm = null;
let alarmTimeout = null;

const ALARM_SOUNDS = [
  'sounds/sound1.wav', 'sounds/sound2.wav', 'sounds/sound3.wav', 'sounds/sound4.wav',
  'sounds/sound5.wav', 'sounds/sound6.wav', 'sounds/sound7.wav', 'sounds/sound8.wav',
  'sounds/sound9.wav', 'sounds/sound10.wav', 'sounds/sound11.wav', 'sounds/sound12.wav',
  'sounds/sound13.wav', 'sounds/sound14.wav', 'sounds/sound15.wav', 'sounds/sound16.wav',
  'sounds/sound17.wav', 'sounds/sound18.wav', 'sounds/sound19.wav', 'sounds/sound20.wav'
];

let usedSounds = new Set();
let availableSounds = [...ALARM_SOUNDS];

function getRandomAlarmSound() {
  if (availableSounds.length === 0) {
    availableSounds = [...ALARM_SOUNDS];
    usedSounds.clear();
  }
  
  const randomIndex = Math.floor(Math.random() * availableSounds.length);
  const sound = availableSounds[randomIndex];
  
  availableSounds.splice(randomIndex, 1);
  usedSounds.add(sound);
  
  return sound;
}

function sendNotification(title, body) {
  console.log(`Notification: ${title} - ${body}`);
  
  stopAlarm();
  
  const soundUrl = getRandomAlarmSound();
  
  currentAlarm = new Audio(soundUrl);
  currentAlarm.loop = true;
  currentAlarm.volume = 0.7;
  currentAlarm.play().catch(err => console.log("Sound error:", err));
  
  alarmTimeout = setTimeout(() => stopAlarm(), 50000);
  
  if (window.api && window.api.notify) {
    window.api.notify(title, body + " (Click to stop)");
  } else if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body: body + " (Click to stop)" });
  }
}

function stopAlarm() {
  if (currentAlarm) {
    currentAlarm.pause();
    currentAlarm.currentTime = 0;
    currentAlarm = null;
  }
  
  if (alarmTimeout) {
    clearTimeout(alarmTimeout);
    alarmTimeout = null;
  }
}

document.addEventListener('click', (e) => {
  if (e.target.closest('.btn')) return;
  if (currentAlarm) stopAlarm();
});

window.testNotification = function() {
  sendNotification("🔔 Test Notification", "This is how your alarm will sound!");
};

function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

let scheduledTimeouts = new Map();

function scheduleExactNotifications() {
  scheduledTimeouts.forEach(timeout => clearTimeout(timeout));
  scheduledTimeouts.clear();
  
  const now = new Date();
  const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  
  timetable.forEach(item => {
    const itemSeconds = timeToSeconds(item.time);
    let millisecondsUntil;
    
    if (itemSeconds > currentSeconds) {
      millisecondsUntil = (itemSeconds - currentSeconds) * 1000;
    } else {
      millisecondsUntil = ((24 * 3600) - currentSeconds + itemSeconds) * 1000;
    }
    
    const timeoutId = setTimeout(() => {
      if (!notified.has(item.time)) {
        sendNotification("📅 Timetable Reminder", `Time for: ${item.activity}`);
        notified.add(item.time);
        setTimeout(() => notified.delete(item.time), NOTIFICATION_COOLDOWN);
      }
    }, millisecondsUntil);
    
    scheduledTimeouts.set(item.time, timeoutId);
  });
  
  console.log(`Scheduled ${scheduledTimeouts.size} exact notifications`);
}

function initNotificationSystem() {
  requestNotificationPermission();
  scheduleExactNotifications();
  
  setInterval(() => {
    const newDay = new Date().getDay();
    if (newDay !== currentDay) {
      currentDay = newDay;
      timetable = buildTimetable();
      notified.clear();
      scheduleExactNotifications();
    }
  }, 60000);
}

// ==================== TIME DISPLAY ====================

function updateCurrentTime() {
  const now = new Date();
  const newDay = now.getDay();
  
  if (newDay !== currentDay) {
    currentDay = newDay;
    timetable = buildTimetable();
    notified.clear();
  }
  
  const timeStr = now.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit',
    hour12: true 
  });
  updateDisplay('current-time', timeStr);
  
  const dateStr = now.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  updateDisplay('current-date', dateStr);
  
  const dayStr = now.toLocaleDateString('en-US', { weekday: 'long' });
  updateDisplay('current-day', dayStr);
  
  updateEventDisplay(now);
}

function updateEventDisplay(now) {
  const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  
  const currentEvent = getCurrentEvent(currentSeconds);
  updateDisplay('current-event', currentEvent.name);
  
  if (currentEvent.start && currentEvent.end) {
    updateDisplay('current-event-period', `${currentEvent.start} - ${currentEvent.end}`);
    const elapsedSeconds = currentSeconds - currentEvent.startSeconds;
    updateDisplay('elapsed-time', elapsedSeconds >= 0 ? formatDuration(elapsedSeconds) : '--:--:--');
  } else {
    updateDisplay('current-event-period', "No scheduled event");
    updateDisplay('elapsed-time', '--:--:--');
  }
  
  const nextEvent = getNextEvent(currentSeconds);
  updateDisplay('next-event', nextEvent.name);
  
  if (nextEvent.start && nextEvent.end) {
    updateDisplay('next-event-period', `${nextEvent.start} - ${nextEvent.end}`);
    const remainingSeconds = nextEvent.startSeconds - currentSeconds;
    updateDisplay('countdown', remainingSeconds > 0 ? formatDuration(remainingSeconds) : '--:--:--');
  } else {
    updateDisplay('next-event-period', "No upcoming event");
    updateDisplay('countdown', '--:--:--');
  }
}

// ==================== SECTION COLLAPSE ====================

function initSectionCollapse() {
  document.querySelectorAll('.section-header').forEach(header => {
    header.addEventListener('click', function() {
      this.closest('.section').classList.toggle('collapsed');
    });
  });
}

// ==================== INITIALIZATION ====================

window.addEventListener('DOMContentLoaded', () => {
  initNotificationSystem();
  initSectionCollapse();
  setInterval(updateCurrentTime, UPDATE_INTERVAL);
  updateCurrentTime();
  console.log('Timetable initialized');
});