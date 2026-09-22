/** Reproduce the optional local 3D pack from the sources cited by OpenWii. */
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
process.chdir(root);
const sources=JSON.parse(await readFile('games/mario-kart/pipeline/sources.json','utf8'));
const inputs='games/mario-kart/evidence/asset-study';
await mkdir(inputs,{recursive:true});
await mkdir('assets/mario-kart',{recursive:true});
for(const source of sources){
  const archive=path.join(inputs,source.id+'.zip');
  let bytes;
  try {bytes=await readFile(archive);} catch {}
  const digest=data=>createHash('sha256').update(data).digest('hex');
  if(!bytes || digest(bytes)!==source.sha256){
    console.log('Downloading',source.id);
    const response=await fetch(source.archive,{signal:AbortSignal.timeout(180000)});
    if(!response.ok)throw new Error(`${source.id}: HTTP ${response.status}`);
    bytes=Buffer.from(await response.arrayBuffer());
    if(digest(bytes)!==source.sha256)throw new Error(`${source.id}: source archive changed; review sources.json before importing`);
    await writeFile(archive,bytes);
  }
  // Use the standard library; never extract paths outside this asset's folder.
  execFileSync('python3',['-c',`
import sys,zipfile,pathlib,stat
archive,directory=sys.argv[1:]
root=pathlib.Path(directory).resolve()
with zipfile.ZipFile(archive) as z:
 for info in z.infolist():
  target=(root/info.filename).resolve()
  if not target.is_relative_to(root) or stat.S_ISLNK(info.external_attr>>16):
   raise ValueError('Unsafe archive path: '+info.filename)
 z.extractall(root)
`,archive,path.join(inputs,source.id)],{stdio:'inherit'});
  await writeFile(path.join(inputs,source.id+'-source.json'),JSON.stringify(source,null,2)+'\n');
}
const env={...process.env,KART_BUILD_ORIGIN:process.env.KART_BUILD_ORIGIN||'https://localhost:8443'};
for(const script of ['build-source.mjs','build-source-rivals.mjs','build-source-stadium.mjs']){
  execFileSync(process.execPath,['games/mario-kart/pipeline/'+script],{env,stdio:'inherit'});
}
const ids=['mario','luigi','peach','yoshi','toad','bowser','donkey-kong','koopa'];
const manifest={characters:ids.map(id=>({id,file:id+'-source.glb'})),course:{model:'stadium-source.glb',route:'stadium-route.json'}};
await writeFile('assets/mario-kart/manifest.json.tmp',JSON.stringify(manifest,null,2)+'\n');
await rename('assets/mario-kart/manifest.json.tmp','assets/mario-kart/manifest.json');
console.log('3D pack enabled. Reload Mario Kart. Sources and converted assets remain local.');
