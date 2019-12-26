/**
 * @author:lpf
 * @flow
 *
 * */
function Store(data: Array<Array<number>>) {
  this.data = {};
  this.min = 0;
  this.max = 1;
  data.forEach(([x, y]) => {
    const key = `${x}:${y}`;
    let value = this.data[key];
    if (value) {
      this.data[key] = value + 1;
    } else {
      this.data[key] = 1;
    }
    value = this.data[key];
    if (value > this.max) {
      this.max = value;
    }
  });
  console.log(this.min, this.max, this.data);
}
// 设置全局透明度，在最大与最小值之间
Store.prototype.getGlobalAlpha = function(x, y) {
  const key = x + ':' + y;
  let value = this.data[key];
  value = (value- this.min) / ( this.max- this.min);
  return value < .01 ? .01 : value
};
Store.prototype.destory = function() {
  this.data = null;
  this.min = null;
  this.max = null;
};
function getPointTemplate(radius, blurFactor = 1) {
  const tplCanvas = document.createElement('canvas');
  const tplCtx = tplCanvas.getContext('2d');
  const x = radius;
  const y = radius;
  tplCanvas.width = tplCanvas.height = radius*2;
  
  // 根据模糊度来决定使用的形状，为1时为整个圆，其它为圆环
  // 矩形和圆形两种
  if (blurFactor === 1) {
    tplCtx.beginPath();
    tplCtx.arc(x, y, radius, 0, 2 * Math.PI, false);
    tplCtx.fillStyle = 'rgba(0,0,0,1)';
    tplCtx.fill();
  } else {
    const gradient = tplCtx.createRadialGradient(x, y, radius*blurFactor, x, y, radius);
    gradient.addColorStop(0, 'rgba(0,0,0,1)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    tplCtx.fillStyle = gradient;
    tplCtx.fillRect(0, 0, 2*radius, 2*radius);
  }
  return tplCanvas;
}
function RadiusTpl() {
  this.tpl = {};
}
RadiusTpl.prototype.getRadius = function(radius: number, blur: number = 1) {
  const key = radius + ':' + blur;
  if(this.tpl[key]) {
    return this.tpl[key];
  } else {
    const tpl = getPointTemplate(radius, blur);
    this.tpl[key] = tpl;
    return tpl;
  }
};
RadiusTpl.prototype.destory = function() {
  Object.keys(this.tpl).forEach(key => {
    this.tpl[key] = null;
  });
};
const RadiusTpls = new RadiusTpl();
export { Store, RadiusTpls };
