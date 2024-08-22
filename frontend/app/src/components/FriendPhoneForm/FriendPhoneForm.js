import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useAuth0 } from '@auth0/auth0-react';

import AptGptUtility from '../utils/API/AptGptUtility';

const FriendPhoneForm = ({ onSubmit }) => {
  const { register, control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      friends: [{ phone: '' }]
    }
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "friends"
  });
  const [isMobile, setIsMobile] = useState(false);

  const {
    user,
    isAuthenticated,
    getAccessTokenSilently
} = useAuth0();

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      setIsMobile(/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase()));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const onFormSubmit = (data) => {
    onSubmit(data.friends);
  };

  const sendSMS = async (phone) => {
    const client = new AptGptUtility(getAccessTokenSilently, isAuthenticated, user);
    let response = await client.datas_waitlist_record(phone);
    const message = encodeURIComponent(`Hey! I'm using this cool apartment search app and thought you might like it too! Check it out: https://townllama.ai`);
    window.open(`sms:${phone}?body=${message}`);

  };

  return (
    // <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Get Insights From Reviews</h2>
        <p className="mb-4">To have Town Llama look through building reviews, please recommend Town Llama to 3 of your friends</p>
        <form onSubmit={handleSubmit(onFormSubmit)}>
          {fields.map((field, index) => (
            <div key={field.id} className="mb-4">
              <div className="flex items-center space-x-2">
                <input
                  {...register(`friends.${index}.phone`, { 
                    required: "Phone number is required",
                    pattern: {
                      value: /^\d{10}$/,
                      message: "Please enter a valid 10-digit phone number"
                    }
                  })}
                  placeholder="Phone Number (10 digits)"
                  className="w-full p-2 border rounded"
                />
                {isMobile && (
                  <button 
                    type="button" 
                    onClick={() => sendSMS(field.phone)}
                    className="bg-green-500 text-white rounded py-1 px-2 text-sm"
                  >
                    Send Invite
                  </button>
                )}
              </div>
              {errors.friends?.[index]?.phone && <span className="text-red-500 text-sm">{errors.friends[index].phone.message}</span>}
              {index > 0 && (
                <button type="button" onClick={() => remove(index)} className="mt-2 text-red-500">
                  Remove
                </button>
              )}
            </div>
          ))}
          <button 
            type="button" 
            onClick={() => append({ name: '', phone: '' })} 
            className="mb-4 text-blue-500"
          >
            Add Another Friend
          </button>
          {/* <button 
            type="submit" 
            className="w-full bg-blue-500 text-white rounded-full py-2 px-4 hover:bg-blue-600"
          >
            Send and Continue
          </button> */}
        </form>
      </div>
    // </div>
  );
};

export default FriendPhoneForm;
