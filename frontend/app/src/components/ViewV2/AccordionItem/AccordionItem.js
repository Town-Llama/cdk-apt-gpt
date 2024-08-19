import { useState } from 'react';
import {ChevronDown, ChevronUp } from 'lucide-react';

const AccordionItem = ({ title, content }) => {
    const [isOpen, setIsOpen] = useState(false);
  
    return (
      <div className="border rounded-lg">
        <div 
          className="flex justify-between items-center p-4 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <h3 className="font-semibold">{title}</h3>
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
        {isOpen && (
          <div className="p-4 border-t">
            <p>{content}</p>
          </div>
        )}
      </div>
    );
};

export default AccordionItem;