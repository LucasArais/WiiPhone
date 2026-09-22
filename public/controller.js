(function () {
  const statusEl = document.getElementById('status');
  const badgeEl = document.getElementById('player-badge');
  const enableBtn = document.getElementById('enable');
  const wheelEl = document.getElementById('wheel');
  const needleEl = document.getElementById('needle');

  const steering = window.WiiPhoneMotion.createSteeringTracker({ sensitivityDeg: 30, smoothing: 0.25 });
  let ws = null;
  let sendTimer = null;
  let latestSteer = 0;

  function connect() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    ws = new WebSocket(`${proto}://${location.host}/ws?role=controller`);

    ws.addEventListener('open', () => {
      statusEl.textContent = 'connected';
      statusEl.classList.add('connected');
    });

    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'welcome') {
        badgeEl.textContent = `Player ${msg.player}`;
      } else if (msg.type === 'full') {
        statusEl.textContent = 'game is full (4 players max)';
      }
    });

    ws.addEventListener('close', () => {
      statusEl.textContent = 'disconnected — reload to retry';
      statusEl.classList.remove('connected');
    });

    sendTimer = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', steer: latestSteer }));
      }
    }, 50);
  }

  function handleOrientation(event) {
    if (event.gamma === null) return;
    latestSteer = steering.update(event.gamma);
    needleEl.style.transform = `rotate(${latestSteer * 55}deg)`;
  }

  async function enableMotion() {
    enableBtn.disabled = true;
    enableBtn.textContent = 'Starting…';

    try {
      if (typeof DeviceOrientationEvent !== 'undefined' &&
          typeof DeviceOrientationEvent.requestPermission === 'function') {
        const result = await DeviceOrientationEvent.requestPermission();
        if (result !== 'granted') {
          statusEl.textContent = 'motion permission denied';
          enableBtn.disabled = false;
          enableBtn.textContent = 'Enable motion sensors';
          return;
        }
      }

      window.addEventListener('deviceorientation', handleOrientation);
      steering.reset();
      wheelEl.style.display = 'flex';
      enableBtn.style.display = 'none';
      connect();
    } catch (err) {
      statusEl.textContent = 'motion sensors unavailable';
      enableBtn.disabled = false;
      enableBtn.textContent = 'Enable motion sensors';
    }
  }

  enableBtn.addEventListener('click', enableMotion);
})();
