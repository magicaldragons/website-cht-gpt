import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import crypto from "crypto";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
app.use(express.static("public"));

const rooms = new Map();
const COLORS = ["#ff4fa3","#6d5dfc","#00c2ff","#ff9f1c","#19c37d","#ef476f","#8b5cf6","#14b8a6"];

function code() {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}
function makeStars() {
  return Array.from({length: 18}, (_, i) => ({
    id: i, x: 8 + Math.random()*84, y: 12 + Math.random()*76, taken: false
  }));
}
function roomState(room) {
  return {
    type: "state",
    room: room.id,
    status: room.players.size >= 2 ? "ready" : "waiting",
    players: [...room.players.values()].map(p => ({
      id:p.id, name:p.name, x:p.x, y:p.y, score:p.score, color:p.color
    })),
    stars: room.stars
  };
}
function broadcast(room) {
  const msg = JSON.stringify(roomState(room));
  for (const p of room.players.values()) if (p.ws.readyState === 1) p.ws.send(msg);
}
function createRoom(id) {
  const room = { id, players:new Map(), stars:makeStars(), started:false };
  rooms.set(id, room);
  return room;
}

wss.on("connection", ws => {
  let player = null;
  let room = null;

  ws.on("message", raw => {
    let m;
    try { m = JSON.parse(raw); } catch { return; }

    if (m.type === "join") {
      const id = String(m.room || "").trim().toUpperCase().slice(0,8) || code();
      room = rooms.get(id) || createRoom(id);
      if (room.players.size >= 8) {
        ws.send(JSON.stringify({type:"error", message:"That room is full. Try another room."}));
        return;
      }
      player = {
        ws,
        id: crypto.randomUUID(),
        name: String(m.name || "Player").trim().slice(0,16) || "Player",
        x: 50, y: 50, score: 0,
        color: COLORS[room.players.size % COLORS.length]
      };
      room.players.set(player.id, player);
      ws.send(JSON.stringify({type:"joined", id:player.id, room:room.id}));
      broadcast(room);
      return;
    }

    if (!room || !player) return;

    if (m.type === "move") {
      const dx = Math.max(-1, Math.min(1, Number(m.dx)||0));
      const dy = Math.max(-1, Math.min(1, Number(m.dy)||0));
      const speed = 1.7;
      player.x = Math.max(3, Math.min(97, player.x + dx*speed));
      player.y = Math.max(5, Math.min(95, player.y + dy*speed));

      for (const s of room.stars) {
        if (!s.taken && Math.hypot(player.x-s.x, player.y-s.y) < 5.2) {
          s.taken = true;
          player.score++;
          setTimeout(() => {
            s.x = 8 + Math.random()*84;
            s.y = 12 + Math.random()*76;
            s.taken = false;
            broadcast(room);
          }, 700);
        }
      }
      broadcast(room);
    }

    if (m.type === "reset") {
      if (player.id === [...room.players.keys()][0]) {
        room.stars = makeStars();
        for (const p of room.players.values()) { p.score=0; p.x=50; p.y=50; }
        broadcast(room);
      }
    }
  });

  ws.on("close", () => {
    if (room && player) {
      room.players.delete(player.id);
      broadcast(room);
      if (room.players.size === 0) rooms.delete(room.id);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Sparkle Showdown running on port ${PORT}`));
