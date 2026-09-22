# 📱🎮 WiiPhone

**Read in English: [README.md](README.md)**

Seu celular é o controle. Seu computador roda os jogos.

Escaneie um QR code para transformar o celular em um controle por
movimento — sem aplicativo, sem hardware extra. Basta segurar na horizontal
e inclinar para virar.

![status](https://img.shields.io/badge/status-em%20desenvolvimento-orange)
![license](https://img.shields.io/badge/licen%C3%A7a-MIT-blue)
![node](https://img.shields.io/badge/node-%3E%3D18-339933)

## Começando

Requer **Node.js 18+**, um navegador com WebGL 2 no computador, e um
navegador no celular na **mesma rede Wi-Fi**.

```bash
git clone https://github.com/LucasArais/WiiPhone.git
cd WiiPhone
npm install
npm start
```

1. Abra **https://localhost:8443/** no computador.
2. Escaneie o QR code exibido na tela com a câmera do celular.
3. Aceite o certificado local autoassinado, toque em **Enable motion
   sensors** e permita o acesso aos sensores de movimento.
4. Escolha um jogo e incline o celular para jogar.

**Sensores de movimento exigem HTTPS.** Por isso o servidor gera um
certificado local automaticamente na primeira execução — sem precisar
configurar OpenSSL manualmente.

## Jogos

Construído aos poucos, um jogo por vez.

| Jogo | Como jogar | Jogadores |
| --- | --- | --- |
| 🏎️ **[Mario Kart](games/mario-kart/README.md)** | Incline o celular para virar. Aceleração automática, pegue as faixas de boost na pista. | 1 humano + 3 CPU |

Mais jogos estão a caminho.

## Como funciona

```mermaid
flowchart TD
    phone["📱 Navegador do celular<br/>lê a inclinação via deviceorientation<br/>public/controller.js"]
    relay["🔀 Relay Node + WebSocket<br/>atribui slots de jogador, encaminha input<br/>server.js"]
    browser["🖥 Navegador do computador<br/>renderiza o jogo com Three.js<br/>games/*/game.js"]
    phone -- "direção, ~20/s" --> relay
    relay -- "marcado por slot de jogador" --> browser
```

- **`server.js`** — Express serve as páginas estáticas, gera um certificado
  HTTPS autoassinado na primeira execução (via [`selfsigned`](https://www.npmjs.com/package/selfsigned))
  e faz o relay das mensagens WebSocket entre os celulares e a aba do jogo.
- **`public/`** — o menu (QR code + lista de jogos) e a página do
  controlador no celular.
- **`core/motion.js`** — utilitário compartilhado que transforma o ângulo
  bruto de inclinação do celular num valor de direção calibrado e suavizado.
- **`games/`** — uma pasta por jogo. Cada jogo é uma cena Three.js
  independente que lê o input dos jogadores via relay WebSocket.

## Estrutura do projeto

```
WiiPhone/
├── server.js              # HTTPS + relay WebSocket
├── core/
│   └── motion.js           # inclinação do celular → direção
├── public/
│   ├── menu.html/.js        # QR code + seletor de jogos
│   └── controller.html/.js  # a página que o celular carrega
└── games/
    └── mario-kart/
        ├── index.html
        ├── game.js          # cena Three.js, pista, karts, lógica de corrida
        └── style.css
```

## Solução de problemas

- **Não conecta:** confira se os dois aparelhos estão na mesma rede Wi-Fi e
  se o firewall permite o Node.js.
- **A direção não responde:** confirme que aceitou o aviso de certificado
  HTTPS no celular e concedeu permissão de movimento.
- **Tela preta:** ative WebGL 2 / aceleração de hardware no navegador do
  computador.

Use `PORT` para escolher outra porta, ou `NO_OPEN=1` para não abrir o
navegador automaticamente.

## Créditos

Inspirado no conceito do [pattssun/OpenWii](https://github.com/pattssun/OpenWii)
— transformar um celular em um controle de movimento estilo Wii para jogos
no navegador. Este projeto é uma implementação independente, escrita do
zero, com arquitetura e código próprios.

## Licença

[MIT](LICENSE). Este é um projeto de fã independente, sem afiliação ou
endosso da Nintendo.
