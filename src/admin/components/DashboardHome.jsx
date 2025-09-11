// src/admin/components/DashboardHome.jsx

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../services/api';
import './DashboardHome.css';

const DashboardHome = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContentStats = async () => {
      try {
        const modules = await api.getModules();
        
        let totalTopics = 0;
        let totalCards = 0;
        
        modules.forEach(module => {
          totalTopics += module.topics.length;
          module.topics.forEach(topic => {
            totalCards += topic.cards.length;
          });
        });

        const dashboardData = [
          { name: 'Modules', count: modules.length, color: '#007bff' },
          { name: 'Topics', count: totalTopics, color: '#28a745' },
          { name: 'Cards', count: totalCards, color: '#17a2b8' },
        ];
        
        setData(dashboardData);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch dashboard data.');
        console.error('Error fetching dashboard data:', err);
        setLoading(false);
      }
    };

    fetchContentStats();
  }, []);

  if (loading) {
    return <Spinner animation="border" className="d-block mx-auto my-5" />;
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  const moduleCount = data.find(item => item.name === 'Modules')?.count || 0;
  const topicCount = data.find(item => item.name === 'Topics')?.count || 0;
  const cardCount = data.find(item => item.name === 'Cards')?.count || 0;

  return (
    <div>
      <h2 className="mb-4 dashboard-title">Content Overview</h2>
      <Row className="g-4 mb-5">
        <Col md={4}>
          <Card className="dashboard-metric-card shadow-sm">
            <Card.Body>
              <Card.Title className="text-muted">Total Modules</Card.Title>
              <Card.Text className="fs-1 fw-bold text-primary">{moduleCount}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="dashboard-metric-card shadow-sm">
            <Card.Body>
              <Card.Title className="text-muted">Total Topics</Card.Title>
              <Card.Text className="fs-1 fw-bold text-success">{topicCount}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="dashboard-metric-card shadow-sm">
            <Card.Body>
              <Card.Title className="text-muted">Total Cards</Card.Title>
              <Card.Text className="fs-1 fw-bold text-info">{cardCount}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Card className="shadow-sm border-0 rounded-3">
        <Card.Body>
          <Card.Title className="dashboard-chart-title">Content Distribution</Card.Title>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="#6c757d" />
              <YAxis stroke="#6c757d" />
              <Tooltip />
              <Bar dataKey="count" fill="#007bff" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card.Body>
      </Card>
    </div>
  );
};

export default DashboardHome;