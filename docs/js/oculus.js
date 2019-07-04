(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.random = random;
exports.Oculus = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/* jshint esversion: 6 */

/* global window, document, TweenMax, THREE, WEBVR */
function random() {
  return Math.random() - 0.5;
}

var Oculus =
/*#__PURE__*/
function () {
  function Oculus() {
    _classCallCheck(this, Oculus);

    this.count = 0;
    this.normal = new THREE.Vector3();
    this.relativeVelocity = new THREE.Vector3();
    this.clock = new THREE.Clock();
  }

  _createClass(Oculus, [{
    key: "init",
    value: function init() {
      var section = document.querySelector('.webvr');
      var container = section.querySelector('.webvr__container');
      var scene = this.scene = this.addScene();
      var camera = this.camera = this.addCamera();
      var room = this.room = this.addRoom(scene);
      var bills = this.bills = this.addBillsToFloor(room);
      var renderer = this.renderer = this.addRenderer(container); // controllers

      var left = this.left = this.addControllerLeft(renderer, scene);
      var right = this.right = this.addControllerRight(renderer, scene); // hands

      var hands = this.hands = this.addHands(); // this.onSelectStart = this.onSelectStart.bind(this);
      // this.onSelectEnd = this.onSelectEnd.bind(this);

      this.onWindowResize = this.onWindowResize.bind(this);
      window.addEventListener('resize', this.onWindowResize, false);
    }
  }, {
    key: "addScene",
    value: function addScene() {
      var scene = new THREE.Scene();
      scene.background = new THREE.Color(0x404040);
      scene.fog = new THREE.Fog(scene.background, 10, 15);
      return scene;
    }
  }, {
    key: "addCamera",
    value: function addCamera() {
      var camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 20);
      return camera;
    }
  }, {
    key: "addRoom",
    value: function addRoom(scene) {
      var geometry = new THREE.PlaneBufferGeometry(15, 15);
      geometry.rotateX(-Math.PI / 2);
      geometry.translate(0, -0.01, 0);
      var material = new THREE.MeshBasicMaterial({
        color: 0x202020
      });
      var room = new THREE.Mesh(geometry, material);
      scene.add(room);
      return room;
    }
  }, {
    key: "addRenderer",
    value: function addRenderer(container) {
      var renderer = new THREE.WebGLRenderer({
        antialias: true
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.vr.enabled = true;
      container.appendChild(renderer.domElement);
      document.body.appendChild(WEBVR.createButton(renderer));
      return renderer;
    }
  }, {
    key: "addControllerLeft",
    value: function addControllerLeft(renderer, scene) {
      var controller = renderer.vr.getController(0);
      controller.addEventListener('selectstart', this.onSelectStart.bind(controller));
      controller.addEventListener('selectend', this.onSelectEnd.bind(controller));
      scene.add(controller);
      return controller;
    }
  }, {
    key: "addControllerRight",
    value: function addControllerRight(renderer, scene) {
      var controller = renderer.vr.getController(1);
      /*
      controller.addEventListener('selectstart', this.onSelectStart.bind(controller));
      controller.addEventListener('selectend', this.onSelectEnd.bind(controller));
      */

      scene.add(controller);
      return controller;
    }
  }, {
    key: "addBillsToFloor",
    value: function addBillsToFloor(room) {
      var geometry = new THREE.PlaneBufferGeometry(0.2, 0.09);
      geometry.rotateZ(Math.PI / 2);
      geometry.rotateX(-Math.PI / 2);
      var texture = new THREE.TextureLoader().load('https://cdn.glitch.com/cf086db5-7af7-4f20-8220-93d1d99150b7%2F100_dollar_bill_vector.png?1558543607686');
      texture.anisotropy = 8;
      var material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide
      });
      var bills = new Array(400).fill(0).map(function (x, i) {
        var bill = new THREE.Mesh(geometry, material);
        bill.position.x = random() * 8;
        bill.position.y = Math.random() * 6;
        bill.position.z = random() * 8;
        bill.rotation.y = random() * Math.PI * 2;
        bill.userData.velocity = new THREE.Vector3();
        bill.userData.velocity.x = random() * 0.01;
        bill.userData.velocity.y = random() * 0.01;
        bill.userData.velocity.z = random() * 0.01;
        bill.userData.noise = random() * 0.1;
        room.add(bill);
        return bill;
      });
      return bills;
    }
  }, {
    key: "addBillsToHand",
    value: function addBillsToHand(hand) {
      var _this = this;

      var room = this.room;
      var bills = new Array(10).fill(0).map(function (x, i) {
        var bill = room.children[0].clone();
        bill.position.set(i * 0.003 + 0.02, -0.05, 0);
        bill.rotation.set(random() * 0.3, random() * 0.1, -Math.PI / 2);
        hand.add(bill);
        _this.right.userData.bill = bill; // pointer to last bill

        return bill;
      });
      return bills;
    }
  }, {
    key: "addHands",
    value: function addHands() {
      var _this2 = this;

      var hands = [];
      var left = this.left;
      var right = this.right;
      var file = 'https://cdn.glitch.com/7ae766be-18fb-4945-ad9d-8cc3be027694%2Fhand.obj?1558677422910';
      var loader = new THREE.OBJLoader();
      loader.load(file, function (group) {
        var texture = new THREE.TextureLoader().load('https://cdn.glitch.com/7ae766be-18fb-4945-ad9d-8cc3be027694%2FBazC_SkinMat.jpg?1558678160164');
        var hand = group.children[0];
        hand.geometry.rotateZ(-Math.PI / 2);
        hand.geometry.rotateY(Math.PI);
        hand.geometry.translate(1, -0.2, 0.25);
        hand.geometry.scale(0.1, 0.1, 0.1);
        hand.material = new THREE.MeshMatcapMaterial({
          matcap: texture
        });
        hand.scale.x = -1;
        var leftHand = hand.clone();
        left.add(leftHand);
        hands.push(leftHand);
        hand.scale.x = 1;

        var bills = _this2.addBillsToHand(hand);

        var rightHand = hand.clone();
        right.add(rightHand);
        hands.push(rightHand);
      });
      return hands;
    }
  }, {
    key: "onSelectStart",
    value: function onSelectStart() {
      this.userData.isSelecting = true;
    }
  }, {
    key: "onSelectEnd",
    value: function onSelectEnd() {
      this.userData.isSelecting = false;
    }
  }, {
    key: "onWindowResize",
    value: function onWindowResize() {
      var camera = this.camera;
      var renderer = this.renderer;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }, {
    key: "handleController",
    value: function handleController(controller) {
      var room = this.room;

      if (controller.userData.isSelecting) {
        var bill = room.children[count++];
        var emitter = controller.children[0].children[9];
        emitter.matrixWorld.decompose(bill.position, bill.quaternion, bill.scale);
        bill.userData.velocity.x = random();
        bill.userData.velocity.y = random() + 0.5;
        bill.userData.velocity.z = Math.random() - 5;
        bill.userData.velocity.applyQuaternion(bill.quaternion);
        bill.userData.noise = random() * 0.1;
        if (count === room.children.length) count = 0;
      }
    }
  }, {
    key: "handleBills",
    value: function handleBills() {
      var clock = this.clock;
      var room = this.room;
      var delta = clock.getDelta() * 0.5; // slow down simulation

      room.children.forEach(function (bill) {
        var userData = bill.userData;
        var velocity = userData.velocity;
        bill.position.x += velocity.x * delta;
        bill.position.y += velocity.y * delta;
        bill.position.z += velocity.z * delta; // flatten rotation

        bill.rotation.x *= 0.99;
        bill.rotation.z *= 0.99; // handle floor

        if (bill.position.y <= 0) {
          bill.position.y = 0;
          velocity.x *= 0.85;
          velocity.y = 0;
          velocity.z *= 0.85;
        }

        var height = bill.position.y * 0.1;

        if (height > 0) {
          velocity.x += userData.noise * height;
          velocity.y -= 9.8 * delta;
          velocity.z += userData.noise * height;
          bill.rotation.y += userData.noise * height;
        }
      });
    }
  }, {
    key: "render",
    value: function render() {
      var left = this.left;
      var right = this.right;
      var renderer = this.renderer;
      var scene = this.scene;
      var camera = this.camera;
      this.handleController(left);
      this.handleController(right);
      this.handleBills();
      renderer.render(scene, camera);
    }
  }, {
    key: "animate",
    value: function animate() {
      var left = this.left;
      var right = this.right;
      var renderer = this.renderer;
      var scene = this.scene;
      var camera = this.camera;
      var handleController = this.handleController.bind(this);
      var handleBills = this.handleBills.bind(this);

      var render = function render() {
        handleController(left);
        handleController(right);
        handleBills();
        renderer.render(scene, camera);
      };

      this.renderer.setAnimationLoop(render);
    }
  }]);

  return Oculus;
}();

exports.Oculus = Oculus;
var oculus = new Oculus(); // window.onload = () => {

oculus.init();
oculus.animate(); // };

},{}]},{},[1]);
//# sourceMappingURL=oculus.js.map
