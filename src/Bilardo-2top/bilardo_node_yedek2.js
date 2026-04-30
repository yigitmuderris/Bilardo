
require('dotenv').config();
const fs = require("fs");



const { registerUser, loginUser, getPlayerById, updateStatsById } = require('./db');


const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const LOG_FILE = "logs.txt";
const dynamicToken = process.argv[2];



function log(message) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`);
}



const { OperationType, VariableType, ConnectionState, AllowFlags, Direction, CollisionFlags, CameraFollow, BackgroundType, GamePlayState, BanEntryType, Callback, Utils, Room, Replay, Query, Library, RoomConfig, Plugin, Renderer, Errors, Language, EventFactory, Impl } = require("node-haxball")();


const BILARDO = fs.readFileSync("Bilardo.hbs", "utf8");
const WARMUP = fs.readFileSync("BilardoIsınma.hbs", "utf8");


let Bilardo;
try {
  Bilardo = Utils.parseStadium(BILARDO); // Stadium objesi
  console.log("Stadium objesi hazır!");
} catch (err) {
  console.error("Stadium parse hatası:", err);
}

let WarmUp
try {
  WarmUp = Utils.parseStadium(WARMUP); // Stadium objesi
  console.log("Stadium objesi hazır!");
} catch (err) {
  console.error("Stadium parse hatası:", err);
}




Room.create({
  name: "🎱BILARDO | Kurallı 🎱",
  showInRoomList: true,
  noPlayer: true,
  maxPlayerCount: 3,
  token: dynamicToken,
  stadium: Bilardo,
  geo: { code: "TR", lat: 39.9199, lon: 32.8543 },
}, {
  storage: {
    player_name: "wxyz-abcd",
    avatar: "👽"
  },
  onOpen: (room) => {


    console.log("Room opened!");
    console.log("Alınan Token:", dynamicToken);
    room.fakeSetTeamsLock(true);

    try {
      room.setCurrentStadium(Bilardo); // Burada stadium kesin yüklenecek
      console.log("Bilardo map başarıyla yüklendi!");
    } catch (err) {
      console.error("Stadium yükleme hatası:", err);
    }
    const stadium = room.stadium;

    console.log("=== GOALS CENTERS DEBUG ===");
    stadium.goals.forEach((goal, i) => {
      const centerX = (goal.L_.x + goal.d_.x) / 2;
      const centerY = (goal.L_.y + goal.d_.y) / 2;
      console.log(`Goal #${i} center: x=${centerX}, y=${centerY}, renk=${goal.p?.u}`);
    });
    console.log("=============================");

    room.sendAnnouncement("Hello " + room.name);
    room.onAfterRoomLink = (roomLink) => {
      console.log("room link:", roomLink);
    };

    /*
        const REMIND_INTERVAL = 60 * 1000; // 10 saniye
        setInterval(() => {
          room.players.forEach(player => {
            if (!activeLogins.has(player.id)) {
              room.sendAnnouncement(
                "⚠️ Sohbeti kullanabilmek ve Rank alabilmek için giriş yap! !register !login",
                player.id,
                0xFF0000
              );
            } 
          });
        }, REMIND_INTERVAL);
    */
    function updateAdmins() {
      // Get all players
      var players = room.players;
      if (players.length == 0) return; // No players left, do nothing.
      if (players.find((player) => player.admin) != null) return; // There's an admin left so do nothing.

    }


    function logTurnQueue() {
      console.log("🔹 turnQueue:", turnQueue.map(id => room.getPlayer(id)?.name || id));
    }


    room.requireRecaptcha = false;
    room.setScoreLimit(0);
    room.setTimeLimit(0);



    var blacklist = ["blackpill"];
    var whitelist = ["ölü salih", "maytap"]
    let mutedPlayerIds = [];





    let pendingAfk = new Set();
    const loggedInPlayers = new Map();

    // ---------- KOMUT PARSING: onBeforeOperationReceived ----------
    // Bu callback her gelen operation için bir kere çalışır.
    // Return edilen obje onOperationReceived'e customData olarak iletilir.
    room.onBeforeOperationReceived = (type, msg, globalFrameNo, clientFrameNo) => {
      // Chat mesajları tipi 4 (headless/compatibility) — bazı implementasyonlarda Callback.CHAT_MESSAGE da olabilir.
      // Güvenlik için hem 4 hem Callback.CHAT_MESSAGE kontrol edilebilir.
      const CHAT_TYPE = 4;
      if (type === CHAT_TYPE) {

        const playerId = msg.X;

        if (mutedPlayerIds.includes(playerId)) {
          // Susturulan oyuncudan gelen mesajı engelle
          return false;
        }
        const text = (msg && msg.text) ? String(msg.text) : "";
        const trimmed = text.trimEnd();
        const isCommand = trimmed.startsWith("!");
        const data = trimmed.split(" ").filter(s => s.length > 0);

        // Mesaj komut değilse ve chat ise announcement yap
        if (!isCommand) {
          const player = room.getPlayer(playerId);

          if (!activeLogins.has(playerId)) {
            room.sendAnnouncement(`[Kayıtsız] ${player.name}: ${text}`, null, 0xAAAAAA);
            log(`[CHAT_PASSED] ${player.name}: ${text}`);
            console.log(`[CHAT_PASSED] ${player.name}: ${text}`);
          } else {
            // Giriş yapmış oyuncu -> sıfat ve renk
            const { rating, rank } = loggedInPlayers.get(playerId);

            // Rank'e göre renk belirle
            let color = 0xFFFFFF; // default beyaz
            if (rating <= 1000) color = 0xCCBFFF; // Acemi -> gri
            else if (rating <= 1200) color = 0xFFC233; // Orta -> yeşil
            else if (rating <= 1400) color = 0x0000FF; // İyi -> mavi
            else if (rating <= 1600) color = 0xFFA500; // Usta -> turuncu
            else color = 0xFFD700; // Efsane -> altın

            room.sendAnnouncement(`[${rank}] ${player.name}: ${text}`, null, color);
            log(`[CHAT_PASSED] ${player.name}: ${text}`);
            console.log(`[CHAT_PASSED] ${player.name}: ${text}`);
          }

          return false; // normal chat’i engelle
        }

        /* Giriş yapmamışsa ve !register/!login değilse
        if (!activeLogins.has(playerId) && !(text.startsWith("!register") || text.startsWith("!login"))) {
          room.sendAnnouncement("Sohbeti kullanabilmek için giriş yapmalısın. !register  !login", playerId, 0xFF0000);
          return false; // mesaj engellenir
        }  */


        return { isCommand, data, rawText: trimmed };
      }
      return null;
    };


    const afkPlayers = new Set();
    const activeLogins = new Set();

    // ---------- KOMUT İŞLEME: onOperationReceived ----------
    // customData: onBeforeOperationReceived'den gelen obje
    room.onOperationReceived = (type, msg, globalFrameNo, clientFrameNo, customData) => {

      if (!customData || !customData.isCommand) return true;

      // Komut geldi -> işle
      const playerId = msg.X;
      const player = room.getPlayer(playerId);
      const text = msg.text?.trimEnd() || "";

      const command = customData?.data?.[0]?.toLowerCase() || ""; // sadece varsa al


      // 🛑 YENİ KOMUT: !koy (Beyaz Top Yerleştirme)  
      if (command === "!koy") {

        // Sadece doğru oyuncu yerleştirme modundayken komutu işle
        if (isPlacingWhiteBall && player.id === currentPlayer) {

          const playerDisc = room.getPlayerDisc(player.id);

          if (!playerDisc) {
            room.sendAnnouncement("Hata: Piyonunuz (disc) bulunamadı.", player.id, 0xFF0000);
            return false;
          }

          const placementPosition = { x: playerDisc.B.x, y: playerDisc.B.y };
          // 1. GEREKSİNİM: Sınır Kontrolü
          if (isOutsideBounds(placementPosition)) {
            room.sendAnnouncement("❌ Topu masanın dışına yerleştiremezsiniz!", player.id, 0xFF0000);
            return false;
          }

          // 2. GEREKSİNİM: Çarpışma Kontrolü
          // Fonksiyonlar artık sadece 'position' parametresini alıyor.
          if (isColliding(placementPosition)) {
            room.sendAnnouncement("❌ Topu başka bir topun üzerine/yanına yerleştiremezsiniz!", player.id, 0xFF0000);
            return false;
          }


          // Kontroller başarılı: Yerleştirme anonsu ve çağrısı
          room.sendAnnouncement(`✅ Yerleştirildi. Vuruşunu yap!`, player.id, 0x00FF00);

          finishPlacement(player.id, placementPosition);

          return false;
        } else if (isPlacingWhiteBall) {
          room.sendAnnouncement("Şu an top yerleştirme sırası sizde değil.", player.id, 0xFFAA00);
          return false;
        }
      }


      if (command === "!test") {

        if (!player.isAdmin) return false;




        const playerDisc = room.getPlayerDisc(player.id);

        if (!playerDisc) {
          room.sendAnnouncement("Hata: Piyonunuz (disc) bulunamadı.", player.id, 0xFF0000);
          return false;
        }

        const placementPosition = { x: playerDisc.B.x, y: playerDisc.B.y };



        // Kontroller başarılı: Yerleştirme anonsu ve çağrısı
        room.sendAnnouncement(`✅ Yerleştirildi. Vuruşunu yap!`, player.id, 0x00FF00);

        finishPlacement(player.id, placementPosition);

        return false;
      }





      // 🛑 YENİ KOMUT BİTTİ




      // Kullanıcı zaten giriş yaptıysa kayıt/login engelle
      if (activeLogins.has(playerId) && (command === "!register" || command === "!login")) {
        room.sendAnnouncement("Zaten giriş yaptınız!", playerId);
        return false;
      }

      // !register

      if (command === "!register") {
        const password = customData.data[1];

        if (customData.data.length != 2) {
          room.sendAnnouncement("Hatalı kullanım! Sadece !register <password> yazın.", playerId, 0xFF0000);
          return false;
        }

        if (!password) {
          room.sendAnnouncement("Şifre girin! Örn: !register 1234", playerId, 0xFF0000);
          return false;
        }

        registerUser(password, (err, user) => {
          if (err) {
            room.sendAnnouncement(err.message, playerId);
          } else {
            room.sendAnnouncement("✅ Kayıt başarılı! Giriş yapınız: !login", playerId, 0x00FF00);
          }
        });

        return false;
      }

      // !login
      // !login
      if (command === "!login") {
        const password = customData.data[1];

        if (customData.data.length != 2) {
          room.sendAnnouncement("Hatalı kullanım! Sadece !login <password> yazın.", playerId, 0xFF0000);
          return false;
        }

        if (!password) {
          room.sendAnnouncement("Şifre girin! Örn: !login 1234", playerId, 0xFF0000);
          return false;
        }

        // Oyuncu giriş yaptığında
        loginUser(password, (err, user) => {
          if (err || !user) {
            room.sendAnnouncement("❌ Giriş başarısız! ❌", playerId);
          } else {
            // Rating'e göre sıfat belirle
            let rank = "";
            const rating = user.rating || 1000;

            if (rating <= 1000) { rank = "Acemi 🦋"; }
            else if (rating <= 1200) { rank = "Orta 🦍"; }
            else if (rating <= 1400) { rank = "İyi 🐺 "; }
            else if (rating <= 1600) { rank = "Usta 🦁"; }
            else { rank = "Efsane 🐲"; }

            // Oyuncuyu giriş yapanlar listesine ekle
            activeLogins.add(playerId);
            loggedInPlayers.set(playerId, {
              dbId: user.id,
              rating: rating,
              rank: rank,
              name: room.getPlayer(playerId).name // Haxball'daki gerçek isim
            });

            // İsim güncelle
            /*
            const player = room.getPlayer(playerId);
            player.name = ` ${player.name} `;
        
            */

            // Anons
            room.sendAnnouncement(`✅ Giriş başarılı! Rank: ${rank}`, playerId, 0x00FF00);
          }
        });


        return false;
      }




      // !admin <password>
      if (command === "!admin") {
        const password = customData.data[1] || "";
        if (password === ADMIN_PASSWORD) {
          try {
            room.setPlayerAdmin(player.id, true);
            // Özel anons: sadece ilgili oyuncuya göster
            room.sendAnnouncement("Artık admin oldun.", playerId);
            log(`!admin başarılı: ${player ? player.name : playerId} (${playerId})`);
          } catch (err) {
            log(`!admin hata: ${err.message}`);
          }
        } else {
          // Hatalı şifre: kullanıcıya özel uyarı
          room.sendAnnouncement("Hatalı admin şifresi.", playerId);
          log(`!admin başarısız: ${player ? player.name : playerId} (${playerId}) - hatalı şifre`);
        }
        // Komut işlendi — mesajın normal chat'e düşmesini engelle (return false)
        return false;
      }
      if (command === "!help") {
        room.sendAnnouncement("Kullanılabilir komutlar: !login, !register, !stats, !ranking, !ranks, !afk", player.id, 0x999999);

        // Komut işlendi — mesajın normal chat'e düşmesini engelle (return false)
        return false;
      }


      if (command === "!banlast" && player.isAdmin) {
        var players = room.players;
        if (players.length > 1) { // odada en az 2 kişi varsa (admin dahil)
          var lastPlayer = players[players.length - 1]; // en son giren

          try {
            room.kickPlayer(lastPlayer.id, "", true);
            log(`!banlast başarılı: ${player.name} (${playerId})`);

          } catch (err) {
            log(`!banlast hata: ${err.message}`);
          }
        } else {
          room.sendAnnouncement("Banlanacak kimse yok!", player.id);
        }
        return false;
      }





      //  !mute "isim"
      if (command === "!mute") {
        if (!player.isAdmin) return false;

        const textArgs = customData.data.slice(1); // komuttan sonraki argümanlar
        const message = textArgs.join(" ").trim();

        var targetName;

        if (message.startsWith('"')) {
          var endQuote = message.indexOf('"', 1);
          if (endQuote !== -1) {
            targetName = message.slice(1, endQuote).trim();
          } else {
            room.sendAnnouncement("Tırnak hatası! Kullanım: !mute \"isim\"", player.id, 0xFF0000, "bold");
            return false;
          }
        } else {
          room.sendAnnouncement("Tırnak hatası! Kullanım: !mute \"isim\"", player.id, 0xFF0000, "bold");
          return false;
        }

        // Oyuncuyu bul
        const target = room.players.find(p => p.name.toLowerCase() === targetName.toLowerCase());
        if (!target) {
          room.sendAnnouncement("Oyuncu bulunamadı.", player.id, 0xFF0000, "bold");
          return false;
        }

        if (!mutedPlayerIds.includes(target.id)) {
          mutedPlayerIds.push(target.id);
          room.sendAnnouncement(`${target.name} süresiz olarak susturuldu.`, null, 0xFF0000, "bold");
        } else {
          room.sendAnnouncement(`${target.name} zaten susturulmuş.`, player.id, 0xFFAA00, "italic");
        }

        return false;
      }

      //  !unmute "isim"
      if (command === "!unmute") {
        if (!player.isAdmin) return false;

        const textArgs = customData.data.slice(1); // komuttan sonraki argümanlar
        const mesaj = textArgs.join(" ").trim();


        var targetName;

        if (mesaj.startsWith('"')) {
          var endQuote = mesaj.indexOf('"', 1);
          if (endQuote !== -1) {
            targetName = mesaj.slice(1, endQuote).trim();
          } else {
            room.sendAnnouncement("Tırnak hatası! Kullanım: !unmute \"isim\"", player.id, 0xFF0000, "bold");
            return false;
          }
        } else {
          room.sendAnnouncement("Tırnak hatası! Kullanım: !unmute \"isim\"", player.id, 0xFF0000, "bold");
          return false;
        }

        const target = room.players.find(p => p.name.toLowerCase() === targetName.toLowerCase());


        // Oyuncuyu listeden çıkar
        if (!target || !mutedPlayerIds.includes(target.id)) {
          room.sendAnnouncement(`${targetName} zaten susturulmamış.`, player.id, 0xFFAA00, "italic");
          return false;
        }

        mutedPlayerIds = mutedPlayerIds.filter(id => id !== target.id);
        room.sendAnnouncement(`${targetName} tekrar konuşabilir.`, null, 0x00FF00, "bold");
        return false;
      }

      // 🔹 AFK komutu
      if (command === "!afk") {
        const isPlayingNow = gameRunning && turnQueue.slice(0, 2).includes(player.id);

        if (gameRunning) {
          if (!isPlayingNow) {
            // Oyun oynanıyor ama kişi aktif değil -> hemen AFK olabilir
            if (turnQueue.includes(player.id)) {
              turnQueue = turnQueue.filter(id => id !== player.id);
              pendingAfk.add(player.id);
              room.setPlayerTeam(player.id, 0);
              room.sendAnnouncement(`💤 ${player.name} AFK oldu ve sıradan çıkarıldı.`, null, 0xFFAA00);
              logTurnQueue();
            } else {
              // AFK iptal, tekrar sıraya ekle
              pendingAfk.delete(player.id);
              turnQueue.push(player.id);
              room.setPlayerTeam(player.id, 0);
              room.sendAnnouncement(`✅ ${player.name}, tekrar sıraya eklendi.`, null, 0x00FF00);

              if (turnQueue.length === 1) {
                room.stopGame();
                try {
                  room.setCurrentStadium(WarmUp); // Burada stadium kesin yüklenecek
                  console.log("Bilardo map başarıyla yüklendi!");
                } catch (err) {
                  console.error("Stadium yükleme hatası:", err);
                }

                isWarmup = true;
                gameRunning = false;
                currentPlayer = null;
                room.setPlayerTeam(player.id, 0);
                setTimeout(() => {
                  room.sendAnnouncement("Oyunun başlaması için en az iki kişi gerekiyor!");
                  room.sendAnnouncement("🎱 Isınma turu başlatılıyor!", null, 0xFFAA00);
                }, 100);

                setTimeout(() => {
                  room.setPlayerTeam(player.id, 1);
                  room.startGame();
                }, 1500);
              } else if (turnQueue.length === 2) {
                isWarmup = false;
                // Oyun başlıyor

                try {
          room.setCurrentStadium(Bilardo); // Burada stadium kesin yüklenecek
          console.log("Bilardo map başarıyla yüklendi!");
        } catch (err) {
          console.error("Stadium yükleme hatası:", err);
        }
                currentPlayer = turnQueue[0]; // sahadaki
                const nextPlayer = turnQueue[1]; // spectator
                room.setPlayerTeam(currentPlayer, 1);
                room.setPlayerTeam(nextPlayer, 0);

                gameRunning = true;
                winnerId = null;
                loserId = null;
                restartGame();


              }

              logTurnQueue();
            }
          } else {
            // Kişi şu an aktif oyunculardan biri -> oyun bitince AFK olacak
            if (pendingAfk.has(player.id)) {
              pendingAfk.delete(player.id);
              room.sendAnnouncement(`✅ ${player.name}, artık AFK olmayacaksın.`, player.id, 0x00FF00);
            } else {
              pendingAfk.add(player.id);
              room.sendAnnouncement(`🕓 ${player.name}, oyun bitince AFK olacaksın.`, player.id, 0xFFAA00);
            }
          }
        } else {
          // Oyun oynanmıyorsa -> anında AFK veya aktif olabilir
          if (turnQueue.includes(player.id)) {
            turnQueue = turnQueue.filter(id => id !== player.id);
            pendingAfk.add(player.id);
            room.setPlayerTeam(player.id, 0);
            room.sendAnnouncement(`💤 ${player.name} AFK oldu ve sıradan çıkarıldı.`, null, 0xFFAA00);
            logTurnQueue();
          } else {
            pendingAfk.delete(player.id);
            turnQueue.push(player.id);
            room.setPlayerTeam(player.id, 0);
            room.sendAnnouncement(`✅ ${player.name}, tekrar sıraya eklendi.`, player.id, 0x00FF00);
            logTurnQueue();

            if (turnQueue.length === 1) {
              room.stopGame();
              try {
                room.setCurrentStadium(WarmUp); // Burada stadium kesin yüklenecek
                console.log("Bilardo map başarıyla yüklendi!");
              } catch (err) {
                console.error("Stadium yükleme hatası:", err);
              }

              isWarmup = true;
              gameRunning = false;
              currentPlayer = null;
              room.setPlayerTeam(player.id, 0);
              setTimeout(() => {
                room.sendAnnouncement("Oyunun başlaması için en az iki kişi gerekiyor!");
                room.sendAnnouncement("🎱 Isınma turu başlatılıyor!", null, 0xFFAA00);
              }, 100);

              setTimeout(() => {
                room.setPlayerTeam(player.id, 1);
                room.startGame();
              }, 1500);
            } else if (turnQueue.length === 2) {
              isWarmup = false;
              // Oyun başlıyor
              try {
                room.setCurrentStadium(Bilardo); // Burada stadium kesin yüklenecek
                console.log("Bilardo map başarıyla yüklendi!");
              } catch (err) {
                console.error("Stadium yükleme hatası:", err);
              }


              currentPlayer = turnQueue[0]; // sahadaki
              const nextPlayer = turnQueue[1]; // spectator
              room.setPlayerTeam(currentPlayer, 1);
              room.setPlayerTeam(nextPlayer, 0);

              gameRunning = true;
              winnerId = null;
              loserId = null;
              restartGame();


            }
          }
        }

        return false;
      }
      // !ranks
      if (command === "!ranks") {

        // Rütbe ve Puan Sınırlarının Tanımı
        const rankList = [
          { limit: "1000 Puan ve Altı", name: "Acemi 🦋" },
          { limit: "1001 - 1200 Puan", name: "Orta 🦍" },
          { limit: "1201 - 1400 Puan", name: "İyi 🐺 " },
          { limit: "1401 - 1600 Puan", name: "Usta 🦁" },
          { limit: "1601 Puan ve Üzeri", name: "Efsane 🐲" }
        ];

        let message = "🏅 **Rütbe Seviyeleri ve Puan Gereksinimleri:**\n";

        rankList.forEach(rank => {
          message += `${rank.name.trim()}: ${rank.limit}\n`;
        });

        room.sendAnnouncement(
          message,
          null, // Herkese gönder
          0x98FB98
        );

        return false;
      }
      //!ranking (Sadece puanı gösterir)
      if (command === "!ranking") {
        const session = loggedInPlayers.get(player.id);

        if (!session) {
          room.sendAnnouncement("❌ Puanınızı görmek için önce !login ile giriş yapmalısınız.", player.id, 0xFF0000);
          return false;
        }

        const ratingDisplay = session.rating !== undefined ? session.rating : 'N/A';
        const rating = session.rating || 1000;

        // Rütbe Belirleme Mantığı
        let rank = "";
        if (rating <= 1000) { rank = "Acemi 🦋"; }
        else if (rating <= 1200) { rank = "Orta 🦍"; }
        else if (rating <= 1400) { rank = "İyi 🐺 "; }
        else if (rating <= 1600) { rank = "Usta 🦁"; }
        else { rank = "Efsane 🐲"; }

        room.sendAnnouncement(
          `🏆 ${player.name} | Güncel Puanınız (Rating): ${ratingDisplay} | Rütbe: ${rank}`,
          player.id,
          0xADD8E6
        );

        return false;
      }
      //  !stats (Tüm istatistikleri gösterir)
      if (command === "!stats") {
        const session = loggedInPlayers.get(player.id);
        const dbId = session ? session.dbId : null;

        if (!dbId) {
          room.sendAnnouncement("❌ İstatistiklerinizi görmek için önce !login ile giriş yapmalısınız.", player.id, 0xFF0000);
          return false;
        }

        // DB'den güncel verileri çek
        getPlayerById(dbId, (err, userData) => {
          if (err || !userData) {
            room.sendAnnouncement("İstatistikleriniz çekilemedi veya veritabanında bulunamadı.", player.id, 0xFF0000);
            return;
          }

          const ratingDisplay = userData.rating !== undefined ? userData.rating : '1000.00';
          const rating = userData.rating || 1000;

          // Rütbe Belirleme Mantığı
          let rank = "";
          if (rating <= 1000) { rank = "Acemi 🦋"; }
          else if (rating <= 1200) { rank = "Orta 🦍"; }
          else if (rating <= 1400) { rank = "İyi 🐺 "; }
          else if (rating <= 1600) { rank = "Usta 🦁"; }
          else { rank = "Efsane 🐲"; }

          const statsMessage = `📊 ${player.name} İstatistikleri:
Rütbe: ${rank}
Toplam Oyun: ${userData.games_played || 0}
Galibiyet (W): ${userData.wins || 0}
Mağlubiyet (L): ${userData.losses || 0}
Rating (Puan): ${ratingDisplay}`.trim();

          room.sendAnnouncement(statsMessage, player.id, 0xADD8E6);
        });

        return false;
      }
      // -----------------------------------------------------
      // 🛑 GEÇERSİZ KOMUT KONTROLÜ (TÜM KOMUTLARDAN SONRA)
      // -----------------------------------------------------
      if (text.startsWith('!')) {

        // 'text' değişkeni, mesajın tamamını içerir. 'command' değişkenini kullanalım.
        room.sendAnnouncement(
          `⚠️ Hata: '${command}' geçerli bir komut değil. Lütfen doğru komut kullandığınızdan emin olun. Komutlar için !help`,
          playerId,
          0xFFA500
        );

        return false;
      }



      // Eğer başka komutlar eklenecekse buraya ekle.
      // Komut değilse varsayılan davranış:
      return true;
    };



    let turnQueue = [];
    let teams = {};
    let currentPlayer = null;
    let playerColors = {};   // { playerId: "mavi" | "red" }
    let playerScores = {};   // { playerId: sayı }// son vuruşta top girdi mi
    let gameRunning = false;
    let alreadyRestarted = false;
    let isWarmup = false;

    const TOTAL_COLOR_BALLS = { mavi: 7, red: 7 }; // kendi renk top sayısı

    room.onPlayerJoin = (player) => {
      console.log(`${player.name} odaya katıldı.`);
      log(`${player.name} odaya katıldı.`);

      console.log("Pending AFK:", Array.from(pendingAfk));

      setTimeout(() => {
        room.sendAnnouncement(`${player.name} Hoşgeldin 🖐️`, player.id);
        room.sendAnnouncement(`⚠️ Rank alabilmek için !register !login`, player.id, 0xFFAA00);
        room.sendAnnouncement(` Komutları görmek için !help `, player.id, 0x999999, false);
        room.sendAnnouncement(`Hız ayarı var, siyah halkayla temas ederken topa vurabilirsin! `, player.id, 0xFF0000, false);


      }, 20);

      turnQueue.push(player.id);
      logTurnQueue();



      // Takımları sabitle





      if (turnQueue.length === 1) {
        room.stopGame();
        try {
          room.setCurrentStadium(WarmUp); // Burada stadium kesin yüklenecek
          console.log("Bilardo map başarıyla yüklendi!");
        } catch (err) {
          console.error("Stadium yükleme hatası:", err);
        }

        isWarmup = true;
        gameRunning = false;
        currentPlayer = null;
        room.setPlayerTeam(player.id, 0);
        setTimeout(() => {
          room.sendAnnouncement("Oyunun başlaması için en az iki kişi gerekiyor!");
          room.sendAnnouncement("🎱 Isınma turu başlatılıyor!", null, 0xFFAA00);
        }, 100);

        setTimeout(() => {
          room.setPlayerTeam(player.id, 1);
          room.startGame();
        }, 1500);
      } else if (turnQueue.length === 2) {
        isWarmup = false;
        // Oyun başlıyor

        try {
          room.setCurrentStadium(Bilardo); // Burada stadium kesin yüklenecek
          console.log("Bilardo map başarıyla yüklendi!");
        } catch (err) {
          console.error("Stadium yükleme hatası:", err);
        }

        currentPlayer = turnQueue[0]; // sahadaki
        const nextPlayer = turnQueue[1]; // spectator
        room.setPlayerTeam(currentPlayer, 1);
        room.setPlayerTeam(nextPlayer, 0);

        gameRunning = true;
        winnerId = null;
        loserId = null;
        restartGame();

        setTimeout(() => {
          room.sendAnnouncement(`🎬 Oyun başladı! ${room.getPlayer(currentPlayer).name} 🆚 ${room.getPlayer(nextPlayer).name}`, null, 0x00FF99);
          startTurnTimer(currentPlayer);
        }, 200);
      } else {
        if (turnQueue.length > 2) {
          isWarmup = false;

          
          firstPlayer = room.getPlayer(turnQueue[0]);
          secondPlayer = room.getPlayer(turnQueue[1]);

        }
        // Fazla oyuncular spectator
        room.setPlayerTeam(player.id, 0);
        setTimeout(() => {
          room.sendAnnouncement("Oyun oynanıyor, sıranı bekle", player.id);
          if (turnQueue.length > 2) {
            room.sendAnnouncement(`Oynanan oyun: ${firstPlayer.name} 🆚 ${secondPlayer.name}`, player.id, 0x0066FFFF)

          }
        }, 100);
      }

      console.log("join check:", { gameRunning, length: turnQueue.length });

      if (gameRunning && turnQueue.length >= 2) {
        console.log("join check:", { gameRunning, length: turnQueue.length });

        // Oyun zaten başlamış, yeni oyuncu spectator
        room.setPlayerTeam(player.id, 0);
        room.sendAnnouncement("Oyun oynanıyor, sıranı bekle.", player.id);
        return;
      }




      // anons


      // blacklist kontrolü
      if (blacklist.includes(player.name.toLowerCase())) {
        room.kickPlayer(player.id, "", true);
        return false;
      }

      // whitelist kontrolü
      var index = whitelist.indexOf(player.name.toLowerCase());
      if (index != -1) {
        room.setPlayerAdmin(player.id, true);
        room.sendAnnouncement("bu abi biri");
        whitelist.splice(index, 1);
      }

      // isim kontrolü
      let name = player.name || "";

      // normalize (bazı Unicode farklarını düzleştirir)
      name = name.normalize("NFKC");

      // Görünmez ve boşluk karakterlerini temizle
      const invisibleRegex = /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u200F\u2028-\u202F\u205F\u2060\u3000\u3164\uFEFF\u2800]/g;
      name = name.replace(invisibleRegex, "");

      // İsim tamamen boşsa kickle
      if (name.length === 0) {
        room.kickPlayer(player.id, "isim koy", false);
        return;
      }

    }

    function endGame(winnerObject, loserObject) {
      // Loser'ın varlığını kontrol etmek önemlidir (maç 2 kişiden azsa sorun çıkabilir)
      if (!winnerObject || !loserObject) return;

      // 1. Maçtaki oyuncuların aktif DB oturumlarını (ID'lerini) al
      // loggedInPlayers.get sadece maçtaki oyuncu ID'si ile eşleşiyorsa true döner.
      const winnerSession = loggedInPlayers.get(winnerObject.id);
      const loserSession = loggedInPlayers.get(loserObject.id);

      const winnerDbId = winnerSession ? winnerSession.dbId : null;
      const loserDbId = loserSession ? loserSession.dbId : null;

      let ratingChange = 10;

      // -----------------------------------------------------------
      // 1️⃣ KAZANAN KAYITLI, KAYBEDEN KAYITSIZ 
      // -----------------------------------------------------------
      if (winnerDbId && !loserDbId) {
        ratingChange = 3;

        getPlayerById(winnerDbId, (err, winnerData) => {
          if (err || !winnerData) return console.error(err || "Kazanan DB’de yok!");

          const newRating = (winnerData.rating || 1000) + ratingChange;

          updateStatsById(winnerDbId, "win", ratingChange, (err) => {
            if (err) return console.error(err);

            room.sendAnnouncement(`🏆 ${winnerObject.name} kayıtsız rakibi yendi!`, null, 0x00FF00);
            room.sendAnnouncement(` ${winnerObject.name} Rating: ${winnerData.rating || 1000} → ${newRating}`, null, 0x00FF00);
          });
        });
        return;
      }

      // -----------------------------------------------------------
      // 2️⃣ KAZANAN KAYITSIZ, KAYBEDEN KAYITLI 
      // -----------------------------------------------------------
      if (!winnerDbId && loserDbId) {
        ratingChange = 3;
        getPlayerById(loserDbId, (err, loserData) => {
          if (err || !loserData) return console.error(err || "Kaybeden DB’de yok!");
          const loserOldRating = loserData.rating || 1000;
          const loserNewRating = loserOldRating - ratingChange;

          updateStatsById(loserDbId, "loss", -ratingChange, (err) => {
            if (err) return console.error(err);

            room.sendAnnouncement(`⚠️ Kayıtsız oyuncu (${winnerObject.name}) kazandı. ${loserObject.name} puan kaybetti!`, null, 0xFFAA00);
            room.sendAnnouncement(` ☠️ ${loserObject.name} Rating: ${loserOldRating} → ${loserNewRating}`, null, 0xFF0000);
          });
        });
        return;
      }

      // -----------------------------------------------------------
      // 3️⃣ HER İKİSİ DE KAYITSIZ 
      // -----------------------------------------------------------
      if (!winnerDbId && !loserDbId) {
        room.sendAnnouncement(`⚠️ ${winnerObject.name} ve ${loserObject.name} kayıtsız oynadı. Rating değişimi yok. Kayıt ol: !register`, null, 0xFFAA00);
        return;
      }

      // -----------------------------------------------------------
      // 4️⃣ HER İKİSİ DE KAYITLI (Normal İşlem)
      // -----------------------------------------------------------
      // Bu bloğa sadece winnerDbId ve loserDbId dolu ise gelinir.

      getPlayerById(winnerDbId, (err, winnerData) => {
        if (err || !winnerData) return console.error("Kazanan DB’de yok!");

        getPlayerById(loserDbId, (err, loserData) => {
          if (err || !loserData) return console.error("Kaybeden DB’de yok!");

          const winnerOldRating = winnerData.rating || 1000;
          const loserOldRating = loserData.rating || 1000;

          updateStatsById(winnerDbId, "win", ratingChange, (err) => {
            if (err) return console.error(err);

            updateStatsById(loserDbId, "loss", -ratingChange, (err) => {
              if (err) return console.error(err);

              // Yeni ratingleri çekme
              getPlayerById(winnerDbId, (err, newWinnerData) => {
                getPlayerById(loserDbId, (err, newLoserData) => {
                  const winnerNewRating = newWinnerData.rating;
                  const loserNewRating = newLoserData.rating;

                  room.sendAnnouncement(`🏆 ${winnerObject.name} Rating: ${winnerOldRating} → ${winnerNewRating}`, null, 0x00FF00);
                  room.sendAnnouncement(`💀 ${loserObject.name} Rating: ${loserOldRating} → ${loserNewRating}`, null, 0xFF0000);
                });
              });
            });
          });
        });
      });
    }

    function processPendingAfk() {

      pendingAfk.forEach(playerId => {
        turnQueue = turnQueue.filter(id => id !== playerId);
        const player = room.getPlayer(playerId);
        if (player) {
          room.sendAnnouncement(`💤 ${player.name} AFK.`, null, 0xFFAA00);
          room.setPlayerTeam(playerId, 0);
        }


      });
      console.log("Pending AFK:", Array.from(pendingAfk));
    }

    function restartGame() {

      // oyun durumunu sıfırla
      scoredDiscs.clear();
      scoredThisTurn.clear();
      scoredOrder = [];
      playerScores = {};
      playerColors = {};
      lastPlayer = null;
      isColorAssigned = false;
      isPlacingWhiteBall = false;
      whiteAlreadyAnnounced.clear();

      if (isWarmup) return;

      room.stopGame();

      if (turnQueue.length <= 1) return;

      // Kaybedeni sona at, kazanan yerinde kalır
      if (loserId) {
        // room.getPlayer(loserId) kullanarak oyuncunun hala odada olup olmadığını KONTROL ET!
        const loserPlayer = room.getPlayer(loserId);

        if (loserPlayer) {
          // 1. Oyuncu hala odadaysa: Kuyruktan çıkar ve sona ekle (sıra değiştirmek için).
          turnQueue = turnQueue.filter(id => id !== loserId);
          turnQueue.push(loserId);
        } else {
          // 2. Oyuncu odadan ÇIKMIŞSA (loserPlayer null): Kuyruktan tamamen çıkarıldığından emin ol.
          // Bu, kuyruğa hayalet oyuncu eklenmesini engeller.
          turnQueue = turnQueue.filter(id => id !== loserId);
        }
      }



      console.log("Process pendingden önce: ", turnQueue.map(id => room.getPlayer(id)?.name || id));

      processPendingAfk();

      console.log("Process pendingden sonra: ", turnQueue.map(id => room.getPlayer(id)?.name || id));




      if (turnQueue.length <= 1) {
        room.stopGame();
        try {
          room.setCurrentStadium(WarmUp); // Burada stadium kesin yüklenecek
          console.log("Bilardo map başarıyla yüklendi!");
        } catch (err) {
          console.error("Stadium yükleme hatası:", err);
        }

        isWarmup = true;
        gameRunning = false;
        currentPlayer = null;
        player = room.getPlayer(turnQueue[0]);
        room.setPlayerTeam(player.id, 0);
        setTimeout(() => {
          room.sendAnnouncement("Oyunun başlaması için en az iki kişi gerekiyor!");
          room.sendAnnouncement("🎱 Isınma turu başlatılıyor!", null, 0xFFAA00);
        }, 100);

        setTimeout(() => {
          room.setPlayerTeam(player.id, 1);
          room.startGame();
        }, 1500);
        return;
      }


      const first = turnQueue[0];
      const second = turnQueue[1];

      currentPlayer = first;



      // Herkesi specte al
      turnQueue.forEach(id => room.setPlayerTeam(id, 0));

      if (first) room.setPlayerTeam(first, 1);
      if (second) room.setPlayerTeam(second, 0);

      gameRunning = true;
      winnerId = null;
      loserId = null;

      setTimeout(() => {

        room.sendAnnouncement(`🔄 Yeni tur: ${room.getPlayer(first)?.name} 🆚 ${room.getPlayer(second)?.name}`, null, 0x0066FFFF);
        room.startGame();


      }, 1500);

      setTimeout(() => {
        startTurnTimer(currentPlayer);
      }, 3000);

      console.log("🔹 turnQueue:", turnQueue.map(id => room.getPlayer(id)?.name || id));


    }

    leavingPlayer = {};

    room.onPlayerLeave = (player) => {
      console.log(`${player.name} odadan ayrıldı.`);
      log(`${player.name} odaya katıldı.`);
      console.log("Pending AFK:", Array.from(pendingAfk));

      const isAFK = pendingAfk.has(player.id);




      const wasCurrentPair = [turnQueue[0], turnQueue[1]].includes(player.id);

      if (wasCurrentPair && !isAFK) {
        processPendingAfk();
        clearTimeout(black_whiteballcheck);

        // 1. Yerleştirme durumunu ve zamanlayıcıyı İPTAL ET
        isPlacingWhiteBall = false;
        clearTimeout(placementTimer);
        placementPlayerId = null; // Sekans ID'sini sıfırla
        // oyun durumunu sıfırla
        scoredDiscs.clear();
        scoredThisTurn.clear();
        scoredOrder = [];
        playerScores = {};
        playerColors = {};
        lastPlayer = null;
        isColorAssigned = false;
        isPlacingWhiteBall = false;
        whiteAlreadyAnnounced.clear();
      }
      // Player objesini sakla
      let leavingPlayer = { id: player.id, name: player.name };


      if (isPlacingWhiteBall && wasCurrentPair) {

        // 1. Yerleştirme durumunu ve zamanlayıcıyı İPTAL ET
        isPlacingWhiteBall = false;
        clearTimeout(placementTimer);
        placementPlayerId = null; // Sekans ID'sini sıfırla
        playerColors = {};

        room.sendAnnouncement(`⚠️ ${player.name} beyaz topu yerleştirirken çıktı. Yerleştirme iptal edildi.`, null, 0xFF0000);
      }




      // Oyuncuyu listeden çıkar
      turnQueue = turnQueue.filter(id => id !== player.id);
      logTurnQueue();




      // Eğer kimse kalmadıysa
      if (turnQueue.length === 0) {
        isWarmup = false;
        gameRunning = false;
        room.stopGame();
        currentPlayer = null;
        if (turnTimer) clearTimeout(turnTimer);
        room.sendAnnouncement("Tüm oyuncular çıktı, oyun durdu.", null, 0xFF0000);
        return;
      }

      // Eğer tek kişi kaldıysa
      if (turnQueue.length === 1) {
        room.stopGame();
        try {
          room.setCurrentStadium(WarmUp); // Burada stadium kesin yüklenecek
          console.log("Bilardo map başarıyla yüklendi!");
        } catch (err) {
          console.error("Stadium yükleme hatası:", err);
        }

        const remaining = turnQueue[0];

        remainingPlayer = room.getPlayer(remaining);



        // Oyunu bitir
        if (!isAFK && !alreadyRanked) {


          room.sendAnnouncement(`💀 ${player.name} çıktı! ${room.getPlayer(remaining)?.name || "Birisi"} kazandı!`, null, 0x00FF00);

          // Eğer içeride kalan oyuncu giriş yapmışsa endGame çalışmalı
          if (activeLogins.has(remainingPlayer.id)) {

            endGame(remainingPlayer, leavingPlayer);

          } else {
            endGame(remainingPlayer, leavingPlayer);
            room.sendAnnouncement(
              `⚠️ Rank sahibi olmak için giriş yapmalısın. !register`,
              remainingPlayer.id,
              0xFFAA00
            );

          }




        } else {

          if (activeLogins.has(remainingPlayer.id)) {

            endGame(remainingPlayer, leavingPlayer);

          } else {
            endGame(remainingPlayer, leavingPlayer);
            room.sendAnnouncement(
              `⚠️ Rank sahibi olmak için giriş yapmalısın. !register`,
              remainingPlayer.id,
              0xFFAA00
            );
          }

          room.sendAnnouncement(`💀 ${leavingPlayer.name} çıktı!`, null, 0x00FF00);
        }



        room.setPlayerTeam(remaining, 0);
        gameRunning = false;
        room.stopGame();
        room.setPlayerTeam(remaining, 0);
        setTimeout(() => {
          room.sendAnnouncement("Oyunun başlaması için en az iki kişi gerekiyor!");
          room.sendAnnouncement("🎱 Isınma turu başlatılıyor!", null, 0xFFAA00);

          isWarmup = true;
          gameRunning = false;
        }, 1000);
        setTimeout(() => {
          room.setPlayerTeam(remainingPlayer.id, 1);
          room.startGame();
        }, 1500);
        if (turnTimer) clearTimeout(turnTimer);
        return;
      }



      // Eğer sahadaki iki oyuncudan biri çıktıysa
      if (wasCurrentPair) {
        const remaining = turnQueue[0]; // kalan oyuncu sahada kalır
        remainingPlayer = room.getPlayer(remaining);


        logTurnQueue();

        console.log("Already Ranked çıktıdan önce:", alreadyRanked);

        if (alreadyRestarted) {
          room.sendAnnouncement(`💀 ${player.name} çıktı!`, null, 0x00FF00);

        } else {
          room.sendAnnouncement(`💀 ${player.name} çıktı! ${room.getPlayer(remaining)?.name || "Birisi"} kazandı!`, null, 0x00FF00);
          if (!isAFK && !alreadyRanked) {
            if (activeLogins.has(remainingPlayer.id)) {
              endGame(remainingPlayer, leavingPlayer);
            } else {

              endGame(remainingPlayer, leavingPlayer);
              room.sendAnnouncement(
                `⚠️ Rank sahibi olmak için giriş yapmalısın. !register`,
                remainingPlayer.id,
                0xFFAA00
              );
            }
          }

        }




        gameRunning = false;
        if (!isWarmup) {
          room.stopGame();
        }

        if (!alreadyRestarted) {
          setTimeout(() => {
            restartGame();

          }, 2000);
        }


        return;
      }



      // Geriye sadece sıradakiler kaldıysa — sorun yok
      room.sendAnnouncement(`${player.name} sıradayken çıktı.`, null, 0x999999);
      updateAdmins();

      if (isAFK) {
        pendingAfk.delete(player.id);

      }
      alreadyRanked = false;
    };



    room.onPlayerChat = (playerId, message) => {


      const player = room.getPlayer(playerId);

      console.log(`${player.name} mesaj attı: ${message} `);
      log(`${player.name} mesaj attı: ${message} `);

    }

    function startTurnTimer(playerId) {

      if (!gameRunning) return;

      // Önce eski zamanlayıcıyı durdur
      if (turnTimer) {
        clearTimeout(turnTimer);
        turnTimer = null;
      }

      const player = room.getPlayer(playerId);
      if (!player) return;
      if (room.players.length === 1) room.sendAnnouncement("Oyunun başlaması için en az iki kişi gerekiyor!");
      room.sendAnnouncement(`⏳ ${player.name} vuruş için 1 dakikası var!`, null, 0xFFFF00, 0, false);



      turnTimer = setTimeout(() => {
        const opponentId = turnQueue.find(id => id !== playerId);
        const opponent = room.getPlayer(opponentId);

        room.sendAnnouncement(`⌛ ${player.name} 1 dakika içinde vuruş yapmadı!`, null, 0xFF0000);

        if (opponent) {
          room.sendAnnouncement(`🏆 ${opponent.name} kazandı!`, null, 0x00FF00);

          winnerId = opponentId;
          loserId = playerId;
          winnerObject = room.getPlayer(winnerId);
          loserObject = room.getPlayer(loserId);

          setTimeout(() => {
            if (activeLogins.has(winnerObject.id)) {
              endGame(winnerObject, loserObject);
            } else {
              endGame(winnerObject, loserObject);
              room.sendAnnouncement(
                `⚠️ Rank sahibi olmak için giriş yapmalısın. !register`,
                winnerObject.id,
                0xFFAA00
              );
            }

          }, 2500);

          // Kaybedeni sahadan çıkar
          room.setPlayerTeam(loserId, 0);
          turnQueue = turnQueue.filter(id => id !== loserId);
          turnQueue.push(loserId);
          logTurnQueue();


          restartGame();
        } else {
          room.sendAnnouncement(`💀 ${player.name} süreyi kaçırdı, oyun durdu.`, player.id, 0xFF0000);
          gameRunning = false;
          room.stopGame();
        }
      }, TURN_TIME_LIMIT);
    }

    const MIN_BOOST = 0;
    const MAX_BOOST = 37;
    const MAX_DISTANCE = 200;

    function computeBoost(distance) {
      const t = Math.min(distance / MAX_DISTANCE, 1);
      return MIN_BOOST + t * (MAX_BOOST - MIN_BOOST);
    }

    function spawnNextPlayer(room, nextPlayerId) {
      const cueBall = room.getDisc(0);
      if (!cueBall) return;

      const spawnX = cueBall.B.x > 0 ? 440 : -440;

      room.setPlayerDiscProperties(nextPlayerId, { x: spawnX, y: 0 });
      console.log(`🎯 Sıradaki oyuncu ${room.getPlayer(nextPlayerId)?.name || "bilinmeyen"} ${spawnX > 0 ? "sağ" : "sol"} tarafta spawnlandı.`);
    }



    let scoredDiscs = new Set();   // Hangi topların deliğe girdiğini tutar
    let scoredThisTurn = new Set(); // O vuruşta hangi toplar girdi
    let scoredOrder = [];           // Sıra ve top renk bilgisi
    let lastPlayer = null;          // Son vuruş yapan oyuncu
    let winnerId = null;
    let loserId = null;
    let turnTimer = null;
    const TURN_TIME_LIMIT = 60 * 1000; // 1 dakika
    let colorHex;
    let placementPlayerId = null;




    // 🔸 BEYAZ TOP TANIMI (Düzeltildi)
    const WHITE_BALL_DISCS = [0, 1]; // Beyaz top artık 0 ve 1 disklerinden oluşuyor
    // 🔸 FAUL VE TUR KONTROLÜ
    let firstContactDiscId = null; // O turda beyaz topun değdiği ilk geçerli topun ID'si
    let isPlacingWhiteBall = false; // Şu an top yerleştirme aşamasında mıyız?
    const BALL_PLACEMENT_TIMEOUT = 30000; // Yerleştirme süresi (30 saniye)
    let placementTimer = null; // Yerleştirme için zamanlayıcı
    let black_whiteballcheck = null;

    function startBallPlacement(playerId) {
      isPlacingWhiteBall = true;
      currentPlayer = playerId;
      placementPlayerId = playerId;

      // Beyaz topların hızını sıfırla ve merkeze taşı (Yerleştirilene kadar)
      WHITE_BALL_DISCS.forEach(id => {
        room.setDiscProperties(id, { x: 50000, y: -50000, xspeed: 0, yspeed: 0 });
      });



      // Oyuncuyu sahanın ortasına koy

      room.setPlayerTeam(playerId, 1);
      room.setPlayerDiscProperties(playerId, { x: 0, y: 0 });



      room.sendAnnouncement(`🟡 ${room.getPlayer(playerId).name} (renk: ${playerColors[playerId] || "henüz belirsiz"}) , beyaz topu koymak için sahada.`, null, 0xFFFF00, "bold");
      room.sendAnnouncement(`🟡 Topu koymak istediğiniz yerin üzerine gelin ve !koy yazın. (30 sn süreniz var)`, null, 0xFFFF00, "bold");


      clearTimeout(placementTimer);
      placementTimer = setTimeout(() => {
        // Süre dolarsa varsayılan konuma koy (Merkez)
        const defaultPos = { x: 0, y: 0 };
        finishPlacement(playerId, defaultPos);
        room.sendAnnouncement(`Süre doldu, beyaz top varsayılan konuma yerleştirildi.`, null, 0xFF0000);
      }, BALL_PLACEMENT_TIMEOUT);
    }

    function finishPlacement(playerId, position) {
      isPlacingWhiteBall = false;
      clearTimeout(placementTimer);

      // ⚠️ Beyaz Topun İKİ DİSKİNİ de yerleştir
      WHITE_BALL_DISCS.forEach(id => {
        room.setDiscProperties(id, {
          x: position.x,
          y: position.y,
          xspeed: 0,
          yspeed: 0
        });
      });

      room.setPlayerTeam(playerId, 0); // Oyuncuyu specte al

      // Vuruş hakkını ver ve turu başlat
      // İçerideki setTimeout bloğu
      setTimeout(() => {
        // 🚨 BU SATIR, SENİN spawnNextPlayer fonksiyonunun YAPMADIĞI TAKIM ATAMASINI YAPIYOR
        room.setPlayerTeam(playerId, 1);

        // Şimdi oyuncu Team 1'de, disc'i spawnlanabilir ve vuruş yapabilir.
        spawnNextPlayer(room, playerId);
        startTurnTimer(playerId);
        // ...
      }, 500);
    }




    // GLOBAL SABİTLER
    const TOP_RADIUS = 11;
    const PIYON_RADIUS = 18;
    let isColorAssigned = false;

    // Çarpışma için: Top vs Top (11+11=22) + Güvenlik Tamponu (1) kullanıldı.
    const MIN_DISTANCE_COLLISION = TOP_RADIUS + TOP_RADIUS + 1; // 11 + 11 + 1 = 23
    const MIN_DISTANCE_SQUARED = MIN_DISTANCE_COLLISION * MIN_DISTANCE_COLLISION;

    /**
     * Masanın Sınır Kontrolü (Boundary Check)
     */
    function isOutsideBounds(position) {
      // Kısıtlı bölgenin ham koordinatları
      const X_LIMIT_MIN = -356;
      const X_LIMIT_MAX = 356;
      const Y_LIMIT_MIN = -180;
      const Y_LIMIT_MAX = 173;

      // Topun yarıçapını (TOP_RADIUS=11) sınırlardan düşerek güvenli alanı hesapla
      const X_MIN_SAFE = X_LIMIT_MIN + TOP_RADIUS; // -356 + 11 = -345
      const X_MAX_SAFE = X_LIMIT_MAX - TOP_RADIUS; // 356 - 11 = 345
      const Y_MIN_SAFE = Y_LIMIT_MIN + TOP_RADIUS; // -154 + 11 = -143
      const Y_MAX_SAFE = Y_LIMIT_MAX - TOP_RADIUS; // 150 - 11 = 139

      // X veya Y koordinatı güvenli alanın dışındaysa, sınır ihlali var demektir.
      if (position.x < X_MIN_SAFE || position.x > X_MAX_SAFE ||
        position.y < Y_MIN_SAFE || position.y > Y_MAX_SAFE) {
        return true;
      }
      return false;
    }

    /**
     * Diğer Toplarla Çarpışma Kontrolü (Collision Check) - Global 'room' değişkenini kullanır.
     */
    function isColliding(position) {
      const discs = room.getDiscs(); // Global 'room' değişkenini kullanır

      // Disc 0 ve 1 (Beyaz Top) hariç tüm topları kontrol et (2'den başlar)
      for (let id = 2; id <= 16; id++) {
        const disc = discs[id];
        if (!disc) continue;

        const dx = disc.B.x - position.x;
        const dy = disc.B.y - position.y;
        const distanceSquared = dx * dx + dy * dy;

        // console.log(`Çarpışma Kontrolü: Pozisyon (${position.x}, ${position.y}) ile Disc ID ${id} arasındaki mesafe karesi: ${distanceSquared}`);

        if (distanceSquared < MIN_DISTANCE_SQUARED) {
          return true; // Çarpışma tespit edildi
        }
      }
      return false;
    }

    room.onCollisionDiscVsDisc = (discId1, discPlayerId1, discId2, discPlayerId2) => {

      // 🛑 1. KONTROL: Bu tur için zaten bir "İlk Temas" kaydettik mi?
      // Eğer kaydettiysek, sonraki sekip çarpmalar bizi ilgilendirmez. Çık.
      if (firstContactDiscId !== null) return;

      let hitDiscId = null;

      // 🕵️ 2. KONTROL: Çarpışanlardan biri Beyaz Top (0) mu?
      // HaxBall bazen (0, 5) bazen (5, 0) diye verir. İkisini de kontrol etmeliyiz.
      if (discId1 === 0) {
        hitDiscId = discId2; // Demek ki beyaz top discId2'ye çarptı
      } else if (discId2 === 0) {
        hitDiscId = discId1; // Demek ki beyaz top discId1'e çarptı
      }

      // Eğer çarpışmada Beyaz Top yoksa (örn: iki kırmızı top çarpıştı), bizi ilgilendirmez.
      if (hitDiscId === null) return;

      // 🎯 3. KONTROL: Çarptığımız şey geçerli bir bilardo topu mu?
      // (Duvarlara, köşe bentlere veya görünmez sensörlere çarparsa sayma)
      // discInfo listende bu ID var mı? Ve ignored listesinde değil mi?
      if (discInfo[hitDiscId] && !ignoredDiscIndices.has(hitDiscId)) {

        // BINGO! Beyaz topun vuruş sonrası değdiği İLK topu bulduk.
        firstContactDiscId = hitDiscId;
        if (!isWarmup) {
          room.sendAnnouncement(`🎯 İlk temas: ${discInfo[hitDiscId].color} `, null, 0x00FF00, 0, false);
          // Konsola yazıp görebilirsin
          console.log(`✅ İLK TEMAS KAYDEDİLDİ: ${discInfo[hitDiscId].color} (ID: ${hitDiscId})`);
        }
      }
    };




    room.onPlayerBallKick = (playerId) => {


      const player = room.getPlayer(playerId);


      if (!isWarmup) {
        if (!player || turnQueue.length < 2) return;
        if (player.id !== currentPlayer) return;
        if (winnerId || loserId) return;
      }

      console.log("=== BallKick Başladı ===");
      console.log("Player:", player.name, player.id);
      console.log("CurrentPlayer:", currentPlayer);
      console.log("GameRunning:", gameRunning);
      console.log("TurnQueue:", turnQueue);


      clearTimeout(turnTimer);

      lastPlayer = player;
      scoredThisTurn.clear();
      lastTurnResult = null; // her vuruş başında sıfırla
      firstContactDiscId = null;

      // Geçici specte al
      if (!isWarmup) {
        setTimeout(() => {
          if (!player) return;
          room.setPlayerTeam(player.id, 0);
          room.sendAnnouncement(`${player.name} vuruşunu yaptı, beklemede...`, null, 0x999999);

          // 7 saniye bekle
          setTimeout(() => {

            // 🔹 Eğer oyun zaten bitti ise devam etme
            if (winnerId || loserId || !gameRunning || !currentPlayer) return;
            if (player.id !== currentPlayer) return;
            const opponentId = turnQueue.find(id => id !== player.id);
            const nextPlayer = opponentId ? room.getPlayer(opponentId) : null;
            const nextColor = playerColors[opponentId]?.toUpperCase() || "belirsiz";

            const scoredColors = [...scoredThisTurn].map(i => discInfo[i].color);

            // ==========================================
            // 🛑 BİRLEŞTİRİLMİŞ FAUL VE YERLEŞTİRME KONTROLÜ
            // ==========================================
            let isFoul = false; // Vurma faulleri için (ıskalama, yanlış top vb.)
            let foulReason = "";
            const myColor = playerColors[player.id];


            // --- 1. VURMA FAULLERİNİ KONTROL ET (Top deliğe girmese de faul) ---
            if (lastTurnResult !== "whiteBall") {

              // 1. HİÇBİR ŞEYE DEĞMEDİ Mİ? (Bu faul her zaman geçerlidir)
              if (firstContactDiscId === null) {
                isFoul = true;
                foulReason = "hitNothing";
              }

              // 2. BİR ŞEYE DEĞDİ, PEKİ DOĞRU RENK Mİ?
              else if (playerColors[player.id]) {
                const myColor = playerColors[player.id];
                const hitColor = discInfo[firstContactDiscId]?.color;
                const ballsRemaining = 7 - (playerScores[player.id] || 0);


                // 🛑 Kural A: SİYAH TOPA ERKEN VURUŞ KONTROLÜ (Bu faul her zaman geçerlidir)






                // 🛑 Kural B: RAKİP TOPA VURUŞ KONTROLÜ (hitColor !== myColor ise fauldür)
                if (hitColor !== myColor) {

                  const isReadyForBlack = (ballsRemaining === 0); // Oyuncunun topu kalmadıysa (7-7=0)

                  // 1. Durum: SİYAH TOP SIRASI MI? (Tüm toplar bitti)
                  if (isReadyForBlack) {
                    // Eğer SİYAH TOP sırasıysa, Siyah Top'a vurmak zorunludur.
                    // Vurulan top siyah değilse (yani renkliyse) fauldür.
                    if (hitColor !== "siyah") {
                      isFoul = true;
                      foulReason = "hitOpponent"; // Siyah yerine renkli topa vuruldu
                    }
                    // Eğer hitColor === "siyah" ise, bu geçerli bir vuruştur, faul yoktur.

                  }
                  // 2. Durum: RENK ATAMA TURU VEYA NORMAL TUR MU?
                  else if (!isColorAssigned) {

                    if (hitColor === "siyah" && ballsRemaining > 0) {
                      isFoul = true;
                      foulReason = "hitBlackEarly";
                    }
                    // Renk atama turu değilse, rakip topa vurmak fauldür.
                    isFoul = true;
                    foulReason = "hitOpponent";
                  }
                }
              }
            }

            // --- 2. YERLEŞTİRME GEREKLİLİĞİNİ TESPİT ET (Tüm Faul Türleri) ---
            const needsPlacement = isFoul ||                 // Vurma Faulü (Iskalama, Yanlış Top)
              lastTurnResult === "whiteBall" ||     // Beyaz Top Deliğe Girdi (Scratch)
              lastTurnResult === "opponentScore"; // Rakip Top Deliğe Girdi (Faul)

            if (needsPlacement) {

              // --- 3. DUYURU YAP VE YERLEŞTİRME SEKANSINI BAŞLAT ---

              if (lastTurnResult === "whiteBall") {
                room.sendAnnouncement(`⚠️ ${player.name} Beyaz topu deliğe soktu! (Faul)`, null, 0xFF0000);
              } else if (lastTurnResult === "opponentScore") {
                room.sendAnnouncement(`⚠️ ${player.name} rakip topu deliğe soktu! (Faul)`, null, 0xFF0000);
              } else if (isFoul) { // isFoul ise sadece vurma faullerini duyur
                if (foulReason === "hitNothing") {
                  room.sendAnnouncement(`⚠️ ${player.name} topu ıskaladı! (Faul)`, null, 0xFFAA00);
                } else if (foulReason === "hitBlackEarly") {
                  room.sendAnnouncement(`⚠️ ${player.name} siyah topa erken vurdu! (Faul)`, null, 0xFFAA00);
                } else if (foulReason === "hitOpponent") {
                  const hitColorName = discInfo[firstContactDiscId]?.color || "Bilinmeyen";
                  room.sendAnnouncement(`⚠️ ${player.name} yanlış topa vurdu! (İlk temas: ${hitColorName})`, null, 0xFFAA00);
                }
              }

              // Yerleştirme sekansını başlat 
              if (opponentId) {
                startBallPlacement(opponentId);
              }

              // Faul olduğu için aşağıdaki normal skorlama/ıskalama mantığını çalıştırma
              return;
            }
            // ==========================================
            // 🛑 BİRLEŞTİRİLMİŞ FAUL KONTROLÜ BİTTİ
            // ==========================================

            // 👇 AŞAĞIDAKİ KISIMDA KÜÇÜK BİR DEĞİŞİKLİK YAPTIK
            // "scoredColors.length === 0" koşuluna "|| lastTurnResult === 'foul'" ekledik.

            if (scoredColors.length === 0 || lastTurnResult === "foul") {
              // Hiç top girmedi VEYA Faul yapıldı -> SIRA RAKİBE
              if (opponentId) {
                room.setPlayerTeam(opponentId, 1);
                spawnNextPlayer(room, opponentId);
                currentPlayer = opponentId;

                if (nextPlayer) {
                  // Eğer faul değilse "kaçırdı" yaz, faulse yukarıda zaten yazdık
                  if (lastTurnResult !== "foul") {
                    room.sendAnnouncement(`❌ ${player.name} kaçırdı! Sıradaki: ${nextPlayer.name}`, null, 0xFF0000);
                  } else {
                    room.sendAnnouncement(`Sıra ${nextPlayer.name} oyuncusuna geçti.`, null, 0xFFFFFF);
                  }
                } else {
                  room.sendAnnouncement(`❌ ${player.name} kaçırdı! Ama rakip yok, oyun durdu.`, null, 0xFF0000);
                  gameRunning = false;
                  room.stopGame();
                }

                setTimeout(() => {
                  startTurnTimer(currentPlayer);

                }, 2000);

                if (nextColor.toLowerCase() === "mavi") {
                  colorHex = 0x0000FF;
                } else if (nextColor.toLowerCase() === "red") {
                  colorHex = 0xFF0000;
                } else {
                  colorHex = 0xFFFFFF;
                }
                room.sendAnnouncement("Atacağı renk:", null, 0xFFAA00, 0, false);
                room.sendAnnouncement(`${nextColor}`, null, colorHex, 0, false);
              }
            } else if (lastTurnResult === "whiteBall" || lastTurnResult === "opponentScore" || lastTurnResult === "wrongBall") {
              // Beyaz veya rakibin topu → rakibe geç
              if (opponentId) {
                if (nextColor.toLowerCase() === "mavi") {
                  colorHex = 0x0000FF;
                } else if (nextColor.toLowerCase() === "red") {
                  colorHex = 0xFF0000;
                } else {
                  colorHex = 0xFFFFFF;
                }
                room.setPlayerTeam(opponentId, 1);
                spawnNextPlayer(room, opponentId);
                currentPlayer = opponentId;

                room.sendAnnouncement(`⚠️ ${player.name} yanlış top soktu! Sıra ${nextPlayer.name}'de`, null, 0xFFAA00);
                setTimeout(() => {
                  startTurnTimer(currentPlayer);
                }, 2000);
                room.sendAnnouncement("Atacağı renk:", null, 0xFFAA00, false);
                room.sendAnnouncement(`${nextColor}`, null, colorHex, false);
              }
            } else if (lastTurnResult !== "blackBall") {
              // Kendi topunu soktu → devam
              room.setPlayerTeam(player.id, 1);
              spawnNextPlayer(room, player.id);
              currentPlayer = player.id;
              setTimeout(() => {
                startTurnTimer(currentPlayer);
              }, 2000);

              room.sendAnnouncement(`🎯 ${player.name} devam ediyor (renk: ${playerColors[player.id]})`, null, 0x00FF00);
            }


          }, 7000);
        }, 300);

        isColorAssigned = false;
      }


      const ball = room.getDisc(0);
      const outer = room.getDisc(1);
      if (!ball || !outer) return;

      const dx = outer.B.x - ball.B.x;
      const dy = outer.B.y - ball.B.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 20) return;

      const nx = dx / distance;
      const ny = dy / distance;

      const boost = computeBoost(distance);

      let newVx = ball.xspeed || 0; // minimum hız X
      let newVy = ball.yspeed || 0; // minimum hız Y

      // boost'u yönlü olarak ekle
      newVx += nx * boost;
      newVy += ny * boost;

      console.log("Boost applied:", boost, "newVx:", newVx, "newVy:", newVy);

      room.setDiscProperties(0, { xspeed: newVx, yspeed: newVy });
    };


    const discInfo = {
      0: { color: "beyaz", scored: false },
      2: { color: "mavi", scored: false },
      3: { color: "red", scored: false },
      4: { color: "mavi", scored: false },
      5: { color: "mavi", scored: false },
      6: { color: "siyah", scored: false },
      7: { color: "red", scored: false },
      8: { color: "red", scored: false },
      9: { color: "mavi", scored: false },
      10: { color: "red", scored: false },
      11: { color: "mavi", scored: false },
      12: { color: "mavi", scored: false },
      13: { color: "red", scored: false },
      14: { color: "red", scored: false },
      15: { color: "mavi", scored: false },
      16: { color: "red", scored: false }
    };

    function makeVirtualPocket(p0, p1, offset = 8) {
      const cx = (p0[0] + p1[0]) / 2;
      const cy = (p0[1] + p1[1]) / 2;

      // Delikten içeri doğru vektör (p0-p1 çizgisine dik)
      const dx = p1[1] - p0[1];
      const dy = -(p1[0] - p0[0]);

      const mag = Math.sqrt(dx * dx + dy * dy);
      const ux = dx / mag;
      const uy = dy / mag;

      // Sanal cebin merkezi
      return {
        x: cx + ux * offset,
        y: cy + uy * offset
      };
    }

    const pocketCenters = [
      makeVirtualPocket([-376, -170], [-346, -192]), // UL
      makeVirtualPocket([-16, -210.5], [16, -210.5]),    // UM
      makeVirtualPocket([346, -192], [376, -170]),   // UR
      makeVirtualPocket([376, 170], [346, 192]),     // DR
      makeVirtualPocket([-16, 210.5], [16, 210.5]),      // DM
      makeVirtualPocket([-346, 192], [-376, 170])    // DL
    ];





    const HOLE_RADIUS = 30; // deliğin çapı kadar uygun bir değer
    const BALL_RADIUS = 11; // top yarıçapı
    const EFFECTIVE_HOLE_RADIUS = HOLE_RADIUS - BALL_RADIUS * 0.2;
    const ignoredDiscIndices = new Set([1 /* kontrolcü disc */, 17, 18, 19, 20, 21, 22, 23]);
    const whiteAlreadyAnnounced = new Set();
    let alreadyRanked = false;
    let controlIsDone = false;




    function checkDiscGoal(disc, index) {
      if (!disc || !disc.B || scoredDiscs.has(index)) return;
      if (ignoredDiscIndices.has(index)) return;


      const x = disc.B.x;
      const y = disc.B.y;

      for (const center of pocketCenters) {
        const dx = x - center.x;
        const dy = y - center.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < EFFECTIVE_HOLE_RADIUS) {
          scoredThisTurn.add(index);
          const color = discInfo[index]?.color || "bilinmeyen";
          if (!lastPlayer) return;



          // ⚪ Beyaz top özel durumu
          if (color === "beyaz") {
            // Eğer bu beyaz top zaten bildirildiyse tekrar etme
            if (whiteAlreadyAnnounced.has(index)) return;
            whiteAlreadyAnnounced.add(index);

            room.sendAnnouncement(`${lastPlayer.name} vuruşu sırasında ⚪ beyaz top deliğe girdi!`, null, 0xFFFFFF);
            lastTurnResult = "whiteBall";

            // 3 saniye sonra bu beyaz top yeniden bildirilebilir hale gelir (yeniden spawn için)
            setTimeout(() => {
              whiteAlreadyAnnounced.delete(index);
            }, 2000);

            return;
          }

          // 🎯 Diğer toplar için bildirim
          if (lastPlayer) {
            room.sendAnnouncement(`${lastPlayer.name} vuruşu sırasında ${color} top deliğe girdi!`, null, 0xFFFFFF);
          }

          scoredDiscs.add(index);
          console.log(` Önce  playerScores[lastPlayer.id]: ${playerScores[lastPlayer.id]}`);

          // ✅ Kendi topunu soktuysa skor ve renk ataması
          if (!playerColors[lastPlayer.id] && color !== "beyaz" && color !== "siyah") {
            playerColors[lastPlayer.id] = color;

            // Rakibin rengi otomatik diğer olur
            const opponentId = turnQueue.find(id => id !== lastPlayer.id);
            playerColors[opponentId] = (color === "mavi") ? "red" : "mavi";

            // Renk bildirimi
            isColorAssigned = true;
            room.sendAnnouncement(`${lastPlayer.name} artık ${color} toplarla oynayacak!`, null, 0x00FF00, 0, false);


            playerScores[lastPlayer.id] = 1; // İlk top için skor 1

            console.log(` İlk top sokuldu ve renk atandı: playerColors=${playerColors[lastPlayer.id]}, playerScores=${playerScores[lastPlayer.id]}`);


          } else if (playerColors[lastPlayer.id] === color && color !== "beyaz" && color !== "siyah") {

            if (!playerScores[lastPlayer.id]) playerScores[lastPlayer.id] = 0;

            playerScores[lastPlayer.id]++;
            console.log(` Doğru topu sokunca playerScores 1 arttı: playerScores[lastPlayer.id]=${playerScores[lastPlayer.id]}`);
          }

          // ⚠️ Rakibin topunu soktuysa işaretle
          const opponentId = turnQueue.find(id => id !== lastPlayer.id);
          console.log(`Önce : playerScores[opponentId]:  ${playerScores[opponentId]}`);
          if (color !== "beyaz" && playerColors[lastPlayer.id] && playerColors[lastPlayer.id] !== color && color !== "siyah") {
            const opponentColor = playerColors[opponentId];
            if (opponentColor === color) {
              if (!playerScores[opponentId]) playerScores[opponentId] = 0;
              playerScores[opponentId]++;
              console.log(` Yanlış topu sokunca rakibin playerScores 1 arttı  playerScores[opponentId]: ${playerScores[opponentId]}`);
              lastTurnResult = "opponentScore";
            } else {
              lastTurnResult = "wrongBall";
            }
          }

          // 🕳️ Siyah top kontrolü
          if (color === "siyah") {
            const ownColor = playerColors[lastPlayer.id];
            const isWhiteScored = lastTurnResult === "whiteBall" || [...scoredThisTurn].some(i => discInfo[i]?.color === "beyaz");
            scoredThisTurn.add(index);

            if (isWarmup) {
              room.stopGame();
              // oyun durumunu sıfırla
              scoredDiscs.clear();
              scoredThisTurn.clear();
              scoredOrder = [];
              playerScores = {};
              playerColors = {};
              lastPlayer = null;
              isColorAssigned = false;
              isPlacingWhiteBall = false;
              whiteAlreadyAnnounced.clear();
              room.startGame();
              return;
            }



            // Eğer oyuncunun rengi yoksa (henüz top sokmadıysa), siyahı soktu → kaybetti
            if (!ownColor || !playerScores[lastPlayer.id]) {
              const opponentId = turnQueue.find(id => id !== lastPlayer.id);
              room.sendAnnouncement(`💀 ${lastPlayer.name} siyah topu erken soktu! ${room.getPlayer(opponentId).name} kazandı!`, null, 0xFF0000);
              winnerId = opponentId;
              loserId = lastPlayer.id;



              winnerObject = room.getPlayer(winnerId);
              loserObject = room.getPlayer(loserId);


              if (activeLogins.has(winnerObject.id)) {
                endGame(winnerObject, loserObject);
              } else {
                endGame(winnerObject, loserObject);
                room.sendAnnouncement(
                  `⚠️ Rank sahibi olmak için giriş yapmalısın. !register`,
                  winnerObject.id,
                  0xFFAA00
                );
              }


              alreadyRanked = true;


            } else if (playerScores[lastPlayer.id] === TOTAL_COLOR_BALLS[ownColor]) {

              controlIsDone = true;
              lastTurnResult = "blackBall";

              room.sendAnnouncement(`🎱 Siyah top deliğe girdi! Beyaz topu sokup sokmadığı kontrol ediliyor...`, null, 0xFF00FF);

              black_whiteballcheck = setTimeout(() => {

                if (isWhiteScored) {
                  // 🏁 Beyaz da aynı anda girdiyse → kaybetti
                  room.sendAnnouncement(
                    `💀 ${lastPlayer.name} siyah topu sokarken beyazı da soktu! ${room.getPlayer(opponentId).name} kazandı!`,
                    null,
                    0xFF0000
                  );
                  winnerId = opponentId;
                  loserId = lastPlayer.id;
                  winnerObject = room.getPlayer(winnerId);
                  loserObject = room.getPlayer(loserId);
                  if (winnerObject) {
                    if (activeLogins.has(winnerObject.id)) {
                      endGame(winnerObject, loserObject);
                    } else {
                      endGame(winnerObject, loserObject);
                      room.sendAnnouncement(
                        `⚠️ Rank sahibi olmak için giriş yapmalısın. !register`,
                        winnerObject.id, // burası güvenli çünkü winnerObject var
                        0xFFAA00
                      );
                    }
                  } else {
                    // winnerObject yok, oyuncu odadan çıktı
                    endGame(null, loserObject);
                    room.sendAnnouncement(
                      `🏆 Oyuncu oyundan çıktığı için oyun sona erdi.`,
                      null,
                      0xFFAA00
                    );
                  }

                  alreadyRanked = true;

                } else {
                  // ✅ Normal kazandı
                  room.sendAnnouncement(
                    `🏆 ${lastPlayer.name} siyah topu soktu ve oyunu kazandı!`,
                    null,
                    0x00FF00
                  );

                  winnerId = lastPlayer.id;
                  loserId = opponentId;

                  winnerObject = room.getPlayer(winnerId);
                  loserObject = room.getPlayer(loserId);

                  if (winnerObject) {
                    if (activeLogins.has(winnerObject.id)) {
                      endGame(winnerObject, loserObject);
                    } else {
                      endGame(winnerObject, loserObject);
                      room.sendAnnouncement(
                        `⚠️ Rank sahibi olmak için giriş yapmalısın. !register`,
                        winnerObject.id, // burası güvenli çünkü winnerObject var
                        0xFFAA00
                      );
                    }
                  } else {
                    // winnerObject yok, oyuncu odadan çıktı
                    endGame(null, loserObject);
                    room.sendAnnouncement(
                      `🏆 Oyuncu oyundan çıktığı için oyun sona erdi.`,
                      null,
                      0xFFAA00
                    );
                  }
                  alreadyRanked = true;



                }

                // Kazanan belirlendi duyurusu yapıldı, şimdi 1.5 saniye sonra oyunu durdur
                setTimeout(() => {
                  room.stopGame();
                  room.sendAnnouncement(`🔁 Yeni eşleşme hazırlanıyor...`, null, 0xFFFF00);
                  alreadyRestarted = true;

                  // Oyunu durdurduktan bir süre sonra restart at
                  setTimeout(() => {
                    restartGame();
                    alreadyRestarted = false;
                    controlIsDone = false;

                  }, 7001); // StopGame'den 2 saniye sonra (Toplamda karardan 3.5 sn sonra)

                }, 1500);

              }, 7001);
            } else {
              // erken soktu → kaybetti
              const opponentId = turnQueue.find(id => id !== lastPlayer.id);
              room.sendAnnouncement(`💀 ${lastPlayer.name} siyah topu erken soktu! ${room.getPlayer(opponentId).name} kazandı!`, null, 0xFF0000);
              winnerId = opponentId;
              loserId = lastPlayer.id;
              winnerObject = room.getPlayer(winnerId);
              loserObject = room.getPlayer(loserId);

              if (activeLogins.has(winnerObject.id)) {
                endGame(winnerObject, loserObject);
              } else {
                endGame(winnerObject, loserObject);
                room.sendAnnouncement(
                  `⚠️ Rank sahibi olmak için giriş yapmalısın. !register`,
                  winnerObject.id,
                  0xFFAA00
                );
              }
              alreadyRanked = true;








            }

            console.log("Already Ranked timeouttan önce:", alreadyRanked);

            if (!controlIsDone) {
              setTimeout(() => {
                room.stopGame();
                alreadyRestarted = true;
                room.sendAnnouncement(`🔁 Yeni eşleşme hazırlanıyor...`, null, 0xFFFF00);



              }, 1500);

              console.log("Already Ranked timeouttan sonra:", alreadyRanked);

              setTimeout(() => {
                restartGame();
                alreadyRestarted = false;



              }
                , 7001);

            }
            console.log("Already Ranked restaartgameden sonra:", alreadyRanked);


            return;
          }

          // Beyaz top girerse işaretle, ama sahaya alma burada yok
          if (color === "beyaz") lastTurnResult = "whiteBall";

          // Doğru top girerse skor için kaydet
          scoredOrder.push({ color, player: lastPlayer.name });

          return; // bir delik bulundu, çık
        }
      }
    }

    // Her tickte tüm topları kontrol et
    room.onGameTick = () => {
      const discs = room.getDiscs();
      if (!discs) return;

      discs.forEach((disc, index) => {
        if (ignoredDiscIndices.has(index)) return; // Beyaz topu ve gösterge discleri atla
        checkDiscGoal(disc, index); // index parametre olarak gönder
      });
    };








  }
});







