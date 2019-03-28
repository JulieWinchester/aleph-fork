import { AframeRegistry, AframeComponent } from "../interfaces";
import { Constants } from "../Constants";
import { ThreeUtils } from "../utils";

interface AlOrbitControlState {
  oldPosition: THREE.Vector3;
  controls: THREE.OrbitControls;
  targetPosition: THREE.Vector3;
  cameraPosition: THREE.Vector3;
  controlPosition: THREE.Vector3;
  animationStep: number;
}

interface AlOrbitControlObject extends AframeComponent {
  dependencies: string[];
  onEnterVR: () => void;
  onExitVR: () => void;
  bindListeners(): void;
  addListeners(): void;
  removeListeners(): void;
  elMouseUp(event: CustomEvent): void;
  elMouseDown(event: CustomEvent): void;
}

export class AlOrbitControl implements AframeRegistry {
  public static getObject(): AlOrbitControlObject {
    return {
      dependencies: ["camera"],

      schema: {
        cameraPosition: { type: "vec3" },
        autoRotate: { type: "boolean" },
        autoRotateSpeed: { default: 2 },
        dampingFactor: { default: 0.1 },
        enabled: { default: true },
        enableDamping: { default: true },
        enableKeys: { default: true },
        enablePan: { default: true },
        enableRotate: { default: true },
        enableZoom: { default: true },
        keyPanSpeed: { default: 7 },
        minAzimuthAngle: { type: "number", default: -Infinity },
        maxAzimuthAngle: { type: "number", default: Infinity },
        maxDistance: { default: 1000 },
        maxPolarAngle: { default: AFRAME.utils.device.isMobile() ? 90 : 120 },
        minDistance: { default: 1 },
        minPolarAngle: { default: 0 },
        minZoom: { default: 0 },
        panSpeed: { default: 1 },
        rotateSpeed: { default: 0.05 },
        screenSpacePanning: { default: false },
        targetPosition: { type: "vec3" },
        zoomSpeed: { type: "number", default: 0.5 },
        boundingRadius: { type: "number", default: 1 },
        cameraAnimating: { type: "boolean", default: false }
      },

      bindListeners() {
        this.onEnterVR = this.onEnterVR.bind(this);
        this.onExitVR = this.onExitVR.bind(this);
        this.elMouseUp = this.elMouseUp.bind(this);
        this.elMouseDown = this.elMouseDown.bind(this);
      },

      addListeners() {
        this.el.sceneEl.addEventListener("enter-vr", this.onEnterVR);
        this.el.sceneEl.addEventListener("exit-vr", this.onExitVR);
        this.el.addEventListener("mouseup", this.elMouseUp);
        this.el.addEventListener("mousedown", this.elMouseDown);
      },

      removeListeners() {
        this.el.sceneEl.removeEventListener("enter-vr", this.onEnterVR);
        this.el.sceneEl.removeEventListener("exit-vr", this.onExitVR);
        this.el.removeEventListener("mouseup", this.elMouseUp);
        this.el.removeEventListener("mousedown", this.elMouseDown);
      },
      onEnterVR() {
        if (
          !AFRAME.utils.device.checkHeadsetConnected() &&
          !AFRAME.utils.device.isMobile()
        ) {
          return;
        }

        let state = this.state as AlOrbitControlState;
        let el = this.el;

        state.controls.enabled = false;
        if (el.hasAttribute("look-controls")) {
          el.setAttribute("look-controls", "enabled", true);
          state.oldPosition.copy(el.getObject3D("camera").position);
          el.getObject3D("camera").position.set(0, 0, 0);
        }
      },
      onExitVR() {
        if (
          !AFRAME.utils.device.checkHeadsetConnected() &&
          !AFRAME.utils.device.isMobile()
        ) {
          return;
        }

        let state = this.state as AlOrbitControlState;
        let el = this.el;

        state.controls.enabled = true;
        el.getObject3D("camera").position.copy(state.oldPosition);
        if (el.hasAttribute("look-controls")) {
          el.setAttribute("look-controls", "enabled", false);
        }
      },

      elMouseUp(_event: CustomEvent) {
        document.body.style.cursor = "grab";
        this.el.emit(
          AlOrbitControlEvents.HAS_MOVED,
          {
            position: this.state.controls.object.position,
            target: this.state.controls.target
          },
          true
        );
      },

      elMouseDown(_event: CustomEvent) {
        document.body.style.cursor = "grabbing";
      },

      init() {
        this.bindListeners();
        this.addListeners();

        let el = this.el;
        let oldPosition = new THREE.Vector3();
        let controls = new THREE.OrbitControls(
          el.getObject3D("camera"),
          el.sceneEl.renderer.domElement
        );
        let data = this.data;

        document.body.style.cursor = "grab";

        // Convert the cameraPosition & targetPosition Objects into THREE.Vector3
        let cameraPosition = ThreeUtils.objectToVector3(data.cameraPosition);
        let targetPosition = ThreeUtils.objectToVector3(data.targetPosition);

        (this.state as AlOrbitControlState) = {
          controls,
          oldPosition,
          targetPosition,
          cameraPosition,
          animationStep: 0,
          controlPosition: controls.object.position
        };

        // emit after 10 ms so that it happens after the scene's componentDidUpdate method has fired
        setTimeout(() => {
          el.emit(
            AlOrbitControlEvents.INIT,
            {
              controls: this.state.controls
            },
            true
          );
        }, 10);
      },

      update(_oldData) {
        let state = this.state as AlOrbitControlState;
        let controls = state.controls;
        const data = this.data;

        controls.target = state.targetPosition.copy(data.targetPosition);
        controls.autoRotate = data.autoRotate;
        controls.autoRotateSpeed = data.autoRotateSpeed;
        controls.dampingFactor = data.dampingFactor;
        controls.enabled = data.enabled;
        controls.enableDamping = data.enableDamping;
        controls.enableKeys = data.enableKeys;
        controls.enablePan = data.enablePan;
        controls.enableRotate = data.enableRotate;
        controls.enableZoom = data.enableZoom;
        controls.keyPanSpeed = data.keyPanSpeed;
        controls.maxPolarAngle = THREE.Math.degToRad(data.maxPolarAngle);
        controls.maxAzimuthAngle = THREE.Math.degToRad(data.maxAzimuthAngle);
        controls.maxDistance = data.maxDistance;
        controls.minDistance = data.minDistance;
        controls.minPolarAngle = THREE.Math.degToRad(data.minPolarAngle);
        controls.minAzimuthAngle = THREE.Math.degToRad(data.minAzimuthAngle);
        controls.rotateSpeed = data.rotateSpeed;
        controls.screenSpacePanning = data.screenSpacePanning;
        controls.zoomSpeed = data.zoomSpeed;

        // If _oldData.cameraPosition exists and we're NOT cameraAnimating, this is not the initialisation update and an animation update
        if (_oldData.cameraPosition) {
          let oldPos = ThreeUtils.objectToVector3(_oldData.cameraPosition);
          let newPos = ThreeUtils.objectToVector3(data.cameraPosition);

          if (!oldPos.equals(newPos)) {
            // Check the old start position against the value passed in by aleph._renderCamera()
            // This is to check and see if the source has changed, as the cameraPosition for each
            // source is determined by it's bounding sphere.
            state.cameraPosition.copy(newPos);

            if (!data.cameraAnimating) {
              controls.object.position.copy(data.cameraPosition);
            } else {
              state.controlPosition.copy(state.controls.object.position);
            }
          }
        }
      },

      tick() {
        if (!this.data.enabled) {
          return;
        }

        let state = this.state as AlOrbitControlState;
        let el = this.el;
        let controls = state.controls;
        const data = this.data;

        if (data.cameraAnimating) {
          let endPos = state.cameraPosition;
          let startPos = state.controlPosition;

          if (state.animationStep <= Constants.maxAnimationSteps) {
            const percent: number =
              state.animationStep / Constants.maxAnimationSteps;
            const res: THREE.Vector3 | null = ThreeUtils.slerp(
              startPos.clone(),
              endPos.clone(),
              percent
            );

            if (res) {
              controls.object.position.copy(res);
              state.animationStep += 1;
            } else {
              el.emit(AlOrbitControlEvents.ANIMATION_FINISHED, {}, true);
              state.animationStep = 0;
            }
          } else {
            el.emit(AlOrbitControlEvents.ANIMATION_FINISHED, {}, true);
            state.animationStep = 0;
          }
        }
        controls.update();
      },

      remove() {
        this.removeEventListener();
        let state = this.state as AlOrbitControlState;
        state.controls.dispose();
        state = null;
      }
    } as AlOrbitControlObject;
  }

  public static getName(): string {
    return "al-orbit-control";
  }
}

export class AlOrbitControlEvents {
  static INIT: string = "al-controls-init";
  static ANIMATION_FINISHED: string = "al-animation-finished";
  static HAS_MOVED: string = "al-has-moved";
}
