import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import AptGptUtility from "../../utils/API/AptGptUtility";
import { advance } from "../../utils/ChatFlow";
import InputBar from "./InputBar";
import { updateDescState, updateImgState } from "../../../store/actions/modelActions";

const ChatArea = ({ showLoading }) => {
  const dispatch = useDispatch();
  const chat = useSelector((state) => state.chat);
  const form_data = useSelector((state) => state.formData);

  const [message, setMessage] = useState("");
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  const { isAuthenticated, getAccessTokenSilently, user } = useAuth0();

  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (chat.chatState !== "POI_SEARCH") {
      scrollToBottom();
    }
  }, [chat.reactNotation]);

  const onSend = async () => {
    const client = new AptGptUtility(
      getAccessTokenSilently,
      isAuthenticated,
      user
    );
    let data;
    if (chat.chatState === "REPORT_FOLLOWUP") {
      let arr = await client.chat_pois(message);
      data = JSON.parse(arr);
    } else {
      data = await client.chat_next(
        [...chat.openAINotation, { role: "user", content: message }],
        chat.conversationId
      );
      // openAINotation we want to make sure it has all the data it needs
      // quite frankly, the user shouldn't be able to talk to the bot yet, so we can hold off on assembling all of that data until
      // THIS moment
      // the key then is making sure all the relevant data is in the chat object
    }
    dispatch(advance(message, chat.df, chat.chatState, data));
    setMessage("");
  };

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 960); // Assuming 960px is the breakpoint for md
    };

    handleResize(); // Call once to set initial state
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    initializeDescModels();
    initializeImageModels();
  }, [isAuthenticated])

  useEffect(() => {
    //this is happening multiple times >> fix this
    if (chat.chatState === "BEGIN") {
      dispatch(advance(null, chat.df, chat.chatState));
    }
  }, []);

  const initializeDescModels = async () => {
    if (!isAuthenticated) {
      return; //no need to waste a call
    }
    const client = new AptGptUtility(
      getAccessTokenSilently,
      isAuthenticated,
      user
    );

    try {
      const resOne = await client.datas_modelOne();
      console.log('Loading Description Model status: ', resOne);
      dispatch(updateDescState(resOne));
    } catch (error) {
      console.error('Error loading Description Model: ', error);
      throw error;
    };
  }

  const initializeImageModels = async () => {
    if (!isAuthenticated) {
      return; //no need to waste a call
    }
    const client = new AptGptUtility(
      getAccessTokenSilently,
      isAuthenticated,
      user
    );

    try {
      const resTwo = await client.datas_modelTwo();
      console.log('Loading Image Model status: ', resTwo);
      dispatch(updateImgState(resTwo));
    } catch (error) {
      console.error('Error loading Image Model: ', error);
      throw error;
    };
  }

  return (
    <div id="chat" className="flex flex-col overflow-y-auto">
      <div className="flex-grow p-6 overflow-y-auto" style={{
        paddingBottom: isSmallScreen ? "10vh" : null
      }}>
        <div className="max-w-7xl mx-auto">
          {chat.reactNotation}
          <div ref={chatEndRef} />
        </div>
      </div>

      <InputBar
        onSend={onSend}
        setMessage={setMessage}
        message={message}
        showLoading={showLoading}
      />
    </div>
  );
};

export default ChatArea;
