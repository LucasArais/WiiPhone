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

As imagens de itens, logo e grama usam links diretos de
`raw.githubusercontent.com/pattssun/OpenWii/main/games/mario-kart/`.
Se o carregamento falhar, as cópias locais são usadas automaticamente.

O pacote 3D detalhado está instalado nesta máquina: os oito pilotos, kart,
pneus e Mario Kart Stadium, convertidos das mesmas fontes indicadas no OpenWii.
Os arquivos GLB, a rota medida e `manifest.json` ficam em `assets/mario-kart/`.
O jogo carrega esse pacote automaticamente; `?sourceCourse=0` permite comparar
com a pista procedural. Arquivos ausentes mantêm o fallback procedural.

Os downloads e modelos convertidos são locais e estão no `.gitignore`, como
na referência. Para reproduzir em outra máquina, com o servidor rodando,
Python 3 e Google Chrome instalados:

```sh
npm run setup:kart-assets
# Se o servidor usa outra porta:
KART_BUILD_ORIGIN=https://localhost:8445 npm run setup:kart-assets
```

O script verifica os hashes dos arquivos de origem, usa os conversores do
OpenWii e só ativa o manifesto após terminar todas as conversões. As fontes,
links de download e créditos estão em [pipeline/sources.json](pipeline/sources.json).
Fontes tipográficas e gravações do jogo original continuam opcionais e não
foram baixadas.

Proveniência das imagens: [item-art/SOURCES.md](item-art/SOURCES.md) e
[art/README.md](art/README.md). Código e licença original:
[THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md).

## Verificação

```sh
npm run test:unit
# Com o servidor rodando e Google Chrome instalado:
npm run test:kart-browser
npm run test:kart-phone
# Verificar o pacote detalhado instalado:
KART_SOURCE=1 npm run test:kart-browser
```

O teste de navegador dirige uma volta com eventos reais de teclado, verifica
seleção de piloto, freio, pausa, áudio, antigravidade, planador, resultado e
reinício. O teste do controle simula orientação e toques em outra página,
verificando o relay, calibração, multitouch e recuperação após desconectar.
Isso não substitui o teste de sensores em um celular físico. Capturas e relatório
ficam em `test-results/kart/`.
