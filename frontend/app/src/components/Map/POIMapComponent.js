import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { useSelector } from 'react-redux';

const POIMapComponent = ({ apt, pois }) => {
  const mapContainerRef = useRef(null);
  const { index, comparingIndices } = useSelector(state => state.df);
  const [poiDistances, setPoiDistances] = useState([]);

  useEffect(() => {
    if (!apt && !pois) {
      return; // Don't create the map if there are no coordinates
    }

    const initMap = async () => {
      mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [apt.longitude, apt.latitude],
        zoom: 10
      });

      const bounds = new mapboxgl.LngLatBounds();

      // Add apartment marker
      if (apt) {
        const marker = new mapboxgl.Marker({
          color: 'green', // Pink color for the apartment
          draggable: false,
          scale: 1.5,
        })
          .setLngLat([apt.longitude, apt.latitude])
          .addTo(map);

        marker.getElement().addEventListener('click', () => {
          new mapboxgl.Popup()
            .setLngLat([apt.longitude, apt.latitude])
            .setHTML(apt.buildingname)
            .addTo(map);
        });

        bounds.extend([apt.longitude, apt.latitude]);
      }

      // Add POI markers
      let key = Object.keys(pois)[0];
      let poiIndex = comparingIndices.indexOf(index);
      let poiForApt = pois[key][poiIndex];
      const newPoiDistances = [];
      poiForApt.forEach((poi) => {
        const el = document.createElement('div');
        el.className = 'poi-marker';
        el.style.backgroundImage = 'url(https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678111-map-marker-512.png)';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.backgroundSize = '100%';
        const marker = new mapboxgl.Marker(el)
          .setLngLat([poi.geometry.coordinates[0], poi.geometry.coordinates[1]])
          .addTo(map);

        marker.getElement().addEventListener('click', (e) => {
          new mapboxgl.Popup()
            .setLngLat([poi.geometry.coordinates[0], poi.geometry.coordinates[1]])
            .setHTML(poi.properties.name)
            .addTo(map);
          e.stopPropagation();
        });

        bounds.extend([poi.geometry.coordinates[0], poi.geometry.coordinates[1]]);

        // Calculate distance
        const distance = calculateDistance(
          apt.latitude,
          apt.longitude,
          poi.geometry.coordinates[1],
          poi.geometry.coordinates[0]
        );
        newPoiDistances.push({ name: poi.properties.name, distance, website: poi.properties.metadata?.website });
      });

      setPoiDistances(newPoiDistances);

      // Autozoom to fit all markers
      map.on('load', () => {
        map.fitBounds(bounds, {
          padding: 50
        });
      });
    };

    initMap();
  }, [apt, pois]);

  // Haversine formula to calculate distance between two points on Earth
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance.toFixed(2); // Return distance in km with 2 decimal places
  };

  return (
    <div className="flex flex-col md:flex-row">
      <div ref={mapContainerRef} className="h-96 md:h-[400px] w-full md:w-2/3 border border-gray-300" />
      <div className="w-full md:w-1/3 p-4 border border-gray-300 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Distances</h2>
        <ul>
          {poiDistances.map((poi, index) => (
            <li key={index} className="mb-2">
              <span className="font-semibold">
                {poi.website !== null ? (
                  <a href={poi.website}>{poi.name}</a>
                ) : (
                  poi.name
                )}
                :</span> {(0.621371 * poi.distance).toFixed(2)} miles
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default POIMapComponent;