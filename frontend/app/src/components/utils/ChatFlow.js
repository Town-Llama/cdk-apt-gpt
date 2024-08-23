import { v4 as uuidv4 } from 'uuid';
import { addOpenAINotation, addReactNotation, clearChat, dialogue, setChatState, setCommuteAddress, setConversationId, setPoiArr } from '../../store/actions/chatActions';
import { updateComparingIndices } from '../../store/actions/dfActions';
import ApartmentTableV2 from '../ApartmentTable/ApartmentTableV2';
import AssistantMessage from '../ChatV2/Messages/AssistantMessage';
import UserMessage from '../ChatV2/Messages/UserMessage';

export const advance = (msg, df, chatState, response = null) => async (dispatch) => {

  switch (chatState) {
    case "BEGIN":
      const randomNumber = Math.floor(Math.random() * 4) + 1;
      dispatch(addReactNotation(
        <AssistantMessage
          key="welcome-am"
          msg={"Hi! I'm Town Llama! I'm here to help you find an apartment you'll love! Open the sidebar and click 'new search' to start looking!"}
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
    case "ANYTHING":
      const displayProperties = [];
      for (let i = 0; i < df.comparingIndices.length; i++) {
        let name = df.payload[df.comparingIndices[i]].buildingname.toLowerCase();
        if (response.data.toLowerCase().includes(name)) {
          displayProperties.push({
            ...df.payload[df.comparingIndices[i]],
            index: df.comparingIndices[i]
          });
        }
      }

      dispatch(dialogue(
        { role: "user", content: msg },
        <UserMessage msg={msg} />,
        { role: "assistant", content: response.data },
        <AssistantMessage key="response-am" msg={response.data} displayProperties={displayProperties} />
      ))
      dispatch(setConversationId(response.conversation_id));
      // State remains as ANYTHING
      break;
    case "COMMUTE":
      dispatch(clearChat());
      let index = 0;
      const chosenIndices = [];

      //handling when the df is == 0
      if (df.length == 0) {
        dispatch(addReactNotation(
          <AssistantMessage
            key="no-results-am"
            msg={"Based on your criteria, I didn't see anything that was a good match, let's try again"}
            image={`/maps.webp`}
          />
        ));
        return;
      }

      while (chosenIndices.length < 4) {
        let possibleApt = df[index];
        let matched = false;
        for (let i = 0; i < chosenIndices.length; i++) {
          let indexedLat = parseFloat(df[chosenIndices[i]].latitude);
          let indexedLng = parseFloat(df[chosenIndices[i]].longitude);
          let possibleLat = parseFloat(possibleApt.latitude);
          let possibleLng = parseFloat(possibleApt.longitude);
          if (indexedLat === possibleLat && indexedLng === possibleLng) {
            matched = true;
          }
        }
        if (!matched) {
          chosenIndices.push(index);
        }
        index++;
      }
      dispatch(updateComparingIndices(chosenIndices)); // Show the top 4
      dispatch(addOpenAINotation({
        role: "system",
        content: "[Inst]You are a helpful AI Assistant. You are helping the user find an apartment. Give your responses in markdown. Below is data about the ones they're considering.[/Inst]"
      }));
      dispatch(addOpenAINotation({
        role: "system",
        content: buildJsonPromptData(df.slice(0, 4))
      }));
      dispatch(addReactNotation(
        <AssistantMessage
          key="report-am"
          msg={"Based on your criteria, I generated the below report with some recommendations."}
          component={<ApartmentTableV2 />}
        />
      ));
      dispatch(addReactNotation(
        <AssistantMessage
          key="commute-am"
          msg={"Let's estimate your commute. Give me a street address to compare the commute times."}
          shouldPreview={false}
        />
      ));
      chatState = "POI_SEARCH";
      dispatch(setChatState(chatState));
      const uniqueId = uuidv4();
      dispatch(setConversationId(uniqueId));
      break;
    case "POI_SEARCH":
      dispatch(setCommuteAddress(response)); // response is [lat, lng]
      dispatch(addReactNotation(
        <UserMessage msg={msg} />
      ));
      if (df !== null) {
        dispatch(addReactNotation(
          <AssistantMessage
            key="nearby-am"
            msg={"Let's find interesting places nearby. What types of stores and places of interest would you like to?"}
            shouldPreview={false}
          />
        ));
        chatState = "REPORT_FOLLOWUP";
      } else {
        dispatch(addReactNotation(
          <AssistantMessage
            key="got-it-am"
            msg={"You got it! Updated to show commute to " + msg}
            shouldPreview={false}
          />
        ));
        chatState = "ANYTHING";
      }
      dispatch(setChatState(chatState));
      break;
    case "REPORT_FOLLOWUP":
      dispatch(addReactNotation(
        <UserMessage msg={msg} />
      ));
      dispatch(setPoiArr(response))
      dispatch(addReactNotation(
        <AssistantMessage
          key="thanks-am"
          msg={"Great! Added those to your report! We can talk more here or you can click on an apartment to get more in-depth information"}
          shouldPreview={true}
        />
      ));
      chatState = "ANYTHING";
      dispatch(setChatState(chatState));
      break;
    default:
      // Handle unknown states
      break;
  }
};

const buildJsonPromptData = (arr) => {
  const columnMapping = {
    rent_12_month_monthly: "rent",
    description: "property_description",
    buildingname: "buildingname",
    distance: "Distance from Neighborhood",
    area: "square_feet",
    beds: "beds",
    baths: "baths",
  };

  const translatedData = [];
  for (let i = 0; i < arr.length; i++) {
    const mappedData = {};
    let data = arr[i];
    for (const key in data) {
      if (columnMapping[key]) {
        mappedData[columnMapping[key]] = data[key];
      }
    }
    translatedData[i] = mappedData;
  }

  return JSON.stringify(translatedData);
};
