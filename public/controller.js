(() => {
  const $ = id => document.getElementById(id);
  const buttons = {};
  const pointers = new Map();
  let ws, timer, retry, orientation = null, orientationAt = 0, enabled = false;
  function send(message) {
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
  }
  function command(value) { send({ type: 'command', command: value }); }
  function setButton(button, pressed) {
    if (!!buttons[button] === pressed) return;
    buttons[button] = pressed;
    document.querySelector(`[data-button="${button}"]`).classList.toggle('held', pressed);
    command({ type: 'button', button, pressed });
  }
  function releaseAll() {
    pointers.clear();
    for (const button of Object.keys(buttons)) setButton(button, false);
    command({ type: 'buttons', buttons });
  }
  function connect() {
    clearTimeout(retry);
    ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws?role=controller`);
    ws.addEventListener('open', () => {
      $('status').textContent = 'Conectado';
      $('status').classList.add('connected');
    });
    ws.addEventListener('message', ({ data }) => {
      const msg = JSON.parse(data);
      if (msg.type === 'welcome') {
        $('player-badge').textContent = `Jogador ${msg.player}`;
        if (msg.player !== 1) $('hint').textContent = 'Mario Kart usa o controle do Jogador 1.';
      }
      if (msg.type === 'full') {
        enabled = false;
        $('status').textContent = 'Sala cheia. Tente novamente.';
        $('setup').hidden = false; $('remote').hidden = true; $('enable').disabled = false;
      }
      if (msg.type === 'feedback' && msg.feedback?.type === 'rumble') navigator.vibrate?.(msg.feedback.pattern);
    });
    ws.addEventListener('close', () => {
      releaseAll();
      $('status').classList.remove('connected');
      if (enabled) {
        $('status').textContent = 'Reconectando…';
        retry = setTimeout(connect, 1500);
      }
    });
  }
  window.addEventListener('deviceorientation', event => {
    if (!Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return;
    orientation = { alpha: event.alpha ?? 0, beta: event.beta, gamma: event.gamma };
    orientationAt = performance.now();
    $('wheel').style.transform = `rotate(${Math.max(-50, Math.min(50, -event.beta * 2))}deg)`;
    $('hint').textContent = 'Direcional: escolher · 2: confirmar';
  });
  $('enable').addEventListener('click', async () => {
    $('enable').disabled = true;
    try {
      if (typeof DeviceOrientationEvent === 'undefined') throw new Error('Sensores indisponíveis neste navegador.');
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        if (await DeviceOrientationEvent.requestPermission() !== 'granted') throw new Error('Permita o acesso aos sensores para jogar.');
      }
      enabled = true;
      $('setup').hidden = true; $('remote').hidden = false;
      connect();
      clearInterval(timer);
      timer = setInterval(() => {
        if (orientation && performance.now() - orientationAt < 500 && !document.hidden) {
          send({ type: 'input', ...orientation, buttons });
        }
      }, 33);
    } catch (error) {
      $('status').textContent = error.message;
      $('enable').disabled = false;
    }
  });
  document.querySelectorAll('[data-button]').forEach(element => {
    element.addEventListener('pointerdown', event => {
      event.preventDefault();
      element.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, element.dataset.button);
      setButton(element.dataset.button, true);
    });
    const release = event => {
      const button = pointers.get(event.pointerId);
      pointers.delete(event.pointerId);
      if (button && ![...pointers.values()].includes(button)) setButton(button, false);
    };
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) element.addEventListener(name, release);
  });
  $('recenter').addEventListener('click', () => command({ type: 'recentre' }));
  window.addEventListener('blur', releaseAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAll(); });
  window.addEventListener('pagehide', () => { enabled = false; clearInterval(timer); clearTimeout(retry); releaseAll(); ws?.close(); });
})();
