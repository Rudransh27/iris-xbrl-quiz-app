// src/admin/components/AdminCategoryManager.jsx
import React, { useState, useEffect, useContext } from "react";
import { Form, Button, Alert, Spinner, Row, Col, Table, Badge } from "react-bootstrap";
import { TagFill, PencilSquare, Trash, PlusCircle, XCircle, SignpostSplit } from "react-bootstrap-icons";
import api from "../services/api";
import AuthContext from "../../context/AuthContext";

// Category ("Tag") CRUD — a flat grouping layer for the Learn page, gated by
// the exact same three-layer visibility scope Module already has (Global /
// Departmental / Team-Specific). The permanent "Uncategorized" bucket
// (isDefault) can't be renamed, re-scoped away from Global, or deleted;
// every module always resolves to a real category, so deleting a
// non-default one just moves its modules to Uncategorized (never deletes
// the modules themselves).
// onOpenPaths(tag): opens the Learning Paths page filtered to this tag (live
// dashboard). Without it (legacy /admin dashboard) the Paths button is hidden.
export default function AdminCategoryManager({ onOpenPaths } = {}) {
  const { user } = useContext(AuthContext);
  const isSuperAdmin = user?.role === "superadmin";

  const [categories, setCategories] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState(0);
  const [visibility, setVisibility] = useState("Global");
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [sequentialUnlock, setSequentialUnlock] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pathCounts, setPathCounts] = useState({});

  const loadCategories = async () => {
    setLoading(true);
    try {
      const [res, pathsRes] = await Promise.all([
        api.getCategories(),
        api.getAdminPaths().catch(() => ({ data: [] })),
      ]);
      setCategories(res?.data || []);
      const counts = {};
      (pathsRes?.data || []).forEach((p) => {
        const key = (p.categoryId?._id || p.categoryId || "").toString();
        counts[key] = counts[key] || { total: 0, published: 0 };
        counts[key].total += 1;
        if (p.status === "published") counts[key].published += 1;
      });
      setPathCounts(counts);
    } catch (err) {
      setError(err.message || "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    (async () => {
      try {
        const data = await api.getDepartments();
        setDepartmentsList(data || []);
      } catch (err) {
        console.error("Failed to load departments:", err.message);
      }
    })();
  }, []);

  // 👤 Same ownership rule as AdminModuleForm: creating new (editingCategory
  // null) trivially makes this admin the owner; editing is only "owned" if
  // the recorded creator matches.
  const isOwner = !editingCategory || (
    !!editingCategory.createdBy &&
    !!user?._id &&
    (editingCategory.createdBy._id || editingCategory.createdBy).toString() === user._id.toString()
  );
  const canUseGlobalScope = isSuperAdmin || isOwner;
  const showGlobalOption = canUseGlobalScope || visibility === "Global";
  const lockVisibilityDropdown = !isSuperAdmin && !isOwner && visibility === "Global";

  const visibleDepartmentsList = isSuperAdmin
    ? departmentsList
    : departmentsList.filter((d) => (d._id || "").toString() === (user?.department || "").toString());

  const selectedDeptObjects = visibleDepartmentsList.filter((d) => selectedDepartments.includes(d._id));
  const availableTeamsMap = new Map();
  selectedDeptObjects.forEach((d) => {
    (d.teams || []).forEach((team) => {
      if (!availableTeamsMap.has(team._id)) {
        availableTeamsMap.set(team._id, { ...team, deptName: d.name });
      }
    });
  });
  const availableTeams = Array.from(availableTeamsMap.values());

  // 🔐 Keep a Department Admin's selection locked to their own department
  // the instant a non-Global scope is chosen — same rule AdminModuleForm
  // enforces client-side (the backend is the real authority either way).
  useEffect(() => {
    if (isSuperAdmin) return;
    if (visibility === "Global") return;
    if (user?.department && (selectedDepartments.length !== 1 || selectedDepartments[0] !== user.department)) {
      setSelectedDepartments([user.department]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin, visibility, user?.department]);

  const resetForm = () => {
    setEditingId(null);
    setEditingCategory(null);
    setName("");
    setDescription("");
    setOrder(0);
    setVisibility("Global");
    setSelectedDepartments([]);
    setSelectedTeams([]);
    setSequentialUnlock(true);
  };

  const startEdit = (category) => {
    setEditingId(category._id);
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description || "");
    setOrder(category.order || 0);
    setVisibility(category.visibility || "Global");
    setSelectedDepartments((category.departments || []).map((d) => d._id || d));
    setSelectedTeams((category.targetTeams || []).map((t) => t._id || t));
    setSequentialUnlock(category.sequentialUnlock !== false);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (visibility !== "Global" && selectedDepartments.length === 0) {
      setError("Validation Error: pick at least one target department for this scope.");
      return;
    }
    if (visibility === "Team-Specific" && selectedTeams.length === 0) {
      setError("Validation Error: select at least one sub-team for Team-Specific scope.");
      return;
    }
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const payload = {
        name,
        description,
        order: Number(order) || 0,
        visibility,
        departments: visibility === "Global" ? [] : selectedDepartments,
        targetTeams: visibility === "Team-Specific" ? selectedTeams : [],
        sequentialUnlock,
      };
      if (editingId) {
        await api.updateCategory(editingId, payload);
        setSuccess(`Tag "${name}" updated.`);
      } else {
        await api.createCategory(payload);
        setSuccess(`Tag "${name}" created.`);
      }
      resetForm();
      await loadCategories();
    } catch (err) {
      setError(err.message || "Failed to save tag.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete tag "${category.name}"? Its modules will move to "Uncategorized" — modules themselves are never deleted.`)) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      await api.deleteCategory(category._id);
      setSuccess(`Tag "${category.name}" removed.`);
      await loadCategories();
    } catch (err) {
      setError(err.message || "Failed to delete tag.");
    }
  };

  const scopeBadge = (cat) => {
    if (cat.visibility === "Team-Specific") return <Badge bg="warning" text="dark">Team-Specific</Badge>;
    if (cat.visibility === "Departmental") return <Badge bg="secondary">Departmental</Badge>;
    return <Badge bg="success">Global</Badge>;
  };

  return (
    <div>
      <h4 className="fw-bold mb-3 d-flex align-items-center gap-2">
        <TagFill size={20} /> Tags
      </h4>
      <p className="text-muted small">
        Tags group learning <strong>paths</strong> on the Learn page (Onboarding, Product, Market, …): Learn → Tag → Path → modules.
        Build paths in <strong>Learning Paths</strong> (or press <SignpostSplit /> Paths on a tag). A tag can be scoped Global,
        Departmental, or Team-Specific. The "Uncategorized" tag is permanent.
      </p>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Form onSubmit={handleSubmit} className="border rounded p-3 mb-4 bg-light">
        <Row className="g-2 mb-2">
          <Col md={4}>
            <Form.Group>
              <Form.Label className="small fw-semibold">Name</Form.Label>
              <Form.Control value={name} onChange={(e) => setName(e.target.value)} required />
            </Form.Group>
          </Col>
          <Col md={5}>
            <Form.Group>
              <Form.Label className="small fw-semibold">Description</Form.Label>
              <Form.Control value={description} onChange={(e) => setDescription(e.target.value)} />
            </Form.Group>
          </Col>
          <Col md={2}>
            <Form.Group>
              <Form.Label className="small fw-semibold">Order</Form.Label>
              <Form.Control type="number" value={order} onChange={(e) => setOrder(e.target.value)} />
            </Form.Group>
          </Col>
          <Col md={1} className="d-flex align-items-end">
            <Button type="submit" variant="primary" disabled={saving} className="w-100">
              {saving ? <Spinner size="sm" /> : editingId ? "Save" : <PlusCircle />}
            </Button>
          </Col>
        </Row>

        <Row className="g-2 mb-2">
          <Col md={4}>
            <Form.Group>
              <Form.Label className="small fw-semibold">Visibility Scope</Form.Label>
              <Form.Select
                value={visibility}
                onChange={(e) => {
                  setVisibility(e.target.value);
                  setSelectedDepartments([]);
                  setSelectedTeams([]);
                }}
                disabled={lockVisibilityDropdown}
              >
                {showGlobalOption && <option value="Global">Global (everyone)</option>}
                <option value="Departmental">Departmental (one business line)</option>
                <option value="Team-Specific">Team-Specific (one sub-team)</option>
              </Form.Select>
              {lockVisibilityDropdown && (
                <small className="text-danger d-block mt-1">
                  This tag is Global and was created by someone else — only its creator or a Super Admin can change its scope.
                </small>
              )}
            </Form.Group>
          </Col>
        </Row>

        {visibility !== "Global" && (
          <div className="mb-2 bg-white p-3 border rounded-3">
            <Form.Label className="small fw-semibold d-block mb-2">Target Departments</Form.Label>
            {visibleDepartmentsList.length === 0 ? (
              <small className="text-danger">No departments provisioned.</small>
            ) : (
              <Row>
                {visibleDepartmentsList.map((d) => (
                  <Col sm={4} xs={6} key={d._id} className="mb-1">
                    <Form.Check
                      type="checkbox"
                      id={`cat-dept-${d._id}`}
                      label={d.name}
                      checked={selectedDepartments.includes(d._id)}
                      onChange={() => {
                        setSelectedDepartments((prev) =>
                          prev.includes(d._id) ? prev.filter((id) => id !== d._id) : [...prev, d._id]
                        );
                        setSelectedTeams([]);
                      }}
                      disabled={!isSuperAdmin}
                      className="small"
                    />
                  </Col>
                ))}
              </Row>
            )}
            {!isSuperAdmin && (
              <small className="text-muted d-block mt-1">Locked to your own department.</small>
            )}
          </div>
        )}

        {visibility === "Team-Specific" && selectedDepartments.length > 0 && (
          <div className="mb-2 bg-white p-3 border rounded-3">
            <Form.Label className="small fw-semibold d-block mb-2">Target Teams</Form.Label>
            {availableTeams.length === 0 ? (
              <small className="text-danger">No sub-teams provisioned under the selected department(s).</small>
            ) : (
              <Row>
                {availableTeams.map((team) => (
                  <Col sm={4} xs={6} key={team._id} className="mb-1">
                    <Form.Check
                      type="checkbox"
                      id={`cat-team-${team._id}`}
                      label={selectedDepartments.length > 1 ? `${team.name} (${team.deptName})` : team.name}
                      checked={selectedTeams.includes(team._id)}
                      onChange={() =>
                        setSelectedTeams((prev) =>
                          prev.includes(team._id) ? prev.filter((id) => id !== team._id) : [...prev, team._id]
                        )
                      }
                      className="small"
                    />
                  </Col>
                ))}
              </Row>
            )}
          </div>
        )}

        <div className="mb-2">
          <Form.Check
            type="switch"
            id="cat-sequential-unlock"
            label="Sequential unlock (old Tag → Region view only — each path has its own setting)"
            checked={sequentialUnlock}
            onChange={(e) => setSequentialUnlock(e.target.checked)}
            className="small"
          />
        </div>

        {editingId && (
          <Button variant="outline-secondary" size="sm" className="mt-2" onClick={resetForm}>
            <XCircle className="me-1" /> Cancel edit
          </Button>
        )}
      </Form>

      {loading ? (
        <Spinner animation="border" size="sm" />
      ) : (
        <Table hover responsive size="sm">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Scope</th>
              <th>Order</th>
              <th>Paths</th>
              <th></th>
              <th style={{ width: 200 }}></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat._id}>
                <td className="fw-semibold">{cat.name}</td>
                <td className="text-muted small">{cat.description}</td>
                <td>{scopeBadge(cat)}</td>
                <td>{cat.order}</td>
                <td>
                  {pathCounts[cat._id]
                    ? <Badge bg={pathCounts[cat._id].published ? "primary" : "secondary"}>
                        {pathCounts[cat._id].published}/{pathCounts[cat._id].total} published
                      </Badge>
                    : <span className="text-muted small">None</span>}
                </td>
                <td>{cat.isDefault && <Badge bg="info">Default bucket</Badge>}</td>
                <td className="text-end">
                  {onOpenPaths && (
                    <Button
                      size="sm"
                      variant="outline-primary"
                      className="me-1"
                      onClick={() => onOpenPaths(cat)}
                      title="See and build this tag's paths"
                    >
                      <SignpostSplit className="me-1" /> Paths
                    </Button>
                  )}
                  {!cat.isDefault && (
                    <>
                      <Button size="sm" variant="outline-secondary" className="me-1" onClick={() => startEdit(cat)}>
                        <PencilSquare />
                      </Button>
                      <Button size="sm" variant="outline-danger" onClick={() => handleDelete(cat)}>
                        <Trash />
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr><td colSpan={7} className="text-center text-muted py-3">No tags yet.</td></tr>
            )}
          </tbody>
        </Table>
      )}

    </div>
  );
}
