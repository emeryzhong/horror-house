const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const overlay = document.querySelector("#overlay");
const jump = document.querySelector("#jump");

const ui = {
  start: document.querySelector("#startBtn"),
  interact: document.querySelector("#interactBtn"),
  audio: document.querySelector("#audioBtn"),
  restart: document.querySelector("#restartBtn"),
  room: document.querySelector("#roomName"),
  message: document.querySelector("#message"),
  log: document.querySelector("#log"),
  tensionBar: document.querySelector("#tensionBar"),
  tensionText: document.querySelector("#tensionText"),
};

const TILE = 32;
const keys = new Set();

const roomData = {
  hall: {
    name: "Hallway",
    x: 0,
    y: 0,
    w: 10,
    h: 8,
    floor: "#24211d",
    message: "The front door is gone. The hall smells like wet dust.",
    interact: "A family photo has been scratched until every face is yours.",
  },
  bedroom: {
    name: "Bedroom",
    x: -10,
    y: 0,
    w: 10,
    h: 8,
    floor: "#24202a",
    message: "The bedroom is colder than the hall. The bed is made too neatly.",
    interact: "The blanket rises and falls once, slowly, then becomes still.",
  },
  kitchen: {
    name: "Kitchen",
    x: 10,
    y: 0,
    w: 10,
    h: 8,
    floor: "#1f2821",
    message: "Water drips in the sink, but the basin is dry.",
    interact: "Every cabinet opens half an inch. Something inside exhales.",
  },
  bath: {
    name: "Bathroom",
    x: 0,
    y: -8,
    w: 10,
    h: 8,
    floor: "#1f2529",
    message: "The mirror is covered with steam from the wrong side.",
    interact: "You wipe the mirror. Your reflection keeps wiping after you stop.",
  },
  basement: {
    name: "Basement",
    x: 0,
    y: 8,
    w: 10,
    h: 8,
    floor: "#171917",
    message: "The basement stairs end in a room that should not fit under the house.",
    interact: "A hatch unlocks in the floor. The house is ready for the last sound.",
  },
};

const doors = [
  { from: "hall", to: "bedroom", x: 0, y: 3.5 },
  { from: "hall", to: "kitchen", x: 10, y: 3.5 },
  { from: "hall", to: "bath", x: 4.5, y: 0 },
  { from: "hall", to: "basement", x: 4.5, y: 7 },
];

const props = [
  { room: "hall", x: 2, y: 1, type: "photo" },
  { room: "hall", x: 7, y: 6, type: "coat" },
  { room: "bedroom", x: -7, y: 3, type: "bed" },
  { room: "bedroom", x: -3, y: 1, type: "lamp" },
  { room: "kitchen", x: 12, y: 2, type: "sink" },
  { room: "kitchen", x: 17, y: 5, type: "table" },
  { room: "bath", x: 3, y: -6, type: "mirror" },
  { room: "bath", x: 7, y: -3, type: "tub" },
  { room: "basement", x: 2, y: 12, type: "hatch" },
  { room: "basement", x: 7, y: 14, type: "boxes" },
];

const state = {
  started: false,
  over: false,
  audioOn: true,
  room: "hall",
  lastRoom: "hall",
  tension: 0,
  time: 0,
  shake: 0,
  message: roomData.hall.message,
  visits: Object.fromEntries(Object.keys(roomData).map((key) => [key, 0])),
  changed: new Set(),
  player: { x: 5 * TILE, y: 4 * TILE, size: 18, speed: 142, dirX: 0, dirY: 1 },
  entity: { x: 14 * TILE, y: 12 * TILE, active: false, visible: false, cooldown: 4, seen: 0 },
  scare: { pending: false, timer: 0 },
};

let lastTime = performance.now();
let audio;

function worldToScreen(x, y) {
  const cameraX = state.player.x - canvas.width / 2;
  const cameraY = state.player.y - canvas.height / 2;
  return { x: Math.round(x - cameraX), y: Math.round(y - cameraY) };
}

function addLog(text) {
  const p = document.createElement("p");
  p.textContent = text;
  ui.log.prepend(p);
  while (ui.log.children.length > 9) ui.log.lastChild.remove();
}

function roomAt(x, y) {
  return Object.entries(roomData).find(([, room]) => {
    return x >= room.x * TILE && x <= (room.x + room.w) * TILE && y >= room.y * TILE && y <= (room.y + room.h) * TILE;
  })?.[0];
}

function isWall(x, y) {
  const roomId = roomAt(x, y);
  if (!roomId) return true;
  const room = roomData[roomId];
  const gx = x / TILE;
  const gy = y / TILE;
  const nearDoor = doors.some((door) => {
    const a = roomData[door.from];
    const b = roomData[door.to];
    const roomsMatch = roomId === door.from || roomId === door.to;
    if (!roomsMatch) return false;
    const doorX = (a.x + door.x) * TILE;
    const doorY = (a.y + door.y) * TILE;
    return Math.abs(x - doorX) < 34 && Math.abs(y - doorY) < 34;
  });
  const onRoomEdge = gx < room.x + 0.35 || gx > room.x + room.w - 0.35 || gy < room.y + 0.35 || gy > room.y + room.h - 0.35;
  return onRoomEdge && !nearDoor;
}

function canMoveTo(x, y) {
  const s = state.player.size / 2;
  return !isWall(x - s, y - s) && !isWall(x + s, y - s) && !isWall(x - s, y + s) && !isWall(x + s, y + s);
}

function enterRoom(roomId) {
  if (!roomId || roomId === state.room) return;
  state.lastRoom = state.room;
  state.room = roomId;
  state.visits[roomId] += 1;
  const visits = state.visits[roomId];
  const room = roomData[roomId];
  state.tension = Math.min(100, state.tension + 8 + visits * 3);
  state.message = room.message;
  addLog(`${room.name}: visit ${visits}`);

  if (visits === 2) {
    state.message = `${room.message} Something has moved since the last time.`;
    state.changed.add(`${roomId}:moved`);
    playSting("knock");
  } else if (visits === 3) {
    state.message = `${room.message} A shadow stands where furniture used to be.`;
    state.changed.add(`${roomId}:shadow`);
    spawnEntityNearPlayer();
    playSting("breath");
  } else if (visits >= 4 && !state.scare.pending) {
    state.message = "The room goes silent. Even your footsteps stop sounding real.";
    state.scare.pending = true;
    state.scare.timer = 1.4;
    stopDroneBriefly();
  } else if (Math.random() < 0.35) {
    playSting(Math.random() < 0.5 ? "creak" : "knock");
  }
}

function interact() {
  if (state.over) return;
  const room = roomData[state.room];
  state.tension = Math.min(100, state.tension + 7);
  state.message = room.interact;
  addLog(room.interact);
  playSting(state.room === "bath" ? "mirror" : "creak");
  if (state.room === "basement" && state.visits.basement >= 2) {
    state.scare.pending = true;
    state.scare.timer = 0.8;
  }
}

function spawnEntityNearPlayer() {
