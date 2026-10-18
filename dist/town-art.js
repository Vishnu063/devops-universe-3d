// Code-native, raycastable visual vocabulary shared by the connected towns.
export function buildTownAsset(n,{add,material,round,cylinder,sphere}){
 const [w,h,d]=n.size,tint=n.visualTint||n.color||0x88ccf2;
 const box=(size,pos,color=tint,glow=false)=>add(round,size,pos,material(color,glow));
 if(n.district&&n.id!=='cluster'){
  box([w,.3,d],[0,.15,0],0x383363);box([w*.98,.12,d*.98],[0,.36,0],tint);box([w*.95,.18,d*.95],[0,.49,0],0x303951);
  for(const x of [-1,1])for(const z of [-1,1])add(cylinder,[.45,.18,.45],[x*(w/2-.7),.65,z*(d/2-.7)],material(tint,true));return true;
 }
 if(!n.visualRole||n.minor)return false;
 if(n.kind==='document'){
  for(let i=0;i<3;i++)box([w*.9,.12,d*.75],[i*.06,.2+i*.2,0],i===2?tint:0x455475);
  box([w*.8,h*.68,.12],[0,h*.52,-d*.2],tint);
  for(let i=0;i<4;i++)box([w*(i%2?.45:.6),.05,.04],[-w*.04,h*(.34+i*.12),-d*.2+.09],0xc6efff,true);return true;
 }
 if(n.kind==='shield'){
  box([w,.25,d],[0,.125,0],0x454360);box([w*.78,h*.64,.3],[0,h*.46,0],tint);
  const lock=add(cylinder,[w*.35,h*.27,w*.35],[0,h*.83,0],material(0xf3d796));
  box([w*.35,h*.25,.4],[0,h*.5,.27],0xf3d796);box([.06,h*.11,.06],[0,h*.5,.5],0x3b355a);return !!lock;
 }
 if(n.id==='queue'){
  box([w,.3,d],[0,.15,0],0x4f5677);for(let i=0;i<4;i++){add(cylinder,[.18,w*.85,.18],[0,.4,-d*.35+i*d*.23],material(0xa9bfdc)).rotation.z=Math.PI/2;box([w*.35,.5,d*.22],[0,.75,-d*.32+i*d*.22],tint);}return true;
 }
 if(n.kind==='router'){
  box([w,h*.65,d],[0,h*.33,0],tint);for(const x of [-.35,.35]){box([.07,h*.7,.07],[x*w,h*.8,-d*.3],0xc6e8ff);add(sphere,[.16,.16,.16],[x*w,h*1.2,-d*.3],material(tint,true));}
  for(let i=0;i<4;i++)box([w*.12,.08,.05],[-w*.3+i*w*.2,h*.3,d/2],0xb8f8ee,true);return true;
 }
 if(n.id==='git-branch'){
  box([w,.18,d],[0,.1,0],0x3c405e);box([.12,h*.8,.12],[0,h*.5,0],tint);box([w*.65,.12,.12],[w*.25,h*.65,0],tint);
  for(const [x,y]of [[0,.25],[0,.8],[.55,.65]])add(sphere,[.42,.42,.42],[x*w,y*h,0],material(0xf6ba93,true));return true;
 }
 if(n.id==='docker-engine'||n.id==='terraform'||n.id==='ansible'){
  box([w,.2,d],[0,.1,0],0x3c4260);box([w*.8,h*.65,d*.65],[0,h*.4,0],tint);add(cylinder,[w*.35,.14,w*.35],[0,h*.78,0],material(0xadf9e8,true));
  for(let i=0;i<3;i++)box([w*.52,.08,.05],[0,h*(.25+i*.16),d*.34],0xc2eaff,true);return true;
 }
 return false; // Existing desk, database, conveyor, container and rack assets retain their meanings.
}
