/* jshint esversion: 6 */
/* global window, document */

import { cm } from '../const';
import EmittableGroup from '../interactive/emittable.group';
import { MenuGridPanel } from './menu-grid';
import { MenuListPanel } from './menu-list';

export default class Menu extends EmittableGroup {

	constructor(parent) {
		super();
		const panels = this.panels = [];
		this.addPanel();
		this.position.set(0, 0, -cm(2));
		/*
		panel.items.forEach(x => {
			x.on('over', () => {
				x.material.color.setHex(0xff0000);
				x.material.opacity = 1.0;
				x.material.needsUpdate = true;
			});
			x.on('out', () => {
				x.material.color.setHex(0xffffff);
				x.material.opacity = 1.0;
				x.material.needsUpdate = true;
			});
		});
		*/
		// this.lookAt(ORIGIN);
		this.parent_ = parent;
		// parent.add(this);
	}

	addPanel() {
		const index = this.panels.length;
		if (index > 2) {
			return;
		}
		let panel;
		if (index === 1) {
			const count = 5;
			const items = new Array(count).fill({});
			panel = this.panel = new MenuListPanel(this, items, index);
		} else {
			const count = 15;
			const items = new Array(count).fill({});
			panel = this.panel = new MenuGridPanel(this, items, index);
		}
		panel.on('down', (event) => {
			this.emit('down', event);
		});
		this.panels.push(panel);
		// this.panels.forEach(panel => panel.items.forEach(x => x.freezed = true));
		return panel;
	}

	toggle() {
		if (this.active) {
			this.exit();
		} else {
			this.enter();
		}
	}

	appear(panel) {
		const from = { value: panel.plane.material.opacity };
		TweenMax.to(from, 0.5, {
			value: 1,
			ease: Power2.easeInOut,
			onUpdate: () => {
				this.enterExitPanel_(panel, from.value);
			},
			onComplete: () => {
				this.unfreeze();
			}
		});
	}

	enter() {
		if (this.active) {
			return;
		}
		this.active = true;
		this.parent_.add(this);
		const from = { value: 0 };
		TweenMax.to(from, 0.5, {
			value: 1,
			ease: Power2.easeInOut,
			onUpdate: () => {
				this.position.z = -cm(2) * (1 - from.value);
				this.panels.forEach(x => this.enterExitPanel_(x, from.value));
			},
			onComplete: () => {
				this.unfreeze();
			}
		});
	}

	exit() {
		if (!this.active) {
			return;
		}
		this.active = false;
		this.freeze();
		const from = { value: 1 };
		TweenMax.to(from, 0.5, {
			value: 0,
			ease: Power2.easeInOut,
			onUpdate: () => {
				this.position.z = -cm(2) * (1 - from.value);
				this.panels.forEach(x => this.enterExitPanel_(x, from.value));
			},
			onComplete: () => {
				this.parent_.remove(this);
			}
		});
	}

	prev() {

	}

	next() {
		this.freeze();
		const r = Math.PI * 2 / 3;
		const z = Math.ceil(this.rotation.z / r) * r + r;
		TweenMax.to(this.rotation, 0.7, {
			z,
			ease: Power2.easeInOut,
			onComplete: () => {
				this.unfreeze();
			}
		});
	}

	enterExitPanel_(panel, value) {
		const opacity = (x, value) => {
			x.material.opacity = value;
			x.material.needsUpdate = true;
		};
		opacity(panel.plane, value * 0.8);
		panel.items.forEach(x => opacity(x, value * 0.1));
	}

	freeze() {
		this.panels.forEach(x => x.freeze());
	}

	unfreeze() {
		this.panels.forEach(x => x.unfreeze());
	}

}
