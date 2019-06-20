/**
 * @author:lpf
 * @flow
 * webgl环境配置文件
 * */

const BaseConfig = {
  backgroundColor: 0xffffff, // 背景色
  // perspective: 500, // 摄像机高度，内部使用,暂不暴露
  objectBaseColor: 0x696969, // 材质基础颜色
  objectSelectedColor: 0xff0000, // 选中对象颜色
  lightColor: 0xffffff, // 灯光颜色
  extrudeSettings: {
    steps: 1,
    depth: 100,
    curveSegments: 100,
    bevelEnabled: true,
  }, // 拉伸参数
  meshMaterialPara: {
    color: 0x696969,
    flatShading: true,
  }, // 材质参数
};
export default BaseConfig;
