// src/admin/components/CardTable.jsx

import React, { useState } from 'react';
import { Table, Button, Card, ButtonGroup, Badge } from 'react-bootstrap';
import api from '../services/api';
import CardModal from './CardModal';
import { FaPlus, FaEdit, FaTrashAlt } from 'react-icons/fa';

const CardTable = ({ topic, fetchModules }) => {
  const [show, setShow] = useState(false);
  const [currentCard, setCurrentCard] = useState(null);

  const handleShow = (card = null) => {
    setCurrentCard(card);
    setShow(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this card?")) {
      await api.deleteCard(id);
      fetchModules();
    }
  };

  const getCardVariant = (type) => {
    switch (type) {
      case 'knowledge': return 'primary';
      case 'quiz': return 'warning';
      case 'code': return 'info';
      default: return 'secondary';
    }
  };

  return (
    <Card className="shadow-sm border-0 rounded-3">
      <Card.Header className="d-flex justify-content-between align-items-center bg-white py-3 border-bottom-0">
        <h5 className="mb-0 text-dark">Cards for Topic: "{topic.title}"</h5>
        <Button variant="primary" size="sm" onClick={() => handleShow(null)}>
          <FaPlus className="me-1" /> Add Card
        </Button>
      </Card.Header>
      <Card.Body className="p-0">
        <Table responsive hover className="mb-0">
          <thead className="bg-light">
            <tr>
              <th className="py-3 ps-4">Order</th>
              <th className="py-3">Type</th>
              <th className="py-3">Title/Question</th>
              <th className="text-end py-3 pe-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {topic.cards.map(card => (
              <tr key={card._id}>
                <td className="align-middle ps-4">{card.cardOrder}</td>
                <td className="align-middle">
                  <Badge bg={getCardVariant(card.card_type)} className="text-uppercase py-2 px-3 fw-normal">
                    {card.card_type}
                  </Badge>
                </td>
                <td className="align-middle">{card.content?.title || card.content?.question}</td>
                <td className="text-end align-middle pe-4">
                  <ButtonGroup size="sm">
                    <Button variant="outline-warning" onClick={() => handleShow(card)}>
                      <FaEdit />
                    </Button>
                    <Button variant="outline-danger" onClick={() => handleDelete(card._id)}>
                      <FaTrashAlt />
                    </Button>
                  </ButtonGroup>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
      <CardModal 
        show={show} 
        handleClose={() => setShow(false)} 
        card={currentCard} 
        topicId={topic._id} 
        fetchModules={fetchModules} 
      />
    </Card>
  );
};

export default CardTable;