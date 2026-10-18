// Reference-style scene composition. Existing resource IDs and explanations are reused.
export const modelContext=['developer','git','ci','registry','users','monitoring'];
export const modelOverview=['cluster','control-plane','worker-a','worker-b','worker-c','pod-a','pod-b','pod-c','app-a','app-b','app-c','ingress','service',...modelContext];
export const modelLayout={
 cluster:[4,.85,1], 'control-plane':[5,1.5,-5], 'worker-a':[-3,1.5,2], 'worker-b':[7,1.5,2], 'worker-c':[2,1.5,8.5],
 'pod-a':[-3,1.95,2], 'pod-b':[7,1.95,2], 'pod-c':[2,1.95,8.5],
 developer:[-22,.4,8], git:[-22,.4,-2], ci:[-15,.4,9], registry:[-14,.4,-6], users:[18,.4,-9], ingress:[14,1.5,-5],service:[12,1.5,4],monitoring:[19,.4,11]
};
export const modelColors={delivery:0xa898ff,images:0x64e7ff,control:0xff9fd7,traffic:0x69eaff,telemetry:0x8fffc4};
export function installK8sModel(nodes,flows){
 const add=(id,label,parent,kind,position,size,purpose,input,output,notes)=>nodes.push({id,label,parent,kind,position,size,purpose,input,output,notes,command:'',reference:'https://kubernetes.io/docs/concepts/',minor:false});
 add('worker-c','Worker node C','cluster','node',[0,.4,11],[7.5,.2,5.5],'Illustrate a third eligible worker in the modeled cluster.','Assigned Pod specifications and allowed traffic.','Running workload and status reports.','Three workers are a visual example, not a Kubernetes minimum or an availability guarantee.');
 add('pod-c','Application Pod C','worker-c','pod',[.2,.35,.9],[4.7,.15,2.6],'Group the third example application instance.','Pod specification, network traffic and configuration.','Responses and observations from the third instance.','A Pod is a logical execution boundary, not an additional physical server.');
 add('app-c','App container C','pod-c','container',[-1.15,.35,0],[1.1,.9,.8],'Run the application process in the third Pod.','Allowed application requests.','Application responses and telemetry.','This instance uses the same application role; its writable runtime state is separate.');
 const labels={developer:'1. Developer',git:'2. Git repository',ci:'3. Build & test',registry:'4. Container registry',monitoring:'Monitoring & logging',users:'Client traffic'};for(const [id,label] of Object.entries(labels))nodes.find(n=>n.id===id).visualLabel=label;
 for(const n of nodes)if(n.kind==='pod')n.visualHeight=2.3;
 const offsets={cluster:[0,.2,10.2],'worker-a':[-1.5,.1,-2.5],'worker-b':[1.7,.1,-2.5],'worker-c':[-.7,.1,2.4],git:[-1,.1,0],'app-a':[0,.4,1.3]};for(const [id,offset]of Object.entries(offsets))nodes.find(n=>n.id===id).visualLabelOffset=offset;
 const cluster=nodes.find(n=>n.id==='cluster');cluster.size=[26,.25,21];
 nodes.find(n=>n.id==='control-plane').visualHeight=3.8;
 for(const id of modelContext){const n=nodes.find(n=>n.id===id);n.visualScale=1.55;n.visualHeight=(id==='git'||id==='registry'?2.6:2.2)*1.55;}
 const hop=(from,to,title,channel,text,packet,relation='network')=>({from,to,title,channel,text,packet,relation,kind:channel==='control'?'Control / API relationship':channel==='telemetry'?'Telemetry exchange':relation==='configuration'?'Logical routing reference':'Network exchange'});
 flows['k8s-model']={label:'Kubernetes model · connected architecture',color:0x67eaff,steps:[
 hop('developer','git','Commit code','delivery','The developer shares versioned source with the configured repository.','Git over HTTPS or SSH'),
 hop('git','ci','Trigger build','delivery','An authenticated repository event triggers a build of an exact revision.','Repository event → CI job'),
 hop('ci','registry','Push image','images','CI builds, tests and scans the image before an authorized push to the registry. The registry does not deploy it.','Image manifest + layers → registry'),
 hop('worker-a','registry','Pull request','images','The runtime on this worker initiates an authenticated image pull. The worker boundary abbreviates its runtime here.','Runtime → registry HTTPS :443'),
 hop('registry','worker-a','Image layers','images','The registry returns the requested image manifest and layers over that established connection.','Registry → worker runtime image bytes'),
 hop('ci','control-plane','Apply desired state','control','Authorized deployment automation submits reviewed resource configuration to the API server. CI is one example of that automation; GitOps is another.','Deployment configuration → API', 'control'),
 hop('control-plane','worker-a','Schedule & reconcile','control','The scheduler records placement through the API; the worker kubelet observes assigned Pod specifications. This is a summarized control relationship, not application traffic.','API binding / watches → kubelet','control'),
 hop('control-plane','worker-b','Reconcile replica','control','Controllers maintain desired resources and the assigned worker executes them through kubelet/runtime. The diagram abbreviates those API interactions.','Desired state → assigned workload','control'),
 hop('control-plane','worker-c','Reconcile replica','control','This worker illustrates another application replica and failure domain. Capacity and scheduling rules still matter.','Assigned Pod → worker execution','control'),
 hop('users','ingress','HTTPS request','traffic','After DNS resolution, traffic reaches the configured public entry and Ingress controller. External load-balancer implementation details are abbreviated.','Client → entry HTTPS :443'),
 hop('ingress','service','Choose backend','traffic','Ingress configuration references a Service backend. Some controllers connect directly to ready endpoint addresses. Service is not an extra physical proxy server.','Host/path → ready backend','configuration'),
 hop('service','app-a','To ready Pod','traffic','The configured Service dataplane and Pod network deliver permitted traffic to the real listener. This is a logical boundary view of that forwarding.','Service :80 → Pod/app :8080'),
 hop('app-a','ingress','App response','traffic','The response returns over the established dataplane and controller connections; intermediate boundaries are abbreviated.','HTTP response → upstream'),
 hop('ingress','users','HTTPS response','traffic','The client receives the response on its established connection. The control plane was not in the HTTP forwarding path.','Response → client'),
 hop('app-a','monitoring','Metrics / logs','telemetry','Configured collectors and instrumentation feed observability backends. This arrow summarizes collection; Prometheus scrapes are a separate pull exchange.','Configured metrics / logs / traces')
 ]};
}
