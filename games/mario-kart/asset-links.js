// Direct upstream artwork, with the bundled copies available when offline.
export const artworkURL = path =>
  `https://raw.githubusercontent.com/pattssun/OpenWii/main/games/mario-kart/${path}`;

export function loadArtwork(loader, path, onLoad) {
  loader.load(artworkURL(path), onLoad, undefined, () => {
    loader.load(`./${path}`, onLoad, undefined, () => {});
  });
}
