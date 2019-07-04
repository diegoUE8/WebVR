/* jshint esversion: 6 */
/* global window, document */

import FreezableMesh from "./freezable.mesh";

export default class EmittableMesh extends FreezableMesh {

	constructor(geometry, material) {
		geometry = geometry || new THREE.BoxGeometry(5, 5, 5);
		material = material || new THREE.MeshBasicMaterial({
			color: 0xff00ff,
			// opacity: 1,
			// transparent: true,
		});
		super(geometry, material);
		// this.renderOrder = 10;
		this.events = {};
	}

	on(type, callback) {
		const event = this.events[type] = this.events[type] || [];
		event.push(callback);
		return () => {
			this.events[type] = event.filter(x => x !== callback);
		};
	}

	off(type, callback) {
		const event = this.events[type];
		if (event) {
			this.events[type] = event.filter(x => x !== callback);
		}
	}

	emit(type, data) {
		const event = this.events[type];
		if (event) {
			event.forEach(callback => {
				// callback.call(this, data);
				callback(data);
			});
		}
		const broadcast = this.events.broadcast;
		if (broadcast) {
			broadcast.forEach(callback => {
				callback(type, data);
			});
		}
	}

}
