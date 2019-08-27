/**
 * @author:lpf
 *
 * */
// import debounce from 'lodash/debounce';
function Clusters(options) {
  this.cluster_x = options.x;
  this.cluster_y = options.y;
  this.childrens = [];
}

Clusters.prototype.addPoint = function (point) {
  this.childrens.push(point);
};
Clusters.prototype.getSize = function () {
  return this.childrens.length;
};
Clusters.prototype.clear = function () {
  this.childrens = [];
  this.cluster_x = null;
  this.cluster_y = null;
};
Clusters.prototype.getDistance = function (point) {
  // console.log(point);
  if (!point || this.cluster_x === null || this.cluster_y === null) {
    return Number.MAX_SAFE_INTEGER;
  }
  // eslint-disable-next-line no-restricted-properties,no-bitwise
  return ~~Math.sqrt(Math.pow(point.x - this.cluster_x, 2) + Math.pow(point.y - this.cluster_y, 2));
};

export default function MarkerCluster(options) {
  this.gridSize = options.gridSize || 60;
  this.minClusterSize = options.minClusterSize || 2;
  this.points = [];
  this.clusters = [];
}

MarkerCluster.prototype.addMarker = function (markers) {
  if (Array.isArray(markers)) {
    this.points = [].concat(markers);
  } else {
    this.points.push(markers);
  }
  // this.resetClusters();
};

MarkerCluster.prototype.clear = function () {
  this.points = [];
  this.clusters.forEach(item => item.clear());
  this.clusters = [];
};

// MarkerClusterer.prototype.resetClusters = debounce(() => {
//
// }, 1000);


MarkerCluster.prototype.initClusters = function () {
  const len = this.points.length;
  this.clusters.forEach(item => item.clear());
  this.clusters = [];
  if (!len) {
    return;
  }
  const clusterInit = new Clusters({ x: this.points[0].x, y: this.points[0].y });
  clusterInit.addPoint(this.points[0]);
  this.clusters.push(clusterInit);
  const round = Math.sqrt(2 * Math.pow(this.gridSize / 2, 2));
  for (let i = 1; i < len; i++) {
    let minDistanceCluster = null;
    let minDistance = null;
    for (let j = 0; j < this.clusters.length; j++) {
      const distance = this.clusters[j].getDistance(this.points[i]);
      // console.info(distance);
      if (distance < round) {
        if (!minDistanceCluster) {
          minDistanceCluster = this.clusters[j];
        } else if (distance < minDistance) {
          minDistance = distance;
          minDistanceCluster = this.clusters[j];
        }
      }
    }
    if (minDistanceCluster) {
      minDistanceCluster.addPoint(this.points[i]);
    } else {
      const clusterInit = new Clusters({ x: this.points[i].x, y: this.points[i].y });
      clusterInit.addPoint(this.points[i]);
      this.clusters.push(clusterInit);
    }
  }
  this.points = [];
  for (let j = 0; j < this.clusters.length; j++) {
    if (this.clusters[j].getSize() < this.minClusterSize) {
      console.log(this.clusters[j].childrens);
      this.points = this.points.concat(this.clusters[j].childrens);
      this.clusters[j].clear();
    }
  }
  this.clusters = this.clusters.filter(item => item.getSize() >= this.minClusterSize);
  console.log(this.points);
  // this.computeCluster();
};

MarkerCluster.prototype.computeCluster = function () {
  const round = Math.sqrt(2 * Math.pow(this.gridSize / 2, 2));
  let oldLen = -1; let
    newLen = this.clusters.length;
  let points = this.points;
  while (oldLen !== newLen) {
    oldLen = newLen;
    for (let i = 0; i < points.length; i++) {
      let minDistanceCluster = null;
      let minDistance = null;
      for (let j = 0; j < this.clusters.length; j++) {
        const distance = this.clusters[j].getDistance(points[i]);
        if (distance < round) {
          if (!minDistanceCluster) {
            minDistanceCluster = this.clusters[j];
          } else if (distance < minDistance) {
            minDistance = distance;
            minDistanceCluster = this.clusters[j];
          }
        }
      }
      if (minDistanceCluster) {
        minDistanceCluster.addPoint(points[i]);
      } else {
        const cluster = new Clusters({ x: points[i].x, y: points[i].y });
        cluster.addPoint(points[i]);
        this.clusters.push(cluster);
      }
    }
    for (let j = 0; j < this.clusters.length; j++) {
      if (this.clusters[j].getSize() < this.minClusterSize) {
        points = points.concat(this.clusters[j].childrens);
        this.clusters[j].clear();
      }
    }
    newLen = this.clusters.length;
  }

  this.points = [];
  for (let j = 0; j < this.clusters.length; j++) {
    if (this.clusters[j].getSize() < this.minClusterSize) {
      this.points = this.points.concat(this.clusters[j].childrens);
      this.clusters[j].clear();
    }
  }
  this.clusters = this.clusters.filter(item => item.getSize() >= this.minClusterSize);
};
