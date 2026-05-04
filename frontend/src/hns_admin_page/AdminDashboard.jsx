import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaEye, FaUsers, FaHome, FaEnvelope, FaStar, FaUser } from 'react-icons/fa';
import api from '../services/apiInstance';

const initialForm = {
    builder_name: '',
    builder_id: '',
    title: '',
    description: '',
    location: '',
    total_units: '',
    price_range: '',
    completion_date: '',
    status: '',
};

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalProperties: 0,
        totalEnquiries: 0,
        totalReviews: 0,
        recentActivities: []
    });
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('view');
    const [activeTab, setActiveTab] = useState('builders'); // 'builders' or 'users'
    const [projects, setProjects] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [showDeleteId, setShowDeleteId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Keep local-auth users gated here; Clerk users are already verified by AdminRoute.
        const rawUser = localStorage.getItem('user');
        if (rawUser) {
            try {
                const user = JSON.parse(rawUser);
                if (user?.role !== 'admin') {
                    navigate('/');
                    return;
                }
            } catch {
                navigate('/');
                return;
            }
        }

        // Fetch dashboard stats and users
        fetchDashboardStats();
        fetchUsers();
        fetchProjects();

        // Set up polling for real-time updates (every 30 seconds)
        const interval = setInterval(() => {
            fetchDashboardStats();
            fetchUsers();
            fetchProjects();
        }, 30000);

        // Cleanup interval on component unmount
        return () => clearInterval(interval);
    }, [navigate]);

    // Clear success message after 3 seconds
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                setSuccess(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            const data = response.data;
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
            setError(error.message);
        }
    };

    const handleUserView = (user) => {
        setSelectedUser(user);
        setModalType('view');
        setShowModal(true);
    };

    const handleUserEdit = (user) => {
        setSelectedUser(user);
        setModalType('edit');
        setShowModal(true);
    };

    const handleUserDelete = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await api.delete(`/users/${userId}`);
                fetchUsers();
                setSuccess('User deleted successfully');
            } catch (error) {
                setError(error.message);
            }
        }
    };

    const handleUserUpdate = async (updatedUser) => {
        try {
            await api.put(`/users/${updatedUser.id}`, updatedUser);
            fetchUsers();
            setShowModal(false);
            setSuccess('User updated successfully');
        } catch (error) {
            setError(error.message);
        }
    };

    const fetchDashboardStats = async () => {
        try {
            const response = await api.get('/admin/stats');
            const data = response.data;
            setStats(data);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects');
            const data = response.data;
            setProjects(data);
        } catch (error) {
            console.error('Error fetching projects:', error);
            setError(error.message);
        }
    };

    const getActivityIcon = (type) => {
        switch (type) {
            case 'user':
                return (
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                );
            case 'property':
                return (
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
        }
    };

    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleAdd = async e => {
        e.preventDefault();
        setError(null);
        try {
            await api.post(`/builders/${form.builder_id}/projects/step1`, {
                builder_name: form.builder_name,
                title: form.title,
                description: form.description,
                location: form.location,
            });
            setForm(initialForm);
            fetchProjects();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleEditProject = project => {
        setEditingId(project.id);
        setForm({
            builder_name: project.builder_name,
            builder_id: project.builder_id,
            title: project.title,
            description: project.description,
            location: project.location,
            total_units: project.total_units || '',
            price_range: project.price_range || '',
            completion_date: project.completion_date ? project.completion_date.split('T')[0] : '',
            status: project.status || '',
        });
    };

    const handleUpdateProject = async e => {
        e.preventDefault();
        setError(null);
        try {
            await api.patch(`/builders/${form.builder_id}/projects/${editingId}`, {
                builder_name: form.builder_name,
                title: form.title,
                description: form.description,
                location: form.location,
                total_units: form.total_units,
                price_range: form.price_range,
                completion_date: form.completion_date,
                status: form.status,
            });
            setEditingId(null);
            setForm(initialForm);
            fetchProjects();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteProject = async id => {
        setError(null);
        try {
            await api.delete(`/projects/${id}`);
            setShowDeleteId(null);
            fetchProjects();
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline"> {error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Add Project List Navigation */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
                <button
                    onClick={() => navigate('/admin/projects')}
                    style={{ background: '#667eea', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, fontSize: 16 }}
                >
                    All Projects
                </button>
            </div>
            {/* Success Message */}
            {success && (
                <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Success!</strong>
                    <span className="block sm:inline"> {success}</span>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline"> {error}</span>
                </div>
            )}

            {/* Welcome Section */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Welcome back, Admin!</h1>
                <p className="mt-2 text-gray-600">Here's what's happening with your platform today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-white bg-opacity-20 rounded-lg p-3">
                                <FaUsers className="h-6 w-6 text-white" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-white text-opacity-80 truncate">Total Users</dt>
                                    <dd className="text-2xl font-bold text-white">{stats.totalUsers}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-white bg-opacity-20 rounded-lg p-3">
                                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-white text-opacity-80 truncate">Total Projects</dt>
                                    <dd className="text-2xl font-bold text-white">{stats.totalProjects || 0}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-white bg-opacity-20 rounded-lg p-3">
                                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-white text-opacity-80 truncate">Total Reviews</dt>
                                    <dd className="text-2xl font-bold text-white">{stats.totalReviews}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-white bg-opacity-20 rounded-lg p-3">
                                <FaStar className="h-6 w-6 text-white" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-white text-opacity-80 truncate">Total Projects</dt>
                                    <dd className="text-2xl font-bold text-white">{stats.totalProjects || 0}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Management Tabs */}
            <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden">
                <div className="border-b border-gray-200">
                    <nav className="flex -mb-px">
                        <button
                            onClick={() => setActiveTab('builders')}
                            className={`px-6 py-4 text-sm font-medium ${activeTab === 'builders'
                                    ? 'border-b-2 border-blue-500 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Builders Management
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`px-6 py-4 text-sm font-medium ${activeTab === 'users'
                                    ? 'border-b-2 border-blue-500 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Users Management
                        </button>
                    </nav>
                </div>

                {/* Builders Management Section */}
                {activeTab === 'builders' && (
                    <div>
                        <div className="px-6 py-5 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-gray-900">Builders Management</h2>
                                <button
                                    onClick={() => navigate('/dashboard/add-builder')}
                                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add New Builder
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {/* Builders are no longer fetched, so this section is empty */}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Users Management Section */}
                {activeTab === 'users' && (
                    <div>
                        <div className="px-6 py-5 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-gray-900">Users Management</h2>
                                <button
                                    onClick={() => navigate('/dashboard/add-user')}
                                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add New User
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-200">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{user.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{user.role}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-3">
                                                    <button
                                                        onClick={() => handleUserView(user)}
                                                        className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                                                    >
                                                        <FaEye className="inline-block mr-1" /> View
                                                    </button>
                                                    <button
                                                        onClick={() => handleUserEdit(user)}
                                                        className="text-yellow-600 hover:text-yellow-900 transition-colors duration-200"
                                                    >
                                                        <FaEdit className="inline-block mr-1" /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleUserDelete(user.id)}
                                                        className="text-red-600 hover:text-red-900 transition-colors duration-200"
                                                    >
                                                        <FaTrash className="inline-block mr-1" /> Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Recent Activities</h2>
                </div>
                <div className="p-6">
                    {stats.recentActivities.length > 0 ? (
                        <div className="flow-root">
                            <ul className="-mb-8">
                                {stats.recentActivities.map((activity, index) => (
                                    <li key={index}>
                                        <div className="relative pb-8">
                                            {index !== stats.recentActivities.length - 1 && (
                                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                            )}
                                            <div className="relative flex space-x-3">
                                                {getActivityIcon(activity.type)}
                                                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                                    <div>
                                                        <p className="text-sm text-gray-500">
                                                            {activity.message}
                                                        </p>
                                                    </div>
                                                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                                        <time dateTime={activity.timestamp}>
                                                            {new Date(activity.timestamp).toLocaleString()}
                                                        </time>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p className="mt-2 text-gray-500">No recent activities</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold text-gray-900">
                                {activeTab === 'builders'
                                    ? (modalType === 'view' ? 'Builder Details' : 'Edit Builder')
                                    : (modalType === 'view' ? 'User Details' : 'Edit User')
                                }
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {activeTab === 'builders' ? (
                            modalType === 'view' ? (
                                // View Mode for Builders
                                <div className="space-y-6">
                                    {/* Company Information */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="text-lg font-medium text-gray-900 mb-4">Company Information</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                                                <p className="mt-1 text-gray-900 font-medium">{selectedUser.name}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Brand Name</label>
                                                <p className="mt-1 text-gray-900 font-medium">{selectedUser.brand_name || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Location</label>
                                                <p className="mt-1 text-gray-900 font-medium">{selectedUser.location}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">RERA ID</label>
                                                <p className="mt-1 text-gray-900 font-medium">{selectedUser.rera_id}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact Information */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                                <p className="mt-1 text-gray-900 font-medium">{selectedUser.contact_email}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Phone</label>
                                                <p className="mt-1 text-gray-900 font-medium">{selectedUser.contact_number}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Website</label>
                                                <p className="mt-1 text-gray-900 font-medium">{selectedUser.website_url || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Established Year</label>
                                                <p className="mt-1 text-gray-900 font-medium">{selectedUser.established_year || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="text-lg font-medium text-gray-900 mb-4">Description</h4>
                                        <p className="text-gray-900">{selectedUser.short_description || 'No description available'}</p>
                                    </div>

                                    {/* Status */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="text-lg font-medium text-gray-900 mb-4">Status</h4>
                                        <div className="flex items-center">
                                            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${selectedUser.verified
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {selectedUser.verified ? 'Verified' : 'Pending'}
                                            </span>
                                            <button
                                                onClick={() => setModalType('edit')}
                                                className="ml-4 text-blue-600 hover:text-blue-900 transition-colors duration-200"
                                            >
                                                <FaEdit className="inline-block mr-1" /> Edit Details
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // Edit Mode for Builders
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    handleUserUpdate(selectedUser);
                                }}>
                                    <div className="space-y-6">
                                        {/* Company Information */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="text-lg font-medium text-gray-900 mb-4">Company Information</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Company Name</label>
                                                    <input
                                                        type="text"
                                                        value={selectedUser.company_name || ''}
                                                        onChange={(e) => setSelectedUser({ ...selectedUser, company_name: e.target.value })}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Brand Name</label>
                                                    <input
                                                        type="text"
                                                        value={selectedUser.brand_name || ''}
                                                        onChange={(e) => setSelectedUser({ ...selectedUser, brand_name: e.target.value })}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Location</label>
                                                    <input
                                                        type="text"
                                                        value={selectedUser.location || ''}
                                                        onChange={(e) => setSelectedUser({ ...selectedUser, location: e.target.value })}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Established Year</label>
                                                    <input
                                                        type="number"
                                                        value={selectedUser.established_year || ''}
                                                        onChange={(e) => setSelectedUser({ ...selectedUser, established_year: e.target.value })}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Contact Information */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                                    <input
                                                        type="email"
                                                        value={selectedUser.contact_email || ''}
                                                        onChange={(e) => setSelectedUser({ ...selectedUser, contact_email: e.target.value })}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                                                    <input
                                                        type="text"
                                                        value={selectedUser.contact_number || ''}
                                                        onChange={(e) => setSelectedUser({ ...selectedUser, contact_number: e.target.value })}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Website</label>
                                                    <input
                                                        type="url"
                                                        value={selectedUser.website_url || ''}
                                                        onChange={(e) => setSelectedUser({ ...selectedUser, website_url: e.target.value })}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="text-lg font-medium text-gray-900 mb-4">Description</h4>
                                            <textarea
                                                value={selectedUser.short_description || ''}
                                                onChange={(e) => setSelectedUser({ ...selectedUser, short_description: e.target.value })}
                                                rows={3}
                                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {/* Verification Status */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="text-lg font-medium text-gray-900 mb-4">Verification Status</h4>
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="verified"
                                                    checked={selectedUser.verified || false}
                                                    onChange={(e) => setSelectedUser({ ...selectedUser, verified: e.target.checked })}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor="verified" className="ml-2 block text-sm text-gray-900">
                                                    Verified Builder
                                                </label>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex justify-end space-x-3">
                                            <button
                                                type="button"
                                                onClick={() => setModalType('view')}
                                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                                            >
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            )
                        ) : (
                            // Users Management
                            modalType === 'view' ? (
                                // View Mode for Users
                                <div className="space-y-6">
                                    {/* User Information */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="text-lg font-medium text-gray-900 mb-4">User Information</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                                <p className="mt-1 text-gray-900 font-medium">{selectedUser.name}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                                <p className="mt-1 text-gray-900 font-medium">{selectedUser.email}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Role</label>
                                                <p className="mt-1 text-gray-900 font-medium">{selectedUser.role}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                                <p className="mt-1 text-gray-900 font-medium">
                                                    <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${selectedUser.is_active
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {selectedUser.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Created At</label>
                                                <p className="mt-1 text-gray-900 font-medium">
                                                    {new Date(selectedUser.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => setModalType('edit')}
                                            className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                                        >
                                            <FaEdit className="inline-block mr-1" /> Edit Details
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // Edit Mode for Users
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    handleUserUpdate(selectedUser);
                                }}>
                                    <div className="space-y-6">
                                        {/* User Information */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="text-lg font-medium text-gray-900 mb-4">User Information</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                                    <input
                                                        type="text"
                                                        value={selectedUser.name || ''}
                                                        onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                                    <input
                                                        type="email"
                                                        value={selectedUser.email || ''}
                                                        onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Role</label>
                                                    <select
                                                        value={selectedUser.role || ''}
                                                        onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        required
                                                    >
                                                        <option value="">Select Role</option>
                                                        <option value="admin">Admin</option>
                                                        <option value="buyer">Buyer</option>
                                                        <option value="seller">Seller</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Status</label>
                                                    <div className="mt-1">
                                                        <label className="inline-flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedUser.is_active || false}
                                                                onChange={(e) => setSelectedUser({ ...selectedUser, is_active: e.target.checked })}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                            />
                                                            <span className="ml-2 text-sm text-gray-900">Active User</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex justify-end space-x-3">
                                            <button
                                                type="button"
                                                onClick={() => setModalType('view')}
                                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                                            >
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            )
                        )}
                    </div>
                </div>
            )}

            {/* All Projects Section */}
            <div className="mt-8">
                <h2 className="text-2xl font-semibold mb-4">All Projects (Admin View)</h2>
                {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
                {/* Add Project Form */}
                <form onSubmit={editingId ? handleUpdateProject : handleAdd} style={{ marginBottom: 32, background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
                    <h3>{editingId ? 'Edit Project' : 'Add New Project'}</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                        <input name="builder_name" value={form.builder_name} onChange={handleChange} placeholder="Builder Name" required style={{ flex: 1, minWidth: 120 }} />
                        <input name="builder_id" value={form.builder_id} onChange={handleChange} placeholder="RERA ID" required style={{ flex: 1, minWidth: 120 }} />
                        <input name="title" value={form.title} onChange={handleChange} placeholder="Project Name" required style={{ flex: 1, minWidth: 120 }} />
                        <input name="description" value={form.description} onChange={handleChange} placeholder="Description" style={{ flex: 2, minWidth: 180 }} />
                        <input name="location" value={form.location} onChange={handleChange} placeholder="Location" style={{ flex: 1, minWidth: 120 }} />
                        <input name="total_units" value={form.total_units} onChange={handleChange} placeholder="Total Units" type="number" style={{ flex: 1, minWidth: 100 }} />
                        <input name="price_range" value={form.price_range} onChange={handleChange} placeholder="Price Range" style={{ flex: 1, minWidth: 120 }} />
                        <input name="completion_date" value={form.completion_date} onChange={handleChange} placeholder="Completion Date" type="date" style={{ flex: 1, minWidth: 120 }} />
                        <input name="status" value={form.status} onChange={handleChange} placeholder="Status" style={{ flex: 1, minWidth: 120 }} />
                    </div>
                    <button type="submit" style={{ marginTop: 16, padding: '8px 24px', background: '#223A5F', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600 }}>{editingId ? 'Update' : 'Add'}</button>
                    {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(initialForm); }} style={{ marginLeft: 16, padding: '8px 24px', background: '#aaa', color: '#fff', border: 'none', borderRadius: 6 }}>Cancel</button>}
                </form>
                {/* Projects Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 24 }}>
                    <thead>
                        <tr style={{ background: '#f5f5f5' }}>
                            <th style={{ padding: 8, border: '1px solid #ddd' }}>Project Name</th>
                            <th style={{ padding: 8, border: '1px solid #ddd' }}>Builder</th>
                            <th style={{ padding: 8, border: '1px solid #ddd' }}>RERA ID</th>
                            <th style={{ padding: 8, border: '1px solid #ddd' }}>Status</th>
                            <th style={{ padding: 8, border: '1px solid #ddd' }}>Primary Slug</th>
                            <th style={{ padding: 8, border: '1px solid #ddd' }}>Description</th>
                            <th style={{ padding: 8, border: '1px solid #ddd' }}>Location</th>
                            <th style={{ padding: 8, border: '1px solid #ddd' }}>Completion Date</th>
                            <th style={{ padding: 8, border: '1px solid #ddd' }}>Created At</th>
                            <th style={{ padding: 8, border: '1px solid #ddd' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map(project => (
                            <tr key={project.id}>
                                <td style={{ padding: 8, border: '1px solid #ddd' }}>{project.title}</td>
                                <td style={{ padding: 8, border: '1px solid #ddd' }}>{project.builder_name}</td>
                                <td style={{ padding: 8, border: '1px solid #ddd' }}>{project.builder_id}</td>
                                <td style={{ padding: 8, border: '1px solid #ddd' }}>{project.status}</td>
                                <td style={{ padding: 8, border: '1px solid #ddd' }}>{project.primary_slug}</td>
                                <td style={{ padding: 8, border: '1px solid #ddd' }}>{project.description}</td>
                                <td style={{ padding: 8, border: '1px solid #ddd' }}>{project.location}</td>
                                <td style={{ padding: 8, border: '1px solid #ddd' }}>{project.completion_date}</td>
                                <td style={{ padding: 8, border: '1px solid #ddd' }}>{project.created_at}</td>
                                <td style={{ padding: 8, border: '1px solid #ddd' }}>
                                    <button onClick={() => handleEditProject(project)} style={{ marginRight: 8, padding: '4px 12px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 4 }}>Edit</button>
                                    <button onClick={() => setShowDeleteId(project.id)} style={{ padding: '4px 12px', background: '#e53935', color: '#fff', border: 'none', borderRadius: 4 }}>Delete</button>
                                    {showDeleteId === project.id && (
                                        <div style={{ background: '#fff', border: '1px solid #ddd', padding: 8, borderRadius: 4, marginTop: 4 }}>
                                            <div>Are you sure?</div>
                                            <button onClick={() => handleDeleteProject(project.id)} style={{ marginRight: 8, padding: '4px 12px', background: '#e53935', color: '#fff', border: 'none', borderRadius: 4 }}>Yes</button>
                                            <button onClick={() => setShowDeleteId(null)} style={{ padding: '4px 12px', background: '#aaa', color: '#fff', border: 'none', borderRadius: 4 }}>No</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDashboard; 