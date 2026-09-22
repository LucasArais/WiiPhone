async function init() {
  const res = await fetch('/api/session');
  const data = await res.json();

  document.getElementById('qr').src = data.qrDataUrl;
  document.getElementById('controller-url').textContent = data.controllerUrl;

  const slotsEl = document.getElementById('slots');
  const slots = [];
  for (let i = 1; i <= data.maxPlayers; i += 1) {
    const el = document.createElement('div');
    el.className = 'slot';
    el.textContent = `P${i}`;
    slotsEl.appendChild(el);
    slots[i] = el;
  }

  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${proto}://${location.host}/ws?role=display`);

  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'presence') {
      slots.forEach((el, player) => el.classList.toggle('active', msg.players.includes(player)));
    }
    if (msg.type === 'player-joined' && slots[msg.player]) {
      slots[msg.player].classList.add('active');
    }
    if (msg.type === 'player-left' && slots[msg.player]) {
      slots[msg.player].classList.remove('active');
    }
  });
}

init();
