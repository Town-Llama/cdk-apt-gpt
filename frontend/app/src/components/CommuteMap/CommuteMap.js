import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxClient from '@mapbox/mapbox-sdk/services/directions';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

if (!MAPBOX_TOKEN) {
  throw new Error("Mapbox token is missing. Please check your environment variables.");
}

mapboxgl.accessToken = MAPBOX_TOKEN;

const CommuteMap = ({ start, end }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const startMarker = useRef(null);
  const endMarker = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [routeInfo, setRouteInfo] = useState({ distance: 0, duration: 0 });

  useEffect(() => {
    if (map.current) return; // Initialize map only once

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [(start[1] + end[1]) / 2, (start[0] + end[0]) / 2], // Center between start and end
        zoom: 10 // Start with a wider view
      });

      map.current.on('load', () => {
        setMapLoaded(true);
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  }, [start, end]);

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const directionsClient = MapboxClient({ accessToken: MAPBOX_TOKEN });

    const getRoute = async () => {
      try {
        const response = await directionsClient.getDirections({
          profile: 'driving',
          geometries: 'geojson',
          waypoints: [
            { coordinates: [start[1], start[0]] },
            { coordinates: [end[1], end[0]] }
          ]
        }).send();

        if (!response.body || !response.body.routes || response.body.routes.length === 0) {
          throw new Error("No route found in the response");
        }

        const route = response.body.routes[0].geometry.coordinates;
        const { distance, duration } = response.body.routes[0];

        setRouteInfo({
          distance: (distance * 0.000621371).toFixed(2), // Convert to miles and round to 2 decimal places
          duration: formatDuration(duration) // Format duration in minutes and seconds
        });

        const geojson = {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: route
          }
        };

        if (map.current.getSource('route')) {
          map.current.getSource('route').setData(geojson);
        } else {
          map.current.addLayer({
            id: 'route',
            type: 'line',
            source: {
              type: 'geojson',
              data: geojson
            },
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#3887be',
              'line-width': 5,
              'line-opacity': 0.75
            }
          });
        }

        // Add start marker
        if (startMarker.current) {
          startMarker.current.setLngLat([start[1], start[0]]);
        } else {
          startMarker.current = new mapboxgl.Marker({ color: 'green' })
            .setLngLat([start[1], start[0]])
            .addTo(map.current);
        }

        // Add end marker
        if (endMarker.current) {
          endMarker.current.setLngLat([end[1], end[0]]);
        } else {
          endMarker.current = new mapboxgl.Marker({ color: 'red' })
            .setLngLat([end[1], end[0]])
            .addTo(map.current);
        }

        // Fit the map to include both markers and the route
        const bounds = new mapboxgl.LngLatBounds()
          .extend([start[1], start[0]])
          .extend([end[1], end[0]]);
        route.forEach(coord => bounds.extend(coord));

        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15
        });

      } catch (error) {
        console.error('Error fetching or displaying route:', error);
      }
    };

    getRoute();
  }, [start, end, mapLoaded]);

  return (
    <>
      <div ref={mapContainer} style={{ width: '100%', height: '400px' }} />
      <div>
        <p>Estimated Distance: <span className='gradient-text'>{routeInfo.distance} miles</span></p>
        <p>Estimated Commute Time: <span className='gradient-text'>{routeInfo.duration}</span></p>
      </div>
    </>
  );
};

export default CommuteMap;
