const { useState, useEffect, useRef } = React;

// Login Component
function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
                onLogin(username);
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden border-4 border-purple-200 shadow-lg">
                        <img src="/static/logo.png" alt="CHENGAI TECH Logo" className="w-full h-full object-cover" />
                    </div>
                    <div className="mb-2">
                        <p className="text-sm font-semibold text-purple-600 tracking-wide">CHENGAI TECH</p>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">InTime</h1>
                    <p className="text-gray-500 mt-2">Sign in to view your dashboard</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                            placeholder="Enter your username"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition disabled:opacity-50"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}

// Dashboard Component
function Dashboard({ username, onLogout }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar state
    const chartRef = useRef(null);
    const donutRef = useRef(null);
    const chartInstance = useRef(null);
    const donutInstance = useRef(null);

    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        try {
            const response = await fetch('/api/attendance', {
                credentials: 'include'
            });

            if (response.status === 401) {
                onLogout();
                return;
            }

            const result = await response.json();
            if (response.ok) {
                setData(result);
                setLoading(false);
            } else {
                setError(result.error || 'Failed to fetch data');
                setLoading(false);
            }
        } catch (err) {
            setError('Network error');
            setLoading(false);
        }
    };

    useEffect(() => {
        if (data && chartRef.current) {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            const ctx = chartRef.current.getContext('2d');
            chartInstance.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.attendance_data.map(s => s.subject),
                    datasets: [{
                        label: 'Attended',
                        data: data.attendance_data.map(s => s.attended),
                        backgroundColor: 'rgba(139, 92, 246, 0.8)',
                        borderRadius: 8
                    }, {
                        label: 'Total',
                        data: data.attendance_data.map(s => s.total),
                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'top' }
                    },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }

        if (data && donutRef.current) {
            if (donutInstance.current) {
                donutInstance.current.destroy();
            }

            const totalAttended = data.attendance_data.reduce((sum, s) => sum + s.attended, 0);
            const totalClasses = data.attendance_data.reduce((sum, s) => sum + s.total, 0);
            const missed = totalClasses - totalAttended;

            const ctx = donutRef.current.getContext('2d');
            donutInstance.current = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Attended', 'Missed'],
                    datasets: [{
                        data: [totalAttended, missed],
                        backgroundColor: ['rgba(139, 92, 246, 0.8)', 'rgba(251, 146, 60, 0.8)'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }
    }, [data]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
                    <div className="text-red-500 text-center">
                        <i className="ri-error-warning-line text-5xl mb-4"></i>
                        <p className="text-lg font-semibold">{error}</p>
                        <button onClick={onLogout} className="mt-4 px-6 py-2 bg-purple-500 text-white rounded-lg">
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const totalAttended = data.attendance_data.reduce((sum, s) => sum + s.attended, 0);
    const totalClasses = data.attendance_data.reduce((sum, s) => sum + s.total, 0);
    const overallPercentage = ((totalAttended / totalClasses) * 100).toFixed(1);

    return (
        <div className="min-h-screen bg-gray-50 flex relative">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 h-full overflow-y-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-200 flex-shrink-0">
                                <img src="/static/logo.png" alt="Logo" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <span className="text-xl font-bold text-gray-800">InTime</span>
                                <p className="text-xs text-gray-500">by CHENGAI TECH</p>
                            </div>
                        </div>
                        {/* Close button for mobile */}
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="md:hidden text-gray-500 hover:text-gray-700"
                        >
                            <i className="ri-close-line text-2xl"></i>
                        </button>
                    </div>

                    <nav className="space-y-2">
                        <a href="#" className="flex items-center space-x-3 px-4 py-3 bg-purple-50 text-purple-600 rounded-lg">
                            <i className="ri-home-line"></i>
                            <span>Home</span>
                        </a>
                        <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg">
                            <i className="ri-user-line"></i>
                            <span>Students</span>
                        </a>
                        <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg">
                            <i className="ri-calendar-check-line"></i>
                            <span>Attendance</span>
                        </a>
                        <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg">
                            <i className="ri-file-list-line"></i>
                            <span>Exam</span>
                        </a>
                    </nav>

                    <button
                        onClick={onLogout}
                        className="mt-8 w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                    >
                        <i className="ri-logout-box-line"></i>
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto h-screen">
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8 flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                {/* Hamburger Menu */}
                                <button
                                    onClick={() => setSidebarOpen(true)}
                                    className="md:hidden text-gray-700 hover:text-purple-600"
                                >
                                    <i className="ri-menu-line text-2xl"></i>
                                </button>
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard</h1>
                            </div>
                            <p className="text-gray-500 mt-1">Welcome back, {data.name}</p>
                            {data.duty_leave && data.duty_leave !== 'N/A' && (
                                <div className="mt-2 inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
                                    <i className="ri-shield-check-line mr-2"></i>
                                    <span className="font-semibold">Duty Leave: {data.duty_leave}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
                        <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-purple-600 font-medium">Subjects</p>
                                    <p className="text-2xl font-bold text-purple-700 mt-1">{data.attendance_data.length}</p>
                                </div>
                                <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center">
                                    <i className="ri-book-line text-xl text-purple-600"></i>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-blue-600 font-medium">Classes</p>
                                    <p className="text-2xl font-bold text-blue-700 mt-1">{totalClasses}</p>
                                </div>
                                <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                                    <i className="ri-calendar-line text-xl text-blue-600"></i>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-orange-600 font-medium">Attended</p>
                                    <p className="text-2xl font-bold text-orange-700 mt-1">{totalAttended}</p>
                                </div>
                                <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center">
                                    <i className="ri-check-line text-xl text-orange-600"></i>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-xl p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-green-600 font-medium">Percentage</p>
                                    <p className="text-2xl font-bold text-green-700 mt-1">{overallPercentage}%</p>
                                </div>
                                <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
                                    <i className="ri-percent-line text-xl text-green-600"></i>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-cyan-100 to-cyan-50 rounded-xl p-6 sm:col-span-2 lg:col-span-1">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-cyan-600 font-medium">Duty Leave</p>
                                    <p className="text-2xl font-bold text-cyan-700 mt-1">
                                        {data.duty_leave && data.duty_leave !== 'N/A' ? data.duty_leave : '-'}
                                    </p>
                                </div>
                                <div className="w-10 h-10 bg-cyan-200 rounded-full flex items-center justify-center">
                                    <i className="ri-shield-check-line text-xl text-cyan-600"></i>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-4 md:p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Subject-wise Attendance</h2>
                            <div className="h-64 md:h-80">
                                <canvas ref={chartRef}></canvas>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Overall Distribution</h2>
                            <div className="h-64 md:h-80">
                                <canvas ref={donutRef}></canvas>
                            </div>
                        </div>
                    </div>

                    {/* Subject Table */}
                    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 overflow-hidden">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Subject Details</h2>
                        <div className="overflow-x-auto -mx-4 md:mx-0">
                            <div className="min-w-full inline-block align-middle">
                                <div className="overflow-hidden">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200 bg-gray-50 md:bg-white">
                                                <th className="text-left py-3 px-4 text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider">Subject</th>
                                                <th className="text-left py-3 px-4 text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">Attended</th>
                                                <th className="text-left py-3 px-4 text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">Total</th>
                                                <th className="text-left py-3 px-4 text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider">Stats</th>
                                                <th className="text-left py-3 px-4 text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {data.attendance_data.map((subject, idx) => {
                                                const percentage = ((subject.attended / subject.total) * 100).toFixed(1);
                                                const status = percentage >= 75 ? 'Good' : percentage >= 60 ? 'Average' : 'Low';
                                                const statusColor = percentage >= 75 ? 'text-green-600 bg-green-50' : percentage >= 60 ? 'text-orange-600 bg-orange-50' : 'text-red-600 bg-red-50';

                                                let actionText = '';
                                                let actionColor = '';

                                                if (percentage < 75) {
                                                    const classesNeeded = Math.ceil((0.75 * subject.total - subject.attended) / 0.25);
                                                    actionText = `${classesNeeded} period koodi classil kerr`;
                                                    actionColor = 'text-red-600 bg-red-50';
                                                } else {
                                                    const canBunk = Math.floor((subject.attended / 0.75) - subject.total);
                                                    actionText = canBunk > 0 ? `${canBunk} claas chadikyo.. safeaaa` : 'Maintain';
                                                    actionColor = 'text-green-600 bg-green-50';
                                                }

                                                return (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                        <td className="py-3 px-4">
                                                            <div className="font-medium text-gray-800 text-sm md:text-base">{subject.subject}</div>
                                                            <div className="sm:hidden text-xs text-gray-500 mt-1">
                                                                {subject.attended}/{subject.total} attended
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 text-gray-600 hidden sm:table-cell">{subject.attended}</td>
                                                        <td className="py-3 px-4 text-gray-600 hidden sm:table-cell">{subject.total}</td>
                                                        <td className="py-3 px-4">
                                                            <div className="font-semibold text-purple-600 text-sm">{percentage}%</div>
                                                            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}>
                                                                {status}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${actionColor} whitespace-nowrap`}>
                                                                {actionText}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Subject Legend */}
                    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mt-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">📚 Subject Codes</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                            {data.attendance_data.map((subject, idx) => (
                                <div key={idx} className="flex items-start p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
                                    <div className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-xs mr-2 mt-0.5">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-purple-700 text-sm truncate">{subject.subject}</p>
                                        <p className="text-xs text-gray-600 mt-1 truncate">
                                            {subject.subject_name !== subject.subject ? subject.subject_name : 'Subject Name Not Available'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Main App
function App() {
    const [user, setUser] = useState(null);

    const handleLogin = (username) => {
        setUser(username);
    };

    const handleLogout = () => {
        setUser(null);
    };

    return user ? <Dashboard username={user} onLogout={handleLogout} /> : <Login onLogin={handleLogin} />;
}

// Render
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
