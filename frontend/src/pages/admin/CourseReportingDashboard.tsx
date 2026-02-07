import React from 'react';
import {
    Users,
    Hourglass,
    MoreHorizontal,
    CheckCircle,
    Moon,
    ChevronLeft,
    ChevronRight,
    Search,
    LayoutPanelTop,
    Info,
    Settings2,
    CheckCircle2,
    X as CloseIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CourseReportingDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const [visibleColumns, setVisibleColumns] = React.useState<string[]>([
        'S.No.', 'Course Name', 'Participant name', 'Enrolled Date', 'Start date', 'Time spent', 'Completion %', 'Completed date', 'Status'
    ]);

    const stats = [
        { label: 'Total Participants', value: '8', icon: Users, color: 'text-slate-500' },
        { label: 'Yet to Start', value: '5', icon: Hourglass, color: 'text-[#7E2259]' },
        { label: 'In Progress', value: '2', icon: MoreHorizontal, color: 'text-[#7E2259]' },
        { label: 'Completed', value: '1', icon: CheckCircle, color: 'text-[#7E2259]' },
    ];

    const usersData = [
        {
            sno: 1,
            courseName: 'Basics of CRM',
            participantName: 'Salman Khan',
            enrolledDate: 'Feb 14',
            startDate: 'Feb 16',
            timeSpent: '2:20',
            completion: '30%',
            completedDate: 'Feb 21',
            status: 'In Progress'
        },
        {
            sno: 2,
            courseName: 'Advanced Sales',
            participantName: 'Rahul Sharma',
            enrolledDate: 'Jan 10',
            startDate: 'Jan 12',
            timeSpent: '8:45',
            completion: '100%',
            completedDate: 'Jan 15',
            status: 'Completed'
        }
    ];

    return (
        <div className="min-h-screen bg-[#FDFDFF] font-sans">
            {/* Header */}
            <header className="bg-white px-10 py-4 flex items-center justify-between border-b border-gray-50 sticky top-0 z-50">
                <div
                    className="flex items-center gap-4 cursor-pointer group"
                    onClick={() => navigate('/admin/dashboard')}
                >
                    <div className="bg-[#7E2259] p-2 rounded-lg group-hover:scale-110 transition-transform">
                        <LayoutPanelTop className="text-white" size={20} />
                    </div>
                    <h1 className="text-xl font-black text-slate-800 tracking-tight group-hover:text-[#7E2259] transition-colors">
                        Reporting Dashboard
                    </h1>
                </div>

                <div className="flex items-center gap-8">
                    <button className="text-slate-400 hover:text-slate-600 transition-colors">
                        <Moon size={22} />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-[#7E2259] flex items-center justify-center font-black text-white text-xs shadow-md cursor-pointer">
                        JD
                    </div>
                </div>
            </header>

            <div className="flex relative">
                {/* Customizable Table Sidebar */}
                {isSidebarOpen && (
                    <div className="w-80 bg-white border-r border-slate-100 min-h-[calc(100vh-72px)] p-8 space-y-8 animate-in slide-in-from-left duration-300 shadow-2xl z-40 sticky top-[72px] h-fit">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Settings2 size={20} className="text-slate-400" />
                                    <h3 className="text-lg font-black text-slate-800">Customizable table</h3>
                                </div>
                                <button
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="text-slate-300 hover:text-slate-500 transition-colors"
                                >
                                    <CloseIcon size={20} />
                                </button>
                            </div>
                            <p className="text-[11px] font-black text-[#7E2259] uppercase tracking-wider italic">
                                Pick which columns to show/hide
                            </p>
                        </div>

                        <div className="space-y-4">
                            {[
                                'S.No.', 'Course Name', 'Participant name', 'Enrolled Date',
                                'Start date', 'Time spent', 'Completion %', 'Completed date', 'Status'
                            ].map((col) => (
                                <button
                                    key={col}
                                    onClick={() => {
                                        setVisibleColumns(prev =>
                                            prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
                                        );
                                    }}
                                    className="w-full flex items-center justify-between group py-1"
                                >
                                    <span className={`text-sm font-bold transition-colors ${visibleColumns.includes(col) ? 'text-slate-700' : 'text-slate-300'
                                        }`}>
                                        {col}
                                    </span>
                                    <CheckCircle2
                                        size={20}
                                        className={`transition-all ${visibleColumns.includes(col)
                                                ? 'text-[#7E2259] fill-[#7E2259]/10'
                                                : 'text-slate-100'
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <main className="flex-1 max-w-[1600px] mx-auto px-10 py-12 space-y-16">
                    {/* Overview Section */}
                    <div className="space-y-8">
                        <div className="inline-flex items-center px-4 py-1.5 bg-[#FFF8F0] text-[#FF8A00] rounded-lg text-[10px] font-black uppercase tracking-widest border border-[#FF8A00]/10">
                            Overview
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {stats.map((stat, i) => (
                                <div key={i} className="bg-white rounded-[2.5rem] p-10 border border-slate-50 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center text-center space-y-6 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] transition-all group">
                                    <div className={`w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                        <stat.icon size={28} className={stat.color} />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-5xl font-black text-slate-800">{stat.value}</div>
                                        <div className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Users Section */}
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="inline-flex items-center px-4 py-1.5 bg-[#FFF8F0] text-[#FF8A00] rounded-lg text-[10px] font-black uppercase tracking-widest border border-[#FF8A00]/10">
                                Users
                            </div>
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="bg-white border border-slate-100 flex items-center gap-3 px-6 py-3 rounded-xl shadow-sm hover:bg-slate-50 transition-all group"
                            >
                                <Search size={18} className="text-slate-400 group-hover:text-slate-600" />
                                <span className="text-sm font-black text-slate-600">Customize Table</span>
                            </button>
                        </div>

                        <div className="bg-white rounded-[2.5rem] border border-slate-50 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.03)] overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            {[
                                                { label: 'S.No.', id: 'S.No.' },
                                                { label: 'COURSE NAME', id: 'Course Name' },
                                                { label: 'PARTICIPANT NAME', id: 'Participant name' },
                                                { label: 'ENROLLED DATE', id: 'Enrolled Date' },
                                                { label: 'START DATE', id: 'Start date' },
                                                { label: 'TIME SPENT', id: 'Time spent' },
                                                { label: 'COMP %', id: 'Completion %' },
                                                { label: 'COMPLETED DATE', id: 'Completed date' },
                                                { label: 'STATUS', id: 'Status' }
                                            ].filter(h => visibleColumns.includes(h.id)).map((header) => (
                                                <th key={header.id} className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                                    {header.label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {usersData.map((row, i) => (
                                            <tr key={i} className="group hover:bg-slate-50/30 transition-all cursor-pointer">
                                                {visibleColumns.includes('S.No.') && <td className="px-8 py-6 text-sm font-black text-slate-600 italic">{row.sno}</td>}
                                                {visibleColumns.includes('Course Name') && <td className="px-8 py-6 text-sm font-black text-[#7E2259] font-serif italic uppercase tracking-tight">{row.courseName}</td>}
                                                {visibleColumns.includes('Participant name') && <td className="px-8 py-6 text-sm font-black text-[#0066FF]">{row.participantName}</td>}
                                                {visibleColumns.includes('Enrolled Date') && <td className="px-8 py-6 text-sm font-black text-slate-400">{row.enrolledDate}</td>}
                                                {visibleColumns.includes('Start date') && <td className="px-8 py-6 text-sm font-black text-slate-400">{row.startDate}</td>}
                                                {visibleColumns.includes('Time spent') && <td className="px-8 py-6 text-sm font-black text-[#FF3B30]">{row.timeSpent}</td>}
                                                {visibleColumns.includes('Completion %') && <td className="px-8 py-6 text-sm font-black text-[#0066FF] font-black">{row.completion}</td>}
                                                {visibleColumns.includes('Completed date') && <td className="px-8 py-6 text-sm font-black text-slate-400">{row.completedDate}</td>}
                                                {visibleColumns.includes('Status') && (
                                                    <td className="px-8 py-6">
                                                        {row.status === 'In Progress' ? (
                                                            <span className="bg-[#FFF8F0] text-[#FF8A00] px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                                                                In Progress
                                                            </span>
                                                        ) : (
                                                            <span className="bg-[#E7F7EF] text-[#22C55E] px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                                                                Completed
                                                            </span>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="px-10 py-8 flex items-center justify-between border-t border-slate-50">
                                <div className="text-sm font-bold text-slate-400 italic">
                                    Showing 1 to 2 of 8 entries
                                </div>
                                <div className="flex items-center gap-4">
                                    <button className="p-2 text-slate-300 hover:text-slate-800 transition-colors bg-white border border-slate-100 rounded-lg">
                                        <ChevronLeft size={20} />
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <button className="w-10 h-10 bg-[#7E2259] text-white rounded-lg font-black text-sm shadow-lg shadow-[#7E2259]/20">1</button>
                                    </div>
                                    <button className="p-2 text-slate-300 hover:text-slate-800 transition-colors bg-white border border-slate-100 rounded-lg">
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Dashboard Footer */}
            <footer className="py-12 text-center text-slate-300 text-[11px] font-bold tracking-wider">
                © 2024 Analytics Dashboard. All rights reserved.
            </footer>
        </div>
    );
};

export default CourseReportingDashboard;
