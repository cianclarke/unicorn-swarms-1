import { WebSocketServer } from 'ws';
import { GameRoom } from './GameRoom.js';

const PORT = parseInt(process.env.PORT || '3001', 10);

const wss = new WebSocketServer({ port: PORT });
const room = new GameRoom();

wss.on('connection', (ws) => {
  const playerId = room.addPlayer(ws);
  if (!playerId) {
    ws.close(4001, 'Room full');
    return;
  }

  console.log(`Player ${playerId} connected (${room.playerCount} in room)`);

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      room.handleMessage(playerId, msg);
    } catch {
      // ignore malformed messages
    }
  });

  ws.on('close', () => {
    room.removePlayer(playerId);
    console.log(`Player ${playerId} disconnected (${room.playerCount} in room)`);
  });
});

console.log(`Unicorn Swarms server listening on port ${PORT}`);
