import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import ReactDOM from 'react-dom';
import PropertyPreview from '../PropertyPreview/PropertyPreview'; // Adjust the path as necessary

/**
 * MapComponent
 * 
 * Renders a MapBox map with markers on specific coordinates.
 * 
 * @param {Array<Array<number>>} markerCoordinates - Array of [latitude, longitude] pairs for markers
 */
const MapComponent = ({ apts }) => {
  const mapContainerRef = useRef(null);

  useEffect(() => {
    if (!apts || apts.length === 0) {
      return; // Don't try to create the map if there are no coordinates
    }

    const initMap = async () => {
      // Set mapbox token
      mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

      // Create map
      const map = new mapboxgl.Map({
        container: mapContainerRef.current, // container ID
        style: 'mapbox://styles/mapbox/streets-v11', // style URL
        center: [-97.733330, 30.266666], // default starting position [lng, lat]
        zoom: 10 // initial zoom, will be adjusted later
      });

      // Add markers
      const colors = ['#ff69b4', '#33cc33', '#6666ff', '#ff9966', '#cc33cc'];
      apts.forEach((a, index) => {
        const marker = new mapboxgl.Marker({
          color: colors[index % colors.length], // cycle through colors
          draggable: false,
          scale: 1.5, // make markers larger
        })
          .setLngLat([a.longitude, a.latitude])
          .addTo(map);

        // Add popup on marker click
        marker.getElement().addEventListener('click', (e) => {
          const popup = new mapboxgl.Popup()
            .setLngLat([a.longitude, a.latitude])
            .setHTML(a.buildingname) // Use setDOMContent to attach the React component
            .addTo(map);
            e.stopPropagation();
        });
      });

      // Autozoom to fit all markers
      map.on('load', () => {
        const bounds = new mapboxgl.LngLatBounds();
        apts.forEach((a) => {
          bounds.extend([a.longitude, a.latitude]);
        });
        map.fitBounds(bounds, {
          padding: 50
        });
      });
    };

    initMap();
  }, [apts]);

  return (
    <div ref={mapContainerRef} style={{
      height: '400px', // adjust to your desired height
      width: '100%', // adjust to your desired width
      border: '1px solid black' // add a border to contain the map
    }} />
  );
};

export default MapComponent;
