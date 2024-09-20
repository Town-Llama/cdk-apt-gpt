import { v4 as uuidv4 } from 'uuid';
import { addOpenAINotation, setDf, addReactNotation, clearChat, dialogue, setChatState, setConversationId, updateQuery, updateComparingIndices } from '../../store/actions/chatActions';
import AssistantMessage from '../ChatV2/Messages/AssistantMessage';
import UserMessage from '../ChatV2/Messages/UserMessage';
import POITable from '../POITable/POITable';

export const advance = (msg, df, chatState, response = null) => async (dispatch) => {

  switch (chatState) {
    case "BEGIN":
      const randomNumber = Math.floor(Math.random() * 4) + 1;
      dispatch(addReactNotation(
        <AssistantMessage
          key="welcome-am"
          msg={"Hi! I'm Town Llama! I'm here to help you find the best bars in Austin! Open the sidebar and click 'new search' to start looking!"}
          image={`/tl_${randomNumber}.webp`}
        />
      ));
      dispatch(addOpenAINotation({
        role: "system",
        content: "Your name is Town Llama. You are a helpful AI designed to help people find apartments. Users click 'create chat' and answer a few questions and you then recommend a few initial places. Once we have our recs, they can ask you anything about them."
      }));
      chatState = "BEGIN";
      dispatch(setChatState(chatState));
      break;
    case "SEARCH":
      console.log(msg, df, response, "SEARCH");
      dispatch(clearChat());
      dispatch(updateQuery(msg));
      dispatch(addOpenAINotation({
        role: "system",
        content: "[Inst]You are a helpful AI Assistant. You are helping the user find what they're looking for in Austin, Texas USA. Give your responses in **markdown**. System prompt has data about the options you're recommending to them[/Inst]"
      }));
      dispatch(addOpenAINotation({
        role: "system",
        content: buildJsonPromptData(df.slice(0, 4))
      }));
      dispatch(updateComparingIndices([0, 1, 2, 3]));
      dispatch(setDf(df));
      dispatch(addReactNotation(
        <AssistantMessage
          key="report-am"
          msg={"What do you think of these?"}
          component={<POITable />}
        />
      ));
      dispatch(setChatState("ANYTHING"));
      break;
    case "ANYTHING":
      const displayProperties = [];
      // for (let i = 0; i < .comparingIndices.length; i++) {
      //   let name = df.payload[df.comparingIndices[i]].buildingname.toLowerCase();
      //   if (response.data.toLowerCase().includes(name)) {
      //     displayProperties.push({
      //       ...df.payload[df.comparingIndices[i]],
      //       index: df.comparingIndices[i]
      //     });
      //   }
      // }
      dispatch(dialogue(
        { role: "user", content: msg },
        <UserMessage msg={msg} />,
        { role: "assistant", content: response.data },
        <AssistantMessage key="response-am" msg={response.data} />
      ))
      dispatch(setConversationId(response.conversation_id));
      // State remains as ANYTHING
      break;
    default:
      // Handle unknown states
      break;
  }
};

const buildJsonPromptData = (arr) => {

  const translatedData = [];
  for (let i = 0; i < arr.length; i++) {
    let data = arr[i];
    console.log("HERE WE GO", data, Object.keys(data).includes("isdrink"));
    translatedData[i] = data;
    if (translatedData[i].price == "-1.00") {
      translatedData[i].price = "Not Given";
    }
  }

  return JSON.stringify(translatedData);
};
