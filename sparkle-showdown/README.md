# ✨ Sparkle Showdown — Multiplayer

A real-time browser multiplayer game for phones, tablets, and computers.

## What it does
- 2–8 players can share one room.
- Players on separate devices connect through the same room code.
- Real-time movement and scores use WebSockets.
- Bright sparkly/tie-dye-inspired background.
- Arrow keys, WASD, and mobile buttons work.
- No account is required.

## Run it on your computer
1. Install Node.js 20+.
2. Open a terminal in this folder.
3. Run `npm install`.
4. Run `npm start`.
5. Open `http://localhost:3000`.

## Put it on the internet
This project is ready for a Node host that supports WebSockets (for example Render, Railway, Fly.io, or another Node/WebSocket host).

The host should:
- run `npm start`
- use the port supplied in the `PORT` environment variable
- expose the app over HTTPS

After deployment, the host gives you a public URL such as `https://your-game.example`. Share that URL and the room code with the other players.

Important: a static-only host such as basic GitHub Pages cannot run the included WebSocket server by itself. Use a Node/WebSocket host for the true multi-device version.
