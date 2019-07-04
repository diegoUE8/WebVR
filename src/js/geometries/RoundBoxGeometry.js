/* jshint esversion: 6 */
/* global window, document, TweenMax, ThreeJs */

export function RoundBoxGeometry(width, height, depth, radius, widthSegments, heightSegments, depthSegments, radiusSegments) {
	width = width || 1;
	height = height || 1;
	depth = depth || 1;
	const minimum = Math.min(Math.min(width, height), depth);
	radius = radius || minimum * 0.25;
	radius = radius > minimum * 0.5 ? minimum * 0.5 : radius;
	widthSegments = Math.floor(widthSegments) || 1;
	heightSegments = Math.floor(heightSegments) || 1;
	depthSegments = Math.floor(depthSegments) || 1;
	radiusSegments = Math.floor(radiusSegments) || 1;
	const fullGeometry = new THREE.BufferGeometry();
	const fullPosition = [];
	const fullUvs = [];
	const fullIndex = [];
	let fullIndexStart = 0;
	let groupStart = 0;
	RoundBoxGeometryBendPlane_(width, height, radius, widthSegments, heightSegments, radiusSegments, depth * 0.5, 'y', 0, 0);
	RoundBoxGeometryBendPlane_(width, height, radius, widthSegments, heightSegments, radiusSegments, depth * 0.5, 'y', Math.PI, 1);
	RoundBoxGeometryBendPlane_(depth, height, radius, depthSegments, heightSegments, radiusSegments, width * 0.5, 'y', Math.PI * 0.5, 2);
	RoundBoxGeometryBendPlane_(depth, height, radius, depthSegments, heightSegments, radiusSegments, width * 0.5, 'y', Math.PI * -0.5, 3);
	RoundBoxGeometryBendPlane_(width, depth, radius, widthSegments, depthSegments, radiusSegments, height * 0.5, 'x', Math.PI * -0.5, 4);
	RoundBoxGeometryBendPlane_(width, depth, radius, widthSegments, depthSegments, radiusSegments, height * 0.5, 'x', Math.PI * 0.5, 5);
	fullGeometry.addAttribute("position", new THREE.BufferAttribute(new Float32Array(fullPosition), 3));
	fullGeometry.addAttribute("uv", new THREE.BufferAttribute(new Float32Array(fullUvs), 2));
	fullGeometry.setIndex(fullIndex);
	fullGeometry.computeVertexNormals();
	return fullGeometry;

	function RoundBoxGeometryBendPlane_(width, height, radius, widthSegments, heightSegments, smoothness, offset, axis, angle, materialIndex) {
		const halfWidth = width * 0.5;
		const halfHeight = height * 0.5;
		const widthChunk = width / (widthSegments + smoothness * 2);
		const heightChunk = height / (heightSegments + smoothness * 2);
		const planeGeom = new THREE.PlaneBufferGeometry(width, height, widthSegments + smoothness * 2, heightSegments + smoothness * 2);
		const v = new THREE.Vector3(); // current vertex
		const cv = new THREE.Vector3(); // control vertex for bending
		const cd = new THREE.Vector3(); // vector for distance
		const position = planeGeom.attributes.position;
		const uv = planeGeom.attributes.uv;
		const widthShrinkLimit = widthChunk * smoothness;
		const widthShrinkRatio = radius / widthShrinkLimit;
		const heightShrinkLimit = heightChunk * smoothness;
		const heightShrinkRatio = radius / heightShrinkLimit;
		const widthInflateRatio = (halfWidth - radius) / (halfWidth - widthShrinkLimit);
		const heightInflateRatio = (halfHeight - radius) / (halfHeight - heightShrinkLimit);
		for (let i = 0; i < position.count; i++) {
			v.fromBufferAttribute(position, i);
			if (Math.abs(v.x) >= halfWidth - widthShrinkLimit) {
				v.setX((halfWidth - (halfWidth - Math.abs(v.x)) * widthShrinkRatio) * Math.sign(v.x));
			} else {
				v.x *= widthInflateRatio;
			} // lr
			if (Math.abs(v.y) >= halfHeight - heightShrinkLimit) {
				v.setY((halfHeight - (halfHeight - Math.abs(v.y)) * heightShrinkRatio) * Math.sign(v.y));
			} else {
				v.y *= heightInflateRatio;
			} // tb
			//re-calculation of uvs
			uv.setXY(
				i,
				(v.x - (-halfWidth)) / width,
				1 - (halfHeight - v.y) / height
			);
			// bending
			const widthExceeds = Math.abs(v.x) >= halfWidth - radius;
			const heightExceeds = Math.abs(v.y) >= halfHeight - radius;
			if (widthExceeds || heightExceeds) {
				cv.set(
					widthExceeds ? (halfWidth - radius) * Math.sign(v.x) : v.x,
					heightExceeds ? (halfHeight - radius) * Math.sign(v.y) : v.y,
					-radius);
				cd.subVectors(v, cv).normalize();
				v.copy(cv).addScaledVector(cd, radius);
			}
			position.setXYZ(i, v.x, v.y, v.z);
		}
		planeGeom.translate(0, 0, offset);
		switch (axis) {
			case 'y':
				planeGeom.rotateY(angle);
				break;
			case 'x':
				planeGeom.rotateX(angle);
		}
		// merge positions
		position.array.forEach(function(p) {
			fullPosition.push(p);
		});
		// merge uvs
		uv.array.forEach(function(u) {
			fullUvs.push(u);
		});
		// merge indices
		planeGeom.index.array.forEach(function(a) {
			fullIndex.push(a + fullIndexStart);
		});
		fullIndexStart += position.count;
		// set the groups
		fullGeometry.addGroup(groupStart, planeGeom.index.count, materialIndex);
		groupStart += planeGeom.index.count;
	}
}
