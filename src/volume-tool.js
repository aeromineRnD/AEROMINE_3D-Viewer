import { Box3, Vector3 } from 'three';

export class VolumeTool {
	constructor(viewer) {
		this.viewer = viewer;
		this.active = false;
		this.panelEl = null;
	}

	activate() {
		this.active = true;
		this._showPanel();
	}

	deactivate() {
		this.active = false;
		this._hidePanel();
	}

	toggle() {
		if (this.active) {
			this.deactivate();
		} else {
			this.activate();
		}
		return this.active;
	}

	// ── Calculations ────────────────────────────────────────────────────────

	_getBoundingBox() {
		if (!this.viewer.content) return null;
		const box = new Box3().setFromObject(this.viewer.content);
		const size = box.getSize(new Vector3());
		return {
			width: size.x,
			height: size.y,
			depth: size.z,
			volume: size.x * size.y * size.z,
		};
	}

	_getMeshVolume() {
		if (!this.viewer.content) return null;

		let totalVolume = 0;

		this.viewer.content.traverse((child) => {
			if (!child.isMesh || !child.geometry) return;

			const geom = child.geometry;
			const worldMatrix = child.matrixWorld;
			const position = geom.attributes.position;
			if (!position) return;

			const getVertex = (i) =>
				new Vector3(position.getX(i), position.getY(i), position.getZ(i)).applyMatrix4(
					worldMatrix,
				);

			const index = geom.index;
			if (index) {
				for (let i = 0; i < index.count; i += 3) {
					totalVolume += this._signedVolumeOfTriangle(
						getVertex(index.getX(i)),
						getVertex(index.getX(i + 1)),
						getVertex(index.getX(i + 2)),
					);
				}
			} else {
				for (let i = 0; i < position.count; i += 3) {
					totalVolume += this._signedVolumeOfTriangle(
						getVertex(i),
						getVertex(i + 1),
						getVertex(i + 2),
					);
				}
			}
		});

		return Math.abs(totalVolume);
	}

	_signedVolumeOfTriangle(p1, p2, p3) {
		return p1.dot(p2.clone().cross(p3)) / 6.0;
	}

	// ── Formatting ───────────────────────────────────────────────────────────

	_formatLength(v) {
		const abs = Math.abs(v);
		if (abs < 0.001) return `${(v * 1000).toFixed(3)} mm`;
		if (abs < 1) return `${(v * 100).toFixed(3)} cm`;
		return `${v.toFixed(4)} m`;
	}

	_formatVolume(v) {
		const abs = Math.abs(v);
		if (abs < 1e-9) return `${(v * 1e9).toFixed(3)} mm³`;
		if (abs < 1e-6) return `${(v * 1e6).toFixed(3)} cm³`;
		if (abs < 0.001) return `${(v * 1000).toFixed(4)} L`;
		return `${v.toFixed(6)} m³`;
	}

	// ── UI ───────────────────────────────────────────────────────────────────

	_showPanel() {
		this._hidePanel();

		this.panelEl = document.createElement('div');
		this.panelEl.className = 'volume-panel';

		const bbox = this._getBoundingBox();
		if (!bbox) {
			this.panelEl.innerHTML = `
				<div class="volume-panel-title">Volume Analysis</div>
				<div class="volume-note">Load a model to calculate volume.</div>
			`;
			this.viewer.el.appendChild(this.panelEl);
			return;
		}

		const meshVol = this._getMeshVolume();

		this.panelEl.innerHTML = `
			<div class="volume-panel-title">Volume Analysis</div>
			<div class="volume-section">
				<div class="volume-section-title">Bounding Box</div>
				<div class="volume-row"><span>Width</span><span>${this._formatLength(bbox.width)}</span></div>
				<div class="volume-row"><span>Height</span><span>${this._formatLength(bbox.height)}</span></div>
				<div class="volume-row"><span>Depth</span><span>${this._formatLength(bbox.depth)}</span></div>
				<div class="volume-row highlight"><span>BB Volume</span><span>${this._formatVolume(bbox.volume)}</span></div>
			</div>
			<div class="volume-section">
				<div class="volume-section-title">Mesh Volume</div>
				<div class="volume-row highlight"><span>Volume</span><span>${this._formatVolume(meshVol)}</span></div>
				<div class="volume-note">Accurate for closed (watertight) meshes</div>
			</div>
		`;
		this.viewer.el.appendChild(this.panelEl);
	}

	_hidePanel() {
		if (this.panelEl) {
			this.panelEl.remove();
			this.panelEl = null;
		}
	}

	dispose() {
		this.deactivate();
	}
}