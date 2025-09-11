import React from 'react';
import './HeroImage.css';

const HeroImage = () => {
  return (
    <div className="hero-image-container">
      <img
        src="https://res.cloudinary.com/daug1ayvk/image/upload/v1754421241/backgroundimage_ruuvxk.png"
        alt="Data processing illustration"
        className="hero-image"
      />
    </div>
  );
};

export default HeroImage;