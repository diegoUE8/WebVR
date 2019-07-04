/* jshint esversion: 6 */
/* global window, document */

import { cm, mm } from '../const';
import EmittableGroup from '../interactive/emittable.group';
import FreezableMesh from '../interactive/freezable.mesh';
import InteractiveMesh from '../interactive/interactive.mesh';

const W = cm(10);
const H = cm(20);

export class MenuGridPanel extends EmittableGroup {

	static getLoader() {
		return this.loader || (this.loader = new THREE.TextureLoader());
	}

	static getTexture() {
		return this.texture || (this.texture = this.getLoader().load('img/menu.png'));
	}

	constructor(parent, items, index) {
		super();
		this.index = index;
		this.rotation.z = -Math.PI * 2 / 3 * index;
		const map = MenuGridPanel.getTexture();
		const geometry = new THREE.PlaneGeometry(W, H, 1, 2);
		// geometry.rotateY(Math.PI);
		const material = new THREE.MeshBasicMaterial({
			// color: 0xffffff,
			map: map,
			transparent: true,
			opacity: 0,
			// blending: THREE.AdditiveBlending,
			side: THREE.DoubleSide,
		});
		const plane = new FreezableMesh(geometry, material);
		plane.renderOrder = 90;
		plane.position.set(0, W / 2, -H);
		plane.rotation.set(-Math.PI / 2, 0, 0);
		this.plane = plane;
		// this.addItems(plane, items);
		items = this.items = items.map((item, index) => new MenuGridItem(plane, item, index, items.length));
		items.forEach((item, index) => item.on('down', () => {
			this.emit('down', { panel: this, item, index });
		}));
		this.add(plane);
		parent.add(this);
	}

}

export class MenuGridItem extends InteractiveMesh {

	static getTexture_(index) {
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

	static getLoader() {
		return this.loader || (this.loader = new THREE.TextureLoader());
	}

	static getTexture(item, index) {
		switch (index) {
			case 0:
				return this.texture0 || (this.texture0 = this.getLoader().load('img/menu-item-prev.png'));
				// break;
			case 1:
				return this.texture1 || (this.texture1 = this.getLoader().load('img/menu-item-load.png'));
				// break;
			case 2:
				return this.texture2 || (this.texture2 = this.getLoader().load('img/menu-item-next.png'));
				// break;
			default:
				return this.texture || (this.texture = this.getLoader().load('img/menu-item.png'));

		}
	}

	constructor(parent, item, index, total) {
		const size = W / 16 * 4;
		const gutter = W / 16 * 1;
		const map = MenuGridItem.getTexture(item, index);
		const geometry = new THREE.PlaneGeometry(size, size, 1, 1);
		const material = new THREE.MeshBasicMaterial({
			// color: 0xffffff,
			map: map,
			opacity: 0,
			transparent: true,
			// blending: THREE.AdditiveBlending,
			// side: THREE.DoubleSide
		});
		super(geometry, material);
		this.freezed = true;
		this.item = item;
		this.index = index;
		this.renderOrder = 100;
		// this.rotation.set(0, -0.5, 0);
		// this.position.set(0, 0, 0);
		// this.lookAt(ORIGIN);
		const d = (size + gutter);
		const cols = 3;
		const rows = Math.ceil(total / cols);
		const sx = size / 2 - (cols * d - gutter) / 2;
		const sy = -size / 2 + (rows * d - gutter) / 2;
		const r = Math.floor(index / cols);
		const c = index - r * cols;
		this.position.set(sx + d * c, sy - d * r, 0);
		// !!!
		const from = { value: 0 };
		this.on('over', () => {
			TweenMax.to(from, 0.4, {
				value: 1,
				ease: Power2.easeInOut,
				onUpdate: () => {
					this.overOutTween_(from.value);
				},
			});
		});
		this.on('out', () => {
			TweenMax.to(from, 0.4, {
				value: 0,
				ease: Power2.easeInOut,
				onUpdate: () => {
					this.overOutTween_(from.value);
				},
			});
		});
		parent.add(this);
	}

	overOutTween_(value) {
		// const z = W / 16 * 1;
		this.position.z = mm(1) + mm(4) * value;
		this.material.opacity = 0.1 + value * 1.9;
		this.material.needsUpdate = true;
	}

}
