import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from "@auth0/auth0-react";
import { useForm, Controller } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { Range } from 'react-range';
import { useDropzone } from 'react-dropzone';

import AptGptUtility from '../utils/API/AptGptUtility';
import { updateDFPayload } from '../../store/actions/dfActions';
import { updateFormDataPayload } from '../../store/actions/formDataActions';
import { setRecHash } from "../../store/actions/recActions";
import { clearChat } from '../../store/actions/chatActions';
import { advance } from '../utils/ChatFlow';
import { trackButtonClick, trackFilledInput } from '../utils/analytics';
import FriendPhoneForm from '../FriendPhoneForm/FriendPhoneForm';
import "./FormV2.css";

const ApartmentSearch = ({ onRequestClose, showLoading }) => {
    const dispatch = useDispatch();
    const { register, handleSubmit, watch, control, setValue, formState: { errors } } = useForm({
        defaultValues: {
            rent_range: [1000, 2000],
            neighborhood: 0,
            city: ''
        }
    });
    const [cities, setCities] = useState([]);
    const [neighborhoods, setNeighborhoods] = useState([]);
    const [notSure, setNotSure] = useState(false);
    const [textQueryAsk, setTextQueryAsk] = useState('');
    const [photosQuerySemantics, setPhotosQuerySemantics] = useState('');
    const [bedrooms, setBedrooms] = useState('');
    const [searchOption, setSearchOption] = useState('text');
    const [uploadedImage, setUploadedImage] = useState(null);
    const [askForRecs, setAskForRecs] = useState(false);
    const [formError, setFormError] = useState('');


    const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();

    const onDrop = useCallback(acceptedFiles => {
        const file = acceptedFiles[0];
        setUploadedImage(file);
        trackFilledInput('FormV2_Image_Upload', isAuthenticated ? user.sub : null);
    }, [isAuthenticated, user]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: 'image/*',
        multiple: false
    });

    const handleSearchOptionChange = (option) => {
        setSearchOption(option);
        trackButtonClick(`FormV2_SearchOption_${option}`, isAuthenticated ? user.sub : null);
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setValue("ask", textQueryAsk);
        setValue("semantic", photosQuerySemantics);

        // Validation checks
        if (!watch("city")) {
            setFormError('Please select a city.');
            return;
        }
        // if (!watch("neighborhood") && !notSure) {
        //     console.log(watch("neighborhood"), 'ok')
        //     setFormError('Please select a neighborhood or check "I am not sure yet".');
        //     return;
        // }
        if (searchOption === 'text' && textQueryAsk === '') {
            setFormError('Please enter your apartment preferences.');
            return;
        }
        if (searchOption === 'semantic' && !photosQuerySemantics === '') {
            setFormError('Please enter your photo search criteria.');
            return;
        }
        if (searchOption === 'image' && !uploadedImage) {
            setFormError('Please upload an image.');
            return;
        }

        setFormError('');
        trackButtonClick("FormV2_search", user.sub);
        handleSubmit(handleFormSubmit)(e);
    };

    const callAPI = async (data) => {
        const client = new AptGptUtility(getAccessTokenSilently, isAuthenticated, user);
        return await client.datas_search(data);
    };

    const handleFormSubmit = async (data) => {
        let coordinatesArr = neighborhoods[data.neighborhood].coordinates;
        data.distance = "5";

        const [minRent, maxRent] = data.rent_range;

        const df = await showLoading(callAPI, {
            max_distance: parseFloat(data.distance),
            min_rent: minRent,
            max_rent: maxRent,
            coordinates: { "lat": coordinatesArr[0], "lng": coordinatesArr[1] },
            ask: data.ask,
            semantic: data.semantic,
            city: data.city,
            bedrooms: data.bedrooms,
            image: uploadedImage
        });

        dispatch(updateDFPayload(df));
        dispatch(setRecHash(null));
        dispatch(clearChat());

        let newFormData = {
            city: data.city,
            coordinates: { "lat": coordinatesArr[0], "lng": coordinatesArr[1] },
            rent_range: data.rent_range,
            distance: data.distance,
            ask: data.ask,
            bedrooms: data.bedrooms,
            image: uploadedImage
        };

        dispatch(updateFormDataPayload(newFormData));
        dispatch(advance(null, df, "COMMUTE"));
        onRequestClose();
    };

    useEffect(() => {
        if (isAuthenticated && cities.length === 0) {
            const fetchCities = async () => {
                const client = new AptGptUtility(getAccessTokenSilently, isAuthenticated, user);
                const cityList = await client.datas_cities();
                setCities(cityList);
            };
            fetchCities();
        }
    }, [isAuthenticated, getAccessTokenSilently, user, cities.length]);

    const handleCityChange = async (e) => {
        const selectedCity = e.target.value;
        setValue("city", selectedCity);
        if (selectedCity) {
            trackFilledInput('FormV2_City', isAuthenticated ? user.sub : null);
        }

        const client = new AptGptUtility(getAccessTokenSilently, isAuthenticated, user);
        const neighborhoodsList = await client.datas_neighborhoods(selectedCity);
        setNeighborhoods(neighborhoodsList);
    };

    const handleNeighborhoodChange = (e) => {
        const selectedNeighborhood = e.target.value;
        if (selectedNeighborhood) {
            trackFilledInput('FormV2_Neighborhood', isAuthenticated ? user.sub : null);
        }
    };

    const handleBedroomsChange = (e) => {
        setBedrooms(e.target.value);
        if (e.target.value) {
            trackFilledInput('FormV2_Bedrooms', isAuthenticated ? user.sub : null);
        }
    };

    const handleRentRangeChange = (values) => {
        setValue("rent_range", values);
        trackFilledInput('FormV2_Rent_Range', isAuthenticated ? user.sub : null);
    };

    const handleTextQueryAskChange = (e) => {
        setTextQueryAsk(e.target.value);
        if (e.target.value) {
            trackFilledInput('FormV2_Apartment_Features', isAuthenticated ? user.sub : null);
        }
    };

    const handlePhotosQuerySemanticsChange = (e) => {
        setPhotosQuerySemantics(e.target.value);
        if (e.target.value) {
            trackFilledInput('FormV2_Apartment_Semantics', isAuthenticated ? user.sub : null);
        }
    };

    const handleFriendFormSubmit = (friendsData) => {
        // Handle the submission of friends' data

        // You can add logic here to send this data to your backend or perform any other necessary actions
        setAskForRecs(false);  // Close the friend form after submission
        onRequestClose();  // Close the apartment search form
    };

    if (askForRecs) {
        return <FriendPhoneForm onSubmit={handleFriendFormSubmit} />;
    }

    return (
        <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold gradient-text mb-4">Hello{isAuthenticated ? " " + user.given_name : ""},</h2>
            <p className="text-xl mb-6">Find Your Best Home!</p>
            <form onSubmit={onSubmit} className="space-y-6">
                {formError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <span className="block sm:inline">{formError}</span>
                    </div>
                )}
                <div>
                    <label className="block text-gray-700 font-bold mb-2">City*</label>
                    <select
                        {...register("city", { required: true })}
                        onChange={handleCityChange}
                        className={`w-full border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.city ? 'border-red-500' : ''}`}
                    >
                        <option value="">Select a city</option>
                        {cities.map((city, index) => (
                            <option key={index} value={city}>{city}</option>
                        ))}
                    </select>
                    {errors.city && <span className="text-red-500 text-sm">This field is required</span>}
                </div>

                {watch("city") && (
                    <div>
                        <label className="block text-gray-700 font-bold mb-2">
                            Which neighborhood are you interested in?*
                        </label>
                        <select
                            {...register("neighborhood", { required: !notSure })}
                            onChange={handleNeighborhoodChange}
                            className={`w-full border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.neighborhood ? 'border-red-500' : ''}`}
                            disabled={notSure}
                        >
                            {neighborhoods.map((neighborhood, index) => (
                                <option key={index} value={index}>{neighborhood.name}</option>
                            ))}
                        </select>
                        <div className="mt-2 flex items-center">
                            <input
                                {...register("notsure")}
                                type="checkbox"
                                checked={notSure}
                                onChange={(e) => {
                                    setNotSure(e.target.checked);
                                    if (e.target.checked) {
                                        setValue("neighborhood", "");
                                    }
                                }}
                                className="mr-2"
                            />
                            <label>I am not sure yet.</label>
                        </div>
                        {errors.neighborhood && !notSure && <span className="text-red-500 text-sm">Please select a neighborhood or check "I am not sure yet"</span>}
                    </div>
                )}

                <div>
                    <label className="block text-gray-700 font-bold mb-2">Number of Bedrooms</label>
                    <input
                        {...register("bedrooms")}
                        type="number"
                        placeholder="Enter the number of bedrooms..."
                        className="w-full border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={bedrooms}
                        onChange={handleBedroomsChange}
                    />
                </div>

                <div>
                    <label className="block text-gray-700 font-bold mb-2">Rent Range</label>
                    <div className="px-2">
                        <Controller
                            name="rent_range"
                            control={control}
                            render={({ field }) => (
                                <Range
                                    step={50}
                                    min={500}
                                    max={10000}
                                    values={field.value}
                                    onChange={(values) => handleRentRangeChange(values)}
                                    renderTrack={({ props, children }) => (
                                        <div
                                            {...props}
                                            className="h-3 w-full bg-gray-200 rounded-md range-track"
                                            style={{
                                                background: `linear-gradient(to right, lightgrey ${100 * (field.value[0] - 500) / (10000 - 500)}%, blue ${100 * (field.value[0] - 500) / (10000 - 500)}%, blue ${100 * (field.value[1] - 500) / (10000 - 500)}%, lightgrey ${100 * (field.value[1] - 500) / (10000 - 500)}%)`
                                            }}
                                        >
                                            {children}
                                        </div>
                                    )}
                                    renderThumb={({ props }) => (
                                        <div
                                            {...props}
                                            className="range-thumb h-6 w-6 rounded-full shadow"
                                        />
                                    )}
                                />
                            )}
                        />
                    </div>
                    <div className="flex justify-between text-gray-700 mt-2">
                        <span>{`Min: $${watch("rent_range")[0]}`}</span>
                        <span>{`Max: $${watch("rent_range")[1]}`}</span>
                    </div>
                </div>

                <div>
                    <label className="block text-gray-700 font-bold mb-2">What do you want in your home?*</label>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
                        <button
                            type="button"
                            className={`flex-1 py-2 px-4 rounded-full ${searchOption === 'text' ? 'message-bubble text-white' : 'bg-gray-200'}`}
                            onClick={() => handleSearchOptionChange('text')}
                        >
                            Search by Text
                        </button>
                        <button
                            type="button"
                            className={`flex-1 py-2 px-4 rounded-full ${searchOption === 'image' ? 'message-bubble text-white' : 'bg-gray-200'}`}
                            onClick={() => handleSearchOptionChange('image')}
                        >
                            Search by Image
                        </button>
                        <button
                            type="button"
                            className={`flex-1 py-2 px-4 rounded-full ${searchOption === 'semantic' ? 'message-bubble text-white' : 'bg-gray-200'}`}
                            onClick={() => handleSearchOptionChange('semantic')}
                        >
                            Search in Photos
                        </button>
                    </div>
                    {searchOption === 'text' ? (
                        <input
                            {...register("ask", { required: searchOption === 'text' })}
                            type="text"
                            placeholder="Pet friendly, luxury building..."
                            className={`w-full border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.ask ? 'border-red-500' : ''}`}
                            value={textQueryAsk}
                            onChange={handleTextQueryAskChange}
                        />
                    ) : searchOption === 'semantic' ? (
                        <input
                            {...register("semantic", { required: searchOption === 'semantic' })}
                            type="text"
                            placeholder="Loft, in-unit laundry, balcony..."
                            className={`w-full border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.semantic ? 'border-red-500' : ''}`}
                            value={photosQuerySemantics}
                            onChange={handlePhotosQuerySemanticsChange}
                        />
                    ) : (
                        <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} ${errors.image ? 'border-red-500' : ''}`}
                        >
                            <input {...getInputProps()} />
                            {uploadedImage ? (
                                <div>
                                    <p>Image uploaded: {uploadedImage.name}</p>
                                    <img src={URL.createObjectURL(uploadedImage)} alt="Uploaded" className="mt-2 max-h-40 mx-auto" />
                                </div>
                            ) : (
                                <p>{isDragActive ? "Drop the image here" : "Drag 'n' drop an image here, or click to select one"}</p>
                            )}
                        </div>
                    )}
                    {((searchOption === 'text' && errors.ask) || (searchOption === 'semantic' && errors.semantic) || (searchOption === 'image' && !uploadedImage)) &&
                        <span className="text-red-500 text-sm">This field is required</span>
                    }
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="message-bubble text-white rounded-full py-2 px-4 flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 mr-2">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                        Search
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ApartmentSearch;