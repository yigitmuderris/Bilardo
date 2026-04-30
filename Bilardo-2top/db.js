const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const db = new sqlite3.Database('./bilardo.db');

// Tablo oluştur
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS bilardo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    password TEXT,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    rating REAL DEFAULT 1000,
    games_played INTEGER DEFAULT 0
  )`);
});

// !register
function registerUser(password, callback) {
  if (!password) return callback(new Error("Şifre boş olamaz!"));

  // Şifreyi hashle
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) return callback(err);

    // Kayıt ekle
    db.run('INSERT INTO bilardo (password) VALUES (?)', [hashedPassword], function(err2) {
      if (err2) return callback(err2);
      callback(null, { id: this.lastID }); // sadece id döner
    });
  });
}

// !login
function loginUser(password, callback) {
  if (!password) return callback(new Error("Şifre boş olamaz!"));

  db.all('SELECT * FROM bilardo', [], async (err, rows) => {
    if (err) return callback(err);
    if (!rows || rows.length === 0) return callback(null, false);

    // Hashleri asenkron kontrol et
    for (const row of rows) {
      try {
        const match = await bcrypt.compare(password, row.password);
        if (match) return callback(null, row);
      } catch (err) {
        return callback(err);
      }
    }

    // Hiçbiri uymadı
    callback(null, false);
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
