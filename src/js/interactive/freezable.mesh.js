/* jshint esversion: 6 */
/* global window, document */

export default class FreezableMesh extends THREE.Mesh {

	get freezed() {
		return this.freezed_;
	}

	set freezed(freezed) {
		// !!! cycle through freezable and not freezable
		this.freezed_ = freezed;
		this.children.filter(x => x.__lookupGetter__('freezed')).forEach(x => x.freezed = freezed);
	}

	constructor(geometry, material) {
		geometry = geometry || new THREE.BoxGeometry(5, 5, 5);
		material = material || new THREE.MeshBasicMaterial({
			color: 0xff00ff,
			// opacity: 1,
			// transparent: true,
		});
		super(geometry, material);
		this.freezed = false;
	}

	freeze() {
		this.freezed = true;
	}

	unfreeze() {
		this.freezed = false;
	}

}
