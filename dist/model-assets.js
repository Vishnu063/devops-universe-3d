// Code-native isometric objects: geometry remains rotatable, selectable and lightweight.
export const assetKinds=['workstation','server','registry','database','pipeline','cluster','container','router','shield','observatory','document'];
export function assetKind(lab,node){
 const id=node.id,words=(node.title+' '+node.type).toLowerCase();
 if(['browser','client','dev','users','request','shell'].includes(id)||/developer|local client/.test(words))return 'workstation';
 if(['registry','sign','backup'].includes(id)||/registry|vault|signed artifact/.test(words))return 'registry';
 if(['db','data','store','volume','config','state'].includes(id)||/database|data store|telemetry backends|persistent/.test(words))return 'database';
 if(['ci','builder','scan'].includes(id)||/build & test|image builder|ci runner/.test(words))return 'pipeline';
 if(lab.id==='kubernetes'&&id==='node'||/worker|control plane|control-plane/.test(words)||id==='standby')return 'cluster';
 if(['pod','runtime','function','deploy'].includes(id)||/container runtime/.test(words))return 'container';
 if(['lb','gateway','nat','service','ingress','queue','collector','socket'].includes(id)||/load balancer|routing|dns resolver|api gateway/.test(words))return 'router';
 if(['policy','secrets','trust','edge'].includes(id)||/security|trust check|admission/.test(words))return 'shield';
 if(['health','verify','check','alert','engineer'].includes(id)||/verification|monitoring|incident response/.test(words))return 'observatory';
 if(['source','git'].includes(id)||/configuration|source change/.test(words))return 'document';
 return 'server';
}
export const palette={
 workstation:{top:'#a4b7ec',front:'#6173ae',side:'#414d83',light:'#e1ebff',accent:'#70ddff'},
 server:{top:'#b1c5ed',front:'#697fb8',side:'#414b7b',light:'#d4e4ff',accent:'#6be5ff'},
 registry:{top:'#c4b8f0',front:'#8973b2',side:'#54446f',light:'#e7d7ff',accent:'#f1ba77'},
 database:{top:'#9ee8ed',front:'#548db0',side:'#405c8c',light:'#ddffff',accent:'#62f0d5'},
 pipeline:{top:'#b8bfed',front:'#7b78ac',side:'#4f477d',light:'#e7deff',accent:'#89e8ff'},
 cluster:{top:'#b9b4ef',front:'#7866ad',side:'#493965',light:'#e4dcff',accent:'#74f4df'},
 container:{top:'#74d6e7',front:'#4294b4',side:'#315c95',light:'#bdf5ff',accent:'#8af2ca'},
 router:{top:'#a89aef',front:'#7769b6',side:'#4c417a',light:'#ded6ff',accent:'#6beaff'},
 shield:{top:'#bda7ed',front:'#8b6cb1',side:'#5b4379',light:'#eedfff',accent:'#f29ce8'},
 observatory:{top:'#a6bde9',front:'#5d7f9e',side:'#354f72',light:'#d8efff',accent:'#7effc5'},
 document:{top:'#b2c4ed',front:'#7389b4',side:'#424f7c',light:'#e0edff',accent:'#7de3ff'}
};
export function drawAsset(model,node,flags){
 const c=model.ctx,kind=assetKind(model.lab,node),base=palette[kind];
 const color=flags.bad?{...base,top:'#ce8a9f',front:'#985c79',side:'#61405f',accent:'#ff8d9e'}:base;
 const X=node.x,Z=node.z,project=(x,y,z)=>model.project(X+x,y,Z+z);
 const poly=(points,fill,stroke)=>model.path(points.map(v=>project(...v)),fill,stroke);
 function box(x,z,w,d,y,h,material=color,edge='#91a9d766'){
  const pts=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([a,b])=>[x+a,z+b]);
  const faces=pts.map((a,i)=>{const b=pts[(i+1)%4];return {a,b,depth:project((a[0]+b[0])/2,0,(a[1]+b[1])/2).y,i};}).sort((a,b)=>a.depth-b.depth);
  for(const f of faces)poly([[f.a[0],y,f.a[1]],[f.b[0],y,f.b[1]],[f.b[0],y+h,f.b[1]],[f.a[0],y+h,f.a[1]]],f.i===1||f.i===2?material.front:material.side,edge);
  poly(pts.map(a=>[a[0],y+h,a[1]]),material.top,edge);
 }
 const line=(a,b,stroke=color.accent,width=1)=>model.line(project(...a),project(...b),stroke,width);
 function disk(x,y,z,r,fill,vertical=false,stroke=color.light){const vertices=Array.from({length:24},(_,i)=>{const a=i/24*Math.PI*2;return vertical?[x+Math.cos(a)*r,y+Math.sin(a)*r,z]:[x+Math.cos(a)*r,y,z+Math.sin(a)*r];});poly(vertices,fill,stroke);}
 function cylinder(x,z,r,y,h,material=color){const segments=20;const ring=Array.from({length:segments},(_,i)=>[x+Math.cos(i/segments*Math.PI*2)*r,z+Math.sin(i/segments*Math.PI*2)*r]);const sides=ring.map((a,i)=>({a,b:ring[(i+1)%segments],d:project(a[0],0,a[1]).y})).sort((a,b)=>a.d-b.d);for(const {a,b}of sides)poly([[a[0],y,a[1]],[b[0],y,b[1]],[b[0],y+h,b[1]],[a[0],y+h,a[1]]],material.front,'#97c5e333');disk(x,y+h,z,r,material.top,false,material.light);}
 function screen(x,z,w,y,h){box(x,z,w,.055,y,h,{top:'#8195c1',front:'#182648',side:'#334675'},'#aac4ec');poly([[x-w*.44,y+.04,z+.031],[x+w*.44,y+.04,z+.031],[x+w*.44,y+h-.04,z+.031],[x-w*.44,y+h-.04,z+.031]],'#12233e','#5ac7e0');for(let i=0;i<4;i++)line([x-w*.33,y+h-.11-i*.075,z+.035],[x+w*(i%2?.12:.28),y+h-.11-i*.075,z+.035],i%2?'#97d9a7':'#70ddff',1.1);}
 function shipping(x,z,w=.56,d=.44,y=.18,h=.43,green=false){const mat=green?{top:'#8be2c5',front:'#4baf9c',side:'#39797b'}:color;box(x,z,w,d,y,h,mat,'#a6edf0aa');for(let i=1;i<6;i++){const xx=x-w/2+w*i/6;line([xx,y+.04,z+d/2+.004],[xx,y+h-.03,z+d/2+.004],green?'#a9f5d0':'#a1e8ff',.8);}line([x-w/2+.03,y+h-.025,z+d/2+.007],[x+w/2-.03,y+h-.025,z+d/2+.007],'#d2f8ff',1);}
 function tower(x=0,z=0,y=.18){box(x,z,.62,.62,y,1.18);for(let i=0;i<3;i++){box(x,z+.32,.5,.035,y+.12+i*.27,.19,{top:'#92b2de',front:'#344563',side:'#293552'},'#a5c4e7');line([x-.16,y+.21+i*.27,z+.346],[x+.06,y+.21+i*.27,z+.346],color.accent,2);disk(x+.17,y+.2+i*.27,z+.347,.026,i===2?'#c4f59b':color.accent,true,color.accent);}line([x-.28,y+1.15,z+.32],[x+.28,y+1.15,z+.32],color.light,1.6);}
 // Every component has a beveled pedestal; each object has its own recognizable silhouette.
 const platform={top:flags.selected?'#4c4b85':'#343558',front:'#343052',side:'#22213c'};
 c.shadowColor=flags.bad?'#fb718e':flags.active?'#49d9ff':'#9567ed';c.shadowBlur=flags.selected?20:flags.active?12:3;
 box(0,0,1.64,1.43,.02,.15,platform,flags.selected?'#ad9bff':flags.active?'#70dfff':'#73649c');c.shadowBlur=0;
 // A distinct luminous front edge helps locate the object's ground connection.
 line([-.7,.19,.62],[.7,.19,.62],flags.bad?'#ff8a9c':flags.active?'#7ae7ff':'#8875bd',flags.active?2:1);
 if(kind==='workstation'){
  for(const x of [-.48,.48])for(const z of [-.19,.31])box(x,z,.07,.07,.18,.43,{top:'#c6bbdb',front:'#8b7ca8',side:'#5b507d'});
  box(0,.05,1.18,.75,.61,.09,{top:'#d0bedb',front:'#9f8bb7',side:'#6f628f'});screen(.05,-.15,.73,.76,.51);box(.05,.21,.51,.19,.71,.035,{top:'#9baace',front:'#586c95',side:'#40537d'});
  for(let j=0;j<3;j++)line([-.16,.75,.14+j*.05],[.27,.75,.14+j*.05],'#dae3fc',.7);
  cylinder(-.57,.45,.12,.31,.31,{top:'#8cacfb',front:'#6885d7',light:'#aac4ff'});disk(-.57,.79,.45,.1,'#eeb9b1',false,'#f4ccc5');box(-.57,.44,.27,.23,.22,.1,{top:'#8a78c0',front:'#675796',side:'#40395e'});
 }else if(kind==='server')tower();
 else if(kind==='registry'){
  box(0,0,.94,.82,.18,1.03);poly([[-.37,.3,.421],[.37,.3,.421],[.37,1.09,.421],[-.37,1.09,.421]],'#4c4b7d','#b8c5f4');disk(.06,.71,.43,.2,'#6b7fa4',true,'#d3e4ff');disk(.06,.71,.435,.1,'#354560',true,'#a9d6ed');for(let i=0;i<4;i++){const a=i*Math.PI/2;line([.06,.71,.44],[.06+Math.cos(a)*.16,.71+Math.sin(a)*.16,.44],'#d2e8ff',1.6);}box(-.4,.43,.16,.08,.57,.28,{top:'#ffdc93',front:'#edba72',side:'#bd804b'},'#ffdda8');
 }else if(kind==='database'){
  for(let i=0;i<3;i++){const y=.2+i*.29;cylinder(0,0,.46,y,.23);disk(0,y+.24,0,.46,'#91dfe9',false,color.light);}
  line([-.28,.39,.38],[.25,.39,.38],'#b3fff2',2);
 }else if(kind==='pipeline'){
  box(.11,.06,1.22,.58,.27,.16,{top:'#788bb1',front:'#4e5d83',side:'#394363'});for(let i=0;i<9;i++)line([-.43+i*.135,.45,-.18],[-.43+i*.135,.45,.32],'#b6c6e2',1.2);
  box(-.48,-.34,.3,.27,.2,.26);const joints=[[-.48,.45,-.34],[-.48,1.03,-.34],[.06,1.25,-.17],[.28,.79,.12]];for(let i=0;i<joints.length-1;i++)line(joints[i],joints[i+1],'#86b8e6',Math.max(3,model.width/95));for(const j of joints)disk(j[0],j[1],j[2],.08,'#b1dbf6',false,'#e1f3ff');
  box(.3,.07,.34,.31,.46,.34,{top:'#ffd29b',front:'#d9a576',side:'#a67867'},'#f6d7a7');line([.3,.81,-.08],[.3,.81,.22],'#f8e5c4',2);line([.21,.81,.06],[.21,.72,.06],color.accent,1.8);line([.35,.81,.06],[.35,.72,.06],color.accent,1.8);
 }else if(kind==='cluster'){
  box(0,0,1.26,1.02,.18,.12,{top:'#9b9ee0',front:'#6764a0',side:'#464170'},'#b3b9ef');
  for(const [x,z]of [[-.35,-.22],[.32,-.22],[-.35,.31],[.32,.31]])shipping(x,z,.47,.36,.32,.42,x>0);
  if(/control|api|primary/.test(node.id+' '+node.type.toLowerCase())){box(0,-.09,.38,.4,.73,.48,{top:'#bed4f3',front:'#718bbb',side:'#485b88'});screen(0,.13,.29,.82,.24);}
 }else if(kind==='container'){
  shipping(-.28,.1,.63,.53,.2,.52);shipping(.35,.02,.52,.53,.2,.52,true);shipping(-.12,-.19,.62,.42,.74,.34,true);
 }else if(kind==='router'){
  box(0,0,1.09,.83,.21,.25);const y=.48;const p=project(0,y,0);for(const [dx,dz]of [[-.35,0],[.35,0],[0,-.3]]){const end=project(dx,y,dz);model.line(p,end,'#bcfaff',2.8);const angle=Math.atan2(end.y-p.y,end.x-p.x);model.path([{x:end.x+4*Math.cos(angle),y:end.y+4*Math.sin(angle)},{x:end.x-3*Math.cos(angle-.65),y:end.y-3*Math.sin(angle-.65)},{x:end.x-3*Math.cos(angle+.65),y:end.y-3*Math.sin(angle+.65)}],'#bcfaff');}
  for(const x of [-.3,0,.3])disk(x,.34,.43,.025,color.accent,true,color.accent);
 }else if(kind==='shield'){
  tower(-.12,-.07,.18);poly([[.09,.42,.4],[.35,.3,.4],[.62,.49,.4],[.62,.92,.4],[.35,1.06,.4],[.09,.92,.4]],'#8c73bd','#f4b8eb');line([.22,.68,.41],[.32,.58,.41],'#d8ffef',2);line([.32,.58,.41],[.49,.83,.41],'#d8ffef',2);
 }else if(kind==='observatory'){
  box(0,.05,1.21,.71,.23,.15,{top:'#b4bfda',front:'#6d8ba7',side:'#485d7d'});screen(-.29,-.13,.48,.48,.59);screen(.29,-.13,.48,.48,.59);box(.02,.24,.63,.15,.39,.04,{top:'#a4bad6',front:'#687b9d',side:'#52607b'});
  for(let i=0;i<5;i++)box(-.43+i*.07,-.09,.035,.035,.56,.08+(i%3)*.06,{top:'#8cffcb',front:'#5bbaaa',side:'#498778'},'#a5ffe0');line([.13,.72,-.09],[.22,.83,-.09],'#a7ffdc',1.6);line([.22,.83,-.09],[.31,.67,-.09],'#a7ffdc',1.6);line([.31,.67,-.09],[.43,.94,-.09],'#a7ffdc',1.6);
 }else if(kind==='document'){
  box(-.03,0,.81,.45,.18,1.08);poly([[-.35,.34,.24],[.29,.34,.24],[.29,1.12,.24],[-.35,1.12,.24]],'#263b62','#96d7f3');for(let i=0;i<5;i++)line([-.25,.98-i*.12,.25],[i%2?.07:.2,.98-i*.12,.25],i%2?'#c5abf0':'#78e5ff',1.7);disk(.16,.4,.25,.055,'#9cf1d5',true,'#c3ffea');
 }
 return kind;
}
