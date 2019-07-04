/* jshint esversion: 6 */
/* global window, document */

import Emittable from '../interactive/emittable';

export const SUPPORTED_GAMEPADS = ['Gear VR Controller', 'Daydream Controller', 'Oculus Go Controller', 'OpenVR Gamepad', 'Oculus Touch', 'Spatial Controller'];
export const SUPPORTED_REGEXP = new RegExp(`^(${SUPPORTED_GAMEPADS.join('|')})`, 'i');

export default class Gamepads extends Emittable {

	static get() {
		return [...typeof navigator.getGamepads === 'function' ? navigator.getGamepads() : []];
	}

	static isSupported(id) {
		// console.log(`isSupported|${id}|`);
		return id.match(SUPPORTED_REGEXP);
	}

	set gamepads(gamepads) {
		this.gamepads_ = gamepads;
	}

	get gamepads() {
		if (!this.gamepads_) {
			this.gamepads_ = {};
			console.log('gamepads', this.gamepads_);
			const gamepads = Gamepads.get();
			for (let i = 0; i < gamepads.length; i++) {
				this.connect(gamepads[i]);
			}
			this.addListeners();
		}
		return this.gamepads_;
	}

	constructor(setText) {
		super();
		this.setText = setText;
		this.hands = {};
		this.onConnect = (event) => { this.connect(event.gamepad); };
		this.onDisconnect = (event) => { this.disconnect(event.gamepad); };
		this.onEvent = this.onEvent.bind(this);
	}

	connect($gamepad) {
		console.log('connect', $gamepad);
		try {
			// Note: $gamepad === navigator.getGamepads()[$gamepad.index]
			if ($gamepad) {
				const id = $gamepad.id;
				this.setText(`connect ${$gamepad.id} ${Gamepads.isSupported(id)}`);
				if (Gamepads.isSupported(id)) {
					const index = $gamepad.index;
					const gamepad = this.gamepads[index] ? this.gamepads[index] : (this.gamepads[index] = new Gamepad($gamepad));
					console.log(gamepad);
					this.hands[gamepad.hand] = gamepad;
					this.emit('connect', gamepad);
					gamepad.on('broadcast', this.onEvent);
				}
			}
		} catch (e) {
			console.log(e);
		}
	}

	disconnect($gamepad) {
		console.log('disconnect', $gamepad);
		try {
			// Note: $gamepad === navigator.getGamepads()[$gamepad.index]
			const id = $gamepad.id;
			if (Gamepads.isSupported(id)) {
				const index = $gamepad.index;
				const gamepad = this.gamepads[index] || $gamepad;
				if (gamepad instanceof Gamepad) {
					gamepad.off('broadcast', this.onEvent);
					gamepad.destroy();
				}
				delete this.gamepads[gamepad.index];
				delete this.hands[gamepad.hand];
				this.emit('disconnect', gamepad);
			}
		} catch (e) {
			console.log(e);
		}
	}

	onEvent(type, event) {
		switch (type) {
			case 'press':
				if (this.button !== event) {
					this.button = event;
					this.emit('hand', event.gamepad);
				}
				break;
			case 'release':
				if (this.button === event) {
					this.button = null;
					// this.emit('hand', event.gamepad);
				}
				break;
		}
		this.emit(type, event);
	}

	addListeners() {
		window.addEventListener('gamepadconnected', this.onConnect, false);
		window.addEventListener('gamepaddisconnected', this.onDisconnect, false);
	}

	removeListeners() {
		window.removeEventListener('gamepadconnected', this.onConnect, false);
		window.removeEventListener('gamepaddisconnected', this.onDisconnect, false);
	}

	update() {
		for (let k in this.gamepads) {
			const gamepad = this.gamepads[k];
			if (gamepad) {
				gamepad.update();
			}
		}
	}

	destroy() {
		this.removeListeners();
		for (let k in this.gamepads) {
			const gamepad = this.gamepads[k];
			if (gamepad) {
				gamepad.destroy();
			}
		}
		this.gamepads = null;
	}

}

export const GAMEPAD_HANDS = { NONE: 'none', LEFT: 'left', RIGHT: 'right' };
export const GAMEPAD_MODELS = {
	OCULUS_TOUCH: 0,
};

export class Gamepad extends Emittable {

	constructor(gamepad) {
		super();
		this.gamepad = gamepad;
		this.id = gamepad.id;
		this.index = gamepad.index;
		this.hand = this.getHand();
		this.type = this.getType();
		this.buttons = {};
		this.axes = {};
	}

	getHand() {
		if (this.gamepad.hand === 'left' || this.id.match(/(\sleft)/i)) {
			return GAMEPAD_HANDS.LEFT;
		} else if (this.gamepad.hand === 'right' || this.id.match(/(\sright)/i)) {
			return GAMEPAD_HANDS.RIGHT;
		} else {
			return GAMEPAD_HANDS.NONE;
		}
	}

	getType() {
		return this.id; // !!!
	}

	update() {
		this.updateButtons();
		this.updateAxes();
	}

	updateButtons() {
		this.gamepad.buttons.forEach((x, i) => {
			const pressed = x.pressed;
			const button = this.buttons[i] || (this.buttons[i] = new GamepadButton(i, this));
			if (button.pressed !== pressed) {
				button.pressed = pressed;
				if (pressed) {
					this.emit('press', button);
				} else if (status !== undefined) {
					this.emit('release', button);
				}
			}
		});
	}

	updateAxes() {
		const axes = this.gamepad.axes;
		for (let i = 0; i < axes.length; i += 2) {
			const index = Math.floor(i / 2);
			const axis = this.axes[index] || (this.axes[index] = new GamepadAxis(index, this));
			const x = axes[i];
			const y = axes[i + 1];
			if (axis.x !== x || axis.y !== y) {
				axis.x = x;
				axis.y = y;
				this.emit('axis', axis);
			}
		}
	}

	feedback(strength = 0.1, duration = 50) {
		// !!! care for battery
		const actuators = this.gamepad.hapticActuators;
		if (actuators && actuators.length) {
			return actuators[0].pulse(strength, duration);
		} else {
			return Promise.reject();
		}
	}

	destroy() {

	}

}

export class GamepadButton {

	constructor(index, gamepad) {
		this.index = index;
		this.gamepad = gamepad;
		this.pressed = false;
	}

}

export class GamepadAxis extends THREE.Vector2 {

	constructor(index, gamepad) {
		super();
		this.index = index;
		this.gamepad = gamepad;
	}

}
