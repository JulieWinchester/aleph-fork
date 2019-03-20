import { Component, Prop, State, Method } from "@stencil/core";
import { Store, Action } from "@stencil/redux";
import {
  appSetSrc,
  appSetSrcLoaded,
  appAddTool,
  appRemoveTool,
  appSelectTool,
  appSaveTools,
  appSetDisplayMode,
  appSetOrientation,
  appSetToolsVisible,
  appSetToolsEnabled,
  appSetToolType,
  appSetOptionsVisible,
  appSetOptionsEnabled,
  appSetBoundingBoxVisible,
  appSetSlicesIndex,
  appSetSlicesWindowWidth,
  appSetSlicesWindowCenter,
  appSetVolumeSteps,
  appSetVolumeWindowWidth,
  appSetVolumeWindowCenter,
  appSetAngleToolEnabled,
  appSetAnnotationToolEnabled,
  appSetRulerToolEnabled
} from "../../redux/actions";
import { configureStore } from "../../redux/store";
import { Tool } from "../../interfaces/interfaces";
import { ToolType } from "../../enums/ToolType";
import { Orientation } from "../../enums/Orientation";
import { DisplayMode } from "../../enums/DisplayMode";
import { GetUtils, ThreeUtils, CreateUtils } from "../../utils/utils";
import { Constants } from "../../Constants";
import { MeshFileType } from "../../enums/MeshFileType";
type Entity = import("aframe").Entity;

@Component({
  tag: "uv-aleph",
  styleUrl: "aleph.css",
  shadow: true
})
export class Aleph {
  private _srcLoadedHandler: any;
  private _toolIntersectedHandler: any;
  private _stack: any;
  private _stackHelper: AMI.StackHelper;

  private _container: HTMLElement;
  private _focusEntity: Entity;
  private _controls: THREE.OrbitControls;
  private _scene: Entity;
  private _scale: THREE.Vector3;
  private _validTarget: boolean;
  private _maxMeshDistance: number;

  @Prop({ context: "store" }) store: Store;
  @Prop() dracoDecoderPath: string | null;

  appSetSrc: Action;
  appSetSrcLoaded: Action;
  appAddTool: Action;
  appRemoveTool: Action;
  appSelectTool: Action;
  appSaveTools: Action;
  appSetDisplayMode: Action;
  appSetOrientation: Action;
  appSetToolsVisible: Action;
  appSetToolsEnabled: Action;
  appSetToolType: Action;
  appSetOptionsVisible: Action;
  appSetOptionsEnabled: Action;
  appSetBoundingBoxVisible: Action;
  appSetSlicesIndex: Action;
  appSetSlicesWindowWidth: Action;
  appSetSlicesWindowCenter: Action;
  appSetVolumeSteps: Action;
  appSetVolumeWindowWidth: Action;
  appSetVolumeWindowCenter: Action;
  appSetAngleToolEnabled: Action;
  appSetAnnotationToolEnabled: Action;
  appSetRulerToolEnabled: Action;

  @State() src: string | null;
  @State() srcLoaded: boolean;
  @State() selectedTool: number;
  @State() tools: Tool[];
  @State() displayMode: DisplayMode;
  @State() orientation: Orientation;
  @State() toolsVisible: boolean;
  @State() toolsEnabled: boolean;
  @State() toolType: ToolType;
  @State() optionsVisible: boolean;
  @State() optionsEnabled: boolean;
  @State() boundingBoxVisible: boolean;
  @State() slicesIndex: number;
  @State() slicesWindowWidth: number;
  @State() slicesWindowCenter: number;
  @State() volumeSteps: number;
  @State() volumeWindowWidth: number;
  @State() volumeWindowCenter: number;
  @State() angleToolEnabled: boolean;
  @State() annotationToolEnabled: boolean;
  @State() rulerToolEnabled: boolean;

  @Method()
  async setSrc(src: string) {
    // validate
    const fileExtension: string = GetUtils.getFileExtension(src);

    if (Object.values(MeshFileType).includes(fileExtension)) {
      if (this.displayMode !== DisplayMode.MESH) {
        throw new Error(
          "When setting 'src' to a mesh file you must set 'displayMode' to 'mesh'"
        );
      }
    } else {
      if (this.displayMode === DisplayMode.MESH) {
        throw new Error(
          "When setting 'src' to a non-mesh file you must set 'displayMode' to either 'slices' or 'volume'"
        );
      }
    }

    this.appSetSrc(src);
  }

  @Method()
  async setDisplayMode(displayMode: DisplayMode) {
    this.appSetDisplayMode(displayMode);
  }

  componentWillLoad() {
    CreateUtils.createAframeComponents();

    this.store.setStore(configureStore({}));

    this.store.mapStateToProps(this, state => {
      const {
        app: {
          src,
          srcLoaded,
          selectedTool,
          tools,
          displayMode,
          orientation,
          toolsVisible,
          toolsEnabled,
          toolType,
          optionsVisible,
          optionsEnabled,
          boundingBoxVisible,
          THREEJSSceneNeedsUpdate,
          slicesIndex,
          slicesWindowWidth,
          slicesWindowCenter,
          volumeSteps,
          volumeWindowWidth,
          volumeWindowCenter,
          angleToolEnabled,
          annotationToolEnabled,
          rulerToolEnabled
        }
      } = state;

      return {
        src,
        srcLoaded,
        selectedTool,
        tools,
        displayMode,
        orientation,
        toolsVisible,
        toolsEnabled,
        toolType,
        optionsVisible,
        optionsEnabled,
        boundingBoxVisible,
        THREEJSSceneNeedsUpdate,
        slicesIndex,
        slicesWindowWidth,
        slicesWindowCenter,
        volumeSteps,
        volumeWindowWidth,
        volumeWindowCenter,
        angleToolEnabled,
        annotationToolEnabled,
        rulerToolEnabled
      };
    });

    this.store.mapDispatchToProps(this, {
      appSetSrc,
      appSetSrcLoaded,
      appAddTool,
      appRemoveTool,
      appSelectTool,
      appSaveTools,
      appSetDisplayMode,
      appSetOrientation,
      appSetToolsVisible,
      appSetToolsEnabled,
      appSetToolType,
      appSetOptionsVisible,
      appSetOptionsEnabled,
      appSetBoundingBoxVisible,
      appSetSlicesIndex,
      appSetSlicesWindowWidth,
      appSetSlicesWindowCenter,
      appSetVolumeSteps,
      appSetVolumeWindowWidth,
      appSetVolumeWindowCenter,
      appSetAngleToolEnabled,
      appSetAnnotationToolEnabled,
      appSetRulerToolEnabled
    });

    // set up event handlers
    this._srcLoadedHandler = this._srcLoaded.bind(this);
    this._toolIntersectedHandler = this._toolIntersected.bind(this);
    this._addToolHandler = this._addToolHandler.bind(this);
    this._validTargetHandler = this._validTargetHandler.bind(this);
    this._meshDistanceHandler = this._meshDistanceHandler.bind(this);

    // TODO remove
    console.log(this._container);
  }

  private _renderSrc() {
    if (!this.src) {
      return null;
    }

    switch (this.displayMode) {
      case DisplayMode.MESH: {
        return (
          <a-entity
            al-tool-spawner
            class="collidable"
            id="focusEntity"
            ref={(el: Entity) => (this._focusEntity = el)}
            al-gltf-model={`
                src: url(${this.src});
                dracoDecoderPath: ${this.dracoDecoderPath};
              `}
            position="0 0 0"
            scale="1 1 1"
          />
        );
      }
      default: {
        return (
          <a-entity
            al-tool-spawner
            class="collidable"
            id="focusEntity"
            ref={(el: Entity) => (this._focusEntity = el)}
            al-volumetric-model={`
                src: url(${this.src});
              `}
            position="0 0 0"
            scale="1 1 1"
          />
        );
      }
    }
  }

  private _renderTools(): JSX.Element {
    const outTools: JSX.Element[] = [];
    const dataTools: Tool[] = this.tools;

    for (var i = 0; i < dataTools.length; i++) {
      if (i < this.tools.length) {
        const tool: Tool = dataTools[i];
        console.log(tool.scale);

        outTools.push(
          <a-entity
            class="collidable"
            id={tool.id}
            // geometry="primitive: sphere;"
            position={tool.position}
            // material={`
            //   color: ${
            //     this.selectedTool === tool.id ? tool.selectedColor : tool.color
            //   };
            //   shader: flat;
            // `}
            scale={tool.scale}
            //scale="1 1 1"
            al-tool={`
              focusId: ${tool.focusObject};
              maxRayDistance: ${tool.maxMeshDistance};
            `}
          />
        );
      }
    }

    return outTools;
  }

  private _renderLights(): JSX.Element {
    return [
      <a-entity
        light="type: directional; color: #ffffff; intensity: 0.75"
        position="1 1 1"
      />,
      <a-entity
        light="type: directional; color: #002958; intensity: 0.5"
        position="-1 -1 -1"
      />,
      <a-entity light="type: ambient; color: #d0d0d0; intensity: 1" />
    ];
  }

  private _renderCamera(): JSX.Element {
    if (this.srcLoaded) {
      let orbitData = GetUtils.getOrbitData(this._focusEntity);

      return (
        <a-camera
          cursor="rayOrigin: mouse"
          raycaster="objects: .collidable"
          fov={Constants.cameraValues.fov}
          near={Constants.cameraValues.near}
          far={Constants.cameraValues.far}
          look-controls="enabled: false"
          position="0 0 0"
          orbit-controls={`
            maxPolarAngle: ${Constants.cameraValues.maxPolarAngle};
            minDistance: ${Constants.cameraValues.minDistance};
            screenSpacePanning: true;
            rotateSpeed: ${Constants.cameraValues.rotateSpeed};
            zoomSpeed: ${Constants.cameraValues.zoomSpeed};
            enableDamping: true;
            dampingFactor: ${Constants.cameraValues.dampingFactor};
            target: ${ThreeUtils.vector3ToString(orbitData.sceneCenter)};
            initialPosition: ${ThreeUtils.vector3ToString(
              orbitData.initialPosition
            )};
            enableDamping: true;
            zoomSpeed: 1;
          `}
          ref={el => {
            this._controls = el.object3DMap.controls;
          }}
        />
      );
    } else {
      return null;
    }
  }

  private _renderScene(): JSX.Element {
    return (
      <a-scene
        inspector
        embedded
        renderer="colorManagement: true;"
        vr-mode-ui="enabled: false"
        ref={el => (this._scene = el)}
      >
        {this._renderSrc()}
        {this._renderTools()}
        {this._renderLights()}
        {this._renderCamera()}
      </a-scene>
    );
  }

  private _renderControlPanel(): JSX.Element {
    // todo: tunnel state
    return (
      <al-control-panel
        angleToolEnabled={this.angleToolEnabled}
        annotationToolEnabled={this.annotationToolEnabled}
        boundingBoxVisible={this.boundingBoxVisible}
        displayMode={this.displayMode}
        optionsEnabled={this.optionsEnabled}
        optionsVisible={this.optionsVisible}
        orientation={this.orientation}
        rulerToolEnabled={this.rulerToolEnabled}
        selectedTool={this.selectedTool}
        slicesIndex={this.slicesIndex}
        slicesWindowCenter={this.slicesWindowCenter}
        slicesWindowWidth={this.slicesWindowWidth}
        stack={this._stack}
        stackHelper={this._stackHelper}
        tools={this.tools}
        toolsEnabled={this.toolsEnabled}
        toolsVisible={this.toolsVisible}
        toolType={this.toolType}
        volumeSteps={this.volumeSteps}
        volumeWindowCenter={this.volumeWindowCenter}
        volumeWindowWidth={this.volumeWindowWidth}
        addTool={this.appAddTool}
        removeTool={this.appRemoveTool}
        saveTools={this.appSaveTools}
        selectTool={this.appSelectTool}
        setBoundingBoxVisible={this.appSetBoundingBoxVisible}
        setDisplayMode={this.appSetDisplayMode}
        setOptionsEnabled={this.appSetOptionsEnabled}
        setOrientation={this.appSetOrientation}
        setSlicesIndex={this.appSetSlicesIndex}
        setSlicesWindowCenter={this.appSetSlicesWindowCenter}
        setSlicesWindowWidth={this.appSetSlicesWindowWidth}
        setToolsEnabled={this.appSetToolsEnabled}
        setToolType={this.appSetToolType}
        setVolumeSteps={this.appSetVolumeSteps}
        setVolumeWindowCenter={this.appSetVolumeWindowCenter}
        setVolumeWindowWidth={this.appSetVolumeWindowWidth}
      />
    );
  }

  render(): JSX.Element {
    return (
      <div>
        <div id="container" ref={(el: HTMLElement) => (this._container = el)}>
          {this._renderScene()}
          {this._renderControlPanel()}
        </div>
      </div>
    );
  }

  private _getToolEls(): NodeListOf<Entity> {
    return this._scene.querySelectorAll(".tool");
  }

  private _srcLoaded(): void {
    const mesh: THREE.Mesh = this._focusEntity.object3DMap.mesh as THREE.Mesh;
    mesh.geometry.computeBoundingSphere();
    this._scale = new THREE.Vector3(
      mesh.geometry.boundingSphere.radius,
      mesh.geometry.boundingSphere.radius,
      mesh.geometry.boundingSphere.radius
    );
    this.appSetSrcLoaded(true);
  }

  private _toolIntersected(event: CustomEvent): void {
    const id: number = Number(event.detail.intersection.object.el.id);
    if (this.selectedTool !== id) {
      this.appSelectTool(id);
    }
  }

  private _addToolHandler(event: CustomEvent): void {
    if (this.toolsEnabled && this._validTarget) {
      let intersection: THREE.Intersection = event.detail.detail.intersection;

      this.appAddTool(
        CreateUtils.createTool(
          this.tools,
          this.toolType,
          intersection.point,
          this._scale,
          this._maxMeshDistance,
          "#focusEntity"
        )
      );
    }
  }

  private _meshDistanceHandler(event: CustomEvent): void {
    this._maxMeshDistance = event.detail.dist;
  }

  private _validTargetHandler(event: CustomEvent): void {
    this._validTarget = event.detail.payload;
  }

  private _addEventListeners(): void {
    if (this._scene) {
      this._getToolEls().forEach((el: Entity) => {
        el.addEventListener(
          "intersection",
          this._toolIntersectedHandler,
          false
        );
      });

      this._scene.addEventListener("add-tool", this._addToolHandler, false);
      this._scene.addEventListener(
        "valid-target",
        this._validTargetHandler,
        false
      );
      this._scene.addEventListener(
        "mesh-distance",
        this._meshDistanceHandler,
        false
      );
      this._scene.addEventListener("mouseup", this._toolMouseUp, false);
      this._scene.addEventListener("mousemove", this._toolMouseMove, false);
      this._scene.addEventListener("mousedown", this._toolMouseDown, false);

      if (this._focusEntity) {
        this._focusEntity.addEventListener(
          "model-loaded",
          this._srcLoadedHandler,
          false
        );
      }
    }
  }

  componentDidLoad() {}

  /**
   * Event function for mouseUp
   */
  private _toolMouseUp(): void {
    if (this.toolsEnabled) {
      // if something hovered, exit

      this._controls.enabled = true;
    }
  }

  /**
   * Event function for mouseMove
   * @param evt Event from mouse
   */
  private _toolMouseMove(_evt: MouseEvent): void {
    if (this.toolsEnabled) {
    }
  }

  /**
   * Event function for mouseDown
   * @param evt Mouse Event
   */
  private _toolMouseDown(_evt: MouseEvent): void {
    if (this.toolsEnabled) {
      this._controls.enabled = false;
    }
  }

  componentDidUpdate() {
    this._addEventListeners();
  }
}
