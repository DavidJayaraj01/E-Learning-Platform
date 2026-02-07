import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Settings,
    Palette,
    Users,
    Mail,
    CreditCard,
    Bell,
    UserPlus,
    Pencil,
    Trash2,
    ChevronLeft,
    ChevronRight,
    LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AdminSettings: React.FC = () => {
    const navigate = useNavigate();
    const { } = useAuth();
    const [activeTab, setActiveTab] = useState('Users & Roles');

    const users = [
        { id: 1, name: 'Mitchell Admin', email: 'admin@example.com', role: 'Admin', status: 'Active', initials: 'MA' },
        { id: 2, name: 'Joel Willis', email: 'joel.willis@edu.com', role: 'Instructor', status: 'Active', initials: 'JW' },
        { id: 3, name: 'Anita Oliver', email: 'anita.o@user.com', role: 'Student', status: 'Inactive', initials: 'AO' },
        { id: 4, name: 'Marc Demo', email: 'm.demo@edu.com', role: 'Student', status: 'Active', initials: 'MD' },
    ];

    const sidebarItems = [
        {
            section: 'GENERAL SETTINGS', items: [
                { id: 'General', icon: Settings, label: 'General' },
                { id: 'Appearance', icon: Palette, label: 'Appearance' },
                { id: 'Users & Roles', icon: Users, label: 'Users & Roles' },
            ]
        },
        {
            section: 'PLATFORM', items: [
                { id: 'Email Templates', icon: Mail, label: 'Email Templates' },
                { id: 'Payments', icon: CreditCard, label: 'Payments' },
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-[#FDFDFF] flex flex-col font-sans">
            {/* Header */}
            <header className="bg-white px-8 py-4 flex items-center justify-between border-b border-gray-100 sticky top-0 z-50">
                <div className="flex items-center gap-12">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/admin/dashboard')}>
                        <div className="bg-[#7E2259] p-1.5 rounded-lg">
                            <LayoutDashboard className="text-white w-5 h-5" />
                        </div>
                        <span className="text-xl font-bold text-[#2D2D2D]">Admin<span className="text-slate-400">Panel</span></span>
                    </div>

                    <nav className="flex items-center gap-6">
                        <button
                            onClick={() => navigate('/admin/dashboard')}
                            className="text-gray-500 hover:text-[#7E2259] font-semibold text-sm transition-colors"
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={() => navigate('/admin/dashboard')}
                            className="text-gray-500 hover:text-[#7E2259] font-semibold text-sm transition-colors"
                        >
                            Courses
                        </button>
                        <button className="bg-[#F8F1F6] text-[#7E2259] px-4 py-1.5 rounded-lg font-bold text-sm">
                            Settings
                        </button>
                    </nav>
                </div>

                <div className="flex items-center gap-6">
                    <button className="text-gray-400 hover:text-[#7E2259] transition-colors relative">
                        <Bell size={20} />
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                    <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-100 cursor-pointer">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Avatar" />
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <aside className="w-72 bg-white border-r border-gray-100 p-8 space-y-10">
                    {sidebarItems.map((section) => (
                        <div key={section.section} className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{section.section}</h4>
                            <div className="space-y-1">
                                {section.items.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id
                                            ? 'bg-[#F8F1F6] text-[#7E2259] font-bold shadow-sm'
                                            : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                                            }`}
                                    >
                                        <item.icon size={18} />
                                        <span className="text-sm tracking-tight">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-12 overflow-y-auto">
                    <div className="max-w-4xl animate-in fade-in duration-500">
                        {activeTab === 'Users & Roles' && (
                            <div className="space-y-8">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Users & Roles</h2>
                                        <p className="text-sm text-slate-400">Manage platform administrators, instructors, and students.</p>
                                    </div>
                                    <button className="bg-[#7E2259] text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#6D1F4D] active:scale-95 transition-all shadow-lg shadow-[#7E2259]/20">
                                        <UserPlus size={18} />
                                        Add New User
                                    </button>
                                </div>

                                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.02)] overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Role</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {users.map((u) => (
                                                <tr key={u.id} className="group hover:bg-slate-50/30 transition-all">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-[11px] font-black text-slate-400 border border-slate-100">
                                                                {u.initials}
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-700">{u.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-sm text-slate-500">{u.email}</td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex justify-center">
                                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${u.role === 'Admin' ? 'bg-[#7E2259] text-white' :
                                                                    u.role === 'Instructor' ? 'bg-[#E1F2FF] text-[#0066FF]' :
                                                                        'bg-slate-100 text-slate-500'
                                                                }`}>
                                                                {u.role}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${u.status === 'Active' ? 'bg-[#22C55E]' : 'bg-slate-300'}`}></div>
                                                            <span className={`text-sm font-bold ${u.status === 'Active' ? 'text-slate-600' : 'text-slate-300 italic'}`}>
                                                                {u.status}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button className="p-2 text-slate-300 hover:text-[#0066FF] hover:bg-blue-50 rounded-lg transition-all">
                                                                <Pencil size={18} />
                                                            </button>
                                                            <button className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    <div className="px-10 py-6 border-t border-gray-50 flex items-center justify-between bg-slate-50/20">
                                        <span className="text-xs font-bold text-slate-300 italic">Showing 4 of 128 users</span>
                                        <div className="flex items-center gap-2">
                                            <button className="p-2 text-slate-300 hover:text-slate-800 transition-colors bg-white border border-slate-100 rounded-lg">
                                                <ChevronLeft size={18} />
                                            </button>
                                            <button className="p-2 text-slate-300 hover:text-slate-800 transition-colors bg-white border border-slate-100 rounded-lg">
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'General' && (
                            <div className="space-y-8">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-bold text-slate-800 tracking-tight">General Settings</h2>
                                    <p className="text-sm text-slate-400">Configure basic information about your LearnSphere platform.</p>
                                </div>
                                <div className="bg-white rounded-[2rem] border border-gray-100 p-10 space-y-6 shadow-sm">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Site Name</label>
                                            <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#7E2259]/10 text-sm font-bold text-slate-700" defaultValue="LearnSphere Pro" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Support Email</label>
                                            <input type="email" className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#7E2259]/10 text-sm font-bold text-slate-700" defaultValue="support@edupro.com" />
                                        </div>
                                        <div className="space-y-2 col-span-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Description</label>
                                            <textarea className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#7E2259]/10 text-sm font-bold text-slate-700 h-32" defaultValue="The world's leading LearnSphere experience for professional development." />
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-4">
                                        <button className="bg-[#7E2259] text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-[#7E2259]/20">Save Changes</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Appearance' && (
                            <div className="space-y-8">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Appearance</h2>
                                    <p className="text-sm text-slate-400">Customize the visual identity of your portal.</p>
                                </div>
                                <div className="bg-white rounded-[2rem] border border-gray-100 p-10 space-y-8 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800">Primary Branding Color</h4>
                                            <p className="text-xs text-slate-400">Used for buttons, links, and highlights.</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-[#7E2259] border-2 border-white shadow-sm ring-1 ring-slate-100"></div>
                                            <span className="text-sm font-mono font-bold text-slate-600">#7E2259</span>
                                        </div>
                                    </div>
                                    <div className="border-t border-slate-50 pt-8">
                                        <h4 className="text-sm font-bold text-slate-800 mb-4">Logo Management</h4>
                                        <div className="flex items-center gap-8">
                                            <div className="w-32 h-32 rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 gap-2 cursor-pointer hover:bg-slate-100 transition-colors">
                                                <Palette size={24} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Upload</span>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-slate-600">Site Logo</p>
                                                <p className="text-[10px] text-slate-400 max-w-[200px]">Recommended: SVG or PNG with transparent background. Max size 2MB.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Email Templates' && (
                            <div className="space-y-8">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Email Templates</h2>
                                    <p className="text-sm text-slate-400">Manage automated communications sent to users.</p>
                                </div>
                                <div className="space-y-4">
                                    {['Welcome Email', 'Password Reset', 'Course Completion', 'Subscription Renewal'].map((tmp) => (
                                        <div key={tmp} className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-slate-50 p-3 rounded-xl text-slate-400 group-hover:text-[#7E2259] transition-colors">
                                                    <Mail size={20} />
                                                </div>
                                                <span className="text-sm font-bold text-slate-700">{tmp}</span>
                                            </div>
                                            <button className="text-[10px] font-black text-[#7E2259] uppercase tracking-widest hover:underline">Edit Template</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'Payments' && (
                            <div className="space-y-8">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Payments & Revenue</h2>
                                    <p className="text-sm text-slate-400">Manage payment gateways and financial settings.</p>
                                </div>
                                <div className="bg-white rounded-[2rem] border border-gray-100 p-10 space-y-8 shadow-sm">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Currency</label>
                                            <select className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/50 focus:outline-none text-sm font-bold text-slate-700">
                                                <option>USD ($)</option>
                                                <option>EUR (€)</option>
                                                <option>GBP (£)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tax Rate (%)</label>
                                            <input type="number" className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/50 focus:outline-none text-sm font-bold text-slate-700" defaultValue="0" />
                                        </div>
                                    </div>
                                    <div className="border-t border-slate-50 pt-8 flex items-center justify-between bg-slate-50/30 -mx-10 px-10 pb-8 mt-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-[#008CFF] rounded-xl flex items-center justify-center text-white">
                                                <CreditCard size={24} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-800">Stripe Integration</h4>
                                                <p className="text-xs text-slate-400 italic">Connected to production environment</p>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest">Active</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-100 px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <p className="text-sm font-bold text-slate-300 tracking-tight">© 2024 AdminPanel User Management. All rights reserved.</p>
                <div className="flex items-center gap-8">
                    <button className="text-sm font-bold text-slate-400 hover:text-[#7E2259] transition-colors">System Status</button>
                    <button className="text-sm font-bold text-slate-400 hover:text-[#7E2259] transition-colors">Security Audit</button>
                    <button className="text-sm font-bold text-slate-400 hover:text-[#7E2259] transition-colors">Help Center</button>
                </div>
            </footer>
        </div>
    );
};

export default AdminSettings;
