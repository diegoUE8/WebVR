/* jshint esversion: 6 */
/* global window, document */

import DragListener from './drag.listener';

export default class Orbit {

	constructor() {
		this.longitude = 0;
		this.latitude = 0;
		this.direction = 1;
		// this.speed = 1;
		this.inertia = new THREE.Vector2();
		this.set(0, 0);
	}

	setOrientation(orientation) {
		if (orientation) {
			this.set(orientation.longitude, orientation.latitude);
		}
	}

	getOrientation() {
		return {
			latitude: this.latitude,
			longitude: this.longitude,
		};
	}

	setDragListener(container) {
		let longitude, latitude;
		const dragListener = new DragListener(this.container, (event) => {
			longitude = this.longitude;
			latitude = this.latitude;
		}, (event) => {
			const direction = event.distance.x ? (event.distance.x / Math.abs(event.distance.x) * -1) : 1;
			this.direction = direction;
			const lon = longitude - event.distance.x * 0.1;
			const lat = latitude + event.distance.y * 0.1;
			this.setInertia(lon, lat);
			this.set(lon, lat);
			// console.log('longitude', this.longitude, 'latitude', this.latitude, 'direction', this.direction);
		}, (event) => {
			// this.speed = Math.abs(event.strength.x) * 100;
			// console.log('speed', this.speed);
		});
		dragListener.move = () => {};
		this.dragListener = dragListener;
		return dragListener;
	}

	set(longitude, latitude) {
		latitude = Math.max(-80, Math.min(80, latitude));
		const phi = THREE.Math.degToRad(90 - latitude);
		const theta = THREE.Math.degToRad(longitude);
		this.longitude = longitude;
		this.latitude = latitude;
		this.phi = phi;
		this.theta = theta;
	}

	setInertia(longitude, latitude) {
		const inertia = this.inertia;
		inertia.x = (longitude - this.longitude) * 1;
		inertia.y = (latitude - this.latitude) * 1;
		this.inertia = inertia;
		// console.log(this.inertia);
	}

	updateInertia() {
		const inertia = this.inertia;
		inertia.multiplyScalar(0.95);
		this.inertia = inertia;
		/*
		let speed = this.speed;
		speed = Math.max(1, speed * 0.95);
		this.speed = speed;
		*/
	}

	update() {
		if (this.dragListener && !this.dragListener.dragging) {
			this.set(this.longitude + this.inertia.x, this.latitude + this.inertia.y);
			this.updateInertia();
		}
	}

}
