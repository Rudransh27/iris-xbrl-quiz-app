// src/admin/components/AdminRegionManager.jsx
import React, { useState, useEffect, useContext, useCallback } from "react";
import { Form, Button, Alert, Spinner, Row, Col, InputGroup } from "react-bootstrap";
import {
  GlobeAmericas,
  PencilSquare,
  Trash,
  PlusCircle,
  XCircle,
  TagFill,
  Collection,
  X,
  Infinity as InfinityIcon,
  Grid3x3GapFill,
  ArrowDownUp,
  PeopleFill,
} from "react-bootstrap-icons";
import api from "../services/api";
import AuthContext from "../../context/AuthContext";
import AdminRegionModuleReorderModal from "./AdminRegionModuleReorderModal";
import "./AdminRegionManager.css";

const DEFAULT_COLOR = "#6366f1";

// Region CRUD is Superadmin-only (a strategic, platform-wide construct like
// Department) — a Department Admin can still see every region and use this
// same panel to map tags/modules INTO one, scoped by their own department
// authority (see regionRoutes.js's canAdminAccessDoc), but can't create,
// rename, or delete the region entity itself.
export default function AdminRegionManager() {
  const { user } = useContext(AuthContext);
  const isSuperAdmin = user?.role === "superadmin";

  // "tag" (default, the primary workflow) browses Tag x Region buckets
  // ("Onboarding-US", "Onboarding-Europe", ...) and is the ONLY place
  // modules get added/removed from a region. "region" is for region
  // administration — create/edit/delete a region, and control which TAGS
  // are even visible to a region-scoped learner at all (a different,
  // read-only-content-wise view — see RegionMappingPanel below). "user" is
  // per-LEARNER region scoping — which region(s) restrict what THAT person
  // sees, same field they can also self-manage from their own profile.
  const [viewMode, setViewMode] = useState("tag");

  return (
    <div>
      <div className="arm-header">
        <div className="arm-header__icon"><GlobeAmericas size={20} /></div>
        <div>
          <h4 className="arm-header__title">Regions</h4>
          <p className="arm-header__desc">
            Regions (US, Europe, India, APAC, LATAM, …) are a separate dimension from Tags. A learner assigned to a
            region only ever sees content that's either unrestricted (visible everywhere) or explicitly placed in
            one of their regions.
          </p>
        </div>
      </div>

      <div className="arm-toggle">
        <button
          type="button"
          className={`arm-toggle__btn ${viewMode === "tag" ? "arm-toggle__btn--active" : ""}`}
          onClick={() => setViewMode("tag")}
        >
          <Grid3x3GapFill size={13} /> By Tag
        </button>
        <button
          type="button"
          className={`arm-toggle__btn ${viewMode === "region" ? "arm-toggle__btn--active" : ""}`}
          onClick={() => setViewMode("region")}
        >
          <GlobeAmericas size={13} /> By Region
        </button>
        <button
          type="button"
          className={`arm-toggle__btn ${viewMode === "user" ? "arm-toggle__btn--active" : ""}`}
          onClick={() => setViewMode("user")}
        >
          <PeopleFill size={13} /> By User
        </button>
      </div>

      {viewMode === "tag" && <TagRegionBrowser />}
      {viewMode === "region" && <RegionAdminView isSuperAdmin={isSuperAdmin} />}
      {viewMode === "user" && <UserRegionBrowser isSuperAdmin={isSuperAdmin} />}
    </div>
  );
}

// =============================================================================
// BY USER — which region(s) restrict what a specific learner sees. Admins
// see (and may edit) only users in their own department; Superadmin sees
// everyone — both scoped server-side by GET /api/progress/admin/users and
// PUT /api/users/:id/regions, not by any client-side filtering here.
// =============================================================================
function UserRegionBrowser({ isSuperAdmin }) {
  const [users, setUsers] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [savingUserId, setSavingUserId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [usersRes, regionsRes] = await Promise.all([
        api.getAdminUsersList(),
        api.getRegions(),
      ]);
      setUsers(usersRes?.users || []);
      setRegions((regionsRes?.data || []).filter((r) => !r.isDefault));
    } catch (err) {
      setError(err.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleUserRegion = async (targetUser, regionId) => {
    const current = (targetUser.regions || []).map((r) => r._id);
    const next = current.includes(regionId) ? current.filter((id) => id !== regionId) : [...current, regionId];
    setSavingUserId(targetUser._id);
    setError("");
    try {
      const res = await api.assignUserRegions(targetUser._id, next);
      const updatedRegions = res?.data?.regions || [];
      setUsers((prev) => prev.map((u) => (u._id === targetUser._id ? { ...u, regions: updatedRegions } : u)));
    } catch (err) {
      setError(err.message || "Failed to update this user's regions.");
    } finally {
      setSavingUserId(null);
    }
  };

  const term = search.trim().toLowerCase();
  const filteredUsers = users.filter((u) => (
    !term || u.username?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term)
  ));

  return (
    <div>
      <p className="arm-header__desc" style={{ marginBottom: 14 }}>
        {isSuperAdmin
          ? "Every user, across every department."
          : "Users in your own department only."} Toggle a region chip to scope that person to it — leave
        someone with none selected to keep them unrestricted (sees content everywhere).
      </p>

      <Form.Control
        size="sm" placeholder="Search by name or email…" value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ maxWidth: 320, marginBottom: 14 }}
      />

      {error && <Alert variant="danger" onClose={() => setError("")} dismissible>{error}</Alert>}

      {loading ? (
        <Spinner animation="border" size="sm" />
      ) : (
        <div className="arm-panel">
          <div className="d-flex flex-column">
            {filteredUsers.length === 0 && <div className="arm-empty">No users found.</div>}
            {filteredUsers.map((u) => {
              const userRegionIds = (u.regions || []).map((r) => r._id);
              const isSaving = savingUserId === u._id;
              return (
                <div key={u._id} className="arm-user-row">
                  <div className="arm-user-row__id">
                    <span className="arm-user-row__name">{u.username}</span>
                    <span className="arm-user-row__email">{u.email}</span>
                    {isSuperAdmin && <span className="arm-badge">{u.department}</span>}
                  </div>
                  <div className="arm-user-row__chips">
                    {regions.map((r) => {
                      const active = userRegionIds.includes(r._id);
                      return (
                        <button
                          type="button"
                          key={r._id}
                          disabled={isSaving}
                          className={`arm-region-toggle ${active ? "arm-region-toggle--active" : ""}`}
                          style={{ "--arm-accent": r.color || DEFAULT_COLOR }}
                          onClick={() => toggleUserRegion(u, r._id)}
                        >
                          {r.code || r.name}
                        </button>
                      );
                    })}
                    {userRegionIds.length === 0 && <span className="arm-badge">Unrestricted</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// BY REGION — region administration. Creating/renaming/deleting a region,
// and controlling which tags are visible to a region-scoped learner at all
// (Category.regions — a different concern from which MODULES a tag offers).
// Deliberately has NO module editing of its own any more — that always
// happens through "By Tag" now, so there's exactly one place that changes
// which modules land in a bucket, instead of two paths that could disagree.
// =============================================================================
function RegionAdminView({ isSuperAdmin }) {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [order, setOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  const [selectedRegionId, setSelectedRegionId] = useState(null);

  const loadRegions = useCallback(async (keepSelection = true) => {
    setLoading(true);
    try {
      const res = await api.getRegions();
      const data = res?.data || [];
      setRegions(data);
      setSelectedRegionId((prev) => {
        if (keepSelection && data.some((r) => r._id === prev)) return prev;
        return data[0]?._id || null;
      });
    } catch (err) {
      setError(err.message || "Failed to load regions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRegions(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedRegion = regions.find((r) => r._id === selectedRegionId) || null;

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setCode("");
    setDescription("");
    setColor(DEFAULT_COLOR);
    setOrder(0);
    setShowForm(false);
  };

  const startCreate = () => {
    resetForm();
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const startEdit = (region) => {
    setEditingId(region._id);
    setName(region.name);
    setCode(region.code || "");
    setDescription(region.description || "");
    setColor(region.color || DEFAULT_COLOR);
    setOrder(region.order || 0);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const payload = { name, code, description, color, order: Number(order) || 0 };
      if (editingId) {
        await api.updateRegion(editingId, payload);
        setSuccess(`Region "${name}" updated.`);
        resetForm();
        await loadRegions();
      } else {
        const res = await api.createRegion(payload);
        setSuccess(`Region "${name}" created.`);
        const newId = res?.data?._id;
        resetForm();
        await loadRegions(false);
        if (newId) setSelectedRegionId(newId);
      }
    } catch (err) {
      setError(err.message || "Failed to save region.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (region) => {
    if (!window.confirm(
      `Delete region "${region.name}"? Any tags/modules/users currently assigned to it simply become ` +
      `unrestricted (visible everywhere) — nothing else is deleted.`
    )) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      await api.deleteRegion(region._id);
      setSuccess(`Region "${region.name}" removed.`);
      if (selectedRegionId === region._id) setSelectedRegionId(null);
      await loadRegions(false);
    } catch (err) {
      setError(err.message || "Failed to delete region.");
    }
  };

  return (
    <div>
      {error && <Alert variant="danger" onClose={() => setError("")} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess("")} dismissible>{success}</Alert>}

      {isSuperAdmin && (
        <div className="mb-3">
          {!showForm ? (
            <Button variant="primary" size="sm" onClick={startCreate}>
              <PlusCircle className="me-1" /> New Region
            </Button>
          ) : (
            <Form onSubmit={handleSubmit} className="arm-form-card">
              <Row className="g-2 mb-2">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Name</Form.Label>
                    <Form.Control value={name} onChange={(e) => setName(e.target.value)} placeholder="United States" required />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Code</Form.Label>
                    <Form.Control value={code} onChange={(e) => setCode(e.target.value)} placeholder="US" maxLength={8} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Description</Form.Label>
                    <Form.Control value={description} onChange={(e) => setDescription(e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Color</Form.Label>
                    <Form.Control type="color" title="Region color" value={color} onChange={(e) => setColor(e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={1}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Order</Form.Label>
                    <Form.Control type="number" value={order} onChange={(e) => setOrder(e.target.value)} />
                  </Form.Group>
                </Col>
              </Row>
              <Button type="submit" variant="primary" size="sm" disabled={saving} className="me-2">
                {saving ? <Spinner size="sm" /> : editingId ? "Save" : "Create"}
              </Button>
              <Button type="button" variant="outline-secondary" size="sm" onClick={resetForm}>
                <XCircle className="me-1" /> Cancel
              </Button>
            </Form>
          )}
        </div>
      )}

      {loading ? (
        <Spinner animation="border" size="sm" />
      ) : (
        <Row className="g-3">
          <Col md={4}>
            <div className="arm-card-list">
              {regions.length === 0 && <div className="arm-empty">No regions yet.</div>}
              {regions.map((region) => {
                const isSelected = region._id === selectedRegionId;
                return (
                  <button
                    type="button"
                    key={region._id}
                    className={`arm-card ${isSelected ? "arm-card--active" : ""}`}
                    style={{ "--arm-accent": region.color || DEFAULT_COLOR }}
                    onClick={() => setSelectedRegionId(region._id)}
                  >
                    <div className="arm-card__top">
                      <div className="arm-card__id">
                        {region.isDefault ? (
                          <InfinityIcon size={12} color={region.color || DEFAULT_COLOR} />
                        ) : (
                          <span className="arm-card__dot" />
                        )}
                        <span className="arm-card__title">{region.name}</span>
                        {region.code && <span className="arm-badge">{region.code}</span>}
                      </div>
                      {isSuperAdmin && !region.isDefault && (
                        <div className="arm-card__actions">
                          <span
                            role="button" className="arm-icon-btn"
                            onClick={(e) => { e.stopPropagation(); startEdit(region); }}
                          >
                            <PencilSquare size={11} />
                          </span>
                          <span
                            role="button" className="arm-icon-btn arm-icon-btn--danger"
                            onClick={(e) => { e.stopPropagation(); handleDelete(region); }}
                          >
                            <Trash size={11} />
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="arm-card__footer">
                      <span className="arm-badge"><TagFill size={9} /> {region.tagCount || 0} tags</span>
                      <span className="arm-badge"><Collection size={9} /> {region.moduleCount || 0} modules</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Col>

          <Col md={8}>
            {selectedRegion ? (
              <RegionMappingPanel region={selectedRegion} />
            ) : (
              <div className="arm-panel"><div className="arm-empty">Select a region to manage it.</div></div>
            )}
          </Col>
        </Row>
      )}
    </div>
  );
}

// Region detail: which tags are visible in this region (RBAC — controls
// whether the tag itself even shows up in a region-scoped learner's tag
// grid), plus a READ-ONLY overview of which tags actually have modules
// here today. Editing modules always happens in "By Tag".
function RegionMappingPanel({ region }) {
  const [assignedTags, setAssignedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [tagBreakdown, setTagBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pickTagId, setPickTagId] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [tagsRes, availTagsRes, breakdownRes] = await Promise.all([
        api.getRegionTags(region._id),
        api.getRegionAvailableTags(region._id),
        api.getRegionTagBreakdown(region._id),
      ]);
      setAssignedTags(tagsRes?.data || []);
      setAvailableTags(availTagsRes?.data || []);
      setTagBreakdown(breakdownRes?.data || []);
      setPickTagId("");
    } catch (err) {
      setError(err.message || "Failed to load region details.");
    } finally {
      setLoading(false);
    }
  }, [region._id]);

  useEffect(() => { load(); }, [load]);

  const addTag = async () => {
    if (!pickTagId) return;
    setBusy(true);
    setError("");
    try {
      await api.addTagToRegion(region._id, pickTagId);
      await load();
    } catch (err) {
      setError(err.message || "Failed to assign tag.");
    } finally {
      setBusy(false);
    }
  };

  const removeTag = async (tagId) => {
    setBusy(true);
    setError("");
    try {
      await api.removeTagFromRegion(region._id, tagId);
      await load();
    } catch (err) {
      setError(err.message || "Failed to remove tag.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="d-flex flex-column gap-3">
      <div className="d-flex align-items-center gap-2">
        {region.isDefault ? (
          <InfinityIcon size={16} color={region.color || DEFAULT_COLOR} />
        ) : (
          <span className="arm-card__dot" style={{ "--arm-accent": region.color || DEFAULT_COLOR, width: 12, height: 12 }} />
        )}
        <h5 className="fw-bold m-0">{region.name}</h5>
        {region.code && <span className="arm-badge">{region.code}</span>}
      </div>

      {error && <Alert variant="danger" className="small py-2">{error}</Alert>}

      {loading ? (
        <Spinner animation="border" size="sm" />
      ) : (
        <Row className="g-3">
          <Col md={6}>
            <div className="arm-panel">
              <div className="arm-panel__header"><TagFill size={13} /> Tags visible in this region</div>
              <div className="arm-panel__body">
                {assignedTags.length === 0 ? (
                  <div className="arm-empty">No tags visible here yet.</div>
                ) : (
                  <div className="d-flex flex-column">
                    {assignedTags.map((tag) => {
                      // A tag with an EMPTY regions array is Global/unrestricted —
                      // always visible everywhere, not specifically scoped to this
                      // region — so there's nothing here to remove. Only a tag
                      // whose own regions array actually contains this region can
                      // be un-scoped from it.
                      const isSpecific = !region.isDefault && Array.isArray(tag.regions) && tag.regions.length > 0;
                      return (
                        <div key={tag._id} className="arm-list-row">
                          <span>{tag.name}</span>
                          {isSpecific ? (
                            <button type="button" className="arm-list-row__remove" disabled={busy} onClick={() => removeTag(tag._id)} title="Remove from region">
                              <X size={15} />
                            </button>
                          ) : (
                            <span className="arm-badge">{region.isDefault ? "Unrestricted" : "Always visible"}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                <p className="arm-panel__hint">
                  Controls whether the tag itself shows up at all in a region-scoped learner's Learn tag grid —
                  separate from which modules the tag offers (managed in "By Tag"). Most tags are Global/
                  unrestricted by default and always show up everywhere.
                </p>
              </div>
              <div className="arm-panel__footer">
                <InputGroup size="sm">
                  <Form.Select value={pickTagId} onChange={(e) => setPickTagId(e.target.value)} disabled={busy}>
                    <option value="">
                      {availableTags.length === 0
                        ? "No more tags available"
                        : region.isDefault ? "Select a tag to make visible everywhere…" : "Select a tag to add…"}
                    </option>
                    {availableTags.map((tag) => <option key={tag._id} value={tag._id}>{tag.name}</option>)}
                  </Form.Select>
                  <Button variant="outline-primary" disabled={!pickTagId || busy} onClick={addTag}>
                    <PlusCircle />
                  </Button>
                </InputGroup>
              </div>
            </div>
          </Col>

          <Col md={6}>
            <div className="arm-panel">
              <div className="arm-panel__header"><Collection size={13} /> Content in this region, by tag</div>
              <div className="arm-panel__body">
                {tagBreakdown.length === 0 ? (
                  <div className="arm-empty">No modules visible here yet.</div>
                ) : (
                  <div className="d-flex flex-column">
                    {tagBreakdown.map((t) => (
                      <div key={t._id} className="arm-list-row arm-list-row--muted">
                        <span>{t.name}</span>
                        <span className="arm-badge arm-badge--accent">{t.moduleCount} module{t.moduleCount === 1 ? "" : "s"}</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="arm-panel__hint">
                  Read-only. To add or remove specific modules, switch to <strong>By Tag</strong> and pick the tag
                  you want to change.
                </p>
              </div>
            </div>
          </Col>
        </Row>
      )}
    </div>
  );
}

// =============================================================================
// BY TAG — the primary workflow. Pick a tag, see every region as a sibling
// bucket named "{Tag}-{Region}" (e.g. "Onboarding-US", "Onboarding-Europe")
// with its real learner-visible module count, and drill into one to manage
// its modules directly.
// =============================================================================
function TagRegionBrowser() {
  const [tags, setTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(true);
  const [selectedTagId, setSelectedTagId] = useState("");
  const [buckets, setBuckets] = useState([]);
  const [loadingBuckets, setLoadingBuckets] = useState(false);
  const [selectedBucketRegionId, setSelectedBucketRegionId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoadingTags(true);
      try {
        const res = await api.getCategories();
        setTags(res?.data || []);
      } catch (err) {
        setError(err.message || "Failed to load tags.");
      } finally {
        setLoadingTags(false);
      }
    })();
  }, []);

  const loadBuckets = useCallback(async (tagId) => {
    if (!tagId) { setBuckets([]); return; }
    setLoadingBuckets(true);
    setError("");
    try {
      const res = await api.getRegionModuleBreakdown(tagId);
      setBuckets(res?.data || []);
    } catch (err) {
      setError(err.message || "Failed to load this tag's region breakdown.");
    } finally {
      setLoadingBuckets(false);
    }
  }, []);

  useEffect(() => {
    setSelectedBucketRegionId(null);
    loadBuckets(selectedTagId);
  }, [selectedTagId, loadBuckets]);

  const selectedTag = tags.find((t) => t._id === selectedTagId) || null;
  const selectedBucketRegion = buckets.find((b) => b._id === selectedBucketRegionId) || null;
  const allRegionId = (buckets.find((b) => b.isDefault) || {})._id || null;

  return (
    <div>
      <Form.Group className="mb-3" style={{ maxWidth: 360 }}>
        <Form.Label className="small fw-semibold">Tag</Form.Label>
        <Form.Select value={selectedTagId} onChange={(e) => setSelectedTagId(e.target.value)} disabled={loadingTags}>
          <option value="">{loadingTags ? "Loading tags…" : "Select a tag…"}</option>
          {tags.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
        </Form.Select>
      </Form.Group>

      {error && <Alert variant="danger" className="small py-2">{error}</Alert>}

      {!selectedTagId ? (
        <div className="arm-panel"><div className="arm-empty">Pick a tag to see its region buckets.</div></div>
      ) : loadingBuckets ? (
        <Spinner animation="border" size="sm" />
      ) : (
        <Row className="g-3">
          <Col md={5}>
            <div className="arm-card-list">
              {buckets.map((bucket) => {
                const isSelected = bucket._id === selectedBucketRegionId;
                const bucketLabel = `${selectedTag?.name || ""}-${bucket.isDefault ? "All" : (bucket.code || bucket.name)}`;
                return (
                  <button
                    type="button"
                    key={bucket._id}
                    className={`arm-card ${isSelected ? "arm-card--active" : ""}`}
                    style={{ "--arm-accent": bucket.color || DEFAULT_COLOR }}
                    onClick={() => setSelectedBucketRegionId(bucket._id)}
                  >
                    <div className="arm-card__top">
                      <div className="arm-card__id">
                        {bucket.isDefault ? (
                          <InfinityIcon size={12} color={bucket.color || DEFAULT_COLOR} />
                        ) : (
                          <span className="arm-card__dot" />
                        )}
                        <span className="arm-card__title">{bucketLabel}</span>
                      </div>
                      <span className="arm-badge arm-badge--accent">
                        <Collection size={9} /> {bucket.moduleCount || 0}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Col>

          <Col md={7}>
            {selectedBucketRegion ? (
              <TagRegionModulePanel tag={selectedTag} region={selectedBucketRegion} allRegionId={allRegionId} />
            ) : (
              <div className="arm-panel"><div className="arm-empty">Select a bucket to manage its modules.</div></div>
            )}
          </Col>
        </Row>
      )}
    </div>
  );
}

// Manages modules for ONE Tag x Region bucket. Mutations reuse the exact
// same addModuleToRegion/removeModuleFromRegion endpoints the region-first
// view used to — only the read queries add ?categoryId= to narrow
// everything to this tag. For a specific (non-"All") region, also shows a
// read-only "also visible here" list of this tag's modules that are
// visible via the permanent All bucket instead — informational only, not
// removable from here (matches the All region's own remove-is-blocked rule).
function TagRegionModulePanel({ tag, region, allRegionId }) {
  const isAllBucket = !!region.isDefault;
  const [assigned, setAssigned] = useState([]);
  const [available, setAvailable] = useState([]);
  const [alsoVisible, setAlsoVisible] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pickId, setPickId] = useState("");
  const [busy, setBusy] = useState(false);
  const [showReorder, setShowReorder] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [assignedRes, availRes, alsoRes] = await Promise.all([
        api.getRegionModules(region._id, tag._id),
        api.getRegionAvailableModules(region._id, tag._id),
        (!isAllBucket && allRegionId) ? api.getRegionModules(allRegionId, tag._id) : Promise.resolve(null),
      ]);
      setAssigned(assignedRes?.data || []);
      setAvailable(availRes?.data || []);
      setAlsoVisible(alsoRes?.data || []);
      setPickId("");
    } catch (err) {
      setError(err.message || "Failed to load this bucket's modules.");
    } finally {
      setLoading(false);
    }
  }, [region._id, tag._id, isAllBucket, allRegionId]);

  useEffect(() => { load(); }, [load]);

  const addModule = async () => {
    if (!pickId) return;
    setBusy(true);
    setError("");
    try {
      await api.addModuleToRegion(region._id, pickId);
      await load();
    } catch (err) {
      setError(err.message || "Failed to assign module.");
    } finally {
      setBusy(false);
    }
  };

  const removeModule = async (moduleId) => {
    setBusy(true);
    setError("");
    try {
      await api.removeModuleFromRegion(region._id, moduleId);
      await load();
    } catch (err) {
      setError(err.message || "Failed to remove module.");
    } finally {
      setBusy(false);
    }
  };

  const bucketLabel = `${tag?.name || ""}-${isAllBucket ? "All" : (region.code || region.name)}`;

  return (
    <div className="arm-panel">
      <div className="arm-panel__header d-flex align-items-center justify-content-between">
        <span className="d-flex align-items-center gap-2"><Collection size={13} /> {bucketLabel}</span>
        {assigned.length > 1 && (
          <Button size="sm" variant="outline-secondary" onClick={() => setShowReorder(true)} title="Reorder the path">
            <ArrowDownUp size={12} className="me-1" /> Reorder
          </Button>
        )}
      </div>
      {error && <Alert variant="danger" className="small py-2 m-2">{error}</Alert>}
      {loading ? (
        <div className="arm-panel__body"><Spinner animation="border" size="sm" /></div>
      ) : (
        <>
          <div className="arm-panel__body" style={{ maxHeight: 320, overflowY: "auto" }}>
            {assigned.length === 0 && alsoVisible.length === 0 && (
              <div className="arm-empty">No modules here yet.</div>
            )}
            <div className="d-flex flex-column">
              {assigned.map((mod, i) => (
                <div key={mod._id} className="arm-list-row">
                  <span><span className="arm-badge me-2">{i + 1}</span>{mod.title}</span>
                  {!isAllBucket && (
                    <button type="button" className="arm-list-row__remove" disabled={busy} onClick={() => removeModule(mod._id)} title="Remove from this region">
                      <X size={15} />
                    </button>
                  )}
                </div>
              ))}
              {!isAllBucket && alsoVisible.map((mod) => (
                <div key={mod._id} className="arm-list-row arm-list-row--muted">
                  <span>{mod.title}</span>
                  <span className="arm-badge">All regions</span>
                </div>
              ))}
            </div>
          </div>
          <div className="arm-panel__footer">
            <InputGroup size="sm">
              <Form.Select value={pickId} onChange={(e) => setPickId(e.target.value)} disabled={busy}>
                <option value="">
                  {available.length === 0
                    ? `No more "${tag?.name}" modules available`
                    : isAllBucket ? "Select a module to make visible everywhere…" : "Select a module to add…"}
                </option>
                {available.map((mod) => <option key={mod._id} value={mod._id}>{mod.title}</option>)}
              </Form.Select>
              <Button variant="outline-primary" disabled={!pickId || busy} onClick={addModule}>
                <PlusCircle />
              </Button>
            </InputGroup>
            <p className="arm-panel__hint">
              Only modules already tagged "{tag?.name}" can be added here — a module's tag is set in its own edit form.
            </p>
          </div>
        </>
      )}

      {showReorder && (
        <AdminRegionModuleReorderModal
          tag={tag}
          region={region}
          onClose={() => setShowReorder(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}
