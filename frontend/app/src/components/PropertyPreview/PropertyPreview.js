import { useDispatch } from "react-redux";
import { updateDFIndex } from "../../store/actions/dfActions";
import { trackButtonClick } from "../utils/analytics";
import { useAuth0 } from "@auth0/auth0-react";

const PropertyPreview = ({ apt, preferredName = null }) => {

  const dispatch = useDispatch();
  const { user } = useAuth0();

  const showDetails = (i) => {
    trackButtonClick("PropertyPreview", user.sub);
    dispatch(updateDFIndex(i));
  }

  const price = apt.price ? parseFloat(apt.price) : parseFloat(apt.rent_12_month_monthly);
  const image = apt.photosarray === undefined ? apt.image : JSON.parse(apt.photosarray)[0].url;

  const displayName = preferredName === null ? apt.barname : preferredName;

  return (
    <div key={apt.index} className="bg-white rounded-lg overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg group relative" onClick={() => showDetails(apt.index)}>
      <div className="relative">
        {/* <img src={image} alt={displayName} className="w-full h-32 object-cover" /> */}
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