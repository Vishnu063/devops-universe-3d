# DevOps Universe 3D

**Choose a topic. Follow the flow. Practice and explain it.**

A free, topic-first DevOps learning website with staged lessons, inspectable architecture models, practical exercises, troubleshooting cases and guided projects. No API key, paid AI model or cloud account is needed to use the site.

## Start

```bash
git clone https://github.com/Vishnu063/devops-universe-3d.git
cd devops-universe-3d
python3 -m http.server 8080 --directory dist
```

Open **http://localhost:8080**. No npm installation is required. Use an HTTP server; JavaScript modules may not load correctly from a `file://` URL.

The separate owner-private hosted site is [DevOps Universe 3D](https://devops-universe-3d.vishnukushwaha63.chatgpt.site). Repository pushes do not automatically update that hosted copy.

## Choose a topic and learn at your pace

The home page opens **Learn by topic**. Choose any of the 30 topics in the dropdown, or search by skill or tool. Prerequisites are linked and a dependency-ordered roadmap is available in **My learning path**. Topics remain open: you do not have to finish another course to inspect one you need now.

Each topic contains:

1. **Three staged lessons:** beginner, intermediate and advanced perspectives, each with a “Can you explain it?” prompt.
2. **A related 3D model:** inspect components, follow directed connections and read the full accessible journey.
3. **A practical exercise:** prerequisites, resource scope, commands or tabletop tasks, expected evidence, explanation and cleanup.
4. **A troubleshooting case:** symptom, evidence, optional hint and explained solution.
5. **Two knowledge questions:** feedback explains correct and incorrect choices.
6. **An evidence notebook:** record actual observations rather than treating a read lesson as executed practice.

There are **90 staged lessons, 60 topic-assessment questions, 30 topic exercises and 30 troubleshooting cases**. Some exercises run real local commands; others are explicitly architecture, policy or operational reasoning exercises. They are not all full infrastructure deployments.

A **course checkpoint** requires all three lessons marked read, both questions answered correctly, and a self-reported practice record of at least 80 characters with confirmation. This is a learning tracker, not independent verification or a professional certification. Reading a solution does not execute a lab.

### Topics covered

Practices; Linux/Windows operating systems; networking; scripting; Git; builds/dependencies; CI/CD; testing; artifacts; containers; Kubernetes; infrastructure as code; configuration management; cloud platforms; releases; GitOps; application infrastructure; databases/storage; observability; incidents; SRE; DevSecOps/supply chain; identity/secrets/policy; backup/disaster recovery; platform engineering; FinOps; governance/compliance; serverless/events; specialized disciplines; documentation/measurements.

The **Learning library** retains the 30-area field guide and a 26-row AWS/Azure/Google Cloud service-category comparison. Similar service categories do not imply identical configuration or behavior.

## Twelve interactive architecture models

| Model | Main lesson |
| --- | --- |
| A web request, end to end | Separate DNS exchange, HTTPS, cache miss, load balancing, database query and response path |
| Inside a private network | Public/private tiers, routing, stateful security groups, NACLs and separate NAT egress |
| From commit to production | Reviewed source, CI, tests, scans, immutable artifact, deployment and verification |
| Inside Kubernetes | Management/control flow versus runtime Ingress/Service/Pod traffic |
| A secure delivery chain | Scanning, SBOM, signing, admission and runtime identity |
| From symptom to evidence | Logs, metrics, traces, alerts and evidence-based mitigation |
| An event-driven workflow | Acceptance, delivery, idempotency, acknowledgement and failed-message recovery |
| Recover from an outage | Protected backups, restore, RTO/RPO, dependency validation and failover |
| A Linux application process | Execution, configuration reads, socket binding and endpoint verification |
| TCP, TLS, then HTTP | TCP handshake, simplified TLS 1.3, local certificate validation and application data |
| From Dockerfile to container | Build context, layers/cache, separate publication, runtime, volume and port mapping |
| An infrastructure change | Plan/state/provider relationships, reviewed apply and outcome verification |

**82 directed journey steps** are included. Each model also has a failure exercise and a knowledge check.

- Click a component for input, output, purpose, tools and a misconception to avoid.
- Click a connection, or use the numbered text journey, to inspect its step.
- Drag to orbit, use zoom/rotation buttons or switch to the flat **2D map**.
- Use **Next step** or adjustable playback to follow one connection at a time.
- Inject a failure, inspect evidence and select a recovery. Unresolved failures block advancement beyond the affected connection.

The renderer projects 3D coordinates onto Canvas 2D and draws solid blocks, links and moving packets. It is a lightweight educational renderer, not a WebGL cloud emulator. Packet animation, layout and timing are illustrative.

## Inspect networking rather than guessing

The connection inspector shows relationship type, source/destination, ports when specified, protocol, route or boundary, example access decision, payload and return-path caveats. Detailed example addresses are supplied for the web, private-network and TCP/TLS paths. Other relationships are explicitly marked conceptual when a concrete packet exchange is not specified.

Public example addresses use documentation ranges; private addresses and ephemeral ports are illustrative. Local file reads, certificate validation and Terraform dependencies are **not** represented as literal TCP traffic.

The **Network decision sandbox** includes internet → ALB, ALB → app, app → database and private app → public API paths. Toggle routing, NACL, security-group, listener and relevant TLS conditions; change the destination port; inspect the first modeled failed boundary and the return path. This uses a fixed explanatory check order and simplified AWS-style assumptions. It does not query cloud state, calculate arbitrary subnet routes or reproduce a real packet capture.

## Three guided end-to-end projects

Downloadable example files are in `dist/projects/learning-app/` and linked from the Projects page.

| Project | Work and evidence |
| --- | --- |
| Containerized API | Test real HTTP/database behavior, build/run a non-root container, inspect health/metrics and verify a readable SQLite backup |
| Kubernetes recovery | Load the local image into a named kind cluster, deploy two replicas/Service, remove required environment configuration, inspect a failed new Pod, roll back and verify |
| Release candidate review | Run tests, build/identify a candidate, optionally scan locally, run a supplied CI example in a disposable repository and record a go/no-go decision |

Each has three evidence milestones, exact commands or tasks, expected results, prerequisites, limits and cleanup. Milestones are self-reported; the site does not remotely execute or certify them.

The sample API exposes `/health`, `/products` and `/metrics`. It deliberately requires `APP_MESSAGE` for the missing-configuration exercise. Its Python standard-library HTTP server and per-Pod SQLite storage are teaching choices, **not a production server/shared-database architecture**. Its metrics sample is not a deployed monitoring stack.

The supplied `ci-example.yml` runs app tests, builds, smoke-tests and cleans up. It does not automatically scan, sign, push an image or deploy production. Copy it only into a separate disposable app repository as explained in the project.

## Progress, accessibility and privacy

- Model progress and course/project records use separate versioned browser-local storage keys; old eight-model progress is retained as the model set expands.
- Course selection does not mark a lesson read. Practice needs observations and explicit confirmation.
- Download progress includes models, courses and project evidence. The two-click reset clears all three.
- Storage failure falls back to session state. No account sync or progress import is provided.
- Controls have text labels; a complete ordered text journey accompanies the canvas; 2D and reduced-motion options are supported.
- Responsive layouts are implemented for phone, tablet and desktop sizes. Actual device/browser visual and assistive-technology verification remains outstanding.
- Optional speech uses browser/OS voices. Whether a voice uses a local or remote service depends on the browser/OS.
- No analytics, externally loaded fonts, CDN libraries or AI inference requests are included. Official reference links leave the site when selected.
- Record sanitized observations without secrets or private customer data.

## Validation and honest limits

Use Node.js 22+ and Python 3 for checks:

```bash
npm run check
npm test
```

The current suite has **24 Node test cases**, including one that runs **four real Python HTTP/database integration tests**. It covers all topic selections, lesson stages, assessment attempts, minimum evidence handling, progress persistence/reset, prerequisites, curriculum/model references, network deny conditions, connection picking, response ports, corrupt-storage input and renderer coordinate checks at multiple widths. DOM tests use a minimal fixture, not a real browser.

Verified locally: JavaScript syntax; these automated tests; the supplied API’s health, product read, metrics and 404 behavior over loopback HTTP.

Not verified in this environment: real browser layout/interaction, phone touch behavior, screen reader output, OS speech, clipboard permissions, Docker build/run, kind deployment/rollback, Terraform/Ansible execution or a real Trivy scan. Instructions for these are provided; they must not be described as successfully executed until observed.

This release offers structured **core DevOps coverage and guided practice**, not complete mastery of every vendor product or advanced specialization. Further production experience, deeper tool-specific labs and specialist study remain necessary. Lesson labels indicate increasing perspective, not independently demonstrated seniority.

## Deploy this static site

Upload `dist/` to a static host. Paths are relative and work under GitHub Pages project URLs.

The repository Actions workflow runs checks and uploads the static-site artifact on `main` pushes and pull requests. GitHub Pages deployment is optional:

1. Select **Settings → Pages → Source → GitHub Actions**.
2. Add repository Actions variable **ENABLE_PAGES** with value **true**.
3. Run the workflow or push a change to `main`.

The expected Pages URL is `https://vishnu063.github.io/devops-universe-3d/` after a successful deployment; it is not claimed live before that result.

## Source layout

```text
dist/
  index.html / style.css   Responsive learning workspace
  data.js                 12 models, field guide and cloud mapping
  curriculum.js           30 courses and their staged learning content
  learning-core.js         Course/project progress and prerequisite logic
  study.js                Topic UI, assessments, practice and projects
  network.js              Connection examples and policy decision model
  projects.js             Three guided project plans
  projects/learning-app/  Real demo API, tests, Dockerfile and teaching configs
  model.js                Lightweight projected 3D canvas renderer
  core.js / app.js         Model progress and site interactions
tests/                    Content, state, DOM, renderer and API integration checks
.github/workflows/        Checks and optional Pages deployment
```

## Accuracy and contribution

Lessons link to primary learning references. Important concepts were checked against official [Kubernetes Services](https://kubernetes.io/docs/concepts/services-networking/service/), [EndpointSlices](https://kubernetes.io/docs/concepts/services-networking/endpoint-slices/), [kubectl environment updates](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_set/kubectl_set_env/), [kind quick start](https://kind.sigs.k8s.io/docs/user/quick-start/), [Docker port publishing](https://docs.docker.com/engine/network/port-publishing/), [Terraform built-in data resource](https://developer.hashicorp.com/terraform/language/resources/terraform-data), [AWS private network architecture](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-example-private-subnets-nat.html) and [Lambda/SQS delivery guidance](https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html).

To contribute, preserve accurate direction, distinguish conceptual/control relationships from packets, explain assumptions and include evidence-based recovery. Run checks before a pull request. Do not add real credentials or private logs. See [VALIDATION.md](VALIDATION.md) for the validation boundary.
