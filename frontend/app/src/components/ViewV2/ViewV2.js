import React, { useState } from 'react';
import { MapPin, Bed, Bath, PencilRuler, ArrowLeft, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth0 } from "@auth0/auth0-react";

import { updateDFIndex } from '../../store/actions/dfActions';
import AccordionItem from './AccordionItem/AccordionItem';
import CommuteCalculation from '../CommuteCalculation/CommuteCalculation';
import AIExplanation from '../AIExplanation/AIExplanation';
import POIMapComponent from '../Map/POIMapComponent';
import { trackButtonClick } from '../utils/analytics';
import AptGptUtility from '../utils/API/AptGptUtility';

const ViewV2 = () => {
  const df = useSelector(state => state.df);
  const formData = useSelector(state => state.formData.payload);
  const chat = useSelector(state => state.chat);
  const dispatch = useDispatch();

  const [modalOpen, setModalOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const goBack = () => {
    dispatch(updateDFIndex(null))
  }

  const viewingApt = df.payload[df.index];
  let photos = JSON.parse(viewingApt.photosarray);

  const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();

  const email = async () => {
    trackButtonClick("ViewV2_Book", user.sub);
    const client = new AptGptUtility(getAccessTokenSilently, isAuthenticated, user);
    await client.datas_book(formData.ask, chat.conversationId, viewingApt.unit_id);
    alert("We got your request-- we'll send an email out as soon as we have an associate available")
  }

  const openModal = (index) => {
    setCurrentPhotoIndex(index);
    setModalOpen(true);
  }

  const closeModal = () => {
    setModalOpen(false);
  }

  const nextPhoto = () => {
    setCurrentPhotoIndex((prevIndex) => (prevIndex + 1) % photos.length);
  }

  const prevPhoto = () => {
    setCurrentPhotoIndex((prevIndex) => (prevIndex - 1 + photos.length) % photos.length);
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      nextPhoto();
    } else if (e.key === 'ArrowLeft') {
      prevPhoto();
    } else if (e.key === 'Escape') {
      closeModal();
    }
  }

  let totalRent = 0;
  let totalSqft = 0;
  let totalBath = 0;
  for (let i = 0; i < df.payload.length; i++) {
    totalRent += parseFloat(df.payload[i].rent_12_month_monthly);
    totalSqft += df.payload[i].area;
    totalBath += parseFloat(df.payload[i].baths);
  }
  const averageRent = totalRent / df.payload.length;
  const averageSqft = totalSqft / df.payload.length;
  const averageBaths = totalBath / df.payload.length;
  const name = viewingApt.buildingname === null ? viewingApt.addressstreet : viewingApt.buildingname;

  return (
    <div className="max-w-4xl mx-auto p-4 font-sans">
      <div onClick={goBack} className="cursor-pointer mb-4">
        <ArrowLeft size={24} className="text-gray-600 hover:text-gray-800" />
      </div>
      <div className="space-y-6">
        {/* Main Image */}
        <img src={photos[0].url} alt="Modern apartment" className="w-full h-64 object-cover rounded-lg cursor-pointer" onClick={() => openModal(0)} />
        
        {/* Thumbnail Images */}
        <div className="grid grid-cols-4 gap-2">
          {photos.slice(0, 4).map((photo, i) => (
            <img key={i} src={photo.url} alt={`Apartment view ${i + 1}`} className="w-full h-20 object-cover rounded cursor-pointer" onClick={() => openModal(i)} />
          ))}
        </div>
        
        {/* Apartment Details */}
        <div>
          <h1 className="text-xl font-bold mb-2">{name}</h1>
          <p className="text-2xl font-bold gradient-text mb-4">${parseFloat(viewingApt.rent_12_month_monthly).toFixed(2)}</p>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center"><Bed className="mr-2 text-blue-500" size={20} /> {viewingApt.beds == 0 ? "Studio" : viewingApt.beds + " Bedroom"}</div>
            <div className="flex items-center"><Bath className="mr-2 text-blue-500" size={20} /> {viewingApt.baths} Baths</div>
            <div className="flex items-center"><PencilRuler className="mr-2 text-blue-500" size={20} /> {viewingApt.area} sqft</div>
          </div>
          <div className="flex items-center mb-4">
            <MapPin className="mr-2 gradient-text" size={20} />
            <span className="text-sm">{viewingApt.addressstreet} {viewingApt.addresscity}, {viewingApt.addressstate} {viewingApt.addresszipcode}</span>
          </div>
          <button onClick={() => email()} className="w-full message-bubble text-white py-2 px-4 hover:bg-blue-600 transition rounded-lg">Book an appointment</button>
        </div>
        
        {/* AI Explanation */}
        <div>
          <h2 className="text-lg font-bold mb-2">AI Insights</h2>
          <p className="text-gray-600 text-sm">
            <AIExplanation 
              showOnLoad={true}
              apt={viewingApt}
            />
          </p>
        </div>
        
        {/* Commute Calculation */}
        <div>
          <h2 className="text-lg font-bold mb-2">Estimate Your Commute</h2>
          <div className="bg-gray-100 p-4 rounded-lg">
            <CommuteCalculation 
              apts={[viewingApt]}
            />
          </div>
        </div>
        
        {/* Comparison */}
        <div>
          <h2 className="text-lg font-bold mb-2">Comparison with Other {df.payload.length} Apartments</h2>
          <div className="space-y-2">
            <AccordionItem 
              title="Rent" 
              content={
                <>
                  <p>Average Rent: ${averageRent.toFixed(2)}</p>
                  <p>This Apartment: ${viewingApt.rent_12_month_monthly}</p>
                </>
              }
            />
            <AccordionItem 
              title="Square Footage" 
              content={
                <>
                  <p>Average Sqft: {parseInt(averageSqft)}</p>
                  <p>This Apartment: {viewingApt.area}</p>
                </>
              }
            />
            <AccordionItem 
              title="Baths" 
              content={
                <>
                  <p>Average Baths: {averageBaths.toFixed(1)}</p>
                  <p>This Apartment: {viewingApt.baths}</p>
                </>
              }
            />
          </div>
        </div>

        {/* Points of Interest */}
        <div>
          <h2 className="text-lg font-bold mb-2">See What's Around You</h2>
          <div className="space-y-2">
            {chat.poiArr.map((poi, i) => (
              <AccordionItem 
                key={i}
                title={poi} 
                content={
                  <POIMapComponent apt={viewingApt} pois={chat.poiData[i]} />
                }
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Photo Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={closeModal} onKeyDown={handleKeyDown} tabIndex="0">
          <div className="relative w-full h-full">
            <img src={photos[currentPhotoIndex].url} alt={`Apartment view ${currentPhotoIndex + 1}`} className="w-full h-full object-contain" />
            <button className="absolute top-4 right-4 text-white" onClick={closeModal}>
              <X size={24} />
            </button>
            <button className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white" onClick={(e) => { e.stopPropagation(); prevPhoto(); }}>
              <ChevronLeft size={36} />
            </button>
            <button className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white" onClick={(e) => { e.stopPropagation(); nextPhoto(); }}>
              <ChevronRight size={36} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewV2;