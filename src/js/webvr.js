/* jshint esversion: 6 */
/* global window, document, TweenMax, THREE, WEBVR */

// import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { ORIGIN, POINTER_RADIUS, ROOM_RADIUS, TEST_ENABLED } from './const';
import InteractiveMesh from './interactive/interactive.mesh';
import Orbit from './orbit/orbit';
import Views from './views/views';
import Controllers from './vr/controllers';
import { VR, VR_MODE } from './vr/vr';

class webvr {

	constructor() {
		this.i = 0;
		this.mouse = { x: 0, y: 0 };
		this.parallax = { x: 0, y: 0 };
		this.size = { width: 0, height: 0, aspect: 0 };
		this.cameraDirection = new THREE.Vector3();
		this.init();
	}

	init() {
		const section = this.section = document.querySelector('.webvr');
		const container = this.container = section.querySelector('.webvr__container');
		const debugInfo = this.debugInfo = section.querySelector('.debug__info');
		const debugSave = this.debugSave = section.querySelector('.debug__save');

		const scene = this.scene = new THREE.Scene();
		const camera = this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
		camera.position.set(0, 0, 10);
		camera.target = new THREE.Vector3();

		const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
		const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
		const cube = this.cube = new InteractiveMesh(geometry, material);
		cube.position.set(0, 0, -5);
		cube.on('over', () => {
			cube.material.color.setHex(0xff0000);
		});
		cube.on('out', () => {
			cube.material.color.setHex(0x00ff00);
		});
		cube.on('down', () => {
			cube.material.color.setHex(0xffffff);
		});
		cube.on('up', () => {
			cube.material.color.setHex(0x0000ff);
		});
		scene.add(cube);

		const light = new THREE.HemisphereLight(0xffffff, 0x000000, 1);
		scene.add(light);

		const raycaster = this.raycaster = new THREE.Raycaster();

		const renderer = this.renderer = new THREE.WebGLRenderer();
		renderer.setClearColor(0x666666, 1);
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.vr.enabled = true;

		const vr = this.vr = new VR(renderer, { referenceSpaceType: 'local' }, (error) => {
			this.debugInfo.innerHTML = error;
		});
		container.appendChild(vr.element);

		const pivot = new THREE.Group();
		scene.add(pivot);

		if (this.vr.mode !== VR_MODE.NONE) {
			const controllers = this.controllers = new Controllers(renderer, scene, pivot);
		}

		this.container.appendChild(renderer.domElement);
		this.onWindowResize = this.onWindowResize.bind(this);
		window.addEventListener('resize', this.onWindowResize, false);
	}

	updateRaycaster() {
		try {
			const controllers = this.controllers;
			const controller = controllers.controller;
			if (controller) {
				const raycaster = this.raycaster;
				const position = controller.position;
				const rotation = controller.getWorldDirection(controllers.controllerDirection).multiplyScalar(-1);
				raycaster.set(position, rotation);
				const hit = InteractiveMesh.hittest(raycaster, controllers.gamepads.button);
				/*
				if (hit) {
					controllers.hapticFeedback();
				}
				*/
			}
		} catch (error) {
			this.debugInfo.innerHTML = error;
		}
	}

	render(delta) {
		try {
			this.cube.rotation.y += Math.PI / 180 * 5;
			this.cube.rotation.x += Math.PI / 180 * 1;
			const s = 1 + Math.cos(this.i * 0.1) * 0.5;
			this.cube.scale.set(s, s, s);
			if (this.controllers) {
				this.controllers.update();
			}
			this.updateRaycaster();
			const renderer = this.renderer;
			renderer.render(this.scene, this.camera);
			this.i++;
		} catch (error) {
			this.debugInfo.innerHTML = error;
		}
	}

	animate() {
		const renderer = this.renderer;
		renderer.setAnimationLoop(() => {
			this.render();
		});
	}

	onWindowResize() {
		try {
			const container = this.container,
				renderer = this.renderer,
				camera = this.camera;
			const width = container.offsetWidth;
			const height = container.offsetHeight;
			if (renderer) {
				renderer.setSize(width, height);
			}
			if (camera) {
				camera.aspect = width / height;
				camera.updateProjectionMatrix();
			}
		} catch (error) {
			this.debugInfo.innerHTML = error;
		}
	}

}

const tour = new webvr();
tour.animate();
