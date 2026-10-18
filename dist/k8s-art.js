// Code-native meshes, inspired by the user's reference illustration.
// Platforms group logical resources; they are not extra network hops.
export function buildK8sAsset(node,{add,material,round,cylinder,sphere,T}){
 const [w,h,d]=node.size;
 const block=(size,pos,color=0x879dd9)=>add(round,size,pos,material(color));
 const disk=(size,pos,color=0x8de7eb)=>add(cylinder,size,pos,material(color));
 const orb=(size,pos,color)=>add(sphere,size,pos,material(color));
 const light=(size,pos,color=0x7df5ff)=>add(round,size,pos,material(color,true));
 const pad=(width,depth,y=0)=>{block([width,.23,depth],[0,y-.25,0],0x5c4a99);block([width*.96,.17,depth*.96],[0,y-.05,0],0x8596df);light([width*.89,.035,.045],[0,y+.025,depth*.46]);};
 if(node.id==='cluster'){
  block([w+.7,.65,d+.7],[0,-.42,0],0x42357c);block([w+.25,.24,d+.25],[0,-.02,0],0x7772bb);block([w,.15,d],[0,.17,0],0x8c9ad0);
  for(const x of [-1,1])light([.055,.04,d*.91],[x*w*.48,.27,0],0x8dd9ff);
  light([w*.91,.04,.055],[0,.27,d*.48],0xc89bff);return true;
 }
 if(node.kind==='node'){
  pad(w,d,h);block([w*.95,.14,d*.92],[0,h+.05,0],0xa7c0e5);
  for(let i=0;i<5;i++)light([.12,.035,.18],[-w*.32+i*.19,h+.14,d*.4],i===4?0xffc580:0x70f4d9);
  return true;
 }
 if(node.id==='control-plane'){
  pad(w*.72,d*.9,.1);block([2.25,2.7,1.9],[0,1.45,0],0x666999);block([2.55,.35,2.2],[0,2.96,0],0xb6c5e8);
  light([1.75,.035,1.4],[0,3.15,0],0x92efff);disk([.82,.04,.82],[0,3.2,0],0x5cbdde);
  block([1.65,1.05,.11],[0,1.9,1.01],0x182f58);for(let i=0;i<3;i++)light([1.18-i*.17,.065,.045],[-.08,2.15-i*.2,1.08],i%2?0xc2b0ff:0x74e8fc);
  block([2.5,.23,1.1],[0,.75,1.25],0xaab8d9);for(let i=0;i<5;i++)light([.24,.045,.14],[-.7+i*.35,.89,1.23],i===4?0xffc287:0x70efff);
  for(const x of [-1,1])block([.35,1.15,.6],[x*1.25,.65,.1],0x777baa);return true;
 }
 if(node.kind==='pod'){
  pad(w,d,.1);light([w*.91,.055,.045],[0,.16,d*.45],0x8ffbff);
  const glass=material(0x7be3e9).clone();glass.transparent=true;glass.opacity=.12;glass.depthWrite=false;
  add(round,[w*.95,1.5,d*.95],[0,.95,0],glass);
  for(const x of [-1,1])for(const z of [-1,1])disk([.07,1.5,.07],[x*w*.44,.95,z*d*.43],0xa8eaff);
  // A status beacon identifies the Pod boundary, while its actual containers remain inside.
  disk([.65,.22,.65],[w*.31,1.78,-d*.25],0xb2d6e5);orb([.6,.38,.6],[w*.31,1.97,-d*.25],0x9bf2d6);return true;
 }
 if(node.kind==='container'){
  block([w,h,d],[0,h/2,0],node.id.startsWith('app')?0x42b5d0:0x6f9fc6);
  for(let i=0;i<6;i++)block([w*.038,h*.82,.045],[-w*.4+i*w*.16,h*.5,d*.51],0x9de7ed);
  light([w*.76,.045,.04],[0,h*.88,d*.54]);return true;
 }
 if(node.id==='git'||node.id==='registry'){
  pad(w*1.3,d*1.3,.05);block([w,h,d],[0,h/2+.15,0],node.id==='git'?0x8fc0dd:0x9e9fc9);block([.1,h*.93,d*.95],[-w*.51,h*.5+.15,0],0xbfa2d6);
  if(node.id==='git'){
   for(let i=0;i<3;i++){block([w*.78,h*.23,.09],[0,h*(.23+i*.27)+.13,d*.53],0x627fa5);light([w*.38,.05,.045],[-w*.1,h*(.23+i*.27)+.16,d*.59],i===1?0xffd398:0xa2f4ff);}
  }else{
   block([w*.81,h*.83,.1],[0,h*.52+.15,d*.53],0x7182ad);const dial=disk([.72,.15,.72],[.1,h*.58,d*.64],0xb7cde5);dial.rotation.x=Math.PI/2;const ring=new T.Mesh(new T.TorusGeometry(.26,.045,6,20),material(0x6680a2));ring.position.set(.1,h*.58,d*.76);addObject(ring);
   block([.43,.5,.16],[-w*.58,h*.5,d*.45],0xffcf7c);const lock=new T.Mesh(new T.TorusGeometry(.16,.045,6,16),material(0xffe3a6));lock.position.set(-w*.58,h*.5+.28,d*.45);addObject(lock);
  }return true;
 }
 if(node.id==='ci'){
  pad(w*1.3,d*1.35,.05);block([w,.35,d],[0,.35,0],0x798bb7);block([w*.95,.13,d*.85],[0,.58,0],0x30465e);
  for(let i=0;i<8;i++){const roller=disk([.12,d*.86,.12],[-w*.42+i*w*.12,.67,0],0x8eabc4);roller.rotation.x=Math.PI/2;}
  block([.65,.65,.65],[w*.12,1.04,0],0xe9bb89);block([.17,.67,.67],[w*.12,1.04,0],0xffdbae);
  disk([.75,.18,.75],[-w*.35,.8,-d*.4],0xb5c7e4);block([.26,1.15,.3],[-w*.35,1.4,-d*.4],0x92bdd5);orb([.42,.42,.42],[-w*.35,1.98,-d*.4],0x697ba5);
  block([w*.6,.25,.28],[-w*.06,2.04,-d*.4],0xb9d3e6);orb([.35,.35,.35],[w*.23,2.04,-d*.4],0x6e83ac);block([.16,.68,.16],[w*.23,1.74,-d*.4],0x91c7db);
  for(const x of [-1,1])block([.07,.25,.1],[w*.23+x*.16,1.35,-d*.4],0xd6e6f0);return true;
 }
 if(['developer','users','monitoring'].includes(node.id)){
  pad(node.id==='monitoring'?3.4:3.1,2.5,.05);block([2.7,.15,1.5],[0,.95,0],0xbbafce);for(const x of [-1,1])for(const z of [-1,1])block([.1,.9,.1],[x*1.14,.48,z*.55],0x9686a9);
  const screens=node.id==='monitoring'?[-.65,.65]:[0];for(const x of screens){block([1.15,.78,.12],[x,1.47,-.4],0xb2c4e4);block([1.02,.64,.035],[x,1.47,-.32],0x173555);for(let i=0;i<4;i++)light([.56+(i%2)*.2,.035,.02],[x-.06,1.67-i*.13,-.29],i%2?0x9aecc8:0x76dcfa);}
  block([.8,.045,.33],[0,1.05,.32],0x69849f);
  if(node.id==='developer'){
   block([.73,.7,.28],[-.8,.9,.95],0x7b88b8);disk([.12,.55,.12],[-.8,.35,.95],0x6b769b);
   orb([.52,.62,.5],[-.8,1.27,.62],0x5f9cdb);orb([.42,.46,.4],[-.8,1.84,.58],0xf3bbae);orb([.44,.22,.42],[-.8,2.03,.55],0x674964);
   for(const x of [-1,1]){block([.15,.5,.17],[-.8+x*.19,.55,.75],0x4c5f8b);block([.14,.13,.52],[-.8+x*.3,1.16,.38],0xf0b5a5);}
  }return true;
 }
 if(node.id==='ingress'||node.id==='service'){
  pad(w*1.25,d*1.25,.05);block([w,h,d],[0,h/2+.16,0],node.id==='ingress'?0xa18ee0:0x82c0dc);
  light([w*.64,.035,.1],[0,h+.2,0]);for(const x of [-1,1]){const arrow=new T.Mesh(new T.ConeGeometry(.15,.4,3),material(0xa9fbff,true));arrow.rotation.z=x*Math.PI/2;arrow.position.set(x*w*.38,h+.22,0);addObject(arrow);}return true;
 }
 return false;
 function addObject(mesh){add(mesh.geometry,[1,1,1],mesh.position.toArray(),mesh.material).quaternion.copy(mesh.quaternion);}
}
export function roundedUnitBox(T){const g=new T.BoxGeometry(1,1,1,5,5,5),p=g.getAttribute('position');for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i),core=v.clone().clamp(new T.Vector3(-.39,-.39,-.39),new T.Vector3(.39,.39,.39));v.sub(core).normalize().multiplyScalar(.11).add(core);p.setXYZ(i,v.x,v.y,v.z);}g.computeVertexNormals();return g;}
