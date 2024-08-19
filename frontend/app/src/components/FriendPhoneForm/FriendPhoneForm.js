import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';

const FriendPhoneForm = ({ onSubmit }) => {
  const { register, control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      friends: [{ name: '', phone: '' }]
    }
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "friends"
  });
  const [isMobile, setIsMobile] = useState(false);

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

  const sendSMS = (phone, name) => {
    const message = encodeURIComponent(`Hey ${name}, I'm using this cool apartment search app and thought you might like it too! Check it out: [Your App URL]`);
    window.open(`sms:${phone}?body=${message}`);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">You've Reached Your Max Searches</h2>
        <p className="mb-4">To get unlimited searches, please recommend Town Llama to your friends</p>
        <form onSubmit={handleSubmit(onFormSubmit)}>
          {fields.map((field, index) => (
            <div key={field.id} className="mb-4">
              <input
                {...register(`friends.${index}.name`, { required: "Name is required" })}
                placeholder="Friend's Name"
                className="w-full p-2 border rounded mb-2"
              />
              {errors.friends?.[index]?.name && <span className="text-red-500 text-sm">{errors.friends[index].name.message}</span>}
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
              {errors.friends?.[index]?.phone && <span className="text-red-500 text-sm">{errors.friends[index].phone.message}</span>}
              {isMobile && (
                <button 
                  type="button" 
                  onClick={() => sendSMS(field.phone, field.name)}
                  className="mt-2 bg-green-500 text-white rounded py-1 px-2 text-sm"
                >
                  Send SMS Invite
                </button>
              )}
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
          <button 
            type="submit" 
            className="w-full bg-blue-500 text-white rounded-full py-2 px-4 hover:bg-blue-600"
          >
            Submit and Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default FriendPhoneForm;