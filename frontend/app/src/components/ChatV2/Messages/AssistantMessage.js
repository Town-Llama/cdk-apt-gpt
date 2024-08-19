import ReactMarkdown from 'react-markdown';
import { useSelector } from 'react-redux';
import remarkGfm from 'remark-gfm';

import PropertyPreview from '../../PropertyPreview/PropertyPreview';

const AssistantMessage = ({ msg, image = null, component = null, displayProperties = [], shouldPreview = true }) => {

  const df = useSelector(state => state.df);

  const chosenApts = [];
  df.comparingIndices.forEach(i => {
    chosenApts.push(df.payload[i])
  });

  let previewApts = [];
  if (displayProperties.length === 0) {
    previewApts = chosenApts.map((apt, index) => {
      const data = { ...apt, index: df.comparingIndices[index] };
      return (
        <PropertyPreview
          apt={data}
          key={index}
        />
      );
    });
  } else {
    previewApts = displayProperties.map((apt, index) => {
      return (
        <PropertyPreview
          apt={apt}
          key={index}
        />
      );
    });
  }

  const showComponent = component !== null;
  const showPreviews = !showComponent && shouldPreview && image === null;

  return (
    <div className="flex items-start mb-6">
      <div className="w-8 h-8 message-bubble rounded-full flex items-center justify-center text-white mr-4">TL</div>
      <div className="flex-1" style={{ padding: "1px", borderRadius: "10px", background: "linear-gradient(to right, #0099ff, #0062ff)" }}>
        <div style={{ backgroundColor: "#fff", borderRadius: "9px", padding: "1vw" }}>
          <p className="mb-4 text-grey-100" style={{
            textAlign: "left",
            marginLeft: "1vw",
            padding: "1vw",
            paddingBottom: "10vw",
            color: "grey",
            marginBottom: "0px"
          }}>Town Llama</p>
          <div className="mb-4" style={{ textAlign: "left", fontSize: "16px" }}>
            <ReactMarkdown remarkPlugins={remarkGfm}>{msg}</ReactMarkdown>
          </div>
          {image !== null && (
            <div className="aspect-w-16 aspect-h-9">
              <img src={image} alt="Aspect Ratio" className="object-cover w-full h-full" />
            </div>
          )}
          {showComponent ? (
            component
          ) : null}
          {chosenApts.length > 0 && showPreviews ? (
            <div className="overflow-x-auto whitespace-nowrap space-x-4">
              {previewApts}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default AssistantMessage;
