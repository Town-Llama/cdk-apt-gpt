import React from 'react';
import { SearchBox } from '@mapbox/search-js-react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth0 } from '@auth0/auth0-react';

import { advance } from '../utils/ChatFlow';
import { trackFilledInput } from '../utils/analytics';

const MAPBOX_ACCESS_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

const CustomSearchBox = ({ accessToken, ...otherProps }) => {

  return (
    <div style={{width: "75%", margin: "auto"}}>
      <SearchBox
        accessToken={accessToken}
        popoverOptions={{
          placement: 'top-start',
          flip: false,
          offset: [0, 8],
        }}
        theme={{
          variables: {
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxShadow: 'none',
          },
          cssText: `
            .mapboxgl-ctrl-geocoder {
              width: 100% !important;
              max-width: none !important;
              box-shadow: none !important;
            }
            .mapboxgl-ctrl-geocoder--suggestion-title,
            .mapboxgl-ctrl-geocoder--suggestion-address {
              text-align: left;
            }
            .mapboxgl-ctrl-geocoder--list {
              position: absolute;
              bottom: 100%;
              left: 0;
              right: 0;
              margin-bottom: 10px;
              background-color: white;
              border-radius: 4px;
              box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
            }
            .mapboxgl-ctrl-geocoder--input {
              padding: 10px;
            }
          `,
        }}
        {...otherProps}
      />
    </div>
  );
};

export default function MapSearchInput() {
    const dispatch= useDispatch();

    const {
      user
    } = useAuth0();

    const df = useSelector(state=>state.df);
    const chatState = useSelector(state=>state.chat);

  const handleRetrieve = (result) => {
    trackFilledInput("MapSearchInput", user.sub)
    const { coordinates } = result.features[0].geometry;
    const {name} = result.features[0].properties;
    console.log(Object.keys(chatState.commuteAddress).length, chatState.commuteAddress, df);
    const twop = Object.keys(chatState.commuteAddress).length == 0 ? df : null;
    dispatch(advance(name, twop, chatState.chatState, [coordinates[1], coordinates[0]]));
  };

  return (
    <CustomSearchBox
      accessToken={MAPBOX_ACCESS_TOKEN}
      onRetrieve={handleRetrieve}
      options={{
        country: 'US',
        types: 'address'
      }}
      value=""
    />
  );
}