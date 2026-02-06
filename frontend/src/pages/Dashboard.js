import React from 'react';
import { useAuth } from '../context/AuthContext';
import ProviderDashboard from '../components/ProviderDashboard';
import ClientDashboard from '../components/ClientDashboard';
import './Dashboard.css';

const Dashboard = () => {
    const { user, logout } = useAuth();

    return (
        <div className="dashboard-layout">
            <header className="dashboard-header">
                <h1>Welcome, {user.fullName}</h1>
                <div className="header-actions">
                    <span className="role-badge">{user.role}</span>
                    <button onClick={logout} className="logout-btn">Logout</button>
                </div>
            </header>

            <main className="dashboard-content">
                {user.role === 'PROVIDER' ? <ProviderDashboard /> : <ClientDashboard />}
            </main>
        </div>
    );
};

export default Dashboard;
