# DevOps Universe 3D

**See it. Trace it. Understand it.**

A free, dependency-free learning website that explains how requests, network packets, source code, artifacts, telemetry and recovery decisions move through a DevOps system.

## Start learning

```bash
git clone https://github.com/Vishnu063/devops-universe-3d.git
cd devops-universe-3d
python3 -m http.server 8080 --directory dist
```

Open **http://localhost:8080**. No npm installation, cloud account, API key, GPU, backend or paid service is needed. Serve the folder over HTTP; opening `index.html` directly as a `file://` URL will not load JavaScript modules reliably.

1. Begin with **A web request, end to end**.
2. Click **Next step** to follow one directed connection at a time. **Play journey** advances automatically; speed is adjustable.
3. Read the protocol, example payload, explanation and architecture caveat below the model.
4. Click a component for what it receives, what it sends, why it matters, relevant tools and a misconception to avoid.
5. Drag to orbit, scroll or use buttons to zoom, and choose **2D map** when a flat layout is easier.
6. Inject the model’s failure, read the evidence and choose a recovery action. Wrong answers provide feedback and allow another attempt.
7. Answer the knowledge check. A model is complete after all journey steps, a correct answer and a recovery exercise.

## Eight interactive architecture models

| Model | What you learn |
| --- | --- |
| A web request, end to end | Separate DNS exchange, HTTPS, CDN/WAF, load balancing, app/database query, and response return path |
| Inside a private network | Public/private tiers, routing, security groups and a separate NAT egress example |
| From commit to production | Reviewed source, CI, tests, security gates, registry digest, rollout and health verification |
| Inside Kubernetes | Management/control flow, scheduling, kubelet, readiness, Ingress and Service/Pod traffic |
| A secure delivery chain | Secret/code/image scans, SBOM, signing, admission, identity and runtime access |
| From symptom to evidence | Correlated logs, metrics, traces, collection, alerting and evidence-based recovery |
| An event-driven workflow | Queue acceptance, function processing, idempotency, acknowledgements and dead-letter queues |
| Recover from an outage | Protected backups, restoration, RPO/RTO, business validation and controlled failover |

The **Learning library** covers all 30 areas from the DevOps curriculum: practices, operating systems, networking, scripting, Git, builds, CI/CD, testing, artifacts, containers, Kubernetes, IaC, configuration management, cloud, releases, GitOps, application infrastructure, databases, observability, incident response, SRE, DevSecOps, identity/secrets/policy, disaster recovery, platform engineering, FinOps, governance, serverless, specialized disciplines and documentation/measurements.

Each area includes its purpose, conceptual flow, skills, tools, practical exercise, pitfall and a link to a related model. Search and area filters are included. A 26-row AWS/Azure/Google Cloud comparison maps common service categories.

**Scope:** all 30 areas have learning content; eight selected architectures have interactive models. This release does not provide a separate simulation for every vendor product, execute shell commands, connect to live infrastructure, or emulate real packet timing. The models are educational abstractions, with implementation caveats shown in the lesson text. Serverless success and failure branches are explained separately. Kubernetes control-plane traffic is distinguished from user traffic.

## Accessibility and privacy

- Keyboard-accessible component buttons, view controls and lesson navigation.
- Complete text journey for screen readers and learners who prefer reading.
- Flat 2D view, readable labels and reduced-motion support.
- Responsive layouts for phones, tablets and desktops.
- Optional browser speech synthesis. Available voices and whether speech uses a local or remote service depend on the browser and operating system.
- Progress is saved in browser-local storage, with a JSON download and deliberate two-click reset. Storage failures degrade to session progress. There is no account sync or progress import in this release.
- No analytics, external scripts, CDN libraries, fonts, cloud credentials or tracking requests are included in the application.

## Development and checks

Node.js 22 or newer is only needed for checks, not for serving the site.

```bash
npm run check
npm test
```

Tests validate directed connections, curriculum coverage, recovery gates, completion rules, corrupted progress handling, search behavior, DNS separation and HTML selector consistency. A lightweight DOM smoke test also exercises navigation, all model journeys, all quiz/failure options, filtering and progress reset without launching a browser.

Browser visual QA must still be performed on target browsers. Test mobile orbit/scroll interactions, canvas text and label overlap, zoom limits, keyboard navigation, screen reader output, speech support and reduced-motion settings before claiming universal browser compatibility.

## Deploy

Upload the contents of **dist/** to any static host. All application paths are relative, so GitHub Pages project URLs are supported.

The included GitHub Actions **Check and publish learning site** workflow validates the project and uploads the static-site artifact after pushes to `main`. GitHub Pages deployment is opt-in so checks work before hosting is configured. To publish on GitHub Pages:

1. Select **Settings → Pages → Source → GitHub Actions**.
2. Add the repository Actions variable **ENABLE_PAGES** with the value **true** under **Settings → Secrets and variables → Actions → Variables**.
3. Run the workflow manually or push a change to `main`.

Once enabled and a successful deployment runs, the expected project URL is `https://vishnu063.github.io/devops-universe-3d/`. This URL is not claimed as live until GitHub reports a successful deployment.

The hosted preview supplied with this project is private to the site owner by default. Changing the GitHub repository does not automatically update that separate preview; GitHub Pages uses repository workflow deployments.

## Project structure

```text
dist/
  index.html       Semantic interface and learning workspace
  style.css        Responsive layout, visual theme and accessibility styling
  data.js          Eight models, 30 curriculum areas and cloud mappings
  model.js         Canvas renderer projecting 3D coordinates, orbit and animation
  core.js          Pure progress, filtering and recovery-gate logic
  app.js           Playback, lessons, component inspector and interactions
tests/             Content, state and DOM interaction checks
.github/workflows/ Automated checks and GitHub Pages deployment
```

The 3D renderer uses a small custom Canvas 2D projection of three-dimensional coordinates, rather than a heavyweight WebGL engine. It draws solid isometric blocks, directed connections and moving packets; rotation and zoom change the projected view. No 3D assets need downloading.

## Learning references

- [Kubernetes Services](https://kubernetes.io/docs/concepts/services-networking/service/)
- [Kubernetes EndpointSlices](https://kubernetes.io/docs/concepts/services-networking/endpoint-slices/)
- [Kubernetes virtual IPs and service proxies](https://kubernetes.io/docs/reference/networking/virtual-ips/)
- [AWS private subnet and NAT architecture](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-example-private-subnets-nat.html)
- [AWS NAT gateways](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html)
- [Using Lambda with SQS](https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html)
- [SQS at-least-once delivery](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/standard-queues-at-least-once-delivery.html)

## Contributing

Add or improve educational content in `dist/data.js`. Preserve accurate direction, distinguish data traffic from control relationships, explain abstractions, and add evidence-based failure exercises. Run both checks before submitting a pull request. Never add real credentials, private logs or customer data.
