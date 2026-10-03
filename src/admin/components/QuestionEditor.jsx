// src/admin/components/QuestionEditor.jsx
// One bank question: text, 2–6 options with the correct one picked,
// explanation (shown after the Post-check) and difficulty.
import React, { useState } from "react";
import { Form, Button, Spinner, InputGroup, Row, Col } from "react-bootstrap";
import { XCircle } from "react-bootstrap-icons";

export default function QuestionEditor({ initial, onSave, onCancel, saving }) {
  const [question, setQuestion] = useState(initial?.question || "");
  const [options, setOptions] = useState(initial?.options?.length ? initial.options : ["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(initial?.correctIndex ?? 0);
  const [explanation, setExplanation] = useState(initial?.explanation || "");
  const [difficulty, setDifficulty] = useState(initial?.difficulty || "medium");
  const name = `qe-correct-${initial?._id || "new"}`;

  const filled = options.map((o) => o.trim()).filter(Boolean);
  const valid = question.trim() && filled.length >= 2 && options[correctIndex]?.trim();

  const save = () => {
    const keep = options.map((o, i) => ({ o: o.trim(), i })).filter((x) => x.o);
    onSave({
      question: question.trim(),
      options: keep.map((x) => x.o),
      correctIndex: keep.findIndex((x) => x.i === correctIndex),
      explanation: explanation.trim(),
      difficulty,
    });
  };

  return (
    <div className="border rounded-3 p-3 mb-2 bg-light">
      <Form.Group className="mb-2">
        <Form.Label className="small fw-semibold">Question</Form.Label>
        <Form.Control as="textarea" rows={2} value={question} onChange={(e) => setQuestion(e.target.value)} />
      </Form.Group>
      <Form.Label className="small fw-semibold">Options — tick the correct one</Form.Label>
      {options.map((opt, i) => (
        <InputGroup size="sm" className="mb-1" key={i}>
          <InputGroup.Radio name={name} checked={correctIndex === i} onChange={() => setCorrectIndex(i)} aria-label={`Option ${i + 1} is correct`} />
          <Form.Control value={opt} placeholder={`Option ${i + 1}`} onChange={(e) => setOptions((p) => p.map((o, j) => (j === i ? e.target.value : o)))} />
          {options.length > 2 && (
            <Button variant="outline-secondary" aria-label="Remove option" onClick={() => {
              setOptions((p) => p.filter((_, j) => j !== i));
              setCorrectIndex((c) => (c === i ? 0 : c > i ? c - 1 : c));
            }}><XCircle /></Button>
          )}
        </InputGroup>
      ))}
      {options.length < 6 && (
        <Button size="sm" variant="link" className="p-0 mb-2" onClick={() => setOptions((p) => [...p, ""])}>+ Add option</Button>
      )}
      <Row className="g-2">
        <Col md={8}>
          <Form.Label className="small fw-semibold">Explanation (shown after the Post-check)</Form.Label>
          <Form.Control size="sm" value={explanation} onChange={(e) => setExplanation(e.target.value)} />
        </Col>
        <Col md={4}>
          <Form.Label className="small fw-semibold">Difficulty</Form.Label>
          <Form.Select size="sm" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="easy">Easy — a key fact</option>
            <option value="medium">Medium — understanding</option>
            <option value="hard">Hard — applying it</option>
          </Form.Select>
        </Col>
      </Row>
      <div className="d-flex gap-2 justify-content-end mt-2">
        {onCancel && <Button size="sm" variant="outline-secondary" onClick={onCancel} disabled={saving}>Cancel</Button>}
        <Button size="sm" variant="primary" disabled={!valid || saving} onClick={save}>
          {saving ? <Spinner size="sm" /> : "Save question"}
        </Button>
      </div>
    </div>
  );
}
