// src/admin/components/TopicTable.jsx

import React, { useState } from 'react';
import { Table, Button, Card, ButtonGroup } from 'react-bootstrap';
import api from '../services/api';
import TopicModal from './TopicModal';
import { FaPlus, FaEye, FaEdit, FaTrashAlt } from 'react-icons/fa';

const TopicTable = ({ module, fetchModules, setSelectedTopic }) => {
  const [show, setShow] = useState(false);
  const [currentTopic, setCurrentTopic] = useState(null);

  const handleShow = (topic = null) => {
    setCurrentTopic(topic);
    setShow(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this topic and all its cards?")) {
      await api.deleteTopic(id);
      fetchModules();
    }
  };

  return (
    <Card className="shadow-sm border-0 rounded-3">
      <Card.Header className="d-flex justify-content-between align-items-center bg-white py-3 border-bottom-0">
        <h5 className="mb-0 text-dark">Topics for "{module.title}"</h5>
        <Button variant="primary" size="sm" onClick={() => handleShow(null)}>
          <FaPlus className="me-1" /> Add Topic
        </Button>
      </Card.Header>
      <Card.Body className="p-0">
        <Table responsive hover className="mb-0">
          <thead className="bg-light">
            <tr>
              <th className="py-3 ps-4">Order</th>
              <th className="py-3">Title</th>
              <th className="text-end py-3 pe-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {module.topics.map(topic => (
              <tr key={topic._id}>
                <td className="align-middle ps-4">{topic.topicOrder}</td>
                <td className="align-middle">{topic.title}</td>
                <td className="text-end align-middle pe-4">
                  <ButtonGroup size="sm">
                    <Button variant="outline-primary" onClick={() => setSelectedTopic(topic)}>
                      <FaEye />
                    </Button>
                    <Button variant="outline-warning" onClick={() => handleShow(topic)}>
                      <FaEdit />
                    </Button>
                    <Button variant="outline-danger" onClick={() => handleDelete(topic._id)}>
                      <FaTrashAlt />
                    </Button>
                  </ButtonGroup>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
      <TopicModal 
        show={show} 
        handleClose={() => setShow(false)} 
        topic={currentTopic} 
        moduleId={module._id} 
        fetchModules={fetchModules} 
      />
    </Card>
  );
};
export default TopicTable;