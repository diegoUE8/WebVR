/* jshint esversion: 6 */
/* global window, document */

import Emittable from '../interactive/emittable';

export const VR_MODE = {
	NONE: 0,
	VR: 1,
	XR: 2,
};

export class VR extends Emittable {

	constructor(renderer, options, onError) {
		super();
		if (options && options.frameOfReferenceType) {
			renderer.vr.setFrameOfReferenceType(options.frameOfReferenceType);
		}
		if (onError) {
			console.log(onError);
			this.on('error', onError);
		}
		this.renderer = renderer;
		this.options = options;
		this.onVRDisplayConnect = this.onVRDisplayConnect.bind(this);
		this.onVRDisplayDisconnect = this.onVRDisplayDisconnect.bind(this);
		this.onVRDisplayPresentChange = this.onVRDisplayPresentChange.bind(this);
		this.onVRDisplayActivate = this.onVRDisplayActivate.bind(this);
		this.onVRMouseEnter = this.onVRMouseEnter.bind(this);
		this.onVRMouseLeave = this.onVRMouseLeave.bind(this);
		this.onVRClick = this.onVRClick.bind(this);
		this.onXRClick = this.onXRClick.bind(this);
		this.onXRSessionStarted = this.onXRSessionStarted.bind(this);
		this.onXRSessionEnded = this.onXRSessionEnded.bind(this);
		this.mode = this.detectMode();
		this.initElement();
	}

	detectMode() {
		let mode = VR_MODE.NONE;
		if ('xr' in navigator) {
			mode = VR_MODE.XR;
		} else if ('getVRDisplays' in navigator) {
			mode = VR_MODE.VR;
		}
		return mode;
	}

	initElement() {
		try {
			let element;
			switch (this.mode) {
				case VR_MODE.VR:
					element = this.element = this.addElement('button');
					element.style.display = 'none';
					window.addEventListener('vrdisplayconnect', this.onVRDisplayConnect, false);
					window.addEventListener('vrdisplaydisconnect', this.onVRDisplayDisconnect, false);
					window.addEventListener('vrdisplaypresentchange', this.onVRDisplayPresentChange, false);
					window.addEventListener('vrdisplayactivate', this.onVRDisplayActivate, false);
					this.getVR();
					break;
				case VR_MODE.XR:
					element = this.element = this.addElement('button');
					this.getXR();
					break;
				default:
					element = this.element = this.addElement('a');
					element.style.display = 'block';
					element.style.left = 'calc(50% - 90px)';
					element.style.width = '180px';
					element.style.textDecoration = 'none';
					element.href = 'https://webvr.info';
					element.target = '_blank';
					element.innerHTML = 'WEBVR NOT SUPPORTED';
			}
			this.element = element;
		} catch (error) {
			// console.log(error);
			this.emit('error', error);
		}
	}

	addElement(type) {
		const element = document.createElement(type);
		element.style.display = 'none';
		element.style.position = 'absolute';
		element.style.bottom = '20px';
		element.style.padding = '12px 6px';
		element.style.border = '1px solid #fff';
		element.style.borderRadius = '4px';
		element.style.background = 'rgba(0,0,0,0.1)';
		element.style.color = '#fff';
		element.style.font = 'normal 13px sans-serif';
		element.style.textAlign = 'center';
		element.style.opacity = '0.5';
		element.style.outline = 'none';
		element.style.zIndex = '999';
		return element;
	}

	getVR() {
		navigator.getVRDisplays().then((displays) => {
			// console.log('navigator.getVRDisplays', displays);
			if (displays.length > 0) {
				this.setEnterVR(displays[0]);
			} else {
				this.setVRNotFound();
			}
		}).catch((e) => {
			console.log('getVR.error', e);
			this.setVRNotFound();
		});
	}

	getXR() {
		navigator.xr.requestDevice().then((device) => {
			device.supportsSession({
				immersive: true,
				exclusive: true /* DEPRECATED */
			}).then(() => {
				this.setEnterXR(device);
			}).catch(() => this.setVRNotFound());
		}).catch((e) => {
			console.log('getXR.error', e);
			this.setVRNotFound();
		});
	}

	setEnterVR(device) {
		this.device = device;
		this.renderer.vr.setDevice(device);
		this.session = null;
		const element = this.element;
		element.style.display = '';
		element.style.cursor = 'pointer';
		element.style.left = 'calc(50% - 50px)';
		element.style.width = '100px';
		element.textContent = 'ENTER VR';
		element.addEventListener('mouseenter', this.onVRMouseEnter);
		element.addEventListener('mouseleave', this.onVRMouseLeave);
		element.addEventListener('click', this.onVRClick);
	}

	setEnterXR(device) {
		this.device = device;
		this.session = null;
		const element = this.element;
		element.style.display = '';
		element.style.cursor = 'pointer';
		element.style.left = 'calc(50% - 50px)';
		element.style.width = '100px';
		element.textContent = 'ENTER XR'; // !!!
		element.addEventListener('mouseenter', this.onVRMouseEnter);
		element.addEventListener('mouseleave', this.onVRMouseLeave);
		element.addEventListener('click', this.onXRClick);
		this.renderer.vr.setDevice(device);
	}

	setVRNotFound() {
		renderer.vr.setDevice(null);
		const element = this.element;
		element.style.display = '';
		element.style.cursor = 'auto';
		element.style.left = 'calc(50% - 75px)';
		element.style.width = '150px';
		element.textContent = 'VR NOT FOUND';
		element.removeEventListener('mouseenter', this.onVRMouseEnter);
		element.removeEventListener('mouseleave', this.onVRMouseLeave);
		element.removeEventListener('click', this.onVRClick);
		element.removeEventListener('click', this.onXRClick);
	}

	// events

	onVRDisplayConnect(event) {
		this.setEnterVR(event.display);
	}

	onVRDisplayDisconnect(event) {
		this.setVRNotFound();
	}

	onVRDisplayPresentChange(event) {
		try {
			this.element.textContent = event.display.isPresenting ? 'EXIT VR' : 'ENTER VR';
			this.session = event.display.isPresenting;
		} catch (error) {
			this.emit('error', error);
		}
	}

	onVRDisplayActivate(event) {
		try {
			event.display.requestPresent([{
				source: this.renderer.domElement
			}]).then(() => {
				this.emit('presenting');
			}, (error) => {
				console.log(error);
				this.emit('error', error);
			});
		} catch (error) {
			this.emit('error', error);
		}
	}

	onVRMouseEnter(event) {
		this.element.style.opacity = '1.0';
	}

	onVRMouseLeave(event) {
		this.element.style.opacity = '0.5';
	}

	onVRClick(event) {
		try {
			const device = this.device;
			if (device.isPresenting) {
				device.exitPresent();
			} else {
				console.log(this.renderer.domElement);
				device.requestPresent([{
					source: this.renderer.domElement
				}]).then(() => {
					console.log('presenting');
					this.emit('presenting');
				}, (error) => {
					console.log(error);
					this.emit('error', error);
				});
			}
		} catch (error) {
			this.emit('error', error);
		}
	}

	onXRClick(event) {
		try {
			const device = this.device;
			if (this.session === null) {
				device.requestSession({
					immersive: true,
					exclusive: true /* DEPRECATED */
				}).then(this.onXRSessionStarted);
				/*
				if (Tone.context.state !== 'running') {
					Tone.context.resume();
				}
				*/
			} else {
				this.session.end();
			}
		} catch (error) {
			this.emit('error', error);
		}
	}

	onXRSessionStarted(session) {
		try {
			session.addEventListener('end', this.onXRSessionEnded);
			this.renderer.vr.setSession(session);
			this.element.textContent = 'EXIT VR';
			this.session = session;
		} catch (error) {
			this.emit('error', error);
		}
	}

	onXRSessionEnded(event) {
		try {
			this.session.removeEventListener('end', this.onXRSessionEnded);
			this.renderer.vr.setSession(null);
			this.element.textContent = 'ENTER VR';
			this.session = null;
		} catch (error) {
			this.emit('error', error);
		}
	}

}

/*
VRDisplays[0]: VRDisplay {
	capabilities: VRDisplayCapabilities {
		canPresent: true
		hasExternalDisplay: false
		hasOrientation: true
		hasPosition: true
		maxLayers: 1
	}
	depthFar: 10000
	depthNear: 0.01
	displayId: 1
	displayName: "Oculus Quest"
	isConnected: true
	isPresenting: false
	stageParameters: VRStageParameters {
		sittingToStandingTransform: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1.649999976158142, 0, 1]
		sizeX: 0
		sizeZ: 0
	}
}
*/
