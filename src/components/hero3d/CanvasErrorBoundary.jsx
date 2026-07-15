// src/components/hero3d/CanvasErrorBoundary.jsx
import React from "react";

// Modeled on src/components/ErrorBoundary.jsx. Needed specifically because a
// missing/corrupt astronaut.glb is a REJECTED promise (404), which Suspense's
// fallback does not catch (Suspense only covers the pending state) — without
// this boundary, that rejection would propagate up and crash the whole
// homepage instead of just this one hero mesh.
class CanvasErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.warn("Cosmic hero: astronaut model failed to load, showing fallback.", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default CanvasErrorBoundary;
