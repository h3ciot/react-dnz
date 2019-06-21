/**
 * @author:lpf
 * @flow
 *
 * */

function ImageCache(maxSize) {
    this.cache = new Map();
    this.cacheSize = 0;
    this.maxSize = maxSize;
}

ImageCache.prototype.constructor = ImageCache;
ImageCache.prototype.set = function(url, data){

};
