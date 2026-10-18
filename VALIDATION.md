# Validation record

## Version 1.1

Automated validation performed during implementation:

- Syntax checks for all fourteen application JavaScript modules.
- 35 Node test cases passed.
- The suite includes four passing Python integration tests using a real ephemeral loopback HTTP server, a temporary SQLite database, expected health/products/metrics responses and a 404 route.
- All 30 courses were selected through the DOM fixture; lesson navigation, quiz retries and evidence checkpoints were exercised.
- Known-model deep links and invalid-link fallback were checked.
- All 12 model journeys and their failure choices were exercised through the fixture.
- Network policy flags, invalid ports, return-port direction, conceptual connections and clickable model paths were checked.
- Course prerequisite graph, malformed stored records, unknown identifiers, export structure dependencies and all-progress reset were checked.
- Renderer drawing calls produced finite coordinates at 320, 700 and 1200 pixel widths in both views. This does not verify visual label spacing.

## Not executed or verified here

- Browser rendering or visual layout on desktop/mobile.
- Real touchscreen orbit/scroll and zoom usability.
- Screen readers and keyboard behavior in a real browser.
- Browser clipboard, downloads and OS speech behavior.
- Docker builds, image pulls, container health or named-volume operations.
- kind/Kubernetes deployment, rollout failure or rollback.
- Terraform, Ansible or Trivy commands.
- The separate app-repository CI example.
- GitHub Pages hosting unless separately enabled and successfully deployed.

The project provides instructions for these operations. They must be recorded as executed only after a real run. Simulated recovery and self-reported practical milestones are explicitly labeled in the interface.

## Illustrated model update

All models use distinct code-native isometric asset silhouettes. Automated checks cover asset classification, focus/expand controls, routed-connection hit testing, drawable scenes after partial playback updates, and finite drawing coordinates. The README animation was regenerated from the scene renderer and representative rendered frames were visually inspected. These rendered assets are not a real-browser recording; mobile/browser visual verification remains outstanding.

## Real 3D world (version 1.2)

- Real Three.js geometry and hierarchy were built in Node and compared with declared model world positions.
- Perspective camera orbit math was exercised in both axes, with polar-angle limits and zoom bounds.
- All 72 components, 20 minor features, 40 flow steps and three failure checkpoints were structurally validated.
- The DOM fixture exercised tiny-feature search, ancestry, parent navigation, all flow steps and evidence-based repair choices without initializing WebGL.
- A geometry-derived illustration was rendered with depth testing and visually inspected for hierarchy/placement. It is not a browser screenshot or a verification of WebGL shading and interaction.
- Real browser/WebGL rendering, label layout, device performance and touch/gesture behavior remain unverified in this environment.
