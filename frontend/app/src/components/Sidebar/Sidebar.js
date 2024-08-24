import { useAuth0 } from "@auth0/auth0-react";
import { LogIn, LogOut, MessageCircle, PlusCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { trackButtonClick } from "../utils/analytics";
import AptGptUtility from "../utils/API/AptGptUtility";

const Sidebar = ({ isOpen, handleDrawerToggle }) => {
  const dispatch = useDispatch();
  const [convos, setConvos] = useState([]);
  const chat = useSelector((state) => state.chat);
  const formData = useSelector((state) => state.formData.payload);

  const {
    isAuthenticated,
    loginWithRedirect,
    logout,
    user,
    getAccessTokenSilently,
  } = useAuth0();

  const openChat = async (data) => {
    //found
    console.log(data);
    const client = new AptGptUtility(
      getAccessTokenSilently,
      isAuthenticated,
      user
    );
    const res = await client.datas_previouschat(data.conversationid);
    console.log(res, "RES");


    // dispatch like crazy then
    // we'll need a chatflow function to bring it up to speed too (nah)

  }

  useEffect(() => {
    const process = async () => {
      const convoArr = [];
      if (isAuthenticated) {
        const client = new AptGptUtility(
          getAccessTokenSilently,
          isAuthenticated,
          user
        );
        const data = await client.datas_chats();
        let listedActive = false;
        for (let i = 0; i < data.length; i++) {
          let active = data[i].conversationid === chat.conversationId;
          listedActive = active ? active : listedActive;
          let classname =
            "flex items-center" + (active ? " gradient-text" : "");
          convoArr.push(
            <li key={"sidebar-li-" + i} className={classname} onClick={() => openChat(data[i])}>
              <MessageCircle
                color={active ? "blue" : "white"}
                size={16}
                className="mr-2"
              />
              {data[i].summary}
            </li>
          );
        }
        if (!listedActive && chat.conversationId !== null) {
          convoArr.push(
            <li key="message-circle-li" className="flex items-center gradient-text">
              <MessageCircle color={"blue"} size={16} className="mr-2" />
              {formData.ask}
            </li>
          );
        }
        if (convoArr.length === 0) {
          //welcome!
          convoArr.push(
            <li key="welcome-aptgpt-li" className="flex items-center">Welcome to AptGPT!</li>
          );
        }
        setConvos(convoArr);
      } else {
        convoArr.push(
          <li key="else-l11" className="flex items-center gradient-text">
            <MessageCircle color={"blue"} size={16} className="mr-2" />
            Pet friendly in downtown
          </li>);
        convoArr.push(
          <li key="else-li2" className="flex items-center">
            <MessageCircle size={16} className="mr-2" />
            Luxury buildings
          </li>
        );
      }
      setConvos(convoArr);
    };
    process();
  }, [isAuthenticated, chat]);


  const callAPI = async (data) => {
    const client = new AptGptUtility(getAccessTokenSilently, isAuthenticated, user);
    return await client.datas_search(data);
  };


  // Define the checkModelStatus function
  const loadImageEmbeddingModel = async () => {
    const params = {
      FunctionName: 'Lambda-image-embedding-model', // The name of the Lambda function to invoke
      InvocationType: 'RequestResponse', // Synchronous invocation
      Payload: JSON.stringify({
        body: JSON.stringify({
          'load_model': true,
        })
      }), // Pass the event received by this Lambda function to the other Lambda function
    };
    //allow it to take longer than 3 seconds on cold start
    const result = await lambda.invoke(params).promise();
    const a = JSON.parse(result.Payload);
    const b = JSON.parse(a.body);
    return b.model_status;
  }

  const loadDescrEmbeddingModel = async () => {
    const params = {
      FunctionName: 'Lambda-descr-embedding-model', // The name of the Lambda function to invoke
      InvocationType: 'RequestResponse', // Synchronous invocation
      Payload: JSON.stringify({
        body: JSON.stringify({
          'load_model': true,
        })
      }), // Pass the event received by this Lambda function to the other Lambda function
    };
    //allow it to take longer than 3 seconds on cold start
    const result = await lambda.invoke(params).promise();
    const a = JSON.parse(result.Payload);
    const b = JSON.parse(a.body);
    return b.model_status;
  }

  async function checkModelStatus() {
    // Check the status of the Image Embedding Model
    try {
      const imageModelStatus = await loadImageEmbeddingModel();
      if (imageModelStatus) {
        console.log('Image Embedding Model is ready');
      } else {
        console.log('Loading Image Embedding Model failed');
      }
    } catch (error) {
      console.error('Error checking Image Embedding Model status:', error);
    }
    // Check the status of the Description Embedding Model
    try {
      const imageModelStatus = await loadDescrEmbeddingModel();
      if (imageModelStatus) {
        console.log('Description Embedding Model is ready');
      } else {
        console.log('Loading Description Embedding Model failed');
      }
    } catch (error) {
      console.error('Error checking Description Embedding Model status:', error);
    }
  }


  const click = () => {
    trackButtonClick("Sidebar_newSearch", user.sub);
    checkModelStatus();
    handleDrawerToggle();
    isOpen();
  };

  return (
    <div
      className={`h-screen bg-gray-900 text-white flex flex-col transition-transform ${isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
    >
      <div className="flex-grow overflow-y-auto">
        <h1 className="text-2xl font-bold mb-6">Town Llama</h1>
        <button
          className="w-full message-bubble text-white py-2 rounded-md mb-6 flex items-center justify-center"
          onClick={click}
        >
          <PlusCircle size={20} className="mr-2" /> New Search
        </button>
        <div className="mb-6">
          <h2
            className="text-sm font-semibold mb-2 flex justify-between"
            style={{
              textAlign: "left",
              padding: "5px",
              backgroundColor: "#172541",
            }}
          >
            Your Previous Searches
          </h2>
          <ul className="space-y-2">{convos}</ul>
        </div>
      </div>
      <div className="mt-auto pt-4 border-t border-gray-700 bg-gray-900">
        {isAuthenticated ? (
          <button
            className="w-full text-left py-2 flex items-center"
            onClick={() => logout()}
          >
            <LogOut size={16} className="mr-2" /> Log out
          </button>
        ) : (
          <button
            className="w-full text-left py-2 flex items-center"
            onClick={() => loginWithRedirect()}
          >
            <LogIn size={16} className="mr-2" /> Log In
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
