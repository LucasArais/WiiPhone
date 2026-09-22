/** Adapt the OpenWii game interface to WiiPhone's native WebSocket relay. */
export class GameLink {
  constructor({ onOrientation, onCommand, onPresence } = {}) {
    this.controllers = 0;
    this.slots = [];
    const presence = (players) => {
      this.slots = players.map(player => player - 1);
      this.controllers = players.length;
      // Mario Kart uses P1; another connected phone cannot keep P1 alive.
      onPresence?.({ controller: players.includes(1) ? 1 : 0, slots: this.slots });
    };
    const connect = () => {
      this.socket = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws?role=display`);
      this.socket.addEventListener('message', ({ data }) => {
        let message;
        try { message = JSON.parse(data); } catch { return; }
        const slot = message.player - 1;
        if (message.type === 'presence') presence(message.players);
        if (message.type === 'input') onOrientation?.(message, slot);
        if (message.type === 'command') onCommand?.(message.command, slot);
      });
      this.socket.addEventListener('close', () => {
        presence([]);
        this.retry = setTimeout(connect, 1500);
      });
    };
    connect();
  }

  feedback(message) {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'feedback', slot: message.slot ?? 0, feedback: message }));
    }
  }
}
