// src/admin/components/ModuleCard.jsx

import React from 'react';
import { Card, ButtonGroup, Button } from 'react-bootstrap';
import { FaEdit, FaTrashAlt, FaEye } from 'react-icons/fa';
import './ModuleCard.css';

const ModuleCard = ({ module, setSelectedModule, handleEdit, handleDelete }) => {
  return (
    <Card className="h-100 shadow-sm rounded-3 module-card">
      <Card.Img
        variant="top"
        src={module.imageUrl || 'https://via.placeholder.com/400x200.png?text=Module+Image'}
        alt={module.title}
        className="card-img-top-cover"
      />
      <Card.Body>
        <Card.Title className="text-dark fw-bold">{module.title}</Card.Title>
        <Card.Text className="text-muted small">
          {module.description.substring(0, 100)}...
        </Card.Text>
      </Card.Body>
      <Card.Footer className="d-flex justify-content-between align-items-center bg-light border-0">
        <Button variant="outline-primary" size="sm" onClick={() => setSelectedModule(module)}>
          <FaEye className="me-1" /> View Topics
        </Button>
        <ButtonGroup size="sm">
          <Button variant="outline-warning" onClick={() => handleEdit(module)}>
            <FaEdit />
          </Button>
          <Button variant="outline-danger" onClick={() => handleDelete(module._id)}>
            <FaTrashAlt />
          </Button>
        </ButtonGroup>
      </Card.Footer>
    </Card>
  );
};
export default ModuleCard;