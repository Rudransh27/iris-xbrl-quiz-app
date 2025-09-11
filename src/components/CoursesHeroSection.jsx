import React from 'react';
import { Link } from 'react-router-dom'; 
import './CoursesHeroSection.css';
import ModuleCardEach from './ModuleCardEach'; 

// Dummy data structured according to your Mongoose Module schema
const dummyModules = [
  {
    _id: '1',
    imageUrl: 'https://res.cloudinary.com/daug1ayvk/image/upload/v1754421241/backgroundimage_ruuvxk.png',
    title: 'Introduction to iFile',
    description: 'Learn the fundamentals of XBRL, the global standard for exchanging business information using iFile.',
    department: 'ifile',
  },
  {
    _id: '2',
    imageUrl: 'https://res.cloudinary.com/daug1ayvk/image/upload/v1754421241/backgroundimage_ruuvxk.png',
    title: 'Getting Started with iDEAL',
    description: 'A comprehensive guide to creating and managing financial data reports with confidence using iDEAL.',
    department: 'ideal',
  },
  {
    _id: '3',
    imageUrl: 'https://res.cloudinary.com/daug1ayvk/image/upload/v1754421241/backgroundimage_ruuvxk.png',
    title: 'Using Carbon for Compliance',
    description: 'Master techniques for data analysis and ensure compliance using our Carbon tool.',
    department: 'carbon',
  },
  {
    _id: '4',
    imageUrl: 'https://res.cloudinary.com/daug1ayvk/image/upload/v1754421241/backgroundimage_ruuvxk.png',
    title: 'iFile Advanced Features',
    description: 'Understand the key regulatory frameworks and how to ensure compliance using advanced iFile features.',
    department: 'ifile',
  },
];

export default function CoursesHeroSection() {
  return (
    <section className="courses-hero-section">
      <div className="courses-hero-background-shapes">
        <div className="course-shape shape--circle-green"></div>
        <div className="course-shape shape--square-blue"></div>
        <div className="course-shape shape--triangle-pink"></div>
      </div>
      
      <div className="courses-hero-content">
        <div className="courses-hero-header">
          {/* Changed from h1 to h2 and updated text */}
          <h2 className="courses-hero-title">Explore Our Learning Paths</h2>
          <p className="courses-hero-subtitle">
            Find the perfect module to start your journey to mastery.
          </p>
        </div>
        <div className="courses-grid">
          {dummyModules.map((module) => (
            <ModuleCardEach 
              key={module._id}
              title={module.title}
              description={module.description}
              imageUrl={module.imageUrl}
              department={module.department}
              onClick={() => console.log(`Module ${module.title} clicked!`)}
            />
          ))}
        </div>
        <div className="courses-actions">
          <Link to="/modules" className="all-courses-btn">All Courses</Link>
        </div>
      </div>
    </section>
  );
}