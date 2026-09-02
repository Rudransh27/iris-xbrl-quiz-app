// src/admin/components/AdminModuleReorderModal.jsx
// Drag-and-drop sequencing for the modules inside one tag — this is what
// actually decides the order the sequential-lock system unlocks them in
// (see quiz-backend's moduleLock.js). Saving posts the full ordered id list
// to PUT /api/categories/:id/modules/order in one shot.
import React, { useState, useEffect, useMemo } from "react";
import { Modal, Button, Spinner, Alert } from "react-bootstrap";
import { GripVertical, TagFill } from "react-bootstrap-icons";
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import api from "../services/api";

function SortableModuleRow({ module, position }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: module._id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="d-flex align-items-center gap-2 p-2 mb-1 border rounded-3 bg-white">
      <span
        {...attributes}
        {...listeners}
        style={{ cursor: "grab", touchAction: "none" }}
        className="text-muted d-flex align-items-center"
        aria-label="Drag to reorder"
      >
        <GripVertical size={16} />
      </span>
      <span className="badge bg-secondary" style={{ minWidth: 26 }}>{position}</span>
      <span className="flex-grow-1">{module.title}</span>
    </div>
  );
}

export default function AdminModuleReorderModal({ category, onClose }) {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const all = await api.getModules();
        const inThisCategory = (Array.isArray(all) ? all : [])
          .filter((m) => (m.categoryId?._id || m.categoryId || "").toString() === category._id.toString())
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        setModules(inThisCategory);
      } catch (err) {
        setError(err.message || "Failed to load modules for this tag.");
      } finally {
        setLoading(false);
      }
    })();
  }, [category._id]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const moduleIds = useMemo(() => modules.map((m) => m._id), [modules]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setModules((prev) => {
      const oldIndex = prev.findIndex((m) => m._id === active.id);
      const newIndex = prev.findIndex((m) => m._id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await api.reorderCategoryModules(category._id, modules.map((m) => m._id));
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save the new order.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2 fs-6">
          <TagFill size={16} /> Reorder modules — {category.name}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted small">
          Drag to set the order learners unlock these modules in. The first module is always open;
          each next one unlocks once the previous is completed
          {category.sequentialUnlock === false && " — currently OFF for this tag, so every module is open regardless of this order"}.
        </p>

        {error && <Alert variant="danger">{error}</Alert>}

        {loading ? (
          <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>
        ) : modules.length === 0 ? (
          <p className="text-muted text-center py-3">No modules in this tag yet.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={moduleIds} strategy={verticalListSortingStrategy}>
              {modules.map((m, i) => (
                <SortableModuleRow key={m._id} module={m} position={i + 1} />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={saving || loading || modules.length === 0}>
          {saving ? <Spinner size="sm" /> : "Save order"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
