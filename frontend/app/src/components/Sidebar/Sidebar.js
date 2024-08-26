import { useAuth0 } from "@auth0/auth0-react";
import { LogIn, LogOut, MessageCircle, PlusCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { trackButtonClick } from "../utils/analytics";
import AptGptUtility from "../utils/API/AptGptUtility";

const Sidebar = ({ isOpen, handleDrawerToggle }) => {

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
    const client = new AptGptUtility(
      getAccessTokenSilently,
      isAuthenticated,
      user
    );
    const res = await client.datas_previouschat(data.conversationid);
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

  const loadImageEmbeddingModel = async () => {
    const client = new AptGptUtility(
      getAccessTokenSilently,
      isAuthenticated,
      user
    );

    const model_status = await client.datas_modelTwo();
    return model_status;
  }

  const loadDescrEmbeddingModel = async () => {
    const client = new AptGptUtility(
      getAccessTokenSilently,
      isAuthenticated,
      user
    );

    const model_status = await client.datas_modelOne();
    return model_status;
  }

  const click = () => {
    trackButtonClick("Sidebar_newSearch", user.sub);
    handleDrawerToggle();
    isOpen();
  };

  return (
    <div
      className={`h-screen bg-gray-900 text-white flex flex-col transition-transform ${isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
    >
      <div className="flex-grow overflow-y-auto">
        <h1 className="text-2xl font-bold mb-6">
          Town Llama
          <span className="ml-2 px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded-full">BETA</span>
        </h1>
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
