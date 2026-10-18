import {clamp} from './core.js';
export class ArchitectureModel {
  constructor(canvas,labels,onSelect){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.labels=labels;this.onSelect=onSelect;this.yaw=-.20;this.zoom=1;this.mode='3d';this.playing=false;this.failed=false;this.step=0;this.selected='';this.dirty=true;this.width=600;this.height=420;this.motion=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.observer=new ResizeObserver(entries=>{const r=entries[0].contentRect;this.width=r.width;this.height=r.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);this.ctx.setTransform(dpr,0,0,dpr,0,0);this.dirty=true;});this.observer.observe(canvas);
    canvas.addEventListener('pointerdown',e=>{this.drag={x:e.clientX,yaw:this.yaw};canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener('pointermove',e=>{if(this.drag&&this.mode==='3d'){this.yaw=this.drag.yaw+(e.clientX-this.drag.x)*.006;this.dirty=true;}});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>{this.drag=null;});
    canvas.addEventListener('wheel',e=>{if(e.ctrlKey||Math.abs(e.deltaY)>0){e.preventDefault();this.zoom=clamp(this.zoom-e.deltaY*.001,.65,1.6);this.dirty=true;}},{passive:false});
    const tick=time=>{if(!document.hidden&&(this.dirty||(this.playing&&!this.motion))){this.draw(time);this.dirty=false;}requestAnimationFrame(tick);};requestAnimationFrame(tick);
    document.addEventListener('visibilitychange',()=>{this.dirty=true;});
  }
  setLab(lab){this.lab=lab;this.labels.replaceChildren();this.buttons=new Map();lab.nodes.forEach((node,i)=>{const b=document.createElement('button');b.className='node-label';b.dataset.node=node.id;b.setAttribute('aria-label',`${node.title}, ${node.zone}. Inspect component`);const num=document.createElement('span');num.className='node-order';num.textContent=String(i+1).padStart(2,'0');b.append(num,document.createTextNode(node.title));const small=document.createElement('small');small.textContent=node.zone.toUpperCase();b.append(small);b.addEventListener('click',()=>this.onSelect(node.id));this.labels.append(b);this.buttons.set(node.id,b);});this.reset();}
  update({step,selected,playing,failed}){Object.assign(this,{step,selected,playing,failed});this.dirty=true;}
  reset(){this.yaw=-.2;this.zoom=1;this.dirty=true;}
  rotate(amount){this.yaw+=amount;this.dirty=true;}
  zoomBy(amount){this.zoom=clamp(this.zoom+amount,.65,1.6);this.dirty=true;}
  setMode(mode){this.mode=mode;this.dirty=true;}
  project(x,y,z){const scale=Math.min(this.width/12.5,this.height/7.7)*this.zoom;if(this.mode==='2d')return {x:this.width/2+x*scale,y:this.height*.49+z*scale*1.15-y*scale*.15};const a=this.yaw;return {x:this.width/2+(x*Math.cos(a)-z*Math.sin(a))*scale,y:this.height*.48+(x*Math.sin(a)+z*Math.cos(a))*scale*.53-y*scale*.95};}
  path(points,fill,stroke){const c=this.ctx;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
  line(a,b,color,width=1,dash=[]){const c=this.ctx;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dash);c.stroke();c.setLineDash([]);}
  arrow(a,b,color){const c=this.ctx;const t=.61;const x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;const angle=Math.atan2(b.y-a.y,b.x-a.x);this.path([{x:x+6*Math.cos(angle),y:y+6*Math.sin(angle)},{x:x-4*Math.cos(angle-.6),y:y-4*Math.sin(angle-.6)},{x:x-4*Math.cos(angle+.6),y:y-4*Math.sin(angle+.6)}],color);}
  draw(time=0){if(!this.lab||!this.ctx)return;const c=this.ctx;c.clearRect(0,0,this.width,this.height);
    for(let x=-6;x<=6;x++)this.line(this.project(x,0,-3.6),this.project(x,0,3.6),'#284035',.7);for(let z=-3;z<=3;z++)this.line(this.project(-6,0,z),this.project(6,0,z),'#284035',.7);
    const current=this.lab.steps[this.step],nodes=new Map(this.lab.nodes.map(n=>[n.id,n]));const seen=new Set();
    this.lab.steps.forEach(s=>{const key=[s.from,s.to].sort().join(':');if(seen.has(key))return;seen.add(key);const n1=nodes.get(s.from),n2=nodes.get(s.to);const a=this.project(n1.x,.08,n1.z),b=this.project(n2.x,.08,n2.z);this.line(a,b,'#47634e',1,[4,5]);this.arrow(a,b,'#58775e');});
    const from=nodes.get(current.from),to=nodes.get(current.to);const a=this.project(from.x,.14,from.z),b=this.project(to.x,.14,to.z);const broken=this.failed&&this.step>=this.lab.failure.at;const color=broken?'#ef9686':'#b5e49a';this.line(a,b,color,2.4,broken?[5,5]:[]);this.arrow(a,b,color);
    const t=broken?.48:(this.playing&&!this.motion?(time%1900)/1900:.48);const dot={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};c.shadowColor=color;c.shadowBlur=12;c.beginPath();c.arc(dot.x,dot.y,4,0,Math.PI*2);c.fillStyle=color;c.fill();c.shadowBlur=0;
    const ordered=[...this.lab.nodes].sort((p,q)=>this.project(p.x,0,p.z).y-this.project(q.x,0,q.z).y);
    ordered.forEach(n=>{const active=n.id===from.id||n.id===to.id;const selected=n.id===this.selected;const bad=broken&&n.id===to.id;const stroke=bad?'#d88978':selected?'#b5e49a':active?'#82b88a':'#4f765c';
      const w=.51,h=.85;const p=(x,y,z)=>this.project(x,y,z);const corners=[p(n.x-w,0,n.z-w),p(n.x+w,0,n.z-w),p(n.x+w,0,n.z+w),p(n.x-w,0,n.z+w)];
      if(this.mode==='3d'){const top=[p(n.x-w,h,n.z-w),p(n.x+w,h,n.z-w),p(n.x+w,h,n.z+w),p(n.x-w,h,n.z+w)];this.path([corners[0],corners[1],top[1],top[0]],bad?'#603d32':'#284e3d',stroke);this.path([corners[1],corners[2],top[2],top[1]],bad?'#794a3b':'#315b44',stroke);this.path([corners[2],corners[3],top[3],top[2]],bad?'#63392f':'#234331',stroke);this.path([corners[3],corners[0],top[0],top[3]],bad?'#75483c':'#2d503b',stroke);this.path(top,bad?'#9e6550':selected?'#638353':active?'#52754c':'#3a5b40',stroke);}
      else this.path(corners,bad?'#663f33':selected?'#57744a':'#2d4d39',stroke);
      const center=this.project(n.x,this.mode==='3d'?.87:0,n.z);c.fillStyle=bad?'#ffd7c7':'#d3edbd';c.font=`${Math.max(14,Math.min(23,this.width/32))}px system-ui`;c.textAlign='center';c.textBaseline='middle';c.fillText(n.icon,center.x,center.y);
      const loc=this.project(n.x,0,n.z);const btn=this.buttons.get(n.id);btn.style.left=`${loc.x}px`;btn.style.top=`${loc.y+(this.mode==='3d'?25:38)}px`;btn.classList.toggle('selected',selected);btn.classList.toggle('failed',bad);btn.setAttribute('aria-pressed',String(selected));
    });
    const caption=broken?'CONNECTION BLOCKED':current.protocol;const cx=(a.x+b.x)/2,cy=(a.y+b.y)/2-16;c.font='8px ui-monospace, monospace';const tw=c.measureText(caption).width;const boxX=clamp(cx-tw/2-8,8,this.width-tw-24);const boxY=clamp(cy-10,45,this.height-45);c.fillStyle='#10241eef';c.fillRect(boxX,boxY,tw+16,20);c.strokeStyle=broken?'#9b6354':'#4c7053';c.strokeRect(boxX,boxY,tw+16,20);c.fillStyle=color;c.textAlign='center';c.textBaseline='middle';c.fillText(caption,boxX+tw/2+8,boxY+10);
  }
}
