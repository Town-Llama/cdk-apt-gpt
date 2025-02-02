import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useSelector } from 'react-redux';
import remarkGfm from 'remark-gfm';

import PropertyPreview from '../../PropertyPreview/PropertyPreview';

const AssistantMessage = ({ msg, image = null, component = null, displayProperties = [], shouldPreview = true }) => {
  const df = useSelector(state => state.df);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 960);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const chosenApts = df.comparingIndices.map(i => df.payload[i]);

  const previewApts = (displayProperties.length === 0 ? chosenApts : displayProperties).map((apt, index) => (
    <PropertyPreview
      apt={{ ...apt, index: df.comparingIndices[index] }}
      key={index}
    />
  ));

  const showComponent = component !== null;
  const showPreviews = !showComponent && shouldPreview && image === null && !isSmallScreen;

  const renderers = {
    p: ({ children }) => <p className="mb-6 text-gray-700 leading-relaxed">{children}</p>,
    h2: ({ children }) => <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">{children}</h2>,
    h3: ({ children }) => <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">{children}</h3>,
    ul: ({ children }) => <ul className="list-disc list-inside mb-6 text-gray-700">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside mb-6 text-gray-700">{children}</ol>,
    li: ({ children }) => <li className="mb-2">{children}</li>,
    blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-500 pl-4 italic my-6 text-gray-600">{children}</blockquote>,
  };

  return (
    <div className={`flex ${isSmallScreen ? 'flex-col' : 'items-start'} mb-6`}>
      <div className={`w-8 h-8 message-bubble rounded-full flex items-center justify-center text-white ${isSmallScreen ? 'mb-2 self-start' : 'mr-4'}`}>
        TL
      </div>
      <div className="flex-1" style={{ padding: "1px", borderRadius: "10px", background: "linear-gradient(to right, #0099ff, #0062ff)" }}>
        <div style={{ backgroundColor: "#fff", borderRadius: "9px", padding: "1vw" }}>
          <p className="mb-4 text-grey-100" style={{
            textAlign: "left",
            marginLeft: "1vw",
            padding: "1vw",
            color: "grey",
            marginBottom: "0px",
          }}>Town Llama</p>
          <div className="mb-4" style={{ textAlign: "left", fontSize: "16px" }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={renderers}
            >
              {msg.replace(/\\n/g, '\n')}
            </ReactMarkdown>
          </div>
          {image && (
            <div className="aspect-w-16 aspect-h-9">
              <img src={image} alt="Aspect Ratio" className="object-cover w-full h-full" />
            </div>
          )}
          {showComponent && component}
          {chosenApts.length > 0 && showPreviews && (
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(chosenApts.length, 4)}, minmax(0, 1fr))` }}>
              {previewApts}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AssistantMessage;