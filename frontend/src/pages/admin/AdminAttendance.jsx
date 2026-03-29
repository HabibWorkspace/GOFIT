import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { toast, Toaster } from 'sonner';
import AdminLayout from '../../components/layouts/AdminLayout';

const AdminAttendance = () => {
  const [summary, setSummary] = useState({ today_checkins: 0, members_inside: 0, trainers_inside: 0, avg_stay_today: 0 });
  const [liveEvents, setLiveEvents] = useState([]);
  const [currentlyInside, setCurrentlyInside] = useState({ members: [], trainers: [] });
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [topMembers, setTopMembers] = useState([]);
  const [dailySummary, setDailySummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState({ connected: false, service_running: false });

  // The device sends PKT time, but backend treats it as UTC and adds Z
  // So we need to subtract 5 hours to get back to PKT
  const convertToPKT = (utcTimeString) => {
    if (!utcTimeString) return 'Unknown time';
    
    try {
      const date = new Date(utcTimeString);
      // Subtract 5 hours because device time is already PKT but marked as UTC
      date.setHours(date.getHours() - 5);
      
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error converting time:', error);
      return 'Invalid time';
    }
  };

  useEffect(() => {
    // For Socket.IO, we need to connect to the actual backend server
    // In development: backend is on port 5000, frontend on port 3000
    // In production: both are served from the same origin
    const isDevelopment = window.location.port === '3000';
    const backendUrl = isDevelopment ? 'http://localhost:5000' : window.location.origin;
    
    socketRef.current = io(backendUrl, { 
      reconnection: true, 
      reconnectionDelay: 1000, 
      reconnectionDelayMax: 5000, 
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
      upgrade: false,
      forceNew: true
    });
    
    socketRef.current.on('connect', () => {
      setWsConnected(true);
    });
    
    socketRef.current.on('disconnect', () => {
      setWsConnected(false);
    });
    
    socketRef.current.on('connect_error', (error) => {
      setWsConnected(false);
    });

    // Listen for check-in events
    socketRef.current.on('attendance:checkin', (data) => {
      // Show toast notification
      const checkInTime = data.check_in_time || data.timestamp;
      const timeStr = convertToPKT(checkInTime);
      
      toast.success(`✓ ${data.person_name} checked in`, {
        description: `${data.person_type.charAt(0).toUpperCase() + data.person_type.slice(1)} • ${timeStr}`,
        duration: 4000,
        style: {
          background: '#1a1a1a',
          border: '1px solid #B6FF00',
          color: '#fff',
        },
      });
      
      // Add to live events feed
      const newEvent = {
        id: Date.now(),
        person_name: data.person_name,
        person_type: data.person_type,
        status: 'Check-In',
        timestamp: checkInTime || new Date().toISOString()
      };
      setLiveEvents(prev => [newEvent, ...prev].slice(0, 20));
      
      // Refresh all data to update counts and lists
      fetchAllData();
    });

    // Listen for check-out events
    socketRef.current.on('attendance:checkout', (data) => {
      // Show toast notification
      const duration = data.stay_duration || 0;
      const durationStr = duration >= 60 ? `${Math.floor(duration/60)}h ${duration%60}m` : `${duration}m`;
      
      toast.info(`← ${data.person_name} checked out`, {
        description: `${data.person_type.charAt(0).toUpperCase() + data.person_type.slice(1)} • Duration: ${durationStr}`,
        duration: 4000,
        style: {
          background: '#1a1a1a',
          border: '1px solid #6B7280',
          color: '#fff',
        },
      });
      
      // Add to live events feed
      const newEvent = {
        id: Date.now(),
        person_name: data.person_name,
        person_type: data.person_type,
        status: `Check-Out (${durationStr})`,
        timestamp: data.check_in_time || data.timestamp
      };
      setLiveEvents(prev => [newEvent, ...prev].slice(0, 20));
      
      // Refresh all data to update counts and lists
      fetchAllData();
    });
    
    return () => { 
      if (socketRef.current) {
        socketRef.current.off('attendance:checkin');
        socketRef.current.off('attendance:checkout');
        socketRef.current.disconnect(); 
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchAllData();
    fetchDeviceStatus();
    
    const interval = setInterval(() => {
      fetchAllData();
      fetchDeviceStatus();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [summaryRes, historyRes, liveRes, weeklyRes, topRes, dailyRes] = await Promise.all([
        fetch('/api/attendance/dashboard/summary', { headers }),
        fetch('/api/attendance/history?page=1&per_page=20', { headers }),
        fetch('/api/attendance/live', { headers }),
        fetch('/api/attendance/analytics/weekly', { headers }),
        fetch('/api/attendance/analytics/top-members?limit=10', { headers }),
        fetch('/api/attendance/daily-summary', { headers })
      ]);
      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (historyRes.ok) setAttendanceHistory((await historyRes.json()).records || []);
      if (liveRes.ok) setCurrentlyInside(await liveRes.json());
      if (weeklyRes.ok) setWeeklyData((await weeklyRes.json()).data || []);
      if (topRes.ok) setTopMembers((await topRes.json()).members || []);
      if (dailyRes.ok) setDailySummary((await dailyRes.json()).summaries || []);
      setLoading(false);
    } catch (err) { console.error(err); setLoading(false); }
  };

  const fetchDeviceStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch('/api/attendance/health', { headers });
      if (res.ok) {
        const data = await res.json();
        setDeviceStatus({ 
          connected: data.device_connected || false, 
          service_running: data.service_running || false 
        });
      } else {
        // If endpoint fails, set both to false
        setDeviceStatus({ connected: false, service_running: false });
      }
    } catch (err) { 
      console.error('Device status fetch error:', err); 
      setDeviceStatus({ connected: false, service_running: false });
    }
  };

  const handleClearDeviceLogs = async () => {
    if (!window.confirm('⚠️ WARNING: This will permanently delete ALL attendance logs from the device. This cannot be undone. Are you sure?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      const res = await fetch('/api/attendance/device/clear-logs', { 
        method: 'POST',
        headers 
      });
      
      if (res.ok) {
        toast.success('Device logs cleared successfully', {
          description: 'All old attendance logs have been removed from the device',
          duration: 4000,
          style: {
            background: '#1a1a1a',
            border: '1px solid #B6FF00',
            color: '#fff',
          },
        });
        // Refresh data
        fetchAllData();
      } else {
        const error = await res.json();
        toast.error('Failed to clear device logs', {
          description: error.error || 'Unknown error',
          duration: 4000,
          style: {
            background: '#1a1a1a',
            border: '1px solid #ef4444',
            color: '#fff',
          },
        });
      }
    } catch (err) {
      console.error('Error clearing device logs:', err);
      toast.error('Error clearing device logs', {
        description: err.message,
        duration: 4000,
        style: {
          background: '#1a1a1a',
          border: '1px solid #ef4444',
          color: '#fff',
        },
      });
    }
  };

  if (loading) return <AdminLayout><div className="p-8 text-white">Loading...</div></AdminLayout>;

  return (
    <AdminLayout>
    <Toaster position="top-right" richColors />
    <div className="p-8 bg-fitnix-black min-h-screen text-fitnix-off-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-fitnix-off-white">Attendance <span className="fitnix-gradient-text">Dashboard</span></h1>
            <p className="text-fitnix-off-white/60 mt-1">Real-time attendance tracking and analytics</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleClearDeviceLogs}
              className="px-4 py-2 rounded-lg border border-fitnix-red bg-fitnix-red/10 text-fitnix-red hover:bg-fitnix-red/20 transition-colors text-sm font-medium"
              title="Clear all attendance logs from device"
            >
              Clear Device Logs
            </button>
            <div className={`px-4 py-2 rounded-lg border ${wsConnected ? 'bg-fitnix-lime/10 border-fitnix-lime text-fitnix-lime' : 'bg-fitnix-red/10 border-fitnix-red text-fitnix-red'}`}>
              <span className="text-xs font-medium">● WebSocket {wsConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <div className={`px-4 py-2 rounded-lg border ${deviceStatus.connected ? 'bg-fitnix-lime/10 border-fitnix-lime text-fitnix-lime' : 'bg-fitnix-red/10 border-fitnix-red text-fitnix-red'}`}>
              <span className="text-xs font-medium">● Device {deviceStatus.connected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-fitnix-charcoal border border-fitnix-dark-gray p-6 rounded-lg hover:border-fitnix-lime/30 transition-colors">
            <h3 className="text-fitnix-gray text-sm font-medium mb-2">Today's Check-ins</h3>
            <p className="text-4xl font-bold text-fitnix-lime">{summary.today_checkins}</p>
          </div>
          <div className="bg-fitnix-charcoal border border-fitnix-dark-gray p-6 rounded-lg hover:border-fitnix-lime/30 transition-colors">
            <h3 className="text-fitnix-gray text-sm font-medium mb-2">Members Inside</h3>
            <p className="text-4xl font-bold text-fitnix-lime">{summary.members_inside}</p>
          </div>
          <div className="bg-fitnix-charcoal border border-fitnix-dark-gray p-6 rounded-lg hover:border-fitnix-lime/30 transition-colors">
            <h3 className="text-fitnix-gray text-sm font-medium mb-2">Trainers Inside</h3>
            <p className="text-4xl font-bold text-fitnix-lime">{summary.trainers_inside}</p>
          </div>
          <div className="bg-fitnix-charcoal border border-fitnix-dark-gray p-6 rounded-lg hover:border-fitnix-lime/30 transition-colors">
            <h3 className="text-fitnix-gray text-sm font-medium mb-2">Avg Stay Today</h3>
            <p className="text-4xl font-bold text-fitnix-lime">{summary.avg_stay_formatted || '0h 0m'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-fitnix-charcoal border border-fitnix-dark-gray p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4 text-fitnix-off-white">Live Activity Feed</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {liveEvents.length === 0 ? (
                <p className="text-fitnix-gray text-center py-8">No recent activity</p>
              ) : (
                liveEvents.map(event => (
                  <div key={event.id} className="p-4 bg-fitnix-dark-gray/50 rounded-lg border-l-4 border-fitnix-lime">
                    <p className="font-semibold text-fitnix-off-white">{event.person_name}</p>
                    <p className="text-sm text-fitnix-gray">{event.person_type} • {event.status}</p>
                    <p className="text-xs text-fitnix-gray/70 mt-1">
                      {convertToPKT(event.timestamp)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-fitnix-charcoal border border-fitnix-dark-gray p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4 text-fitnix-off-white">Currently Inside</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-fitnix-lime mb-3">Members ({currentlyInside.members?.length || 0})</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {currentlyInside.members && currentlyInside.members.length > 0 ? (
                    currentlyInside.members.map(m => (
                      <div key={m.id} className="text-sm p-3 bg-fitnix-dark-gray/50 rounded-lg">
                        <p className="font-medium text-fitnix-off-white">{m.person_name || m.person_id}</p>
                        <p className="text-xs text-fitnix-gray">{m.time_spent_formatted || `${m.time_spent_so_far} min`}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-fitnix-gray">No members inside</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-fitnix-lime mb-3">Trainers ({currentlyInside.trainers?.length || 0})</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {currentlyInside.trainers && currentlyInside.trainers.length > 0 ? (
                    currentlyInside.trainers.map(t => (
                      <div key={t.id} className="text-sm p-3 bg-fitnix-dark-gray/50 rounded-lg">
                        <p className="font-medium text-fitnix-off-white">{t.person_name || t.person_id}</p>
                        <p className="text-xs text-fitnix-gray">{t.time_spent_formatted || `${t.time_spent_so_far} min`}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-fitnix-gray">No trainers inside</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-fitnix-charcoal border border-fitnix-dark-gray p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4 text-fitnix-off-white">Weekly Analytics</h2>
            <div className="space-y-3">
              {weeklyData && weeklyData.length > 0 ? (
                weeklyData.map((day, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-sm text-fitnix-gray w-12">{day.day ? day.day.substring(0, 3) : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]}</span>
                    <div className="flex-1 mx-4 bg-fitnix-dark-gray rounded-full h-8">
                      <div className="bg-fitnix-lime h-8 rounded-full transition-all" style={{ width: `${Math.min(100, (day.count / 50) * 100)}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-fitnix-lime w-12 text-right">{day.count}</span>
                  </div>
                ))
              ) : (
                <p className="text-fitnix-gray text-center py-8">No data available</p>
              )}
            </div>
          </div>

          <div className="bg-fitnix-charcoal border border-fitnix-dark-gray p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4 text-fitnix-off-white">Top Members</h2>
            <div className="space-y-2">
              {topMembers && topMembers.length > 0 ? (
                topMembers.slice(0, 10).map((member, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-fitnix-dark-gray/50 rounded-lg hover:bg-fitnix-dark-gray transition-colors">
                    <span className="text-sm text-fitnix-off-white/80">#{idx + 1} {member.person_name || member.person_id}</span>
                    <span className="font-semibold text-fitnix-lime">{member.visit_count} visits</span>
                  </div>
                ))
              ) : (
                <p className="text-fitnix-gray text-center py-8">No data available</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-fitnix-charcoal border border-fitnix-dark-gray p-6 rounded-lg mb-8">
          <h2 className="text-xl font-bold mb-4 text-fitnix-off-white">Today's Attendance Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-fitnix-dark-gray/50 border-b border-fitnix-dark-gray">
                <tr>
                  <th className="px-4 py-3 text-left text-fitnix-lime font-medium">Name</th>
                  <th className="px-4 py-3 text-left text-fitnix-lime font-medium">Type</th>
                  <th className="px-4 py-3 text-left text-fitnix-lime font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-fitnix-lime font-medium">First Check-In</th>
                  <th className="px-4 py-3 text-left text-fitnix-lime font-medium">Last Check-Out</th>
                  <th className="px-4 py-3 text-left text-fitnix-lime font-medium">Total Time</th>
                  <th className="px-4 py-3 text-left text-fitnix-lime font-medium">Visits</th>
                </tr>
              </thead>
              <tbody>
                {dailySummary && dailySummary.length > 0 ? (
                  dailySummary.map(record => (
                    <tr key={record.id} className="border-b border-fitnix-dark-gray hover:bg-fitnix-dark-gray/30 transition-colors">
                      <td className="px-4 py-3 text-fitnix-off-white">{record.person_name || record.person_id}</td>
                      <td className="px-4 py-3 text-fitnix-gray capitalize">{record.person_type}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${record.status === 'Present' ? 'bg-fitnix-lime/20 text-fitnix-lime' : 'bg-fitnix-red/20 text-fitnix-red'}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-fitnix-gray">{record.first_check_in ? convertToPKT(record.first_check_in) : '-'}</td>
                      <td className="px-4 py-3 text-fitnix-gray">{record.last_check_out ? convertToPKT(record.last_check_out) : '-'}</td>
                      <td className="px-4 py-3 text-fitnix-gray">{record.total_time_minutes ? `${Math.floor(record.total_time_minutes / 60)}h ${record.total_time_minutes % 60}m` : '-'}</td>
                      <td className="px-4 py-3 text-fitnix-lime font-medium">{record.visit_count}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-4 py-12 text-center text-fitnix-gray">No attendance records for today</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-fitnix-charcoal border border-fitnix-dark-gray p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4 text-fitnix-off-white">Recent Attendance</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-fitnix-dark-gray/50 border-b border-fitnix-dark-gray">
                <tr>
                  <th className="px-4 py-3 text-left text-fitnix-lime font-medium">Name</th>
                  <th className="px-4 py-3 text-left text-fitnix-lime font-medium">Type</th>
                  <th className="px-4 py-3 text-left text-fitnix-lime font-medium">Check-In</th>
                  <th className="px-4 py-3 text-left text-fitnix-lime font-medium">Check-Out</th>
                  <th className="px-4 py-3 text-left text-fitnix-lime font-medium">Duration</th>
                </tr>
              </thead>
              <tbody>
                {attendanceHistory && attendanceHistory.length > 0 ? (
                  attendanceHistory.map(record => (
                    <tr key={record.id} className="border-b border-fitnix-dark-gray hover:bg-fitnix-dark-gray/30 transition-colors">
                      <td className="px-4 py-3 text-fitnix-off-white">{record.person_name || record.person_id}</td>
                      <td className="px-4 py-3 text-fitnix-gray capitalize">{record.person_type}</td>
                      <td className="px-4 py-3 text-fitnix-gray">{convertToPKT(record.check_in_time)}</td>
                      <td className="px-4 py-3 text-fitnix-gray">{record.check_out_time ? convertToPKT(record.check_out_time) : '-'}</td>
                      <td className="px-4 py-3 text-fitnix-gray">{record.stay_duration ? `${Math.floor(record.stay_duration / 60)}h ${record.stay_duration % 60}m` : '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-4 py-12 text-center text-fitnix-gray">No attendance records yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    </AdminLayout>
  );
};

export default AdminAttendance;
