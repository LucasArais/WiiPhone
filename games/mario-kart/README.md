# Mario Kart — WiiPhone

Adaptação da versão pública do [pattssun/OpenWii](https://github.com/pattssun/OpenWii):
estádio 3D, oito pilotos, sete adversários CPU, corrida de uma ou três voltas,
itens, moedas, drift com mini-turbo, antigravidade e planador.

Na raiz do WiiPhone, execute `npm install` e `npm start`. Abra
https://localhost:8443, escaneie o QR code com o celular na mesma rede Wi-Fi,
aceite o certificado e toque em **Ativar sensores e conectar**.

## Controles

Segure o celular de lado, tela voltada para cima, direcional à esquerda e
botões 1 / 2 à direita. Mantenha-o nivelado por um instante na largada.

| Ação | Celular | Teclado |
| --- | --- | --- |
| Escolher piloto / voltas | Direcional | Setas ou mouse |
| Confirmar / continuar | 2 | Enter |
| Virar | Inclinar como um volante | ← / → |
| Acelerar | Segurar 2 | Z |
| Frear / ré | Segurar 1 | X |
| Drift | Segurar A numa curva | Shift |
| Mini-turbo | Soltar A após carregar | Soltar Shift |
| Usar item | Direcional → | Espaço |
| Recalibrar | − Recalibrar | R |
| Pausar | Recalibrar | Esc |

**F** alterna tela cheia, **C** oculta a interface e **I** inverte a direção.
O botão **Sound** controla o áudio. Sem celular, use o teclado desde a seleção
de piloto. Apenas o **Jogador 1** controla a corrida; os demais são CPUs.
Perder a conexão pausa a corrida; reconecte e pressione 2 ou use Enter e teclado.

## Imagens e referência

Todos os PNGs publicados na pasta Mario Kart da referência estão incluídos:
`item-art/{banana,blue,green,mushroom,red,star}.png` e `art/turf-v1.png`,
além do logo SVG. Os itens aparecem no HUD e na roleta de caixas.
Não é necessário baixar imagens durante o jogo.

A referência pública não inclui os modelos, fontes, retratos e gravações do
jogo original usados no vídeo de demonstração. Nesta versão, os personagens,
pista e sons usam a implementação procedural pública, como em um clone limpo
do OpenWii. Não é uma reprodução idêntica daquele vídeo.

Proveniência das imagens: [item-art/SOURCES.md](item-art/SOURCES.md) e
[art/README.md](art/README.md). Código e licença original:
[THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md).

## Verificação

```sh
npm run test:unit
# Com o servidor rodando e Google Chrome instalado:
npm run test:kart-browser
npm run test:kart-phone
```

O teste de navegador dirige uma volta com eventos reais de teclado, verifica
seleção de piloto, freio, pausa, áudio, antigravidade, planador, resultado e
reinício. O teste do controle simula orientação e toques em outra página,
verificando o relay, calibração, multitouch e recuperação após desconectar.
Isso não substitui o teste de sensores em um celular físico. Capturas e relatório
ficam em `test-results/kart/`.
