// src/admin/components/ContentManager.jsx

import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';
import api from '../services/api';
import ModuleModal from './ModuleModal';
import ModuleCard from './ModuleCard';
import TopicTable from './TopicTable';
import CardTable from './CardTable';
import { FaArrowLeft } from 'react-icons/fa';
import './ContentManager.css';

const ContentManager = () => {
  const [modules, setModules] = useState([]);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [currentModule, setCurrentModule] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedTopicWithCards, setSelectedTopicWithCards] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchModules = async () => {
    setLoading(true);
    try {
      const data = await api.getModules();
      setModules(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch modules. Please try again.');
      setLoading(false);
    }
  };

  const fetchCardsForTopic = async (topicId) => {
    setLoading(true);
    try {
      const data = await api.getTopic(topicId);
      setSelectedTopicWithCards(data);
    } catch (err) {
      setError('Failed to fetch cards. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handleShowModuleModal = (module = null) => {
    setCurrentModule(module);
    setShowModuleModal(true);
  };
  
  const handleDeleteModule = async (id) => {
    if (window.confirm("Are you sure you want to delete this module and all its content?")) {
      await api.deleteModule(id);
      fetchModules();
      setSelectedModule(null);
      setSelectedTopic(null);
    }
  };

  const handleSelectTopic = (topic) => {
    setSelectedTopic(topic);
    fetchCardsForTopic(topic._id);
  };

  const handleBackToModules = () => {
    setSelectedModule(null);
    setSelectedTopic(null);
    setSelectedTopicWithCards(null);
  };

  const handleBackToTopics = () => {
    setSelectedTopic(null);
    setSelectedTopicWithCards(null);
  };

  if (loading) {
    return <Spinner animation="border" className="d-block mx-auto mt-5" />;
  }
  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!selectedModule) {
    return (
      <>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="page-title">Content Manager</h2>
          <Button variant="primary" onClick={() => handleShowModuleModal(null)}>
            + Add Module
          </Button>
        </div>
        <div className="modules-grid">
          <Row xs={1} md={2} lg={3} className="g-4">
            {modules.map(module => (
              <Col key={module._id}>
                <ModuleCard
                  module={module}
                  setSelectedModule={setSelectedModule}
                  handleEdit={() => handleShowModuleModal(module)}
                  handleDelete={() => handleDeleteModule(module._id)}
                />
              </Col>
            ))}
          </Row>
        </div>
        <ModuleModal 
          show={showModuleModal} 
          handleClose={() => setShowModuleModal(false)} 
          module={currentModule} 
          fetchModules={fetchModules} 
        />
      </>
    );
  }

  if (selectedModule && !selectedTopic) {
    return (
      <>
        <Button variant="link" onClick={handleBackToModules} className="mb-3 p-0 back-button">
          <FaArrowLeft className="me-2" /> Back to Modules
        </Button>
        <TopicTable
          module={selectedModule}
          fetchModules={fetchModules}
          setSelectedTopic={handleSelectTopic}
        />
      </>
    );
  }

  if (selectedTopic && selectedTopicWithCards) {
    return (
      <>
        <Button variant="link" onClick={handleBackToTopics} className="mb-3 p-0 back-button">
          <FaArrowLeft className="me-2" /> Back to Topics
        </Button>
        <CardTable
          topic={selectedTopicWithCards}
          fetchModules={fetchModules}
        />
      </>
    );
  }

  return null;
};

export default ContentManager;