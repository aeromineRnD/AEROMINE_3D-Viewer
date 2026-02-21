import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { Viewer } from './viewer.js';
import { SimpleDropzone } from 'simple-dropzone';
import { Validator } from './validator.js';
import { Footer } from './components/footer';
import { MeasureTool } from './measure-tool.js';
import { VolumeTool } from './volume-tool.js';
import queryString from 'query-string';

window.THREE = THREE;
window.VIEWER = {};

if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
	console.error('The File APIs are not fully supported in this browser.');
} else if (!WebGL.isWebGL2Available()) {
	console.error('WebGL is not supported in this browser.');
}

class App {
	constructor(el, location) {
		const hash = location.hash ? queryString.parse(location.hash) : {};
		this.options = {
			kiosk: Boolean(hash.kiosk),
			model: hash.model || '',
			preset: hash.preset || '',
			cameraPosition: hash.cameraPosition ? hash.cameraPosition.split(',').map(Number) : null,
		};

		this.el = el;
		this.viewer = null;
		this.viewerEl = null;
		this.spinnerEl = el.querySelector('.spinner');
		this.dropEl = el.querySelector('.dropzone');
		this.inputEl = el.querySelector('#file-input');
		this.validator = new Validator(el);
		this.measureTool = null;
		this.volumeTool = null;

		this.createDropzone();
		this.setupMeasureTool();
		this.setupVolumeTool();
		this.setupInlineControls();
		this.hideSpinner();

		const options = this.options;

		if (options.kiosk) {
			const headerEl = document.querySelector('header');
			headerEl.style.display = 'none';
		}

		if (options.model) {
			this.view(options.model, '', new Map());
		}
	}

	setupInlineControls() {
		this.autoRotateBtn = document.getElementById('auto-rotate-btn');
		this.gridBtn = document.getElementById('grid-btn');
		this.bgSelect = document.getElementById('bg-color-select');

		this.autoRotateBtn.addEventListener('click', () => {
			if (!this.viewer) return;
			const isActive = !this.viewer.state.autoRotate;
			this.viewer.state.autoRotate = isActive;
			this.viewer.controls.autoRotate = isActive;
			this.autoRotateBtn.textContent = `Auto Rotate: ${isActive ? 'On' : 'Off'}`;
			this.autoRotateBtn.classList.toggle('active', isActive);
		});

		this.gridBtn.addEventListener('click', () => {
			if (!this.viewer) return;
			const isActive = !this.viewer.state.grid;
			this.viewer.state.grid = isActive;
			this.viewer.updateDisplay();
			this.gridBtn.textContent = `Grid: ${isActive ? 'On' : 'Off'}`;
			this.gridBtn.classList.toggle('active', isActive);
		});

		this.bgSelect.addEventListener('change', (e) => {
			if (this.viewer) {
				this.viewer.setBackgroundColor(e.target.value);
			}
		});
	}

	setupMeasureTool() {
		this.measureBtn = document.getElementById('measure-btn');

		this.measureBtn.addEventListener('click', () => {
			if (!this.viewer) return;

			if (!this.measureTool) {
				this.measureTool = new MeasureTool(this.viewer);
			}

			const isActive = this.measureTool.toggle();
			this.measureBtn.classList.toggle('active', isActive);
		});
	}

	setupVolumeTool() {
		this.volumeBtn = document.getElementById('volume-btn');

		this.volumeBtn.addEventListener('click', () => {
			if (!this.viewer) return;

			if (!this.volumeTool) {
				this.volumeTool = new VolumeTool(this.viewer);
			}

			const isActive = this.volumeTool.toggle();
			this.volumeBtn.classList.toggle('active', isActive);
		});
	}

	createDropzone() {
		const dropCtrl = new SimpleDropzone(this.dropEl, this.inputEl);
		dropCtrl.on('drop', ({ files }) => this.load(files));
		dropCtrl.on('dropstart', () => this.showSpinner());
		dropCtrl.on('droperror', () => this.hideSpinner());
	}

	createViewer() {
		this.viewerEl = document.createElement('div');
		this.viewerEl.classList.add('viewer');
		this.dropEl.innerHTML = '';
		this.dropEl.appendChild(this.viewerEl);
		this.viewer = new Viewer(this.viewerEl, this.options);

		// Reset measure and volume tools for new viewer
		this.measureTool = null;
		this.measureBtn.classList.remove('active');
		if (this.volumeTool) {
			this.volumeTool.dispose();
			this.volumeTool = null;
		}
		this.volumeBtn.classList.remove('active');

		// Sync background with selected dropdown color
		const selectedColor = this.bgSelect ? this.bgSelect.value : '#1a1a2e';
		this.viewer.setBackgroundColor(selectedColor);

		// Reset inline control button states
		if (this.autoRotateBtn) {
			this.autoRotateBtn.textContent = 'Auto Rotate: Off';
			this.autoRotateBtn.classList.remove('active');
		}
		if (this.gridBtn) {
			this.gridBtn.textContent = 'Grid: Off';
			this.gridBtn.classList.remove('active');
		}

		return this.viewer;
	}

	load(fileMap) {
		let rootFile;
		let rootPath;
		Array.from(fileMap).forEach(([path, file]) => {
			if (file.name.match(/\.(gltf|glb)$/)) {
				rootFile = file;
				rootPath = path.replace(file.name, '');
			}
		});

		if (!rootFile) {
			this.onError('No .gltf or .glb asset found.');
		}

		this.view(rootFile, rootPath, fileMap);
	}

	view(rootFile, rootPath, fileMap) {
		if (this.viewer) this.viewer.clear();

		const viewer = this.viewer || this.createViewer();

		const fileURL = typeof rootFile === 'string' ? rootFile : URL.createObjectURL(rootFile);

		const cleanup = () => {
			this.hideSpinner();
			if (typeof rootFile === 'object') URL.revokeObjectURL(fileURL);
		};

		viewer
			.load(fileURL, rootPath, fileMap)
			.catch((e) => this.onError(e))
			.then((gltf) => {
				if (!this.options.kiosk) {
					this.validator.validate(fileURL, rootPath, fileMap, gltf);
				}
				cleanup();
			});
	}

	onError(error) {
		let message = (error || {}).message || error.toString();
		if (message.match(/ProgressEvent/)) {
			message = 'Unable to retrieve this file. Check JS console and browser network tab.';
		} else if (message.match(/Unexpected token/)) {
			message = `Unable to parse file content. Verify that this file is valid. Error: "${message}"`;
		} else if (error && error.target && error.target instanceof Image) {
			message = 'Missing texture: ' + error.target.src.split('/').pop();
		}
		window.alert(message);
		console.error(error);
	}

	showSpinner() {
		this.spinnerEl.style.display = '';
	}

	hideSpinner() {
		this.spinnerEl.style.display = 'none';
	}
}

document.body.innerHTML += Footer();

document.addEventListener('DOMContentLoaded', () => {
	const app = new App(document.body, location);

	window.VIEWER.app = app;

	console.info('[AEROMINE 3D Viewer] Debugging data exported as `window.VIEWER`.');
});
