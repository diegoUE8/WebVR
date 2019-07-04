/* jshint esversion: 6 */
/* global window, document */

import { cm, mm, POINTER_RADIUS, TEST_ENABLED } from '../const';
import Emittable from '../interactive/emittable';
import Menu from '../menu/menu';
import Gamepads, { GAMEPAD_HANDS } from './gamepads';

export default class Controllers extends Emittable {

	constructor(renderer, scene, pivot) {
		super();
		this.controllers_ = {};
		this.gamepads_ = {};
		this.renderer = renderer;
		this.scene = scene;
		this.pivot = pivot;
		this.controllerDirection = new THREE.Vector3();
		if (TEST_ENABLED) {
			const right = this.right = this.addControllerTest(scene);
			document.addEventListener('mousedown', this.onRightSelectStart);
			document.addEventListener('mouseup', this.onRightSelectEnd);
			const group = new THREE.Group();
			const menu = this.menu = new Menu(group);
			menu.on('down', (event) => {
				this.onMenuDown(event);
			});
			group.rotation.set(Math.PI / 2, 0, 0);
			group.position.set(0, 0, -2);
			group.scale.set(5, 5, 5);
			pivot.add(group);
		}
		console.log('controllers');
		const text = this.text = this.addText(pivot);
		const gamepads = this.gamepads = this.addGamepads();
	}

	addGamepads() {
		const gamepads = this.gamepads = new Gamepads((text) => {
			this.setText(text);
		});
		gamepads.on('connect', (gamepad) => {
			// console.log('connect', gamepad);
			this.setText(`connect ${gamepad.hand} ${gamepad.index}`);
			const controller = this.addController(this.renderer, this.scene, gamepad);
			if (gamepad.hand === GAMEPAD_HANDS.LEFT) {
				this.left = controller;
				const menu = this.menu = new Menu(controller);
				menu.on('down', (event) => {
					this.onMenuDown(event);
				});
			} else {
				this.right = controller;
			}
		});
		gamepads.on('disconnect', (gamepad) => {
			// console.log('disconnect', gamepad);
			this.setText(`disconnect ${gamepad.hand} ${gamepad.index}`);
			this.removeController(gamepad);
		});
		gamepads.on('hand', (gamepad) => {
			this.setController(gamepad);
		});
		gamepads.on('press', (button) => {
			// console.log('press', press);
			this.setText(`press ${button.gamepad.hand} ${button.index}`);
			switch (button.gamepad.hand) {
				case GAMEPAD_HANDS.LEFT:
					// 0 trigger, 1 front, 2 side, 3 Y, 4 X
					switch (button.index) {
						case 1:
							this.menu.exit();
							break;
						case 2:
							this.menu.enter();
							break;
						case 3:
							// this.menu.next();
							break;
					}
					break;
				case GAMEPAD_HANDS.RIGHT:
					// 0 trigger, 1 front, 2 side, 3 A, 4 B
					break;
			}
		});
		gamepads.on('release', (button) => {
			// console.log('release', button);
			// this.setText(`release ${button.gamepad.hand} ${button.index}`);
		});
		gamepads.on('axis', (axis) => {
			// console.log('axis', axis);
			this.setText(`axis ${axis.gamepad.hand} ${axis.index} { x:${axis.x}, y:${axis.y} }`);
			// axisup, axisdown, axisleft, axisright
			// this.menu.next();
		});
		return gamepads;
	}

	setController(gamepad) {
		const controller = gamepad.hand === GAMEPAD_HANDS.LEFT ? this.left : this.right;
		const currentController = this.controller;
		if (currentController !== controller) {
			if (currentController) {
				currentController.remove(currentController.indicator);
			}
			controller.add(controller.indicator);
			this.controller = controller;
		}
	}

	onMenuDown(event) {
		const item = event.item;
		const index = event.index;
		// console.log('Controllers.onMenuDown', item, index);
		if (index === 0 || index === 2) {
			const direction = index === 0 ? -1 : 1;
			const y = this.pivot.rotation.y + Math.PI / 2 * direction;
			// this.pivot.ery = y;
			this.pivot.busy = true;
			TweenMax.to(this.pivot.rotation, 0.7, {
				y,
				ease: Power2.easeInOut,
				onComplete: () => {
					this.pivot.busy = false;
				}
			});
		} else if (index === 1) {
			const panel = this.menu.addPanel();
			if (panel) {
				this.menu.panel = panel;
				this.menu.next();
				this.menu.appear(panel);
			}
		}
	}

	hapticFeedback() {
		return;
		const gamepad = this.findGamepad_(this.controller.index);
		if (gamepad) {
			// console.log('start');
			/*
			if (Tone.context.state === 'running') {
				const feedback = this.feedback = (this.feedback || new Tone.Player('audio/feedback.mp3').toMaster());
				feedback.start();
			}
			*/
			return; // !!! care for battery
			const actuators = gamepad.hapticActuators;
			if (actuators && actuators.length) {
				return actuators[0].pulse(0.1, 50);
			} else {
				return Promise.reject();
			}
		}
	}

	update() {
		this.gamepads.update();
	}

	updateTest(mouse) {
		const controller = this.controller;
		if (controller) {
			controller.rotation.y = -mouse.x * Math.PI;
			controller.rotation.x = mouse.y * Math.PI / 2;
		}
	}

	addControllerTest(scene) {
		const controller = new THREE.Group();
		controller.position.set(0, 0, 0);
		controller.index = 0;
		const cylinder = controller.cylinder = this.addControllerModel(controller, GAMEPAD_HANDS.RIGHT);
		controller.scale.set(5, 5, 5);
		scene.add(controller);
		return controller;
	}

	addController(renderer, scene, gamepad) {
		const controller = renderer.vr.getController(gamepad.index);
		if (controller) {
			controller.index = gamepad.index;
			const cylinder = controller.cylinder = this.addControllerModel(controller, gamepad.hand);
			scene.add(controller);
			this.controllers_[gamepad.index] = controller;
		}
		return controller;
	}

	removeController(gamepad) {
		const controller = this.controllers_[gamepad.index];
		if (controller) {
			controller.parent.remove(controller);
			delete this.controllers_[gamepad.index];
		}
	}

	addControllerModel(controller, hand) {
		const mesh = new THREE.Group();
		const texture = new THREE.TextureLoader().load('img/matcap.jpg');
		const material = new THREE.MeshMatcapMaterial({
			color: hand === GAMEPAD_HANDS.RIGHT ? 0x991111 : 0x111199,
			matcap: texture,
			transparent: true,
			opacity: 1,
		});
		const loader = new THREE.OBJLoader();
		loader.load(
			hand === GAMEPAD_HANDS.RIGHT ?
			'models/oculus_quest_controller_right/oculus_quest_controller_right.obj' :
			'models/oculus_quest_controller_left/oculus_quest_controller_left.obj',
			(object) => {
				const x = hand === GAMEPAD_HANDS.RIGHT ? -cm(1) : cm(1);
				object.traverse((child) => {
					// console.log(child);
					if (child instanceof THREE.Mesh) {
						child.material = material;
						child.geometry.translate(x, 0, 0);
					}
				});
				mesh.add(object);
			},
			(xhr) => {
				// console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
			},
			(error) => {
				console.log('An error happened');
			}
		);
		this.addControllerIndicator(controller);
		controller.add(mesh);
		return mesh;
	}

	addControllerCylinder(controller, hand) {
		const geometry = new THREE.CylinderBufferGeometry(cm(2), cm(2), cm(12), 24);
		const texture = new THREE.TextureLoader().load('img/matcap.jpg');
		const material = new THREE.MeshMatcapMaterial({
			color: hand === GAMEPAD_HANDS.RIGHT ? 0x991111 : 0x111199,
			matcap: texture,
			transparent: true,
			opacity: 1,
		});
		const mesh = new THREE.Mesh(geometry, material);
		mesh.geometry.rotateX(Math.PI / 2);
		controller.add(mesh);
		this.addControllerIndicator(controller);
		return mesh;
	}

	addControllerIndicator(controller) {
		const geometryIndicator = new THREE.CylinderBufferGeometry(mm(2), mm(1), cm(30), 5); // 10, 12
		const materialIndicator = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			// matcap: texture,
			transparent: true,
			opacity: 0.5,
		});
		const indicator = new THREE.Mesh(geometryIndicator, materialIndicator);
		controller.indicator = indicator;
		indicator.geometry.rotateX(Math.PI / 2);
		indicator.position.set(0, 0, -cm(18.5));
	}

	addText(parent) {
		const loader = new THREE.FontLoader();
		loader.load('fonts/helvetiker_regular.typeface.json', (font) => {
			this.font = font;
			const material = new THREE.MeshBasicMaterial({
				color: 0x111111, // 0x33c5f6,
				transparent: true,
				opacity: 1,
				side: THREE.DoubleSide
			});
			this.fontMaterial = material;
		});
	}

	setText(message) {
		message = message || '1';
		if (this.text) {
			this.text.parent.remove(this.text);
			this.text.geometry.dispose();
		}
		if (this.font) {
			// console.log(this.font.generateShapes);
			const shapes = this.font.generateShapes(message, 5);
			const geometry = new THREE.ShapeBufferGeometry(shapes);
			geometry.computeBoundingBox();
			const x = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
			geometry.translate(x, 0, 0);
			const text = new THREE.Mesh(geometry, this.fontMaterial);
			text.position.set(0, 0, -POINTER_RADIUS);
			this.text = text;
			this.pivot.add(text);
		}
	}

	findGamepad_(id) {
		// !!! fix
		let gamepad = this.gamepads_[id];
		if (gamepad) {
			return gamepad;
		}
		const gamepads = navigator.getGamepads && navigator.getGamepads();
		if (!gamepads) {
			return undefined;
		}
		for (var i = 0, j = 0, l = gamepads.length; i < l; i++) {
			gamepad = gamepads[i];
			if (gamepad && (
					gamepad.id === 'Daydream Controller' ||
					gamepad.id === 'Gear VR Controller' || gamepad.id === 'Oculus Go Controller' ||
					gamepad.id === 'OpenVR Gamepad' || gamepad.id.startsWith('Oculus Touch') ||
					gamepad.id.startsWith('Spatial Controller')
				)) {
				if (j === id) {
					this.gamepads_[id] = gamepad;
					return gamepad;
				}
				j++;
			}
		}
	}

}
