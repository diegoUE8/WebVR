/* jshint esversion: 6 */
/* global window, document */

import { POINT_RADIUS } from '../const';
import InteractiveMesh from '../interactive/interactive.mesh';

const SIZE = 8;
const RADIUS = POINT_RADIUS - 0.1;
const ARC = SIZE / RADIUS;
const PY = 50;
const RY = Math.PI - 0.5;
const FROM = 0;
const TO = 1;

export default class TopBar {

	constructor(parent) {
		this.parent = parent;
		this.py = PY;
		this.ry = RY;
		const mesh = this.mesh = this.addMesh(parent);
	}

	addMesh(parent) {
		const mesh = new THREE.Group();
		mesh.position.set(0, PY, 0);
		const arc = this.arc = this.addArc(mesh);
		this.items = [
			new TopBarItem(mesh, 0),
			new TopBarItem(mesh, 1)
		];
		this.items.forEach((x, index) => {
			x.on('over', () => {
				x.material.color.setHex(0xffffff);
				x.material.opacity = 0.8;
				x.material.needsUpdate = true;
			});
			x.on('out', () => {
				x.material.color.setHex(0xffffff);
				x.material.opacity = 0.5;
				x.material.needsUpdate = true;
			});
			x.on('down', () => {
				x.material.color.setHex(0x33c5f5);
				x.material.opacity = 1;
				x.material.needsUpdate = true;
				const direction = index === 1 ? 1 : -1;
				const y = this.parent.rotation.y + Math.PI / 2 * direction;
				// this.parent.ery = y;
				this.parent.busy = true;
				TweenMax.to(this.parent.rotation, 0.7, {
					y,
					ease: Power2.easeInOut,
					onComplete: () => {
						this.parent.busy = false;
					}
				});
			});
		});
		this.materials = this.items.map(x => x.material);
		this.materials.unshift(arc.material);
		parent.add(mesh);
		return mesh;
	}

	addArc(parent) {
		const loader = new THREE.TextureLoader();
		const texture = loader.load('img/top-bar.png');
		const geometry = new THREE.CylinderGeometry(POINT_RADIUS, POINT_RADIUS, 8, 32, 1, true, FROM, TO);
		geometry.scale(-1, 1, 1);
		// geometry.rotateY(Math.PI);
		const material = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			map: texture,
			transparent: true,
			opacity: 0,
		});
		const arc = new THREE.Mesh(geometry, material);
		// arc.renderOrder = 100;
		// arc.position.set(0, 20, 0);
		// arc.lookAt(ORIGIN);
		parent.add(arc);
		return arc;
	}

	update(cameraDirection) {
		const y = Math.atan2(cameraDirection.x, cameraDirection.z) - this.parent.rotation.y + Math.PI - this.ry;
		this.mesh.rotation.set(0, y, 0);
	}

	get active() {
		return this.active_;
	}
	set active(active) {
		if (this.active_ !== active) {
			this.active_ = active;
			const mesh = this.mesh;
			const materials = this.materials;
			// console.log(materials);
			const from = { value: materials[0].opacity };
			TweenMax.to(from, 0.7, {
				value: active ? 1 : 0,
				ease: Power2.easeInOut,
				onUpdate: () => {
					mesh.position.y = this.py - 30 * from.value;
					materials.forEach((x, i) => {
						x.opacity = i === 0 ? from.value * 0.8 : from.value * 0.5;
						x.needsUpdate = true;
					});
				}
			});
		}
	}

}

export class TopBarItem extends InteractiveMesh {

	static getTexture(index) {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		canvas.width = canvas.height = 64;
		ctx.fillStyle = '#ffffff';
		/*
		ctx.textAlign = 'center';
		ctx.font = '30px sans';
		ctx.fillText(index ? '>' : '<', 32, 32);
		*/
		ctx.beginPath();
		ctx.moveTo(32 - 10, 32 - 10);
		ctx.lineTo(32 + 10, 32);
		ctx.lineTo(32 - 10, 32 - 10);
		ctx.fill();
		const texture = new THREE.CanvasTexture(canvas);
		// CanvasTexture( canvas : HTMLElement, mapping : Constant, wrapS : Constant, wrapT : Constant, magFilter : Constant, minFilter : Constant, format : Constant, type : Constant, anisotropy : Number )
		return texture;
	}

	constructor(parent, index) {
		// const texture = MenuItem.getTexture(index);
		const loader = new THREE.TextureLoader();
		const texture = loader.load(index === 1 ? 'img/right.png' : 'img/left.png');
		const geometry = new THREE.CylinderGeometry(RADIUS, RADIUS, SIZE, 1, 1, true, index ? 1 - ARC : 0, ARC);
		geometry.scale(-1, 1, 1);
		const material = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			map: texture,
			transparent: true,
			opacity: 0,
		});
		super(geometry, material);
		// this.renderOrder = 100;
		// this.rotation.set(0, -0.5, 0);
		// this.position.set(0, 0, 0);
		// this.lookAt(ORIGIN);
		parent.add(this);
	}

}
