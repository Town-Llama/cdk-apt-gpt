import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from "react-redux";

import { CensusGeocoder } from '../utils/Census/CensusGeocoder';
import CommuteMap from '../CommuteMap/CommuteMap';
import { updateDFIndex } from '../../store/actions/dfActions';
import { advance } from '../utils/ChatFlow';

const CommuteCalculation = ({apts}) => {

    const dispatch = useDispatch();
    const commuteAddress = useSelector(state => state.chat.commuteAddress);
    const df = useSelector(state=>state.df);
    const [address, setAddress] = useState({
        street: commuteAddress?.street,
        city: commuteAddress?.city,
        zip: commuteAddress?.zip
    });

    useEffect(()=>{
        process();
    }, [commuteAddress]);

    function formatNumber(number) {
        if (!isFinite(number)) {
            return 'Invalid number';
        }
    
        const [integerPart, fractionalPart] = number.toString().split('.');
    
        let formattedNumber = integerPart;
    
        if (fractionalPart) {
            formattedNumber += '.' + fractionalPart.slice(0, 1);
        } 
    
        return formattedNumber;
    }

    const process = async () => {
        let tempDestination = {};
        if ( Object.keys(commuteAddress).length > 0 ) {
            tempDestination = await getCoordinates();
        }
    }

    const showDetails = (i) => {
        dispatch(updateDFIndex(i));
      }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setAddress(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const getCoordinates = async () => {
        try {
            const geocoder = new CensusGeocoder();
            const censusResults = await geocoder.geocode(address.street, address.city, address.zip);
            return censusResults[0];
        } catch (e) {
            // cloudWatchMetrics.emitErrorMetric('FormV2', 'getCoordinates');
            // await cloudWatchMetrics.writeLog(
            //     "Error in getCoordiantes() user {"+JSON.stringify(user)+
            //     "} targetLocation {"+JSON.stringify(targetLocation)+"}");
            throw e;
        }
      };

    const handleAddressSubmit = async (e) => {
        e.preventDefault();
        let coords = await getCoordinates();
        dispatch(advance(address.street, df, "POI_SEARCH", [coords["lat"], coords["lng"]]));
        // Dispatch an action to save the address
    };

    if (Object.keys(commuteAddress).length === 0) {
        return (
            <form onSubmit={handleAddressSubmit} className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md">
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="street">
                        Street Address:
                    </label>
                    <input
                        type="text"
                        name="street"
                        id="street"
                        value={address.street}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="city">
                        City:
                    </label>
                    <input
                        type="text"
                        name="city"
                        id="city"
                        value={address.city}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="zip">
                        Zip Code:
                    </label>
                    <input
                        type="text"
                        name="zip"
                        id="zip"
                        value={address.zip}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                </div>
                <div className="flex items-center justify-between">
                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                        Submit
                    </button>
                </div>
            </form>
        );
    }

    return (
        <div>
            <CommuteMap
                start={[parseFloat(apts[0].latitude), parseFloat(apts[0].longitude)]}
                end={[commuteAddress[0], commuteAddress[1]]}
            />
        </div>
    );

}

export default CommuteCalculation;
