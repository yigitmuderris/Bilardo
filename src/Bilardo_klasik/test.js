
const fs = require("fs");


const { OperationType, VariableType, ConnectionState, AllowFlags, Direction, CollisionFlags, CameraFollow, BackgroundType, GamePlayState, BanEntryType, Callback, Utils, Room, Replay, Query, Library, RoomConfig, Plugin, Renderer, Errors, Language, EventFactory, Impl } = require("node-haxball")();


const BILARDO = fs.readFileSync("Bilardo.hbs", "utf8");

let stadium;
try {
  stadium = Utils.parseStadium(BILARDO); // Stadium objesi
  console.log("Stadium objesi hazır!");
} catch (err) {
  console.error("Stadium parse hatası:", err);
}

// ---------- 1️⃣ Goalpost testi ----------
console.log("=== Goalpost Testi ===");
const expectedCenters = [
  { x: -360, y: -182 }, // sol üst
  { x: 0, y: -196.2 }, // orta üst
  { x: 360, y: -182 }, // sağ üst
  { x: -360, y: 182 }, // sol alt
  { x: 0, y: 194.2 }, // orta alt
  { x: 360, y: 182 } // sağ alt
];

const HOLE_RADIUS = 20; // delik yarıçapı

console.log("Goal sayısı:", stadium.goals.length);
console.log("Expected sayısı:", expectedCenters.length);

for (let i = 0; i < Math.min(stadium.goals.length, expectedCenters.length); i++) {
  const goal = stadium.goals[i];
  const expected = expectedCenters[i];
  const centerX = (goal.L_.x + goal.d_.x) / 2;
  const centerY = (goal.L_.y + goal.d_.y) / 2;
  console.log(`Goal #${i} -> x:${centerX}, y:${centerY}, expected x:${expected.x}, y:${expected.y}`);
}

// ---------- 1️⃣a Goal ve PocketCenters uyum testi ----------
console.log("\n=== Goal ve PocketCenters uyum testi ===");
stadium.goals.forEach((goal, i) => {
  const goalCenterX = (goal.L_.x + goal.d_.x) / 2;
  const goalCenterY = (goal.L_.y + goal.d_.y) / 2;

  const dx = goalCenterX - expectedCenters[i].x;
  const dy = goalCenterY - expectedCenters[i].y;
  const dist = Math.sqrt(dx*dx + dy*dy);

  const isMatch = dist < HOLE_RADIUS;
  console.log(`Goal #${i}: Goal center=(${goalCenterX},${goalCenterY}) vs Pocket center=(${expectedCenters[i].x},${expectedCenters[i].y})`);
  console.log(`Distance=${dist.toFixed(2)}, Hole radius=${HOLE_RADIUS}, Match? ${isMatch}`);
});

// ---------- 2️⃣ TurnQueue testi ----------
console.log("\n=== TurnQueue Testi ===");
let turnQueue = [1, 2];
let currentPlayer = turnQueue[0];
console.log("Başlangıç:", turnQueue, "current:", currentPlayer);

currentPlayer = turnQueue.find(id => id !== currentPlayer);
console.log("Vuruş sonrası currentPlayer:", currentPlayer);

// ---------- 3️⃣ Top sokma testi ----------
console.log("\n=== Top Sokma Testi ===");
let scoredDiscs = new Set();
let lastPlayer = { id: 1, name: "Alice" };
let pocketCenters = [{ x: 360, y: 182 }];

function checkDiscGoal(disc, index) {
  const dx = disc.x - pocketCenters[0].x;
  const dy = disc.y - pocketCenters[0].y;
  const dist = Math.sqrt(dx*dx + dy*dy);
  if (dist < HOLE_RADIUS) {
    scoredDiscs.add(index);
    console.log(`${lastPlayer.name} topu soktu! index:${index}`);
  } else {
    console.log(`${lastPlayer.name} topu sokamadı. index:${index}, Distance=${dist.toFixed(2)}`);
  }
}

// Test
checkDiscGoal({ x: 362, y: 159 }, 1);
console.log("Scored discs:", Array.from(scoredDiscs));