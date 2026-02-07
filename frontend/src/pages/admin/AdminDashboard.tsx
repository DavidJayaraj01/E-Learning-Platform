import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    Users,
    BookOpen,
    LogOut,
    BarChart,
    LayoutDashboard,
    Bell,
    Search,
    Settings,
    UserCheck,
    MoreVertical
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');

    // Mock data for admin stats
    const stats = [
        { title: 'Total Users', value: '1,234', icon: Users, color: 'bg-blue-500' },
        { title: 'Active Courses', value: '45', icon: BookOpen, color: 'bg-green-500' },
        { title: 'Pending Approvals', value: '12', icon: UserCheck, color: 'bg-yellow-500' },
        { title: 'Total Revenue', value: '$12,450', icon: BarChart, color: 'bg-purple-500' },
    ];

    const recentUsers = [
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Student', status: 'Active' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Instructor', status: 'Pending' },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Student', status: 'Active' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <div className="w-64 bg-slate-900 text-white min-h-screen hidden md:block">
                <div className="p-6">
                    <h1 className="text-xl font-bold tracking-wider">AdminPanel</h1>
                </div>
                <nav className="mt-6 px-4 space-y-2">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <LayoutDashboard size={20} />
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'users' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <Users size={20} />
                        Users
                    </button>
                    <button
                        onClick={() => setActiveTab('courses')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'courses' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <BookOpen size={20} />
                        Courses
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <Settings size={20} />
                        Settings
                    </button>
                </nav>
                <div className="absolute bottom-0 w-64 p-4 border-t border-slate-800">
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-semibold text-gray-800 capitalize">{activeTab}</h2>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-64"
                            />
                        </div>
                        <button className="text-gray-500 hover:text-gray-700 relative">
                            <Bell size={20} />
                            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
                        </button>
                        <div className="flex items-center gap-3 border-l pl-6 border-gray-200">
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">{user?.name || 'Admin User'}</p>
                                <p className="text-xs text-gray-500">Administrator</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">
                                A
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-auto p-6">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {stats.map((stat, index) => (
                                    <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
                                        <div className={`p-4 rounded-lg ${stat.color} bg-opacity-10`}>
                                            <stat.icon size={24} className={`text-${stat.color.split('-')[1]}-600`} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                                            <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Recent Users Table */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-gray-900">Recent Registrations</h3>
                                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
                                </div>
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {recentUsers.map((user) => (
                                            <tr key={user.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                                                            {user.name.charAt(0)}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                            <div className="text-sm text-gray-500">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                        {user.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <button className="text-gray-400 hover:text-gray-600">
                                                        <MoreVertical size={20} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab !== 'overview' && (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            <p>Wait for {activeTab} module implementation...</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
