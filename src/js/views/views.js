/* jshint esversion: 6 */
/* global window, document */

import html2canvas from 'html2canvas';
import { ORIGIN, PANEL_RADIUS, POINT_RADIUS, ROOM_RADIUS, TEST_ENABLED } from '../const';
import EmittableGroup from '../interactive/emittable.group';
import InteractiveMesh from '../interactive/interactive.mesh';

export default class Views extends EmittableGroup {

	constructor(parent) {
		super();
		this.views_ = [];
		const room = this.room = this.addRoom(this);
		const floor = this.floor = this.addFloor(this);
		const ceil = this.ceil = this.addCeil(this);
		const points = this.points = this.addPoints(this);
		const panel = this.panel = this.addPanel(this);
		parent.add(this);
	}

	get views() {
		return this.views_;
	}
	set views(views) {
		this.views_ = views;
		this.index = 0;
	}

	get view() {
		return this.view_;
	}
	set view(view) {
		this.onInitView(this.view_, view);
		this.view_ = view;
	}

	get index() {
		return this.index_;
	}
	set index(index) {
		this.index_ = index;
		this.view = this.views[index];
	}

	onInitView(previous, current) {
		// console.log(previous, current);
		this.onExitPanel();
		this.onExitPoints(previous).then(() => {
			// console.log(this.points.vertices);
			this.onExitView(previous).then(() => {
				// if (!previous) {
				this.onEnterView(current).then(() => {
					this.onEnterPoints(current);
					// console.log(this.points.vertices);
				});
				// }
			});
		});
	}

	onExitView(view) {
		return new Promise((resolve, reject) => {
			if (view) {
				TweenMax.to(this.room.sphere.material, 0.7, {
					opacity: 0,
					delay: 0.0,
					ease: Power2.easeInOut,
					onCompleted: () => {
						setTimeout(() => {
							resolve(view);
						}, 250);
					}
				});
			} else {
				resolve(view);
			}
		});
	}

	onEnterView(view) {
		return new Promise((resolve, reject) => {
			if (view) {
				setTimeout(() => {
					// const tourTextureSrc = container.getAttribute('texture');
					const loader = new THREE.TextureLoader();
					loader.crossOrigin = '';
					loader.load(view.image, (texture) => {
						/*
						// texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
						// texture.repeat.set(2, 2);
						this.tourTexture = texture;
						this.createScene();
						*/
						/*
						if (this.room.sphere.material.map) {
							this.room.sphere.material.map.dispose();
						}
						*/
						const material = this.room.sphere.material;
						material.opacity = 0;
						material.color.setHex(0xffffff);
						// texture.minFilter = THREE.NearestMipMapNearestFilter;
						// texture.magFilter = THREE.LinearMipMapLinearFilter;
						material.map = texture;
						material.map.needsUpdate = true;
						material.needsUpdate = true;
						TweenMax.to(material, 0.7, {
							opacity: TEST_ENABLED ? 0.5 : 1,
							delay: 0.1,
							ease: Power2.easeInOut,
							onCompleted: () => {
								resolve(view);
							}
						});
						this.emit('onEnterView', view);
					});
				}, 100);
			} else {
				reject(view);
			}
		});
	}

	onEnterPoints(view) {
		view.points.forEach((p, i) => {
			const point = new NavPoint(this.points, {}, i, new THREE.Vector3(...p.position));
			this.addPointListeners(point);
			return point;
		});
	}

	onExitPoints(view) {
		if (view) {
			return Promise.all(view.points.map((point, i) => this.removePoint(i)));
		} else {
			return Promise.resolve();
		}
	}

	onEnterPanel(point) {
		this.getPanelInfoById('#panel').then(info => {
			if (info) {
				const panel = this.panel;
				panel.material.map = info.map;
				panel.material.opacity = 0;
				// panel.material.alphaMap = info.alphaMap;
				panel.material.needsUpdate = true;
				// const scale = info.width / 256;
				// panel.geometry.scale(scale, scale, scale);
				// panel.geometry.verticesNeedUpdate = true;
				const position = point.normalize().multiplyScalar(PANEL_RADIUS);
				panel.position.set(position.x, position.y + 30 + 30, position.z);
				panel.lookAt(ORIGIN);
				this.add(panel);
				const from = { value: 1 };
				TweenMax.to(from, 0.7, {
					value: 0,
					delay: 0.2,
					ease: Power2.easeInOut,
					onUpdate: () => {
						panel.position.set(position.x, position.y + 30 + 30 * from.value, position.z);
						panel.lookAt(ORIGIN);
						panel.material.opacity = 1 - from.value;
						panel.material.needsUpdate = true;
					}
				});
				// console.log('getPanelInfoById', panel.position);
			}
		});
	}

	onExitPanel() {
		const panel = this.panel;
		if (panel && panel.parent) {
			panel.parent.remove(panel);
		}
	}

	//

	addRoom(parent) {
		const group = new THREE.Group();
		const geometry = new THREE.SphereBufferGeometry(ROOM_RADIUS, 72, 72);
		// const geometry = new THREE.IcosahedronBufferGeometry(ROOM_RADIUS, 4);
		// console.log(geometry);
		// invert the geometry on the x-axis so that all of the faces point inward
		geometry.scale(-1, 1, 1);
		const material = new THREE.MeshBasicMaterial({
			color: 0x000000,
			depthTest: false,
			transparent: true,
			opacity: 0.0,
			// wireframe: true
		});
		/*
		const material = new THREE.MeshStandardMaterial({
			color: '#fefefe',
			roughness: 0.9,
			metalness: 0.1,
			roughnessMap: texture,
			map: texture,
			transparent: true,
			opacity: 0,
			// premultipliedAlpha: true,
		});
		*/
		const sphere = new InteractiveMesh(geometry, material);
		sphere.renderOrder = -1;
		// sphere.castShadow = false;
		// sphere.receiveShadow = true;
		// group.renderOrder = -1;
		group.add(sphere);
		group.sphere = sphere;
		//
		/*
		const rotation = new THREE.Euler(0.0, 0.0, 0.0, 'XYZ');
		group.rotation.set(rotation.x, rotation.y, rotation.z);
		*/
		parent.add(group);
		return group;
	}

	addFloor(parent) {
		const geometry = new THREE.PlaneGeometry(ROOM_RADIUS / 5 * 3, ROOM_RADIUS / 5 * 3, 3, 3);
		const loader = new THREE.TextureLoader();
		const texture = loader.load('img/floor.jpg');
		const textureAlpha = loader.load('img/floor-alpha.jpg');
		const material = new THREE.MeshBasicMaterial({
			map: texture,
			alphaMap: textureAlpha,
			// alphaTest: 0.5,
			// blending: THREE.AdditiveBlending,
			// depthTest: true,
			transparent: true
		});
		/*
		material.blending = THREE.AdditiveBlending;
		*/
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.y = -ROOM_RADIUS / 5 * 3;
		mesh.rotation.x = -Math.PI / 2;
		parent.add(mesh);
		return mesh;
	}

	addCeil(parent) {
		const geometry = new THREE.PlaneGeometry(ROOM_RADIUS / 5 * 2, ROOM_RADIUS / 5 * 2, 3, 3);
		const loader = new THREE.TextureLoader();
		const texture = loader.load('img/ceil.jpg');
		const textureAlpha = loader.load('img/ceil-alpha.jpg');
		const material = new THREE.MeshBasicMaterial({
			map: texture,
			alphaMap: textureAlpha,
			// alphaTest: 0.5,
			// blending: THREE.AdditiveBlending,
			// depthTest: true,
			transparent: true
		});
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.y = ROOM_RADIUS / 5 * 4;
		mesh.rotation.x = Math.PI / 2;
		parent.add(mesh);
		return mesh;
	}

	addPanel(parent) {
		const geometry = new THREE.PlaneBufferGeometry(PANEL_RADIUS / 2.5, PANEL_RADIUS / 2.5, 3, 3);
		const material = new THREE.MeshBasicMaterial({
			transparent: true,
			opacity: 1,
			// side: THREE.DoubleSide,
		});
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(100000, 100000, 100000);
		// parent.add(mesh);
		return mesh;
	}

	addPoints(parent) {
		const points = new THREE.Group();
		parent.add(points);
		return points;
	}

	removePoints() {
		/*
		if (this.points) {
			this.points.remove();
			delete this.points;
		}
		*/
	}

	removePoint(i) {
		return new Promise((resolve, reject) => {
			const point = this.points.children[i];
			const from = { opacity: 1 };
			TweenMax.to(from, 0.7, {
				opacity: 0,
				delay: 0.0 * i,
				ease: Power2.easeInOut,
				onUpdate: () => {
					// console.log(index, from.opacity);
					point.material.opacity = from.opacity;
					point.material.needsUpdate = true;
				},
				onCompleted: () => {
					this.points.remove(point);
					resolve();
				}
			});
		});
	}

	createPoint(intersection) {
		const position = intersection.point.clone();
		const points = this.points;
		const point = new NavPoint(points, {}, 0, position);
		this.addPointListeners(point);
		this.view.points.push({
			id: 2,
			position: position.toArray(),
			type: 1,
			name: 'Point 2',
			key: 'POINT2',
		});
	}

	addPointListeners(point) {
		point.on('over', () => {
			const from = { scale: point.scale.x };
			TweenMax.to(from, 0.4, {
				scale: 3,
				delay: 0,
				ease: Power2.easeInOut,
				onUpdate: () => {
					point.scale.set(from.scale, from.scale, from.scale);
				}
			});
			this.onEnterPanel(point.position.clone());
			this.emit('pointOver', point);
		});
		point.on('out', () => {
			const from = { scale: point.scale.x };
			TweenMax.to(from, 0.4, {
				scale: 1,
				delay: 0,
				ease: Power2.easeInOut,
				onUpdate: () => {
					point.scale.set(from.scale, from.scale, from.scale);
				}
			});
			this.onExitPanel();
			this.emit('pointOut', point);
		});
		point.on('down', () => {
			this.emit('pointDown', point);
			this.index = (this.index + 1) % this.views.length;
		});
	}

	getPanelInfoById(id) {
		return new Promise((resolve, reject) => {
			const node = document.querySelector(id);
			if (node) {
				html2canvas(node, {
					backgroundColor: '#ffffff00',
				}).then(canvas => {
					// !!!
					// document.body.appendChild(canvas);
					// const alpha = this.getAlphaFromCanvas(canvas);
					// document.body.appendChild(alpha);
					const map = new THREE.CanvasTexture(canvas);
					// const alphaMap = new THREE.CanvasTexture(alpha);
					resolve({
						map: map,
						// alphaMap: alphaMap,
						width: canvas.width,
						height: canvas.height,
					});
				});
			} else {
				reject('node not found');
			}
		});
	}

	/*
	getAlphaFromCanvas(source) {
		const sourceCtx = source.getContext('2d');
		const imageData = sourceCtx.getImageData(0, 0, source.width, source.height);
		const data = imageData.data;
		for (let i = 0; i < data.length; i += 4) {
			const alpha = data[i + 3];
			data[i] = alpha;
			data[i + 1] = alpha;
			data[i + 2] = alpha;
			data[i + 3] = 254;
		}
		const target = document.createElement('canvas');
		target.width = source.width;
		target.height = source.height;
		const targetCtx = target.getContext('2d');
		targetCtx.putImageData(imageData, target.width, target.height);
		// targetCtx.drawImage(imageData, 0, 0);
		return target;
	}
	*/
}

export class NavPoint extends InteractiveMesh {

	static getLoader() {
		return NavPoint.loader || (NavPoint.loader = new THREE.TextureLoader());
	}

	static getTexture(item, index) {
		return NavPoint.texture || (NavPoint.texture = NavPoint.getLoader().load('img/pin.png'));
	}

	constructor(parent, item, index, position) {
		// console.log('NavPoint', parent, position, i);
		// size 2 about 20 cm radius
		const geometry = new THREE.PlaneBufferGeometry(2, 2, 2, 2);
		const map = NavPoint.getTexture(item, index);
		const material = new THREE.MeshBasicMaterial({
			// alphaMap: texture,
			map: map,
			transparent: true,
			opacity: 0,
		});
		super(geometry, material);
		this.item = item;
		this.index = index;
		// this.renderOrder = 1;
		position = position.normalize().multiplyScalar(POINT_RADIUS);
		this.position.set(position.x, position.y, position.z);
		this.lookAt(ORIGIN);
		parent.add(this);
		const from = { opacity: 0 };
		TweenMax.to(from, 0.7, {
			opacity: 1,
			delay: 0.1 * index,
			ease: Power2.easeInOut,
			onUpdate: () => {
				// console.log(index, from.opacity);
				material.opacity = from.opacity;
				material.needsUpdate = true;
			}
		});
	}

}
