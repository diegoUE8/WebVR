/* jshint esversion: 6 */
/* global window, document */

import { cm, mm } from '../const';
import EmittableGroup from '../interactive/emittable.group';
import FreezableMesh from '../interactive/freezable.mesh';
import InteractiveMesh from '../interactive/interactive.mesh';

const W = cm(10);
const H = cm(20);

export class MenuListPanel extends EmittableGroup {

	static getLoader() {
		return this.loader || (this.loader = new THREE.TextureLoader());
	}

	static getTexture() {
		return this.texture || (this.texture = this.getLoader().load('img/menu-list.png'));
	}

	constructor(parent, items, index) {
		super();
		this.index = index;
		this.rotation.z = -Math.PI * 2 / 3 * index;
		const map = MenuListPanel.getTexture();
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
		items = this.items = items.map((item, index) => new MenuListItem(plane, item, index, items.length));
		items.forEach((item, index) => item.on('down', () => {
			this.emit('down', { panel: this, item, index });
		}));
		this.add(plane);
		parent.add(this);
	}

}

export class MenuListItem extends InteractiveMesh {

	static getLoader() {
		return this.loader || (this.loader = new THREE.TextureLoader());
	}

	static getTexture(item, index) {
		return this.texture || (this.texture = this.getLoader().load('img/menu-item-list.png'));
	}

	constructor(parent, item, index, total) {
		const size = W / 16 * 4;
		const gutter = W / 16 * 1;
		const map = MenuListItem.getTexture(item, index);
		const geometry = new THREE.PlaneGeometry(W, size, 1, 1);
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
		const cols = 1;
		const rows = Math.ceil(total / cols);
		const sx = 0;
		const sy = -size / 2 + (rows * d - gutter) / 2;
		const r = Math.floor(index / cols);
		const c = index - r * cols;
		this.position.set(sx, sy - d * r, 0);
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
