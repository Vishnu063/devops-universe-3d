Third-party 3D engine

Three.js 0.186.1 (revision 186), including OrbitControls.
Upstream: https://github.com/mrdoob/three.js
Documentation: https://threejs.org/docs/
License: MIT. See THREE-LICENSE.txt.

Source package: three@0.186.1 from the npm registry, obtained with npm pack --ignore-scripts.
Selected exports from build/three.module.js and examples/jsm/controls/OrbitControls.js
were bundled as a local ES module with esbuild 0.28.2, with minification and inline
legal comments. OrbitControls' bare three import was resolved to the same module.
The bundle is loaded only when the dedicated 3D world is opened.
No CDN or paid API is used at runtime.
