/* jshint esversion: 6 */
/* global window, document, TweenMax, THREE, WEBVR */

const modifier = new THREE.SubdivisionModifier(2);
const geometry = new THREE.CylinderGeometry(4, 4, 30, 12);
const smoothGeometry = modifier.modify(geometry);
const smoothBufferGeometry = new THREE.BufferGeometry().fromGeometry(smoothGeometry);
const mesh = new THREE.Mesh(smoothBufferGeometry, material);
/*
var faceIndices = [ 'a', 'b', 'c' ];
for ( var i = 0; i < smooth.faces.length; i ++ ) {
	var face = smooth.faces[ i ];
	for ( var j = 0; j < 3; j ++ ) {
		var vertexIndex = face[ faceIndices[ j ] ];
		var vertex = smooth.vertices[ vertexIndex ];
		var hue = ( vertex.y / 200 ) + 0.5;
		var color = new THREE.Color().setHSL( hue, 1, 0.5 );
		face.vertexColors[ j ] = color;
	}
}
*/
