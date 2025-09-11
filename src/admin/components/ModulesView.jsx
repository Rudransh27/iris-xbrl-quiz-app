import React, { useState } from 'react';
import { Card, Button, Row, Col } from 'react-bootstrap';
import api from '../services/api';
import ModuleModal from './ModuleModal';
import TopicTable from './TopicTable';
import ModuleCard from './ModuleCard';

const ModulesView = ({ modules, fetchModules, setSelectedModule, selectedModule }) => {
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
    <>
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h4>Modules</h4>
          <Button variant="secondary" onClick={() => handleShow(null)}>+ Add Module</Button>
        </Card.Header>
        <Card.Body>
          <Row xs={1} md={2} lg={3} className="g-4">
            {modules.map(module => (
              <Col key={module._id}>
                <ModuleCard
                  module={module}
                  setSelectedModule={setSelectedModule}
                  handleEdit={handleShow}
                  handleDelete={handleDelete}
                />
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>
      <ModuleModal show={show} handleClose={() => setShow(false)} module={currentModule} fetchModules={fetchModules} />
      
      {selectedModule && (
        <Card className="mt-4">
          <Card.Body>
            <TopicTable
              module={selectedModule}
              fetchModules={fetchModules}
            />
          </Card.Body>
        </Card>
      )}
    </>
  );
};
export default ModulesView;