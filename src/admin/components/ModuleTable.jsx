import React, { useState } from 'react';
import { Table, Button, Card, ButtonGroup, Row, Col } from 'react-bootstrap';
import api from '../services/api.js';
import ModuleModal from './ModuleModal.jsx';
import TopicTable from './TopicTable.jsx';

const ModuleTable = ({ modules, fetchModules, setSelectedModule, selectedModule }) => {
  const [show, setShow] = useState(false);
  const [currentModule, setCurrentModule] = useState(null);

  const handleShow = (module = null) => {
    setCurrentModule(module);
    setShow(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this module and all its content?")) {
      await api.deleteModule(id);
      fetchModules();
      setSelectedModule(null);
    }
  };

  return (
    <Card className="mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h4>Modules</h4>
        <Button variant="success" onClick={() => handleShow(null)}>+ Add Module</Button>
      </Card.Header>
      <Card.Body>
        <Table hover responsive>
          <thead>
            <tr>
              <th>Title</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {modules.map(module => (
              <tr key={module._id}>
                <td>{module.title}</td>
                <td className="text-end">
                  <ButtonGroup size="sm">
                    <Button variant="info" onClick={() => setSelectedModule(module)}>View Topics</Button>
                    <Button variant="warning" onClick={() => handleShow(module)}>Edit</Button>
                    <Button variant="danger" onClick={() => handleDelete(module._id)}>Delete</Button>
                  </ButtonGroup>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
      <ModuleModal show={show} handleClose={() => setShow(false)} module={currentModule} fetchModules={fetchModules} />
      
      {selectedModule && (
        <Card.Body>
          <Row className="mt-4">
            <Col>
              <TopicTable
                module={selectedModule}
                fetchModules={fetchModules}
              />
            </Col>
          </Row>
        </Card.Body>
      )}
    </Card>
  );
};

export default ModuleTable;