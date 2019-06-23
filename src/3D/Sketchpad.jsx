/**
 * @author:lpf
 * @flow
 *
 **/
import React, { Component } from 'react';
import WebGL from './WebGL';
import BaseConfig from './BaseConfig';
import { generatePath, transformCoordinateSys, generateTextMark, transformCoordinateToWebgl } from "./utilsFor3d";
import type { Size, Position } from "./TypeDec";
import {
    WebGLRenderer,
    PerspectiveCamera,
    Vector3,
    Scene,
    Color,
    AxesHelper,
    GridHelper,
    BoxGeometry,
    MeshBasicMaterial,
    Mesh,
    Line3,
    DoubleSide,
    ImageBitmapLoader,
    CanvasTexture,
    PlaneGeometry,
    Line,
    Shape,
    OrthographicCamera,
    LineBasicMaterial,
    Geometry,
    BufferGeometry,
    Path,
    ShapeBufferGeometry,
    ExtrudeBufferGeometry,
    ShapePath,
    Vector2,
    Math as _Math,
    CameraHelper,
    ExtrudeGeometry,
    Points,
    PointsMaterial,
    Group,
    Raycaster,
    TextureLoader,
    SpriteMaterial,
    Sprite,
    TextGeometry,
    Font,
    TextBufferGeometry,
    Texture,
    DirectionalLight,
    FrontSide,
    MeshLambertMaterial,
    DirectionalLightHelper,
    MeshDepthMaterial,
    MeshPhysicalMaterial,
    Material,
    MeshPhongMaterial,
    PlaneBufferGeometry,
    Object3D, Camera, Light, PCFSoftShadowMap,
} from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import {fromEvent, Subscription, partition} from "rxjs";
import { map, filter, distinct } from 'rxjs/operators';
type Area = {
    key: string, // 用于优化渲染机制
    type: 'line' | 'rect' | 'circle' | 'polygon',
    points: Array<Array>,
    height: number,
    color: string,
    radius?: number,
    z: number,
};
type Mask = {
    key: string, //
    position: { x: number, y: number }, // 定位
    z: number, // z位置
    img: string, // 图片路径
    content: string, // 文字内容
    width: number,
    height: number,
    placeMoment: 'left' | 'top' | 'bottom' | 'right',
};
type Props = {
    baseImg?: string, // 底图url
    style?: HTMLElement, // 容器样式
    dataUrl?: string, // 图层数据url，为gtlf格式
    containerClass?: string, // 容器类
    children: any, // children
    allowAnyClick: boolean, // 捕获点击事件的click类型，通过event.button区分
    captureClick: boolean, // 是否捕获事件
    capturePosition: (position: Position, e: event) => null, // 捕获事件回调函数
    drawModel: 'line' | 'rect' | 'circle' | 'polygon' | 'mark' | null, // 绘制模式
    customConfig?: Object, // 配置文件
    areaList?:Array<Area>, // 区域数据
    maskList?: Array<Mask>, // 标记数据
    selectObject?: (selectObj: Object, e: event) => null, // 选择元素回调
    loadingStatus?: (err: Error, loading: boolean, percentage: number) => null, // 加载状态回调
};
type State = {
    width: number, // 场景宽度
    height: number, // 场景高度
    offset: {
        x: number, // 中心点位置
        y: number, // 中心点位置
        zoom: number, // 缩放
    },
    containerSize: {
        width: number,
        height: number,
    },
};

export default class Sketchpad extends Component<Props, State> {
    static perspective = 800;
    static defaultProps = {
        style: {},
        drawModel: undefined,
        allowAnyClick: true,
        customConfig: {},
        areaList: [],
        maskList: [],
    };
    containerRef: Object; // 容器引用
    canvasRef: Object; // canvas引用
    zBase: number; // 基础高度，避免物体沉入地平面
    renderer: WebGLRenderer; // 渲染器
    scene: Scene; // 场景
    camera: Camera; // 相机实例
    rayCaster: Raycaster; // 光线处理
    control: OrbitControls; // 视图控制器
    light: Light; // 灯光
    selectObject: Object; // 选中对象
    areaGroup: Group; // 区域对象群组
    areaGroupMap: Map; // 区域对象映射，保存的是key -> uuid
    markGroup: Group; // 标记对象数组
    lineBasicMaterial: Material; // 基础线材质
    meshMaterial: Material; // 基础棱柱材质
    meshMaterialCache: Map; // 材质缓存
    config: Object; // 配置对象
    loader: GLTFLoader; // 加载器
    // TODO 暂且使用自动动画循环,后期待优化移除动画循环
    animateId: number; // 动画循环id
    lastPosition: { // 上一次定位
        x: number,
        y: number,
    };
    positionInfo: Size;
    eventSub: Subscription;
    constructor(props) {
        super(props);
        this.state = {
            width: 1000,
            height: 800,
            offset: {
                x: 0,
                y: 0,
                zoom: 1,
            },
            containerSize: {
                width: 0,
                height: 0,
            },
        };
        this.containerRef = React.createRef();
        this.canvasRef = React.createRef();
        this.config = { ...BaseConfig, ...props.customConfig };
        this.positionInfo = { width: 0, height: 0, scrollTop: 0, scrollLeft: 0, left: 0, top: 0 };
        this.eventSub = new Subscription();
    }
    componentDidMount() {
        const canvas = this.canvasRef.current;
        if (canvas) {
            if (WebGL.isWebGL2Available()) {
                this.initWebGLContext(canvas, 2);
            } else if (WebGL.isWebGLAvailable()) {
                this.initWebGLContext(canvas, 1);
            } else {
                const warning =  WebGL.getErrorMessage(1);
                document.body.appendChild(warning);
            }
        } else {
            console.error('canvas element not exits, please check your code');
        }
    }

    // TODO 变更之后重新进行渲染,缓存优化
    componentWillReceiveProps(nextProps) {

    }

    componentWillUnmount() {
        cancelAnimationFrame(this.animateId);
        window.removeEventListener('resize', this.onResize);
        this.eventSub.unsubscribe();
    }

    initWebGLContext = (canvas, version) => {
        const { clientHeight, clientWidth, scrollLeft, scrollTop } = canvas;
        const { left, top } = canvas.getBoundingClientRect();
        this.positionInfo = { width: clientWidth, height: clientHeight, scrollLeft, scrollTop, left, top };
        this.setState({ containerSize: { width: clientWidth, height: clientHeight }});
        // 初始化渲染器
        if (version === 2) {
            this.renderer = new WebGLRenderer({ canvas, antialias: true, context: canvas.getContext('webgl2') });
        } else {
            this.renderer = new WebGLRenderer({ canvas, antialias: true });
        }
        this.renderer.setClearColor(new Color(0x000000));
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(clientWidth, clientHeight);
        // 阴影设置
        // this.renderer.shadowMap.enabled = true;
        // this.renderer.shadowMap.type = PCFSoftShadowMap;

        // 场景初始化
        this.scene = new Scene();
        this.scene.name = 'Scene';
        this.scene.background = new Color( this.config.backgroundColor );

        // 相机初始化，使用正交相机
        this.camera = new OrthographicCamera(-clientWidth/2 , clientWidth/2, clientHeight/2, -clientHeight / 2, 0.01, 2000);
        // this.camera = new PerspectiveCamera(60, clientWidth, clientHeight, 1, 10000);
        this.camera.name = 'Camera';
        // 观察视角待调整
        this.camera.position.set( 0, 0, Sketchpad.perspective );
        this.camera.lookAt( new Vector3() );

        // 灯光初始化，默认使用平行光
        this.light = new DirectionalLight(this.config.lightColor, 1);
        // TODO 阴影设置
        // this.light.castShadow = true;
        // this.light.shadowCameraVisible = true;
        // this.light.shadow.camera.near = 0.01;
        // this.light.shadow.camera.far = 2000;
        // this.light.shadow.camera.right = 15;
        // this.light.shadow.camera.left = -15;
        // this.light.shadow.camera.top	= 15;
        // this.light.shadow.camera.bottom = - 15;
        // this.light.shadow.mapSize.width = 1024;
        // this.light.shadow.mapSize.height = 1024;
        this.light.position.set(-1, -1, 1);
        // console.log(this.light);
        // TODO 调试用，待移除
        // this.cameraHelper = new CameraHelper(this.light.shadow.camera);
        // this.scene.add(this.cameraHelper);

        this.scene.add(this.light);

        // 射线初始化，用于选中物体
        this.rayCaster = new Raycaster();

        // 添加底部平面
        var geometry = new PlaneGeometry( 1000, 800 );
        var material = new MeshBasicMaterial( {color: 0xffff00, side: DoubleSide} );
        var plane = new Mesh( geometry, material );
        // plane.receiveShadow = true;
        this.scene.add( plane );


        //    z基准高度
        this.zBase = 0;

        //    基础材质
        this.lineBasicMaterial = new LineBasicMaterial({ color: this.config.objectBaseColor, opacity: 0.7, linewidth: 2, depthTest: true });
        // this.meshMaterial = new MeshBasicMaterial({ color: 0x696969,  depthTest: true, shadowSide: FrontSide, transparent: true });
        this.meshMaterial = new MeshPhongMaterial( { color: this.config.objectBaseColor, flatShading: true } );
        this.meshMaterialCache = new Map();

         // 初始化控制器
        this.control = new OrbitControls(this.camera, this.containerRef.current);
        // 控制器使用上下左右平移
        this.control.screenSpacePanning = true;

        this.scene.add(new AxesHelper(Math.max(clientHeight, clientWidth)));
        // 增加网格辅助线
        const gridHelper = new GridHelper( Math.max(clientHeight, clientWidth), 100, 0x444444, 0x888888 );
        gridHelper.rotateX(Math.PI / 2);
        this.scene.add(gridHelper);
        // 平移旋转平面
        // this.scene.rotateX(-Math.PI / 2);
        // this.scene.rotateX(Math.PI / 2);
        this.control.addEventListener('change', (e) => {
            const { target: { target } } = e;
            // 获取中心点实际位置
            // const worldVector = new Vector3(0,0,0);
            // const stadnardVector = worldVector.project(this.camera);
            // const a = this.canvasRef.current.clientWidth / 2;
            // const b = this.canvasRef.current.clientHeight / 2;
            // let x = (stadnardVector.x * a + a).toFixed(1);
            // let y = (-stadnardVector.y * b + b).toFixed(1);
            // console.log('x:', x, ' y:', y);
            // const { x: lastX = a, y: lastY = b } = this.lastPosition;
            // console.log(lastX, lastY);
            this.setState({ offset: { x: target.x, y: target.y, zoom: this.camera.zoom } });
        });

        // 初始化群组对象
        this.areaGroup = new Group();
        this.areaGroupMap = new Map();
        this.markGroup = new Group();
        this.scene.add(this.markGroup);
        this.scene.add(this.areaGroup);
        // 初始化gtlf
        this.loader = new GLTFLoader();
        this.loadGtlf(this.props);
        this.renderer.render(this.scene, this.camera);
        this.update();
         //  增加窗口大小调整
        window.addEventListener('resize', this.onResize);
        console.log('aaa');
        const clickEvent = partition(fromEvent(canvas, 'click').pipe(
            map(event => {
                const { x, y } = transformCoordinateToWebgl(event, this.positionInfo);
                const vector = new Vector3(x, y, 0);
                vector.unproject(this.camera);
                vector.setZ(0);
                return { position: vector, event };
            }),
            filter(e =>
                e.position.x >= -this.state.width / 2 &&
                e.position.x <= this.state.width / 2 &&
                e.position.y >= -this.state.height / 2 &&
                e.position.y <= this.state.height)
        ), () => this.props.captureClick);
        this.eventSub.add(.subscribe(x =>                 console.log('vector:', x)));
    };

    // 加载gtlf文件
    loadGtlf = (props: Props) => {
        const { dataUrl, loadingStatus, areaList, maskList } = props;
        this.lastPosition = {};
        this.drawAreas(areaList);
        this.renderMarks(maskList);
        if (dataUrl) {
            this.loader.load(dataUrl, gltf => {
                console.log(gltf);
                loadingStatus(null, false, 100);
                // TODO 加载流程待继续优化
                // this.scene.add(gltf.scene);
                this.drawAreas(areaList);
                this.renderMarks(maskList);
            }, xhr => {
                console.log( xhr.loaded / xhr.total * 100 + '% loaded' );
                const percentage = ( xhr.loaded / xhr.total * 100 ) || 0;
                loadingStatus(null, true, percentage);
            }, err => {
                loadingStatus(err, false);
            })
        }
    };

    //  重设场景宽高
    onResize = () => {
        const canvas = this.canvasRef.current;
        if (!canvas) {
            throw new Error("can't get canvas element!");
        }
        const { clientHeight, clientWidth, scrollLeft, scrollTop } = canvas;
        const { left, top } = canvas.getBoundingClientRect();
        this.positionInfo = { width: clientWidth, height: clientHeight, scrollLeft, scrollTop, left, top };
        if (this.camera && this.renderer) {
            this.camera.left = clientWidth / -2;
            this.camera.right = clientWidth / 2;
            this.camera.top = clientHeight / 2;
            this.camera.bottom = clientWidth / -2;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(clientWidth, clientHeight);
            this.renderer.render(this.scene, this.camera);
        }
    };

    // 更新整个场景函数
    update = () => {
        this.animateId = requestAnimationFrame(this.update);
        this.control.update();
        // this.cameraHelper.update();
        this.renderer.render(this.scene, this.camera);
    };

    // 绘制区域
    drawAreas = areas => {
        this.areaGroupMap.clear();
        // 内存释放
        this.areaGroup.children.forEach( item => {
            item.geometry.dispose();
        });
        this.areaGroup.remove(this.areaGroup.children);

        for (const area of areas) {
            const object = this.drawGraph(area);
            // 产生阴影
            object.castShadow = true;
            object.receiveShadow = true;
            // TODO 缓存机制，待确认使用
            // const uuid = _Math.generateUUID();
            // object.material = item.material;
            // object.userData.uuid = uuid;
            this.areaGroup.add(object);
            // this.areaGroupMap.set(uuid, object.uuid);
        }
    };

    // 绘制单个图形
    drawGraph = (area: Area) => {
        const { width: sWidth, height: sHeight } = this.state;
        const { type, points, height, color, radius, z = this.zBase } = area;
        const path = generatePath(type,
            transformCoordinateSys(this.positionInfo, { width: sWidth, height: sHeight }, points.map(point => ({ x: point[0], y: point[1] }))).map(item => {
                const { x, y } = item;
                const vector = new Vector3(x, y, 0);
                vector.unproject(this.camera);
                vector.setZ(0);
                return vector;
            }),
            radius);
        const material = this.getMeshMaterial(color);
        const object3d = new Mesh(new ExtrudeBufferGeometry(path, { ...this.config.extrudeSettings, depth: parseFloat(height) + this.zBase }), material);
        object3d.position.setZ(parseFloat(z || 0));
        // 阴影代码，暂且不开
        // object3d.castShadow = true;
        object3d.userData = { ...area };
        return object3d;
    };

    // 缓存材质对象
    getMeshMaterial = (color: string) => {
      let result = this.meshMaterialCache.get(color);
      if (!result) {
          result = new MeshPhongMaterial({ ...this.config.meshMaterialPara, color });
          this.meshMaterialCache.set(color, result);
      }
      return result;
    };

    // 自定义图层渲染
    renderChildren = (children: any) => {
        console.log(children);
        const { width, height, offset: { x, y, zoom }} = this.state;
        const { clientHeight = 0, clientWidth = 0 } = this.canvasRef.current || {};
        const childProps = {
            containerSize: { width: clientWidth, height: clientHeight },
            sceneSize: { width, height },
            offset: { x, y },
            zoom
        };
        return React.Children.map(children, child => {
            console.log(child.type.isCustomItems);
            if(child.type && child.type.isCustomItems ) {
                return React.cloneElement(child, { ...child.props, ...childProps });
            } else {
                return null;
            }
        });
    };

    // 绘制poi
    renderMarks = (marks: Array<Mark>) => {
        // 内存释放
        this.markGroup.children.forEach( item => {
            item.geometry.dispose();
        });
        this.markGroup.remove(this.markGroup.children);

        for (const mark of marks) {
            generateTextMark(mark, this.renderMark);
        }
    };

    // TODO 异步操作可能会发生下一次刷新的问题，需要进一步优化
    // 异步渲染poi
    renderMark  = (canvas, mask) => {
        const { width: sWidth, height: sHeight } = this.state;
        const { position, z, width, height } = mask;
        if(this.props.maskList.indexOf(mask) === -1) {
            return false;
        }
        const texture = new Texture(canvas);
        texture.needsUpdate = true;
        const mark = new Sprite(new SpriteMaterial({ map: texture, color: 0xffffff, transparent:true, depthTest: false }));
        const { x, y } = transformCoordinateSys(this.positionInfo, { width: sWidth, height: sHeight }, [position])[0];
        const vector = new Vector3(x, y, 0);
        vector.unproject(this.camera);
        vector.setZ(this.zBase + z);
        mark.position.copy(vector);
        mark.scale.set(width,height,1);
        this.markGroup.add(mark);
    };
    render() {
        const { style = {}, containerClass = '', children } = this.props;
        const containerStyle = {  width: '100%', height: '100%', ...style, perspective: Sketchpad.perspective, position: 'absolute'};
        return <div ref={this.containerRef} className={`sketchpadContainers ${containerClass}`} style={containerStyle}>
            <canvas ref={this.canvasRef} className="canvasContent" style={{ width: '100%', height: '100%' }}>
                Please use browser support canvas!
            </canvas>
            {/*{this.renderChildren(children)}*/}
        </div>;
    }
}
