# AEROMINE 3D Viewer

A professional web-based viewer for inspecting, measuring, and validating glTF 2.0 three-dimensional models — built for engineering, product design, and technical review workflows.

**Live:** [aeromine-3d-viewer.vercel.app](https://aeromine-3d-viewer.vercel.app) &nbsp;|&nbsp; **Company:** [aeromine.info](https://www.aeromine.info/)

---

## Overview

AEROMINE 3D Viewer enables teams to load, inspect, and analyse 3D models directly in a web browser — no software installation required. It is designed for professionals who need fast, accurate feedback on geometry, dimensions, and model quality during the review process.

Supported format: **glTF 2.0** (`.gltf` and `.glb`)

---

## Features

### Viewport & Navigation

| Control | Action |
|---|---|
| Left Click + Drag | Rotate model |
| Right Click + Drag | Pan camera |
| Scroll Wheel | Zoom in / out |

### Toolbar Controls

| Control | Description |
|---|---|
| **Auto Rotate** | Toggles continuous model rotation for presentation purposes |
| **Grid** | Displays a reference grid and axes in the scene |
| **Background** | Switches the scene background colour (Light, Purple, Dark, Black, Navy, Forest) |

### Measurement Tool

Activates an interactive distance measurement mode. Click two points on the model surface to display the straight-line distance between them. Units are automatically scaled (mm, cm, m) based on model size. Click the ruler icon in the top-right toolbar to activate.

### Volume Calculator

Computes and displays the model's geometric volume. Provides both bounding box volume and closed-mesh volume using a signed tetrahedron algorithm. Results are shown in multiple units (mm³, cm³, litres, m³). Click the cube icon in the top-right toolbar to activate.

### glTF Validation

Automatically validates loaded models against the official Khronos glTF 2.0 specification. The validation report surfaces errors, warnings, and informational messages, along with model statistics (draw calls, triangles, materials, animations).

---

## Supported File Formats

| Format | Extension | Notes |
|---|---|---|
| glTF JSON | `.gltf` | May reference external `.bin` and texture files |
| glTF Binary | `.glb` | Self-contained; recommended for sharing |
| DRACO compressed | `.glb` | Automatically decoded |
| KTX2 textures | embedded | GPU-compressed textures supported |

> Drag an entire folder to load `.gltf` files together with their referenced assets (textures, buffers).

---

## Loading a Model

1. Open the application in a modern browser (Chrome, Edge, or Firefox recommended).
2. **Drag and drop** a `.glb` or `.gltf` file (or folder) onto the viewer area.
3. Alternatively, click **Choose file** to open a file browser.
4. The model loads and centres automatically in the viewport.

---

## Browser Requirements

| Requirement | Minimum |
|---|---|
| WebGL | Version 2.0 |
| Browser | Chrome 80+, Edge 80+, Firefox 75+ |
| File API | Required for drag-and-drop |

---

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm (included with Node.js)

### Install & Run

```bash
# Clone the repository
git clone https://github.com/aeromineRnD/AEROMINE_3D-Viewer.git
cd AEROMINE_3D-Viewer

# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev
```

### Build for Production

```bash
npm run build
```

The compiled output is placed in the `dist/` directory and can be served from any static hosting platform (Vercel, Netlify, GitHub Pages, etc.).

### Preview Production Build Locally

```bash
npm run preview
```

---

## Technology Stack

| Library | Version | Purpose |
|---|---|---|
| [three.js](https://threejs.org/) | 0.176 | 3D rendering engine |
| [Vite](https://vitejs.dev/) | 5.1 | Build tool and dev server |
| [gltf-validator](https://github.com/KhronosGroup/glTF-Validator) | 2.0 | Khronos model validation |
| [simple-dropzone](https://github.com/donmccurdy/simple-dropzone) | 0.8 | Drag-and-drop file handling |
| dat.GUI | 0.7 | Animation and camera controls |

---

## URL Parameters

The viewer supports optional URL hash parameters for embedding and automation use cases.

| Parameter | Example | Description |
|---|---|---|
| `model` | `#model=https://…/model.glb` | Auto-loads a model from a URL on startup |
| `preset` | `#preset=assetgenerator` | Activates asset-generator lighting preset |
| `cameraPosition` | `#cameraPosition=1,1,1` | Sets the initial camera position (x,y,z) |
| `kiosk` | `#kiosk` | Hides the header UI for presentation mode |

Example:
```
https://aeromine-3d-viewer.vercel.app/#model=https://example.com/part.glb&kiosk
```

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

*Developed by [AEROMINE](https://www.aeromine.info/)*
