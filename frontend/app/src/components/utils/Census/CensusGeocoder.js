import { CensusResult } from './CensusResult';
import axios from 'axios';


export class CensusGeocoder {
  constructor(format = 'json') {
    this.format = format;
  }

  url = (benchmark, address) => {
    return 'https://corsproxy.io/?' + encodeURIComponent(
        'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address='+address+'&format='+this.format+'&benchmark='+benchmark);
  }

  getCensusResult = async (url, take) => {
    const response = await axios.get(url);
    if (response.status === 200) {
      const data = response.data;
      let parsedResults = data.result.addressMatches.map((result) => {
        const lat = result.coordinates.x;
        const lng = result.coordinates.y;
        return new CensusResult(lat, lng, result.addressComponents, result.matchedAddress);
      });
      return parsedResults.slice(0, take);
    } else {
      throw new Error('API call to Census failed.');
    }
  }

  async geocode(street, city, postalCode, take = 1) {
    const address = `${street}, ${city} ${postalCode}`;
    let benchmark1 = 2020;
    let benchmark2 = 4;
    try {
      let result = await this.getCensusResult(this.url(benchmark1, address), take);
      console.log(result, "CSR");
      if (result.length == 0) {
        result = await this.getCensusResult(this.url(benchmark2, address), take);
      }
      return result;
    } catch (error) {
      console.error(error);
      throw new Error('Error thrown in call to Census');
    }
  }
}

