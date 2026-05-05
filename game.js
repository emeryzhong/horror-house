const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d", { alpha: false });
const start = document.querySelector("#start");
const ending = document.querySelector("#ending");
const startButton = document.querySelector("#startButton");
const againButton = document.querySelector("#againButton");
const caption = document.querySelector("#caption");

const W = 320;
const H = 180;
const TILE = 64;
const FOV = Math.PI / 3;
const RAYS = W;
const FAR = 18;
const view = document.createElement("canvas");
view.width = W;
view.height = H;
const g = view.getContext("2d", { alpha: false });
g.imageSmoothingEnabled = false;
ctx.imageSmoothingEnabled = false;

const keys = new Set();
let audio;
let running = false;
let last = performance.now();
let captionTimer = 0;
let shake = 0;
let blackout = 0;
let drag = false;
let dragX = 0;
let dragY = 0;
let collapse = null;
let endingReady = false;

const player = {
  x: 3.5,
  y: 9.5,
  z: 0,
  floor: 0,
  a: -Math.PI / 2,
  speed: 2.15,
  bob: 0,
};

const state = {
  fuse: false,
  key: false,
  locket: false,
  breaker: false,
  chairMoved: false,
  mirrorWrong: false,
  floorFell: false,
  kitchenWhisper: false,
  basementOpen: false,
};

const maps = [
  {
    name: "Ground floor",
    grid: [
      "####################",
      "#LLLLLL#SSSSSSSSSSS#",
      "#L....L#S....S....S#",
      "#L....D.S....S....S#",
      "#L....L#S....S....S#",
      "#LLDLLL#SSSDSSSSSSS#",
      "#....H....H....K...#",
      "#....H....H....K...#",
      "#....H....D....K...#",
      "#....H....H....K...#",
      "#FFFFDFFFFFFFFDFFFF#",
      "#B....B#M....M#T...#",
      "#B....D.M....M#T...#",
      "#B....B#M....M#T...#",
      "#B....B#MMMMMM#T...#",
      "####################",
    ],
    spawn: { x: 3.5, y: 9.5, a: -Math.PI / 2 },
  },
  {
    name: "Second floor",
    grid: [
      "####################",
      "#AAAAAA#NNNNN#RRRRR#",
      "#A....A#N...N#R...R#",
      "#A....D.N...D.R...R#",
      "#A....A#N...N#R...R#",
      "#AAADAA#NNNNN#RRDRR#",
      "#....U....U....U...#",
      "#....U....U....U...#",
      "#....U....D....U...#",
      "#....U....U....U...#",
      "#WWWWDWWWWWWWWDWWWW#",
      "#C....C#E....E#V...#",
      "#C....D.E....E#V...#",
      "#C....C#E....E#V...#",
      "#C....C#EEEEEE#V...#",
      "####################",
    ],
    spawn: { x: 3.5, y: 9.5, a: -Math.PI / 2 },
