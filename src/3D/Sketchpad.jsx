/**
 * @author:lpf
 * @flow
 *
 **/
import React, { Component } from 'react';
import WebGL from './WebGL';
import BaseConfig from './BaseConfig';
import { DragControls } from './DragControls';
import {
    generatePath,
    transformCoordinateSys,
    generateTextMark,
    transformCoordinateToWebgl,
    transformWebgl
} from "./utilsFor3d";
import type { Size, Position } from "./TypeDec";
import {
    WebGLRenderer,
    Vector3,
    Scene,
    Color,
    MeshBasicMaterial,
    Mesh,
    DoubleSide,
    PlaneBufferGeometry,
    OrthographicCamera,
    ExtrudeBufferGeometry,
    Group,
    Raycaster,
    SpriteMaterial,
    Sprite,
    Texture,
    DirectionalLight,
    Material,
    MeshPhongMaterial,
    Object3D, Camera, Light, CircleBufferGeometry, AxesHelper
} from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { fromEvent, Subscription, partition } from "rxjs";
import { map, filter, distinctUntilChanged } from 'rxjs/operators';
type Area = {
    key: string, // 用于优化渲染机制
    type: 'line' | 'rect' | 'circle' | 'polygon',
    points: Array<Array>,
    height: number,
    color: string,
    radius?: number,
    z: number,
    onClick?: (e: { type: string, event: Event }) => null,
    showPoint: boolean,
};
type Mark = {
    key: string, //
    position: { x: number, y: number }, // 定位
    z: number, // z位置
    img: string, // 图片路径
    content: string, // 文字内容
    width: number,
    height: number,
    placement: 'top' | 'bottom',
    onClick?: (e: { type: string, event: Event }) => null,
    dragable: boolean,
    onDrag?: (e: { type: string, position: Position }) => null,
    onDragStop?: (e: { type: string, position: Position }) => null,
    onClick?: (e: { type: string, event: Event }) => null,
};
type Props = {
    style?: Object, // 容器样式
    dataUrl?: string, // 图层数据url，为gtlf格式
    containerClass?: string, // 容器类
    allowAnyClick: boolean, // 捕获点击事件的click类型，通过event.button区分
    capture: boolean, // 是否捕获事件
    capturePosition: (position: Position, e: Event) => null, // 捕获事件回调函数
    customConfig?: Object, // 配置文件
    areaList?:Array<Area>, // 区域数据
    markList?: Array<Mark>, // 标记数据
    loadingStatus?: (err: Error, loading: boolean, percentage: number) => null, // 加载状态回调
    model: '2d' | '3d', // 展示模式，2D模式下可进行编辑操作，3d模式下目前只能进行展示操作
};
type State = {
    // 场景宽高
    sceneSize: {
        width: number,
        height: number,
    },
    offset: {
        x: number, // 中心点位置
        y: number, // 中心点位置
        zoom: number, // 缩放
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
        capturePosition: f => f,
        model: '3d',
    };
    containerRef: Object; // 容器引用
    canvasRef: Object; // canvas引用
    zBase: number; // 基础高度，避免物体沉入地平面
    renderer: WebGLRenderer; // 渲染器
    scene: Scene; // 场景
    camera: Camera; // 相机实例
    rayCaster: Raycaster; // 光线处理
    control: OrbitControls; // 视图控制器
    dragControl: DragControls; // 拖拽控制器
    light: Light; // 灯光
    areaGroup: Group; // 区域对象群组
    markGroup: Group; // 标记对象数组
    pointGroup: Group; // 点对象
    meshMaterial: Material; // 基础棱柱材质
    pointMaterial: Material; // 基础点材质
    meshMaterialCache: Map; // 材质缓存
    config: Object; // 配置对象
    loader: GLTFLoader; // 加载器
    // TODO 暂且使用自动动画循环,后期待优化移除动画循环
    animateId: number; // 动画循环id
    positionInfo: Size;
    eventSub: Subscription;
    dataSceneUuid: string; // 底图场景
    dataUrl: string; // 底图url
    constructor(props) {
        super(props);
        this.state = {
            sceneSize: {
                width: 0,
                height: 0,
            },
            offset: {
                x: 0,
                y: 0,
                zoom: 1,
            },
        };
        this.containerRef = React.createRef();
        this.canvasRef = React.createRef();
        this.config = { ...BaseConfig, ...props.customConfig };
        this.positionInfo = { width: 0, height: 0, scrollTop: 0, scrollLeft: 0, left: 0, top: 0 };
        this.eventSub = new Subscription();
        this.dataSceneUuid = null;
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
    componentWillReceiveProps(nextProps:Props) {
        const { model, dataUrl, markList, areaList } = nextProps;
        const { model: oldModel, dataUrl: oldDataUrl, markList: oldMarkList, areaList: oldAreaList } = this.props;
        if( model !== oldModel) {
            this.scene && this.resetModel(model);
        }
        if(dataUrl !== oldDataUrl) {
            this.scene && this.loadGtlf(nextProps);
        }
        if(markList !== oldMarkList) {
            this.scene && this.renderMarks(markList);
        }
        if(areaList !== oldAreaList) {
            this.scene && this.drawAreas(areaList);
        }
    }

    // TODO 资源释放需要释放全部，避免内存溢出
    componentWillUnmount() {
        try {
            cancelAnimationFrame(this.animateId);
            window.removeEventListener('resize', this.onResize);
            this.eventSub.unsubscribe();
            this.scene.remove(...this.scene.children);
            this.clearMark();
            this.markGroup && this.markGroup.dispose();
            this.clearArea();
            this.areaGroup && this.areaGroup.dispose();
            this.control && this.control.dispose();
            const baseScene = this.scene.getObjectByProperty('uuid', this.dataSceneUuid);
            baseScene && this.clearChildren(baseScene);
            this.scene.remove(baseScene);
            const keys = this.meshMaterialCache.keys();
            for(const key of keys) {
                this.meshMaterialCache.get(key).dispose();
                this.meshMaterialCache.set(key, null);
            }
            this.meshMaterialCache.clear();
            this.meshMaterial && this.meshMaterial.dispose();
            this.pointMaterial && this.pointMaterial.dispose();
            this.clearDragControl();
            this.control && this.control.dispose();
        } catch (e) {
            throw e;
        }
    }

    // 清除mark
    clearMark = () => {
        if(this.markGroup) {
            const children = this.markGroup.children;
            this.markGroup.remove(...children);
            children.forEach( item => {
                const { onClick, onDrag, onDragStop } = item.userData;
                item.removeEventListener('click', onClick);
                item.removeEventListener('drag', onDrag);
                item.removeEventListener('dragstop', onDragStop);
                item.userData = null;
                // 资源释放
                // TODO 重用部分材质
                item.geometry && item.geometry.dispose();
                item.material.map && item.material.map.dispose();
                item.material && item.material.dispose();
            });
        }
    };

    // 清除area
    clearArea = () => {
        if(this.areaGroup) {
            const children = this.areaGroup.children;
            this.areaGroup.remove(...children);
            children.forEach( item => {
                const { onClick } = item.userData;
                item.removeEventListener('click', onClick);
                item.userData = null;
                item.geometry.dispose();
            });
        }
        if(this.pointGroup) {
            this.clearChildren(this.pointGroup);
        }
    };

    // 清除控制器
    clearDragControl = () => {
        if(this.dragControl) {
            this.dragControl.removeEventListener( 'dragstart', this.handleDragEvent);
            this.dragControl.removeEventListener('drag', this.handleDragEvent);
            this.dragControl.removeEventListener( 'dragend', this.handleDragEvent);
            this.dragControl.dispose();
            this.dragControl = null;
        }
    };

    // 递归释放资源
    clearChildren = (obj: Object3D) => {
        if (obj.geometry && obj.geometry.isGeometry) {
            obj.geometry.dispose();
        }
        if (obj.material && obj.material.isMaterial)  {
            obj.material.dispose();
        }
        if(obj.children) {
            obj.children.forEach(this.clearChildren)
            obj.remove(...obj.children);
        }
        obj.dispose && obj.dispose();
    };


    // 切换2D和3D模式
    resetModel = (model: string) => {
        if(model === '2d') {
            if(this.control) {
                this.control.enableRotate = false;
                this.control.maxPolarAngle = this.control.minPolarAngle = Math.PI / 2;
                this.control.maxAzimuthAngle = this.control.minAzimuthAngle = 0;
            }
            if (this.dragControl) {
                this.dragControl.enabled = true;
            }
        } else {
            if(this.control) {
                this.control.enableRotate = true;
                this.control.maxPolarAngle =Math.PI;
                this.control.minPolarAngle = 0;
                this.control.maxAzimuthAngle = Infinity;
                this.control.minAzimuthAngle = -Infinity;
            }
            if (this.dragControl) {
                this.dragControl.enabled = false;
            }
        }
    };

    // 初始化环境
    initWebGLContext = (canvas, version) => {
        const { clientHeight, clientWidth, scrollLeft, scrollTop } = canvas;
        const { left, top } = canvas.getBoundingClientRect();
        this.positionInfo = { width: clientWidth, height: clientHeight, scrollLeft, scrollTop, left, top };
        // 初始化渲染器
        if (version === 2) {
            this.renderer = new WebGLRenderer({ canvas, antialias: true, context: canvas.getContext('webgl2') });
        } else {
            this.renderer = new WebGLRenderer({ canvas, antialias: true });
        }
        this.renderer.setClearColor(new Color(0x000000));
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(clientWidth, clientHeight);

        // 场景初始化
        this.scene = new Scene();
        this.scene.name = 'Scene';
        this.scene.background = new Color( this.config.backgroundColor );

        // 相机初始化，使用正交相机
        this.camera = new OrthographicCamera(-clientWidth/2 , clientWidth/2, clientHeight/2, -clientHeight / 2, 0.01, 2000);
        this.camera.name = 'Camera';

        this.camera.position.set( 0, 0, Sketchpad.perspective );
        this.camera.lookAt( new Vector3() );

        // 灯光初始化，默认使用平行光
        this.light = new DirectionalLight(this.config.lightColor, 1);
        this.light.position.set(-1, -1, 1);
        this.scene.add(this.light);

        // 射线初始化，用于选中物体
        this.rayCaster = new Raycaster();

        //    z基准高度
        this.zBase = 0;

        //    基础材质
        this.meshMaterial = new MeshPhongMaterial( { color: this.config.objectBaseColor, flatShading: true } );
        this.pointMaterial = new MeshBasicMaterial({ color: 0x888888, depthTest: false });
        this.meshMaterialCache = new Map();

         // 初始化控制器
        this.control = new OrbitControls(this.camera, this.containerRef.current);
        // 控制器使用上下左右平移
        this.control.screenSpacePanning = true;
        this.scene.add(new AxesHelper(Math.max(clientHeight, clientWidth)));
        // 初始化群组对象
        this.areaGroup = new Group();
        this.markGroup = new Group();
        this.pointGroup = new Group();
        this.scene.add(this.markGroup);
        this.scene.add(this.areaGroup);
        this.scene.add(this.pointGroup);
        // 初始化gtlf
        this.loader = new GLTFLoader();
        this.loadGtlf(this.props);
        this.renderer.render(this.scene, this.camera);
        this.update();
         //  增加窗口大小调整
        window.addEventListener('resize', this.onResize);
        // 事件分流，根据是否捕获分流至两个处理函数
        const [captureEvent, clickEvent] = partition(fromEvent(canvas, 'click').pipe(
            // filter(() => this.control.enabled),         // 拖拽期间暂时关闭
            map(event => {
                const { x, y } = transformCoordinateToWebgl(event, this.positionInfo);
                const vector = new Vector3(x, y, 0);
                return { position: vector, event };
            }),
        ), e => this.props.capture && this.props.allowAnyClick && typeof e.event.button === 'number' && e.event.button === 0);
        this.eventSub.add(fromEvent(canvas, 'mousemove').pipe(
            filter( () => this.props.capture && this.props.model === '2d'),
            distinctUntilChanged((p, q) => p.clientX === q.clientX && p.clientY === q.clientY),
            map(event => {
                const { x, y } = transformCoordinateToWebgl(event, this.positionInfo);
                const vector = new Vector3(x, y, 0);
                vector.unproject(this.camera);
                vector.setZ(0);
                return { position: vector, event };
            })
        ).subscribe(this.capturePosition));
        this.eventSub.add(captureEvent.pipe(
            map(event => {
                const { position } = event;
                position.unproject(this.camera);
                position.setZ(0);
                return event;
            })
        ).subscribe(this.capturePosition));
        this.eventSub.add(clickEvent.subscribe(this.handleClick));
        this.resetModel(this.props.model);
    };

    // 将坐标转换后通过props传出
    capturePosition = ( e: { position: Position, event: Event }) => {
        if(this.props.model === '2d') {
            const { x, y } = transformWebgl(e.position, this.state.sceneSize);
            this.props.capturePosition({ x, y }, e.event);
        }
    };

    // 处理点击与选中事件
    handleClick = (e: { position: Position, event: Event }) => {
        const { position, event } = e;
        position.z = 0.5;
        this.rayCaster.setFromCamera(position, this.camera);
        const intersects = this.rayCaster.intersectObjects([].concat(this.markGroup.children).concat(this.areaGroup.children));
        if (intersects.length) {
            const [select] = intersects;
            select.object.dispatchEvent({ type: 'click', event });
        }
    };

    // 加载gtlf文件
    loadGtlf = (props: Props) => {
        const { dataUrl, loadingStatus, areaList, markList } = props;
        if (dataUrl) {
            const baseScene = this.scene.getObjectByProperty('uuid', this.dataSceneUuid);
            baseScene && this.clearChildren(baseScene);
            this.dataUrl = dataUrl;
            this.loader.load(dataUrl, gltf => {
                if(dataUrl !== this.dataUrl) {
                    return;
                }
                const { sceneSize } = gltf.asset;
                const { width, height } = sceneSize;
                const { width: cWidth, height: cHeight } = this.positionInfo;
                const zoom = Math.min(cWidth / width, cHeight / height).toFixed(2);
                this.setZoom(zoom);
                this.setState({ sceneSize });
                loadingStatus(null, false, 100);
                // TODO 加载流程待继续优化
                this.dataSceneUuid = gltf.scene.uuid;
                this.scene.add(gltf.scene);
                this.drawAreas(areaList);
                this.renderMarks(markList);
                this.addBasePlane(sceneSize);
            }, xhr => {
                if(dataUrl !== this.dataUrl) {
                    return;
                }
                const percentage = ( xhr.loaded / xhr.total * 100 ) || 0;
                loadingStatus(null, true, percentage);
            }, err => {
                if(dataUrl !== this.dataUrl) {
                    return;
                }
                const { width, height } = this.positionInfo;
                this.setZoom(1);
                this.setState({ sceneSize: { width, height } });
                this.drawAreas(areaList);
                this.renderMarks(markList);
                this.addBasePlane({ width, height });
                loadingStatus(err, false);
            })
        }else {
            const { width, height } = this.positionInfo;
            this.setZoom(1);
            this.setState({ sceneSize: { width, height } });
            this.drawAreas(areaList);
            this.renderMarks(markList);
            this.addBasePlane({ width, height });
        }
    };

    // 添加基准平面
    addBasePlane = (size: { width: number, height: number }) => {
        const planeObj = this.scene.getObjectByName('basePlane');
        if(!planeObj) {
            const geometry = new PlaneBufferGeometry( size.width, size.height );
            const material = new MeshBasicMaterial( {color: 0xffffff, side: DoubleSide } );
            const plane = new Mesh( geometry, material );
            plane.name = 'basePlane';
            plane.position.setZ(-0.5);
            // plane.receiveShadow = true;
            this.scene.add( plane );
        } else {
            const geometry = new PlaneBufferGeometry( size.width, size.height );
            planeObj.geometry.copy(geometry);
            geometry.dispose();
        }
    };

    // 调整缩放倍率
    setZoom = (zoom: number) => {
        this.camera.zoom = parseFloat(zoom);
        this.camera.updateProjectionMatrix();
    };

    //  重设场景宽高
    onResize = () => {
        const canvas = this.canvasRef.current;
        const container = this.containerRef.current;
        if (!canvas) {
            throw new Error("can't get canvas element!");
        }

        const { width, height } = container.getBoundingClientRect();
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        const { clientHeight, clientWidth, scrollLeft, scrollTop } = canvas;
        const { left, top } = canvas.getBoundingClientRect();
        this.positionInfo = { width: width, height: height, scrollLeft, scrollTop, left, top };
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
    drawAreas = (areas: Array) => {
        // 内存释放
        this.clearArea();
        for (const area of areas) {
            const { onClick } = area;
            const object = this.drawGraph(area);
            // 产生阴影
            object.castShadow = true;
            object.receiveShadow = true;
            object.userData = { ...area };
            if(onClick) {
                object.addEventListener('click', onClick);
            }
            this.areaGroup.add(object);
        }
    };

    // 绘制单个图形
    drawGraph = (area: Area) => {
        const { width: sWidth, height: sHeight } = this.state.sceneSize;
        const { type, points, height, color, radius, z = this.zBase, showPoint = false } = area;
        const zHeight = parseFloat(height) + this.zBase;
        const vectors = transformCoordinateSys(this.positionInfo,
            { width: sWidth, height: sHeight },
            points.map(point => ({ x: point[0], y: point[1] })),
            this.camera.zoom)
            .map(item => {
                const { x, y } = item;
                const vector = new Vector3(x, y, 0);
                vector.unproject(this.camera);
                vector.setZ(0);
                return vector;
            });
        if(showPoint) {
            for(const x of vectors) {
                const geometry = new CircleBufferGeometry( 5, 32 );
                const circle = new Mesh( geometry, this.pointMaterial );
                circle.position.set(x.x, x.y, zHeight + 0.5);
                this.pointGroup.add(circle);
            }

        }
        const path = generatePath(type, vectors, radius);
        const material = this.getMeshMaterial(color);
        const object3d = new Mesh(new ExtrudeBufferGeometry(path, { ...this.config.extrudeSettings, depth: zHeight }), material);
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

    // 绘制poi
    renderMarks = (marks: Array<Mark>) => {
        // 内存释放
        this.clearMark();
        this.clearDragControl();
        this.markGroup.remove(...this.markGroup.children);

        let dragCount = 0;
        for (const mark of marks) {
            generateTextMark(mark, this.renderMark);
            dragCount += mark.dragable ? 1 : 0;
        }
        if(this.markGroup.children.length || dragCount) {
            this.dragControl = new DragControls(this.markGroup.children, this.camera, this.canvasRef.current);
            this.dragControl.addEventListener( 'dragstart', this.handleDragEvent);
            this.dragControl.addEventListener('drag', this.handleDragEvent);
            this.dragControl.addEventListener( 'dragend', this.handleDragEvent);
            this.dragControl.enabled = this.props.model === '2d';
        }
    };

    // 统一回调drag事件
    handleDragEvent = (e: { type: string, object: Object3D } ) => {
        const { type, object } = e;
        if (type !== 'dragend') {
            this.control.enabled = false;
        } else {
            // 延迟至下一轮事件循环放开视图控制器，避免传出点击事件
            setTimeout(() => this.control.enabled = true, 0);
        }
        const { x, y } = transformWebgl(object.position, this.state.sceneSize);
        object.dispatchEvent( { type, position: { x, y } });
    };

    // TODO 异步操作可能会发生下一次刷新的问题，需要进一步优化
    // 异步渲染poi
    renderMark  = (canvas, mark) => {
        const { width: sWidth, height: sHeight } = this.state.sceneSize;
        const { position, z, width, height, onClick, dragable, onDrag, onDragStop } = mark;
        if(this.props.markList.indexOf(mark) === -1) {
            return false;
        }
        const texture = new Texture(canvas);
        texture.needsUpdate = true;
        const markObj = new Sprite(new SpriteMaterial({ map: texture, color: 0xffffff, transparent:true, depthTest: false }));
        const { x, y } = transformCoordinateSys(this.positionInfo, { width: sWidth, height: sHeight }, [position], this.camera.zoom)[0];
        const vector = new Vector3(x, y, 0);
        vector.unproject(this.camera);
        vector.setZ(this.zBase + z);
        markObj.position.copy(vector);
        markObj.scale.set(width,height,1);
        markObj.userData = { ...mark };
        if(onClick) {
            markObj.addEventListener('click', onClick);
        }
        if(dragable) {
            markObj.addEventListener('drag', onDrag);
            markObj.addEventListener('dragend', onDragStop);
        }
        this.markGroup.add(markObj);
    };
    render() {
        const { style = {}, containerClass = '' } = this.props;
        const containerStyle = {  width: '100%', height: '100%', ...style, perspective: Sketchpad.perspective, position: 'absolute'};
        return <div ref={this.containerRef} className={`sketchpadContainers ${containerClass}`} style={containerStyle}>
            <canvas ref={this.canvasRef} className="canvasContent" style={{ width: '100%', height: '100%' }}>
                Please use browser support canvas!
            </canvas>
        </div>;
    }
}
