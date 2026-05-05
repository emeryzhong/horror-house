const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d", { alpha: false });
const start = document.querySelector("#start");
const ending = document.querySelector("#ending");
const startButton = document.querySelector("#startButton");
const againButton = document.querySelector("#againButton");
const caption = document.querySelector("#caption");

const W = canvas.width;
const H = canvas.height;
const SCALE = 2;
const VIEW_W = W / SCALE;
const VIEW_H = H / SCALE;
const TILE = 32;
const keys = new Set();

let audio;
let running = false;
let last = performance.now();
let camera = { x: 0, y: 0 };
let shake = 0;
let blackout = 0;
let captionTimer = 0;
let scare = null;
let endingShown = false;
let roomNow = "";
let dragged = false;

const player = {
  x: 260,
  y: 360,
  floor: 0,
  speed: 118,
  face: 0,
  radius: 10,
};

const state = {
  hasKitchenKey: false,
  hasBedroomFuse: false,
  hasAtticLocket: false,
  basementUnlocked: false,
  chairMoved: false,
  mirrorScare: false,
  windowScare: false,
  upstairsScare: false,
  basementFinal: false,
  lightsOut: false,
  notes: 0,
};

const house = {
  width: 1152,
  height: 864,
  floors: [
    {
      name: "Ground floor",
      spawn: { x: 260, y: 360 },
      rooms: [
        { id: "foyer", name: "Foyer", x: 96, y: 280, w: 230, h: 250, floor: "boards", wall: "plaster" },
        { id: "living", name: "Living room", x: 326, y: 280, w: 330, h: 250, floor: "rugboards", wall: "panel" },
        { id: "kitchen", name: "Kitchen", x: 656, y: 280, w: 300, h: 250, floor: "tile", wall: "mold" },
        { id: "bath", name: "Downstairs bathroom", x: 956, y: 280, w: 120, h: 250, floor: "tile", wall: "mold" },
        { id: "library", name: "Library", x: 326, y: 80, w: 330, h: 200, floor: "boards", wall: "panel" },
        { id: "storage", name: "Storage hall", x: 656, y: 80, w: 420, h: 200, floor: "boards", wall: "plaster" },
        { id: "basementDoor", name: "Basement door", x: 96, y: 530, w: 230, h: 170, floor: "boards", wall: "mold" },
      ],
      doors: [
        { x: 310, y: 356, w: 32, h: 84 },
        { x: 638, y: 356, w: 36, h: 84 },
        { x: 940, y: 356, w: 34, h: 70 },
        { x: 444, y: 264, w: 90, h: 32 },
        { x: 720, y: 264, w: 100, h: 32 },
        { x: 188, y: 514, w: 72, h: 32 },
      ],
      stairs: { x: 720, y: 138, w: 90, h: 92, to: 1, tx: 205, ty: 616, label: "stairs up" },
      basement: { x: 178, y: 590, w: 68, h: 72 },
    },
    {
      name: "Second floor",
      spawn: { x: 205, y: 616 },
      rooms: [
        { id: "upperHall", name: "Second floor hall", x: 96, y: 500, w: 920, h: 190, floor: "boards", wall: "plaster" },
        { id: "bedroom", name: "Main bedroom", x: 96, y: 190, w: 330, h: 310, floor: "rugboards", wall: "mold" },
        { id: "nursery", name: "Nursery", x: 426, y: 190, w: 260, h: 310, floor: "boards", wall: "plaster" },
        { id: "mirrorRoom", name: "Mirror room", x: 686, y: 190, w: 330, h: 310, floor: "boards", wall: "panel" },
        { id: "atticNook", name: "Attic nook", x: 426, y: 64, w: 260, h: 126, floor: "boards", wall: "mold" },
      ],
      doors: [
        { x: 204, y: 484, w: 88, h: 32 },
        { x: 504, y: 484, w: 84, h: 32 },
        { x: 790, y: 484, w: 92, h: 32 },
        { x: 512, y: 174, w: 82, h: 32 },
      ],
      stairs: { x: 156, y: 588, w: 88, h: 78, to: 0, tx: 746, ty: 184, label: "stairs down" },
    },
    {
      name: "Basement",
      spawn: { x: 230, y: 620 },
      rooms: [
