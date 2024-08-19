import React, { useState } from 'react';
import styles from './Accordion.module.css'; // Ensure this file includes the new accordion styles

const Accordion = ({ title, children, defaultToOpen=false }) => {
  const [isOpen, setIsOpen] = useState(defaultToOpen);

  const toggleAccordion = () => setIsOpen(!isOpen);

  return (
    <div className={styles.accordion}>
      <button 
        className={`${styles.accordionHeader} ${isOpen ? styles.open : ''}`} 
        onClick={toggleAccordion}
      >
        {title}
        <span className={`${styles.icon} ${isOpen ? styles.rotate : ''}`}>▼</span>
      </button>
      {isOpen && <div className={styles.accordionBody}>{children}</div>}
    </div>
  );
};

export default Accordion;
