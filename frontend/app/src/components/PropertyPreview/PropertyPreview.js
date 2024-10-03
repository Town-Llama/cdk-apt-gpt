import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { updateDFIndex } from "../../store/actions/dfActions";
import { trackButtonClick } from "../utils/analytics";
import { useAuth0 } from "@auth0/auth0-react";
import AptGptUtility from "../utils/API/AptGptUtility";
import { Buffer } from 'buffer';

const PropertyPreview = ({ apt, preferredName = null }) => {

  const dispatch = useDispatch();
  const [images, setImages] = useState(null);

  const {
    isAuthenticated,
    user,
    getAccessTokenSilently,
  } = useAuth0();

  useEffect(() => {
    const process = async () => {
      const client = new AptGptUtility(
        getAccessTokenSilently,
        isAuthenticated,
        user
      );
      const data = await client.datas_fetch_apt(apt.barid);
      setImages(data.image.length ? data.image : null);
    }

    process();
  }, []);

  const showDetails = (i) => {
    trackButtonClick("PropertyPreview", user.sub);
    dispatch(updateDFIndex(i));
  }

  const price = apt.price ? parseFloat(apt.price) : parseFloat(apt.rent_12_month_monthly);

  const displayName = preferredName === null ? apt.barname : preferredName;

  const imgSrc = images === null ? "/maps.webp" : "data:image/" + images[0].filetype + ";base64," + Buffer.from(images[0].image_data).toString('base64');

  return (
    <div key={apt.index} className="bg-white rounded-lg overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg group relative" onClick={() => showDetails(apt.index)}>
      <div className="relative">
        <img src={imgSrc} alt={displayName} className="w-full h-32 object-cover" />
        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-40 transition-opacity duration-300"></div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="message-bubble p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white transform -rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>
      </div>
      <div className="p-2">
        <h3 className="font-semibold text-left">{displayName}</h3>
        <p className="gradient-text text-sm">
          {
            price > 0 ? (`Price: ${price.toFixed(2)}`) : (`Price not on Menu`)

          }
        </p>
      </div>
    </div>
  )
}

export default PropertyPreview;