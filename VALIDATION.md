# Validation record

## Version 1.1

Automated validation performed during implementation:

- Syntax checks for all nine application JavaScript modules.
- 25 Node test cases passed.
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
