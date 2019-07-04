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
		this.mouse = { x: 0, y: 0 };
		this.parallax = { x: 0, y: 0 };
		this.size = { width: 0, height: 0, aspect: 0 };
		this.cameraDirection = new THREE.Vector3();
		this.init();
	}

	load(jsonUrl) {
		try {
			fetch(jsonUrl).then(response => response.json()).then(response => {
				this.pivot.views = response.views;
			});
		} catch (error) {
			this.debugInfo.innerHTML = error;
		}
	}

	init() {
		const body = this.body = document.querySelector('body');
		const section = this.section = document.querySelector('.webvr');
		const container = this.container = section.querySelector('.webvr__container');
		const debugInfo = this.debugInfo = section.querySelector('.debug__info');
		const debugSave = this.debugSave = section.querySelector('.debug__save');
		// Dom.detect(body);
		// body.classList.add('ready');
		this.onWindowResize = this.onWindowResize.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onMouseDown = this.onMouseDown.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.onMouseUp = this.onMouseUp.bind(this);
		this.onMouseWheel = this.onMouseWheel.bind(this);
		this.onSave = this.onSave.bind(this);
		//
		const scene = this.scene = this.addScene();
		const camera = this.camera = this.addCamera();
		const pivot = this.pivot = new Views(scene);
		pivot.on('onEnterView', (view) => {
			if (this.orbit) {
				this.orbit.setOrientation(view.orientation);
			}
		});
		pivot.on('pointDown', (point) => {
			const position = point.position;
			const debugInfo = `down => {${position.x}, ${position.y}, ${position.z}}`;
			this.debugInfo.innerHTML = debugInfo;
		});
		const renderer = this.renderer = this.addRenderer();
		// container.appendChild(WEBVR.createButton(renderer, { referenceSpaceType: 'local' }));
		const vr = this.vr = this.addVR(renderer, container);
		// this.addIO();
		console.log('vr.mode', vr.mode, TEST_ENABLED);
		if (vr.mode !== VR_MODE.NONE) {
			try {
				const controllers = this.controllers = new Controllers(renderer, scene, pivot);
				// const topBar = this.topBar = new TopBar(pivot);
				const pointer = this.pointer = this.addPointer(pivot);
				this.addPointerListeners();
			} catch (error) {
				this.debugInfo.innerHTML = error;
			}
		} else if (TEST_ENABLED) {
			const controllers = this.controllers = new Controllers(renderer, scene, pivot);
			// const topBar = this.topBar = new TopBar(pivot);
			const pointer = this.pointer = this.addPointer(pivot);
			this.addPointerListeners();
			camera.target.z = ROOM_RADIUS;
			camera.lookAt(camera.target);
			const orbit = this.orbit = new Orbit();
			const dragListener = this.dragListener = orbit.setDragListener(container);
		} else {
			camera.target.z = ROOM_RADIUS;
			camera.lookAt(camera.target);
			const orbit = this.orbit = new Orbit();
			const dragListener = this.dragListener = orbit.setDragListener(container);
		}
		// raycaster
		const raycaster = this.raycaster = new THREE.Raycaster();
		window.addEventListener('resize', this.onWindowResize, false);
		window.addEventListener('keydown', this.onKeyDown, false);
		document.addEventListener('mousemove', this.onMouseMove, false);
		document.addEventListener('wheel', this.onMouseWheel, false);
		this.container.addEventListener('mousedown', this.onMouseDown, false);
		this.container.addEventListener('mouseup', this.onMouseUp, false);
		this.debugSave.addEventListener('click', this.onSave, false);
		this.section.classList.add('init');
		this.onWindowResize();
	}

	addRenderer() {
		const renderer = new THREE.WebGLRenderer({
			antialias: true,
			localClippingEnabled: true,
			// logarithmicDepthBuffer: true,
			// premultipliedAlpha: true,
			// alpha: true,
		});
		this.renderer = renderer;
		// renderer.shadowMap.enabled = true;
		renderer.setClearColor(0x000000, 1);
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.vr.enabled = true;
		// container.innerHTML = '';
		this.container.appendChild(renderer.domElement);
		return renderer;
	}

	addScene() {
		const scene = new THREE.Scene();
		// scene.background = new THREE.Color(0x00000000);
		// scene.background = new THREE.Color(0x404040);
		// scene.fog = new THREE.Fog(scene.background, 10, 700);
		return scene;
	}

	addCamera() {
		const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, ROOM_RADIUS * 2);
		camera.target = new THREE.Vector3();
		return camera;
	}

	addVR(renderer, container) {
		const vr = new VR(renderer, { referenceSpaceType: 'local' }, (error) => {
			this.debugInfo.innerHTML = error;
		});
		container.appendChild(vr.element);
		return vr;
	}

	addPointer(parent) {
		// size 2 about 20 cm radius
		const geometry = new THREE.PlaneBufferGeometry(1.2, 1.2, 2, 2);
		// const geometry = new THREE.SphereBufferGeometry(1, 8, 8);
		const loader = new THREE.TextureLoader();
		const texture = loader.load('img/pin.png');
		// texture.magFilter = THREE.NearestFilter;
		// texture.wrapT = THREE.RepeatWrapping;
		// texture.repeat.y = 1;
		// texture.anisotropy = 0;
		// texture.magFilter = THREE.LinearMipMapLinearFilter;
		// texture.minFilter = THREE.NearestFilter;
		const material = new THREE.MeshBasicMaterial({
			// color: 0xff0000,
			map: texture,
			// alphaMap: texture,
			// alphaTest: 0.5,
			// blending: THREE.AdditiveBlending,
			// depthTest: false,
			transparent: true,
			opacity: 0.9,
			// side: THREE.DoubleSide,
		});

		/*
		THREE.NoBlending
		THREE.NormalBlending
		THREE.AdditiveBlending
		THREE.SubtractiveBlending
		THREE.MultiplyBlending
		THREE.CustomBlending
		*/
		// material.blending = THREE.AdditiveBlending;
		/*
        material.blending = THREE.CustomBlending;
		material.blendEquation = THREE.MaxEquation; //default
		material.blendSrc = THREE.OneFactor; // THREE.SrcAlphaFactor; //default
        material.blendDst = THREE.OneFactor; // THREE.OneMinusSrcAlphaFactor; //default
        */
		const mesh = new THREE.Mesh(geometry, material);
		mesh.renderOrder = 1000;
		// mesh.position.x = 100000;
		mesh.position.set(-100000, -100000, -100000);
		// mesh.geometry.rotateX(Math.PI);
		// mesh.lookAt(ORIGIN);
		// mesh.lookAt(this.camera.position);
		parent.add(mesh);
		return mesh;
	}

	addPointerListeners() {
		const pivot = this.pivot;
		const pointer = this.pointer;
		const sphere = pivot.room.sphere;
		sphere.on('hit', (sphere) => {
			const intersection = sphere.intersection;
			let position = intersection.point.normalize().multiplyScalar(POINTER_RADIUS);
			position = pivot.worldToLocal(position);
			pointer.position.set(position.x, position.y, position.z);
			pointer.lookAt(ORIGIN);
			// console.log(position.x, position.y, position.z);
			pointer.scale.setScalar(pivot.busy ? 0 : 1);
		});
		sphere.on('down', (sphere) => {
			pointer.material.color.setHex(0x0000ff);
			pointer.material.opacity = 1.0;
			pointer.material.needsUpdate = true;
		});
		sphere.on('up', (sphere) => {
			pointer.material.color.setHex(0xffffff);
			pointer.material.opacity = 0.9;
			pointer.material.needsUpdate = true;
		});
	}

	addIO() {
		const rr = () => {
			return -20 + Math.random() * 40;
		};
		const ims = this.ims = new Array(10).fill(null).map(x => {
			const im = new InteractiveMesh();
			im.position.set(rr(), 0, rr());
			im.on('over', (item) => {
				item.material.color.setHex(0xff0000);
			});
			im.on('out', (item) => {
				item.material.color.setHex(0xff00ff);
			});
			im.on('down', (item) => {
				item.material.color.setHex(0x00ff00);
			});
			im.on('up', (item) => {
				item.material.color.setHex(0xff00ff);
			});
			this.pivot.add(im);
			return im;
		});
	}

	// events

	onWindowResize() {
		try {
			const container = this.container,
				renderer = this.renderer,
				camera = this.camera;
			const size = this.size;
			size.width = container.offsetWidth;
			size.height = container.offsetHeight;
			size.aspect = size.width / size.height;
			if (renderer) {
				renderer.setSize(size.width, size.height);
			}
			if (camera) {
				camera.aspect = size.width / size.height;
				camera.updateProjectionMatrix();
			}
		} catch (error) {
			this.debugInfo.innerHTML = error;
		}
	}

	onKeyDown(e) {
		try {
			// console.log(e.which, e.key);
			const key = `${e.which} ${e.key}`;
			if (this.vr.mode !== VR_MODE.NONE || TEST_ENABLED) {
				this.controllers.setText(key);
				switch (e.keyCode) {
					case 37: // left
						this.controllers.menu.prev();
						break;
					case 38: // up
						this.controllers.menu.exit();
						break;
					case 40: // down
						this.controllers.menu.enter();
						break;
					case 39: // right
						this.controllers.menu.next();
						break;
				}
			} else {
				this.debugInfo.innerHTML = key;
			}
		} catch (error) {
			this.debugInfo.innerHTML = error;
		}
	}

	onMouseDown(event) {
		if (TEST_ENABLED) {
			// this.dragListener.start();
			this.controllers.setText('down');
			return;
		}
		try {
			this.mousedown = true;
			const raycaster = this.raycaster;
			// update the picking ray with the camera and mouse position
			raycaster.setFromCamera(this.mouse, this.camera);
			// calculate objects intersecting the picking ray
			if (event.shiftKey) {
				const intersections = raycaster.intersectObjects(this.pivot.room.children);
				if (intersections) {
					const intersection = intersections.find(x => x !== undefined);
					this.createPoint(intersection);
				}
				// console.log(intersections);
				/*
				for (var i = 0; i < intersects.length; i++ ) {
					console.log(intersections[i])
					intersects[i].object.material.color.set( 0xff0000 );
				}
				*/
			}
			/* else if (this.points) {
				raycaster.params.Points.threshold = 10.0;
				const intersections = raycaster.intersectObjects(this.points.children);
				if (intersections) {
					const intersection = intersections.find(x => x !== undefined);
					if (intersection) {
						const index = intersection.index;
						const point = intersection.point;
						const debugInfo = `${index} => {${point.x}, ${point.y}, ${point.z}}`;
						// console.log(index, point, debugInfo);
						this.debugInfo.innerHTML = debugInfo;
						this.pivot.index = (this.pivot.index + 1) % this.pivot.views.length;
					}
				}
			} */
		} catch (error) {
			this.debugInfo.innerHTML = error;
		}
	}

	onMouseMove(event) {
		try {
			const w2 = this.container.offsetWidth / 2;
			const h2 = this.container.offsetHeight / 2;
			this.mouse = {
				x: (event.clientX - w2) / w2,
				y: -(event.clientY - h2) / h2,
			};
			if (TEST_ENABLED) {
				return this.controllers.updateTest(this.mouse);
			}
			const raycaster = this.raycaster;
			raycaster.setFromCamera(this.mouse, this.camera);
			InteractiveMesh.hittest(raycaster, this.mousedown);
		} catch (error) {
			this.debugInfo.innerHTML = error;
		}
	}

	onMouseUp(event) {
		if (TEST_ENABLED) {
			// this.dragListener.end();
			this.controllers.setText('up');
			return;
		}
		this.mousedown = false;
	}

	onMouseWheel(event) {
		try {
			const camera = this.camera;
			const fov = camera.fov + event.deltaY * 0.01;
			camera.fov = THREE.Math.clamp(fov, 30, 75);
			camera.updateProjectionMatrix();
		} catch (error) {
			this.debugInfo.innerHTML = error;
		}
	}

	onSave(event) {
		try {
			this.view.orientation = this.orbit.getOrientation();
			this.saveData({ views: this.pivot.views }, 'vr.json');
		} catch (error) {
			this.debugInfo.innerHTML = error;
		}
	}

	// animation

	animate() {
		const renderer = this.renderer;
		renderer.setAnimationLoop(() => {
			this.render();
		});
	}

	render(delta) {
		try {
			const cameraDirection = this.camera.getWorldDirection(this.cameraDirection);
			if (this.vr.mode !== VR_MODE.NONE) {
				// this.dragListener.move();
				this.controllers.update();
				this.updateController();
				/*
				this.topBar.active = this.controllers.controller && this.pointer.position.y > 15;
				this.topBar.update(cameraDirection);
				*/
			} else if (TEST_ENABLED) {
				// this.dragListener.move();
				this.updateCamera();
				this.updateController();
				/*
				this.topBar.active = this.controllers.controller && this.pointer.position.y > 15;
				this.topBar.update(cameraDirection);
				*/
			} else {
				this.updateCamera();
			}
		} catch (error) {
			this.debugInfo.innerHTML = error;
		}
		const renderer = this.renderer;
		renderer.render(this.scene, this.camera);
	}

	updatePointer(raycaster) {
		const intersections = raycaster.intersectObjects(this.pivot.room.children);
		if (intersections.length) {
			const intersection = intersections[0];
			// const intersection = intersections.find(x => x !== undefined);
			if (intersection) {
				// const index = intersection.index;
				// const point = intersection.point;
				// const debugInfo = `${index} => {${point.x}, ${point.y}, ${point.z}}`;
				// console.log(index, point, debugInfo);
				// this.debugInfo.innerHTML = debugInfo;
				// console.log(intersection.point);
				let position = intersection.point.normalize().multiplyScalar(POINTER_RADIUS);
				position = this.pivot.worldToLocal(position);
				this.pointer.position.set(position.x, position.y, position.z);
				this.pointer.lookAt(ORIGIN);
				// console.log(position.x, position.y, position.z);
			}
		}
		if (this.controllers) {
			this.pointer.material.color.setHex(this.controllers.gamepads.button ? 0x0000ff : 0xffffff);
			this.pointer.material.opacity = this.controllers.gamepads.button ? 1.0 : 0.5;
		}
		this.pointer.scale.setScalar(this.pivot.busy ? 0 : 1);
		// this.pivot.rotation.y = (this.pivot.ery || 0);
		// this.pivot.rotation.y += ((this.pivot.ery || 0) - this.pivot.rotation.y) / 10;
	}

	updateCamera() {
		const orbit = this.orbit;
		const camera = this.camera;
		orbit.update();
		camera.target.x = ROOM_RADIUS * Math.sin(orbit.phi) * Math.cos(orbit.theta);
		camera.target.y = ROOM_RADIUS * Math.cos(orbit.phi);
		camera.target.z = ROOM_RADIUS * Math.sin(orbit.phi) * Math.sin(orbit.theta);
		camera.lookAt(camera.target);
		/*
		// distortion
		camera.position.copy( camera.target ).negate();
		*/
	}

	updateController() {
		try {
			const controllers = this.controllers;
			const controller = controllers.controller;
			if (controller) {
				const raycaster = this.raycaster;
				const position = controller.position;
				const rotation = controller.getWorldDirection(controllers.controllerDirection).multiplyScalar(-1);
				raycaster.set(position, rotation);
				const hit = InteractiveMesh.hittest(raycaster, controllers.gamepads.button);
				if (hit && hit !== this.pivot.room.sphere) {
					controllers.hapticFeedback();
				}
				// this.updatePointer(raycaster);
			}
		} catch (error) {
			this.debugInfo.innerHTML = error;
		}
	}

	// utils

	saveData(data, filename = 'console.json') {
		if (!data) {
			console.error('Console.save: No data');
			return;
		}
		if (typeof data === 'object') {
			data = JSON.stringify(data, undefined, 4);
		}
		const blob = new Blob([data], { type: 'text/json' });
		const event = document.createEvent('MouseEvents');
		const anchor = document.createElement('a');
		anchor.download = filename;
		anchor.href = window.URL.createObjectURL(blob);
		anchor.dataset.downloadurl = ['text/json', anchor.download, anchor.href].join(':');
		event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
		anchor.dispatchEvent(event);
	}

}

const tour = new webvr();
tour.animate();
tour.load('data/vr.json');

/*

copyGeometry() {
	var MAX_POINTS = 500;
	// geometry
	var geometry = new THREE.BufferGeometry();
	// attributes
	var positions = new Float32Array(MAX_POINTS * 3); // 3 vertices per point
	geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
	// draw range
	var drawCount = 2; // draw the first 2 points, only
	geometry.setDrawRange(0, drawCount);
	// material
	var material = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
	// line
	var line = new THREE.Line(geometry, material);
	scene.add(line);
	// And then to later update after adding new point information:
	line.geometry.setDrawRange(0, newValue);
}

doParallax() {
	// parallax
	const parallax = this.parallax;
	parallax.x += (this.mouse.x - parallax.x) / 8;
	parallax.y += (this.mouse.y - parallax.y) / 8;
	// this.light1.position.set(parallax.x * 5.0, 6.0 + parallax.y * 2.0, 4.0);
	// this.light2.position.set(parallax.x * -5.0, -6.0 - parallax.y * 2.0, 4.0);
}

const shaderPoint = {
	vertexShader: `
	attribute float size;
	attribute vec4 ca;
	varying vec4 vColor;
	void main() {
		vColor = ca;
		vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
		gl_PointSize = size * (400.0 / -mvPosition.z);
		gl_Position = projectionMatrix * mvPosition;
	}
	`,
	fragmentShader: `
	uniform vec3 color;
	uniform sampler2D texture;
	varying vec4 vColor;
	void main() {
		vec4 textureColor = texture2D(texture, gl_PointCoord);
		// if (textureColor.a < 0.5) discard;
		gl_FragColor = textureColor * vec4(color * vColor.xyz, 1.0);
		// float depth = gl_FragCoord.z / gl_FragCoord.w;
		gl_FragColor = vec4(vec3(1.0), gl_FragColor.w);
	}
	`,
};

const material = new THREE.PointsMaterial({
	size: 15,
	map: loader.load('img/pin.png'),
	vertexColors: THREE.VertexColors,
	blending: THREE.AdditiveBlending,
	depthTest: true,
	transparent: true
});
*/
/*
const material = new THREE.ShaderMaterial({
	uniforms: {
		color: { value: new THREE.Color(0xffffff) },
		texture: { value: loader.load('img/pin.png') }
	},
	vertexColors: THREE.VertexColors,
	blending: THREE.AdditiveBlending,
	depthTest: true,
	transparent: true,
	vertexShader: shaderPoint.vertexShader,
	fragmentShader: shaderPoint.fragmentShader,
	alphaTest: 0.9
});
*/
/*
	addPoints_(parent) {
		const loader = new THREE.TextureLoader();
		const geometry = new THREE.BufferGeometry();
		// hack fix
		const vertices = [];
		vertices.push(0, -10000, 0);
		vertices.push(0, 10000, 0);
		geometry.addAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
		// hack fix
		const colors = new Array(100 * 3).fill(0);
		const colorsAttribute = new THREE.Float32BufferAttribute(colors, 3);
		const sizes = new Array(100).fill(10);
		geometry.addAttribute('color', colorsAttribute);
		geometry.addAttribute('customColor', new THREE.Float32BufferAttribute(colors, 3));
		geometry.addAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
		const material = new THREE.ShaderMaterial({
			uniforms: {
				amplitude: { value: 1.0 },
				color: { value: new THREE.Color(0xffffff) },
				texture: { value: loader.load('img/pin.png') }
			},
			vertexShader: shaderPoint.vertexShader,
			fragmentShader: shaderPoint.fragmentShader,
			transparent: true
		});
		// materials[i].color.setHSL(1, 0, 0);
		const points = new THREE.Points(geometry, material);
		points.vertices = vertices;
		points.colors = colors;
		points.colorsAttribute = colorsAttribute;
		points.scale.set(0.95, 0.95, 0.95);
		parent.add(points);
		return points;
	}

	addPoint_(position, i) {
		const points = this.points;
		const geometry = points.geometry;
		const vertices = points.vertices;
		const index = vertices.length / 3;
		vertices.push(position.x, position.y, position.z);
		geometry.addAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
		const colorsAttribute = points.colorsAttribute;
		colorsAttribute.setXYZ(index, 0, 0, 0);
		points.material.needsUpdate = true;
		// console.log(index, 'start');
		const from = { opacity: 0 };
		TweenMax.to(from, 0.7, {
			opacity: 1,
			delay: 0.1 * i,
			ease: Power2.easeInOut,
			onUpdate: () => {
				// console.log(index, from.opacity);
				colorsAttribute.setXYZ(index, from.opacity, from.opacity, from.opacity);
				colorsAttribute.needsUpdate = true;
				points.material.needsUpdate = true;
			},
			onCompleted: () => {
				// console.log(index, 'completed');
			}
		});
	}

	removePoint_(i) {
		return new Promise((resolve, reject) => {
			const points = this.points;
			const geometry = points.geometry;
			const vertices = points.vertices;
			const index = vertices.length / 3;
			const colorsAttribute = points.colorsAttribute;
			colorsAttribute.setXYZ(index, 1, 1, 1);
			points.material.needsUpdate = true;
			// console.log(index, 'start');
			const from = { opacity: 1 };
			TweenMax.to(from, 0.7, {
				opacity: 0,
				delay: 0.0 * i,
			ease: Power2.easeInOut,
				onUpdate: () => {
					// console.log(index, from.opacity);
					colorsAttribute.setXYZ(index, from.opacity, from.opacity, from.opacity);
					colorsAttribute.needsUpdate = true;
					points.material.needsUpdate = true;
				},
				onCompleted: () => {
					// console.log(index, 'completed');
					vertices.splice(vertices.length - 3, 3);
					geometry.addAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
					resolve();
				}
			});
		});
	}

	createPoint_(intersection) {
		// console.log(intersection);
		const position = intersection.point.clone();
		this.addPoint(this.points, position, 0);
		this.view.points.push({
			id: 2,
			position: position.toArray(),
			type: 1,
			name: 'Point 2',
			key: 'POINT2',
		});
		// p.multiplyScalar(1);
	}


let camera;
if (USE_ORTHO) {
	const width = 10;
	const height = width / this.container.offsetWidth * this.container.offsetHeight;
	camera = new THREE.OrthographicCamera(-width, width, height, -height, 0.01, 1000);
} else {
	camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 1000);
}
// const camera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, 0.01, 1000);
camera.position.set(0, 5.0, 12.0);
camera.up = new THREE.Vector3(0, 0, -1);
camera.lookAt(new THREE.Vector3(0, 0, 0));
this.camera = camera;
*/

/*
const ambient = new THREE.AmbientLight(0x222222);
scene.add(ambient);
this.ambient = ambient;
*/

/*
// color : Integer, intensity : Float, distance : Number, decay : Float
const light = new THREE.PointLight(0xffffff, 1000, 1000, 1);
light.position.set(0, 0, 0);
scene.add(light);
this.light = light;
*/

/*
let light1;
light1 = new THREE.DirectionalLight(0xffffff, 4.0);
// light1.castShadow = true;
// light1.shadowCameraVisible = true;
// light1.mapSize.width = 2048;
// light1.mapSize.height = 2048;
scene.add(light1);
this.light1 = light1;
if (SHOW_HELPERS) {
	const light1Helper = new THREE.DirectionalLightHelper(light1, 1);
	scene.add(light1Helper);
}
const light2 = new THREE.DirectionalLight(0xffffff, 4.0);
scene.add(light2);
this.light2 = light2;
if (SHOW_HELPERS) {
	const light2Helper = new THREE.DirectionalLightHelper(light2, 1);
	scene.add(light2Helper);
}
*/
