import {
	Raycaster,
	Vector2,
	Vector3,
	Box3,
	BufferGeometry,
	LineBasicMaterial,
	Line,
	SphereGeometry,
	MeshBasicMaterial,
	Mesh,
} from 'three';

export class MeasureTool {
	constructor(viewer) {
		this.viewer = viewer;
		this.active = false;
		this.points = [];
		this.markers = [];
		this.line = null;
		this.labelEl = null;
		this.raycaster = new Raycaster();
		this.mouse = new Vector2();
		this._origRender = null;

		this._onClick = this._onClick.bind(this);
	}

	activate() {
		this.active = true;
		const canvas = this.viewer.renderer.domElement;
		canvas.classList.add('measure-cursor-active');
		canvas.addEventListener('click', this._onClick);
		// Disable orbit controls rotation so clicks place points instead of rotating
		this.viewer.controls.enableRotate = false;
	}

	deactivate() {
		this.active = false;
		const canvas = this.viewer.renderer.domElement;
		canvas.classList.remove('measure-cursor-active');
		canvas.removeEventListener('click', this._onClick);
		// Re-enable orbit controls
		this.viewer.controls.enableRotate = true;
		this.clearMeasurement();
	}

	toggle() {
		if (this.active) {
			this.deactivate();
		} else {
			this.activate();
		}
		return this.active;
	}

	_getNDC(event) {
		const canvas = this.viewer.renderer.domElement;
		const rect = canvas.getBoundingClientRect();
		this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
		this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
	}

	_raycast(event) {
		this._getNDC(event);
		this.raycaster.setFromCamera(this.mouse, this.viewer.activeCamera);

		if (!this.viewer.content) return null;

		const intersects = this.raycaster.intersectObject(this.viewer.content, true);
		return intersects.length > 0 ? intersects[0] : null;
	}

	_onClick(event) {
		if (event.button !== 0) return;

		const hit = this._raycast(event);
		if (!hit) return;

		// If we already have 2 points, clear and start over
		if (this.points.length >= 2) {
			this.clearMeasurement();
		}

		this.points.push(hit.point.clone());
		this._addMarker(hit.point);

		if (this.points.length === 2) {
			this._drawLine();
			this._showLabel();
		}
	}

	_getSceneSize() {
		if (!this.viewer.content) return 1;
		const box = new Box3().setFromObject(this.viewer.content);
		return box.getSize(new Vector3()).length();
	}

	_addMarker(position) {
		const size = this._getSceneSize();
		const radius = size * 0.005;

		const geometry = new SphereGeometry(radius, 16, 16);
		const material = new MeshBasicMaterial({
			color: 0x00b4d8,
			depthTest: false,
			transparent: true,
		});
		const sphere = new Mesh(geometry, material);
		sphere.position.copy(position);
		sphere.renderOrder = 999;

		this.viewer.scene.add(sphere);
		this.markers.push(sphere);
	}

	_drawLine() {
		const geometry = new BufferGeometry().setFromPoints(this.points);
		const material = new LineBasicMaterial({
			color: 0x00b4d8,
			depthTest: false,
			transparent: true,
		});
		this.line = new Line(geometry, material);
		this.line.renderOrder = 999;
		this.viewer.scene.add(this.line);
	}

	_showLabel() {
		const distance = this.points[0].distanceTo(this.points[1]);

		let text;
		if (distance < 0.01) {
			text = `${(distance * 1000).toFixed(2)} mm`;
		} else if (distance < 1) {
			text = `${(distance * 100).toFixed(2)} cm`;
		} else {
			text = `${distance.toFixed(3)} m`;
		}

		this.labelEl = document.createElement('div');
		this.labelEl.className = 'measure-label';
		this.labelEl.textContent = text;
		this.viewer.el.appendChild(this.labelEl);

		// Hook into render loop to update label position
		this._origRender = this.viewer.render.bind(this.viewer);
		const self = this;
		this.viewer.render = function () {
			self._origRender();
			self._updateLabelPosition();
		};

		this._updateLabelPosition();
	}

	_updateLabelPosition() {
		if (!this.labelEl || this.points.length < 2) return;

		const midpoint = new Vector3()
			.addVectors(this.points[0], this.points[1])
			.multiplyScalar(0.5);

		const canvas = this.viewer.renderer.domElement;
		const rect = canvas.getBoundingClientRect();

		const projected = midpoint.clone().project(this.viewer.activeCamera);
		const x = ((projected.x + 1) / 2) * rect.width;
		const y = ((-projected.y + 1) / 2) * rect.height;

		this.labelEl.style.left = `${x}px`;
		this.labelEl.style.top = `${y}px`;
	}

	clearMeasurement() {
		// Remove 3D markers
		this.markers.forEach((m) => {
			this.viewer.scene.remove(m);
			m.geometry.dispose();
			m.material.dispose();
		});
		this.markers = [];

		// Remove line
		if (this.line) {
			this.viewer.scene.remove(this.line);
			this.line.geometry.dispose();
			this.line.material.dispose();
			this.line = null;
		}

		// Remove HTML label
		if (this.labelEl) {
			this.labelEl.remove();
			this.labelEl = null;
		}

		// Restore original render
		if (this._origRender) {
			this.viewer.render = this._origRender;
			this._origRender = null;
		}

		this.points = [];
	}

	dispose() {
		this.deactivate();
	}
}
