export class CensusResult {
    constructor(lng, lat, components, matched_addr) {
      this.lng = lng;
      this.lat = lat;
      this.components = components;
      this.matched = matched_addr;
    }
  
    distanceFrom(x, y, metric = false) {
      let radiusConstant = 3959.87433;
      if (metric) {
        radiusConstant = 6372.8;
      }
  
      const dLat = degreesToRadians(x - this.lat);
      const dLon = degreesToRadians(y - this.lng);
      const lat1 = degreesToRadians(this.lat);
      const lat2 = degreesToRadians(x);
  
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.asin(Math.sqrt(a));
  
      return radiusConstant * c;
    }
  
    toString() {
      return JSON.stringify(this, null, 2);
    }
  }
  
  function degreesToRadians(degrees) {
    return (degrees * Math.PI) / 180;
  }
  