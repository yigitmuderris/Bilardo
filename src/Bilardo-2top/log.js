// log.js
const fs = require("fs");
const path = require("path");
const { gitPushLogs } = require("./gitPush");
const { log } = require("console");


const LOG_DIR = path.join(__dirname, "logs_2top");

// Logs klasörü yoksa oluştur
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);


function formatTimestamp() {
  const now = new Date();
  // Almanya saati
  const options = { timeZone: "Europe/Berlin", hour12: false };
const date = now.toLocaleDateString("de-DE", options); // DD.MM.YYYY
const time = now.toLocaleTimeString("de-DE", options); // HH:MM:SS
  return `[${date} ${time}]`;
}

// Günlük dosya ismi oluştur (YYYY-MM-DD formatında)
function getDailyLogFilename(type) {
  const now = new Date();
  const options = { timeZone: "Europe/Berlin" };

  const year = now.toLocaleString("de-DE", { year: "numeric", ...options });
  const month = now.toLocaleString("de-DE", { month: "2-digit", ...options });
  const day = now.toLocaleString("de-DE", { day: "2-digit", ...options });

  return `${type}-${year}-${month}-${day}.txt`;
}

// debounce ile push tetikleme
let pushTimeout;
function scheduleGitPush() {
  clearTimeout(pushTimeout);
  pushTimeout = setTimeout(async () => {
   
    await gitPushLogs();
  }, 1000); // 1 saniye gecikme
}

function write(message, type = "general") {
  const timestamp = formatTimestamp();
  const filename = getDailyLogFilename(type);
  const filePath = path.join(LOG_DIR, filename); // türüne göre dosya
  fs.appendFileSync(filePath, `[${timestamp}] ${message}\n`);

  scheduleGitPush();
}

// Özel fonksiyonlar
function logChat(message) {
  write(message, "chat");
}

function logJoin(message) {
  write(message, "join");
}

function logLeave(message) {
  write(message, "join");
}

function logGame(message) {
  write(message, "game");
}

function logGit(message) {
  write(message, "git");
}

function logError(message) {
  write(message, "error");
}

module.exports = {
  write,
  logChat,
  logJoin,
  logLeave,
  logGame,
  logError,
  logGit
};
