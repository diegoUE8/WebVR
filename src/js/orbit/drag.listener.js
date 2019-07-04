/* jshint esversion: 6 */
/* global window, document, TweenMax, ThreeJs */

export default class DragListener {

	constructor(target, downCallback, moveCallback, upCallback) {
		this.target = target || document;
		this.downCallback = downCallback || function(e) {
			console.log('DragListener.downCallback not setted', e);
		};
		this.moveCallback = moveCallback || function(e) {
			console.log('DragListener.moveCallback not setted', e);
		};
		this.upCallback = upCallback || function(e) {
			console.log('DragListener.upCallback not setted', e);
		};
		this.dragging = false;
		this.init();
	}

	init() {
		this.onMouseDown = this.onMouseDown.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.onMouseUp = this.onMouseUp.bind(this);
		this.onTouchStart = this.onTouchStart.bind(this);
		this.onTouchMove = this.onTouchMove.bind(this);
		this.onTouchEnd = this.onTouchEnd.bind(this);
		this.target.addEventListener('mousedown', this.onMouseDown, false);
		this.target.addEventListener('touchstart', this.onTouchStart, false);
	}

	onDown(down) {
		this.down = down; // this.position ? { x: down.x - this.position.x, y: down.y - this.position.y } : down;
		this.strength = { x: 0, y: 0 };
		this.distance = this.distance || { x: 0, y: 0 };
		this.speed = { x: 0, y: 0 };
		this.downCallback(this);
	}

	onDrag(position) {
		this.dragging = this.down !== undefined;
		var target = this.target;
		var distance = { x: position.x - this.down.x, y: position.y - this.down.y };
		var strength = { x: distance.x / window.innerWidth * 2, y: distance.y / window.innerHeight * 2 };
		var speed = { x: this.speed.x + (strength.x - this.strength.x) * 0.1, y: this.speed.y + (strength.y - this.strength.y) * 0.1 };
		this.position = position;
		this.distance = distance;
		this.strength = strength;
		this.speed = speed;
		this.moveCallback({
			position: position,
			distance: distance,
			strength: strength,
			speed: speed,
			target: target,
		});
	}

	onUp() {
		this.down = undefined;
		this.dragging = false;
		this.upCallback(this);
	}

	onMouseDown(e) {
		this.target.removeEventListener('touchstart', this.onTouchStart);
		this.onDown({
			x: e.clientX,
			y: e.clientY
		});
		this.addMouseListeners();
	}

	onMouseMove(e) {
		this.onDrag({
			x: e.clientX,
			y: e.clientY
		});
	}

	onMouseUp(e) {
		this.removeMouseListeners();
		/*
		this.onDrag({
			x: e.clientX,
			y: e.clientY
		});
		*/
		this.onUp();
	}

	onTouchStart(e) {
		this.target.removeEventListener('mousedown', this.onMouseDown);
		if (e.touches.length > 1) {
			e.preventDefault();
			this.onDown({
				x: e.touches[0].pageX,
				y: e.touches[0].pageY
			});
			this.addTouchListeners();
		}
	}

	onTouchMove(e) {
		if (e.touches.length > 0) {
			e.preventDefault();
			this.onDrag({
				x: e.touches[0].pageX,
				y: e.touches[0].pageY
			});
		}
	}

	onTouchEnd(e) {
		this.removeTouchListeners();
		this.onDrag(this.position);
		this.onUp();
	}

	addMouseListeners() {
		document.addEventListener('mousemove', this.onMouseMove, false);
		document.addEventListener('mouseup', this.onMouseUp, false);
	}

	addTouchListeners() {
		document.addEventListener('touchend', this.onTouchEnd, false);
		document.addEventListener('touchmove', this.onTouchMove, false);
	}

	removeMouseListeners() {
		document.removeEventListener('mousemove', this.onMouseMove);
		document.removeEventListener('mouseup', this.onMouseUp);
	}

	removeTouchListeners() {
		document.removeEventListener('touchend', this.onTouchEnd);
		document.removeEventListener('touchmove', this.onTouchMove);
	}

}
