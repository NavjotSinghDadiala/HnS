import React, { useEffect, useState } from 'react';
import { FaEdit, FaTrash, FaEye, FaPlus } from 'react-icons/fa';
import api from '../services/apiInstance';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [form, setForm] = useState({ title: '', builder_name: '', builder_id: '', location: '', description: '' });

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/projects');
      const data = res.data;
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.delete(`/projects/${id}`);
      setSuccess('Project deleted successfully');
      fetchProjects();
    } catch (err) {
      setError('Failed to delete project');
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setForm({
      title: project.title,
      builder_name: project.builder_name,
      builder_id: project.builder_id,
      location: project.location,
      description: project.description || '',
    });
    setShowForm(true);
  };

  const handleView = (slug) => {
    window.open(`/project/${slug}`, '_blank');
  };

  const handleCreate = () => {
    setEditingProject(null);
    setForm({ title: '', builder_name: '', builder_id: '', location: '', description: '' });
    setShowForm(true);
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingProject) {
        await api.patch(`/builders/${editingProject.builder_id}/projects/${editingProject.id}`, form);
      } else {
        await api.post(`/builders/${form.builder_id}/projects/step1`, form);
      }
      setSuccess(editingProject ? 'Project updated successfully' : 'Project created successfully');
      setShowForm(false);
      fetchProjects();
    } catch (err) {
      setError('Failed to save project');
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto', padding: 32, background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px #0001' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 28, fontWeight: 700 }}>All Projects</h2>
        <button onClick={handleCreate} style={{ background: '#667eea', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, fontSize: 16, display: 'flex', alignItems: 'center' }}>
          <FaPlus style={{ marginRight: 8 }} /> Create Project
        </button>
      </div>
      {success && <div style={{ color: 'green', marginBottom: 16 }}>{success}</div>}
      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
      {showForm && (
        <form onSubmit={handleFormSubmit} style={{ marginBottom: 32, background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
          <h3>{editingProject ? 'Edit Project' : 'Add New Project'}</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <input name="title" value={form.title} onChange={handleFormChange} placeholder="Project Name" required style={{ flex: 1, minWidth: 120 }} />
            <input name="builder_name" value={form.builder_name} onChange={handleFormChange} placeholder="Builder Name" required style={{ flex: 1, minWidth: 120 }} />
            <input name="builder_id" value={form.builder_id} onChange={handleFormChange} placeholder="Builder RERA ID" required style={{ flex: 1, minWidth: 120 }} />
            <input name="location" value={form.location} onChange={handleFormChange} placeholder="Location" required style={{ flex: 1, minWidth: 120 }} />
            <input name="description" value={form.description} onChange={handleFormChange} placeholder="Description" style={{ flex: 2, minWidth: 180 }} />
          </div>
          <button type="submit" style={{ marginTop: 16, padding: '8px 24px', background: '#223A5F', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600 }}>{editingProject ? 'Update' : 'Add'}</button>
          <button type="button" onClick={() => setShowForm(false)} style={{ marginLeft: 16, padding: '8px 24px', background: '#aaa', color: '#fff', border: 'none', borderRadius: 6 }}>Cancel</button>
        </form>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 24 }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: 8, border: '1px solid #ddd' }}>Project Name</th>
            <th style={{ padding: 8, border: '1px solid #ddd' }}>Builder</th>
            <th style={{ padding: 8, border: '1px solid #ddd' }}>Location</th>
            <th style={{ padding: 8, border: '1px solid #ddd' }}>Primary Slug</th>
            <th style={{ padding: 8, border: '1px solid #ddd' }}>Alias Slugs</th>
            <th style={{ padding: 8, border: '1px solid #ddd' }}>Description</th>
            <th style={{ padding: 8, border: '1px solid #ddd' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map(project => (
            <tr key={project.id}>
              <td style={{ padding: 8, border: '1px solid #ddd' }}>{project.title}</td>
              <td style={{ padding: 8, border: '1px solid #ddd' }}>{project.builder_name}</td>
              <td style={{ padding: 8, border: '1px solid #ddd' }}>{project.location}</td>
              <td style={{ padding: 8, border: '1px solid #ddd' }}>{project.primary_slug}</td>
              <td style={{ padding: 8, border: '1px solid #ddd' }}>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {(Array.isArray(project.alias_slugs) ? project.alias_slugs : (project.alias_slugs ? JSON.parse(project.alias_slugs) : [])).map((slug, idx) => (
                    <li key={idx} style={{ wordBreak: 'break-all' }}>{slug}</li>
                  ))}
                </ul>
              </td>
              <td style={{ padding: 8, border: '1px solid #ddd' }}>
                <div style={{ maxWidth: 200, whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
                  {project.description}
                </div>
              </td>
              <td style={{ padding: 8, border: '1px solid #ddd' }}>
                <button onClick={() => handleView(project.primary_slug)} style={{ marginRight: 8, padding: '4px 12px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4 }}><FaEye /></button>
                <button onClick={() => handleEdit(project)} style={{ marginRight: 8, padding: '4px 12px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 4 }}><FaEdit /></button>
                <button onClick={() => handleDelete(project.id)} style={{ padding: '4px 12px', background: '#e53935', color: '#fff', border: 'none', borderRadius: 4 }}><FaTrash /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectList; 