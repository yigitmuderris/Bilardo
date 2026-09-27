const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const db = new sqlite3.Database('./bilardo.db');

// Tablo oluştur
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS bilardo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    password TEXT UNIQUE,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    rating REAL DEFAULT 1000,
    games_played INTEGER DEFAULT 0
  )`);
});

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// !register
function registerUser(password, callback) {
  if (!password) return callback(new Error("Şifre boş olamaz!"));

  const hashedPassword = hashPassword(password);

    // Kayıt ekle
    db.run('INSERT INTO bilardo (password) VALUES (?)', [hashedPassword], function(err2) {
      if (err2) return callback(err2);
      callback(null, { id: this.lastID }); // sadece id döner
    });
  };

// !login
function loginUser(password, callback) {
  if (!password) return callback(new Error("Şifre boş olamaz!"));

  const hash = hashPassword(password);

  db.get('SELECT * FROM bilardo WHERE password = ?', [hash], (err, row) => {
    if (err) return callback(err);
    callback(null, row || false);
  });
}

// ID bazlı oyuncu verisi al
function getPlayerById(id, callback) {
  db.get('SELECT * FROM bilardo WHERE id = ?', [id], (err, row) => {
    if (err) return callback(err);
    callback(null, row || null);
  });
}

// ID bazlı istatistik güncelle
function updateStatsById(id, result, ratingChange = 0, callback) {
  db.get('SELECT * FROM bilardo WHERE id = ?', [id], (err, user) => {
    if (err || !user) return callback && callback(err || new Error("Oyuncu bulunamadı!"));

    const wins = result === "win" ? user.wins + 1 : user.wins;
    const losses = result === "loss" ? user.losses + 1 : user.losses;
    const games_played = user.games_played + 1;
    const rating = user.rating + ratingChange;

    db.run(
      `UPDATE bilardo
       SET wins = ?, losses = ?, games_played = ?, rating = ?
       WHERE id = ?`,
      [wins, losses, games_played, rating, id],
      (err2) => {
        if (err2) console.error("updateStatsById error:", err2);
        callback && callback(err2);
      }
    );
  });
}

module.exports = {
  registerUser,
  loginUser,
  getPlayerById,
  updateStatsById
};
