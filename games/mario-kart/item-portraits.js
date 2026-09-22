import { artworkURL } from './asset-links.js';
/** Official promotional portraits; provenance is retained in item-art/SOURCES.md. */
export function itemPortraits(){
 return Object.fromEntries(['mushroom','green','red','banana','blue','star'].map(type=>[type,`<img src="${artworkURL(`item-art/${type}.png`)}" onerror="this.onerror=null;this.src='./item-art/${type}.png'" alt="${type}"/>`]));
}
