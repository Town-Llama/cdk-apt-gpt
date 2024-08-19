import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import AptGptUtility from "../../utils/API/AptGptUtility";
import { advance } from "../../utils/ChatFlow";
import InputBar from "./InputBar";

const ChatArea = ({ showLoading }) => {
  const dispatch = useDispatch();
  const df = useSelector((state) => state.df);
  const chat = useSelector((state) => state.chat);
  const form_data = useSelector((state) => state.formData);

  const [message, setMessage] = useState("");

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
      console.log("ai", chat.openAINotation);
      data = await client.chat_next(
        [...chat.openAINotation, { role: "user", content: message }],
        chat.conversationId
      );
      // openAINotation we want to make sure it has all the data it needs
      // quite frankly, the user shouldn't be able to talk to the bot yet, so we can hold off on assembling all of that data until
      // THIS moment
      // the key then is making sure all the relevant data is in the chat object
    }
    dispatch(advance(message, df, chat.chatState, data));
    setMessage("");
  };

  useEffect(() => {
    //this is happening multiple times >> fix this
    if (chat.chatState === "BEGIN") {
      dispatch(advance(null, df, chat.chatState));
    }
  }, []);

  return (
    <div id="chat" className="flex flex-col overflow-y-auto">
      <div className="flex-grow p-6 overflow-y-auto">
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
