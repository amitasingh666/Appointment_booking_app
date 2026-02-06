
import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './Dashboard.css'; // Assuming existing CSS or I'll use inline styles for "Attractive UI"

const ProviderDashboard = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [services, setServices] = useState([]);
    const [schedule, setSchedule] = useState([]);
    const [activeTab, setActiveTab] = useState('bookings');
    const [loading, setLoading] = useState(true);

    // Form State
    const [newService, setNewService] = useState({
        name: '',
        duration: '30',
        price: '',
        description: '',
        fuelType: '',
        seats: '',
        vehicleType: '',
        durationUnit: 'mins',
        image: null
    });

    const isCarRental = user.category === 'CAR_RENTAL';
    const isDoctor = user.category === 'DOCTOR';
    const hasSchedule = schedule.length > 0;

    // Force Schedule Setup for Doctors
    const isScheduleLocked = isDoctor && !hasSchedule;

    const labels = getLabels(user.category);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        // Redirect logic if schedule is missing for Doctor
        if (!loading && isScheduleLocked) {
            setActiveTab('schedule');
        }
    }, [loading, isScheduleLocked]);

    const fetchData = async () => {
        try {
            const [bookingsRes, servicesRes, scheduleRes] = await Promise.all([
                api.get('/bookings'),
                api.get('/services'),
                api.get('/schedule')
            ]);
            setBookings(bookingsRes.data);
            setServices(servicesRes.data);
            setSchedule(scheduleRes.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await api.patch(`/bookings/${id}/status`, { status });
            toast.success(`Booking ${status.toLowerCase()}!`);
            fetchData();
        } catch (error) {
            toast.error('Update failed');
        }
    };

    const validateService = () => {
        if (user.category === 'DOCTOR') {
            if (newService.name.trim().length < 3) {
                toast.warning('Service Name must be at least 3 characters.');
                return false;
            }
            if (newService.description && newService.description.trim().length < 10) {
                toast.warning('Description too short (min 10 chars).');
                return false;
            }
            if (parseFloat(newService.price) <= 0) {
                toast.warning('Price must be positive.');
                return false;
            }
        }
        return true;
    };

    const handleAddService = async (e) => {
        e.preventDefault();
        if (!validateService()) return;
        try {
            let data;
            if (newService.image || isCarRental) {
                const formData = new FormData();
                formData.append('name', newService.name);
                formData.append('price', newService.price);
                formData.append('description', newService.description);
                formData.append('duration', newService.duration);
                if (isCarRental) {
                    formData.append('fuelType', newService.fuelType);
                    formData.append('seats', newService.seats);
                    formData.append('vehicleType', newService.vehicleType);
                    formData.append('durationUnit', newService.durationUnit);
                }
                if (newService.image) formData.append('image', newService.image);
                data = formData;
            } else {
                data = newService;
            }

            await api.post('/services', data);
            toast.success('Service added successfully!');
            setNewService({
                name: '', duration: '30', price: '', description: '',
                fuelType: '', seats: '', vehicleType: '', durationUnit: 'mins', image: null
            });
            if (document.getElementById('fileInput')) document.getElementById('fileInput').value = "";
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add service');
        }
    };

    const handleDeleteService = async (id) => {
        try {
            await api.delete(`/services/${id}`);
            toast.success('Service removed');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete service.');
        }
    };

    // UI Components
    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '30px', background: '#e8f0fe', padding: '20px', borderRadius: '12px', borderLeft: '6px solid #1a73e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#1a73e8' }}>{labels.title}</h1>
                    <p style={{ margin: '5px 0 0 0', color: '#555' }}>
                        <strong>Specialization:</strong> {user.specialization || 'General'}
                    </p>
                </div>
                {isScheduleLocked && (
                    <div style={{ background: '#d93025', color: 'white', padding: '10px 20px', borderRadius: '30px', fontWeight: 'bold' }}>
                        ⚠️ You are Offline. Set Hours to go Online.
                    </div>
                )}
            </div>

            {/* Navigation Tabs */}
            <div style={{ marginBottom: '30px', display: 'flex', borderBottom: '2px solid #eee' }}>
                <button
                    onClick={() => !isScheduleLocked && setActiveTab('bookings')}
                    disabled={isScheduleLocked}
                    style={getTabStyle(activeTab === 'bookings', isScheduleLocked)}
                >
                    Bookings
                </button>
                <button
                    onClick={() => !isScheduleLocked && setActiveTab('services')}
                    disabled={isScheduleLocked}
                    style={getTabStyle(activeTab === 'services', isScheduleLocked)}
                >
                    Services
                </button>
                {!isCarRental && (
                    <button
                        onClick={() => setActiveTab('schedule')}
                        style={getTabStyle(activeTab === 'schedule', false)}
                    >
                        Schedule {isScheduleLocked && '🔴'}
                    </button>
                )}
            </div>

            {/* Content Area */}
            <div className="dashboard-content">
                {activeTab === 'bookings' && (
                    <BookingsView bookings={bookings} handleStatusUpdate={handleStatusUpdate} />
                )}

                {activeTab === 'services' && (
                    <ServicesView
                        services={services}
                        labels={labels}
                        handleDeleteService={handleDeleteService}
                        newService={newService}
                        setNewService={setNewService}
                        handleAddService={handleAddService}
                        isCarRental={isCarRental}
                    />
                )}

                {activeTab === 'schedule' && (
                    <ScheduleView
                        schedule={schedule}
                        fetchData={fetchData}
                        isLocked={isScheduleLocked}
                    />
                )}
            </div>
        </div>
    );
};

// --- Sub Components ---

const BookingsView = ({ bookings, handleStatusUpdate }) => (
    <div className="dashboard-section fade-in">
        <div className="section-title">
            <h2>Booking Management</h2>
        </div>
        {bookings.length === 0 ? <p style={{ color: '#666', fontStyle: 'italic' }}>No bookings found.</p> : (
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <thead style={{ background: '#f8f9fa' }}>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '15px', borderBottom: '2px solid #eee' }}>Client</th>
                            <th style={{ textAlign: 'left', padding: '15px', borderBottom: '2px solid #eee' }}>Details</th>
                            <th style={{ textAlign: 'left', padding: '15px', borderBottom: '2px solid #eee' }}>Date & Time</th>
                            <th style={{ textAlign: 'left', padding: '15px', borderBottom: '2px solid #eee' }}>Status</th>
                            <th style={{ textAlign: 'left', padding: '15px', borderBottom: '2px solid #eee' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map(b => (
                            <tr key={b.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '15px', fontWeight: '500' }}>{b.counterpart_name}</td>
                                <td style={{ padding: '15px' }}>{b.service_name}</td>
                                <td style={{ padding: '15px' }}>
                                    {new Date(b.booking_date).toLocaleDateString()} <br />
                                    <span style={{ color: '#666', fontSize: '0.9em' }}>{b.start_time.slice(0, 5)}</span>
                                </td>
                                <td style={{ padding: '15px' }}>
                                    <span style={{
                                        padding: '5px 10px', borderRadius: '15px', fontSize: '0.85em', fontWeight: 'bold',
                                        background: b.status === 'CONFIRMED' ? '#e6f4ea' : b.status === 'PENDING' ? '#fef7e0' : b.status === 'COMPLETED' ? '#e8f0fe' : '#fce8e6',
                                        color: b.status === 'CONFIRMED' ? '#1e8e3e' : b.status === 'PENDING' ? '#f9ab00' : b.status === 'COMPLETED' ? '#1a73e8' : '#d93025'
                                    }}>
                                        {b.status}
                                    </span>
                                </td>
                                <td style={{ padding: '15px' }}>
                                    {b.status === 'PENDING' && (
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button onClick={() => handleStatusUpdate(b.id, 'CONFIRMED')} style={{ background: '#1e8e3e', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Accept</button>
                                            <button onClick={() => handleStatusUpdate(b.id, 'REJECTED')} style={{ background: '#d93025', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Reject</button>
                                        </div>
                                    )}
                                    {b.status === 'CONFIRMED' && (
                                        <button onClick={() => handleStatusUpdate(b.id, 'COMPLETED')} style={{ background: '#1a73e8', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Complete</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
);

const ServicesView = ({ services, labels, handleDeleteService, newService, setNewService, handleAddService, isCarRental }) => (
    <div className="fade-in">
        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
            {/* List */}
            <div style={{ flex: 1, minWidth: '300px' }}>
                <h2 style={{ color: '#333', borderBottom: '2px solid #1a73e8', paddingBottom: '10px', display: 'inline-block' }}>{labels.serviceList}</h2>
                <div style={{ marginTop: '20px' }}>
                    {services.map(s => (
                        <div key={s.id} style={{
                            background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #eee', position: 'relative'
                        }}>
                            <button
                                onClick={() => handleDeleteService(s.id)}
                                style={{ position: 'absolute', top: '15px', right: '15px', color: '#d93025', background: 'none', border: '1px solid #eee', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', zIndex: 2 }}
                                title="Delete"
                            >✕</button>
                            {s.image_url && (
                                <div style={{ width: '100%', height: '150px', overflow: 'hidden', borderRadius: '8px', marginBottom: '15px' }}>
                                    <img src={s.image_url} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            )}
                            <h3 style={{ margin: '0 0 5px 0' }}>{s.name}</h3>
                            <p style={{ margin: '0 0 10px 0', color: '#1a73e8', fontWeight: 'bold' }}>${s.price} <span style={{ fontSize: '0.8em', color: '#666', fontWeight: 'normal' }}>{isCarRental ? '/ hour' : ''}</span></p>
                            <p style={{ margin: '0', color: '#555', fontSize: '0.9em' }}>{s.description}</p>
                            <div style={{ marginTop: '10px', fontSize: '0.85em', color: '#888' }}>
                                ⏳ {s.duration_unit === 'days' ? `${s.duration} Days` : `${s.duration} Mins`}
                                {s.seats && <span style={{ marginLeft: '10px' }}>💺 {s.seats} Seats</span>}
                                {s.fuel_type && <span style={{ marginLeft: '10px' }}>⛽ {s.fuel_type}</span>}
                            </div>
                        </div>
                    ))}
                    {services.length === 0 && <p>No services yet.</p>}
                </div>
            </div>

            {/* Add Form */}
            <div style={{ flex: 1, minWidth: '350px' }}>
                <div style={{
                    background: 'white', padding: '30px', borderRadius: '16px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.08)', borderTop: '5px solid #1a73e8'
                }}>
                    <h2 style={{ marginTop: 0, marginBottom: '25px', color: '#1a73e8' }}>{labels.addHeader}</h2>
                    <form onSubmit={handleAddService} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

                        <div className="form-group">
                            <label className="form-label">{labels.nameLabel}</label>
                            <input className="form-input" value={newService.name} onChange={e => setNewService({ ...newService, name: e.target.value })} required />
                        </div>

                        {/* Car Rental Specifics */}
                        {isCarRental && (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div>
                                        <label className="form-label">Vehicle Type</label>
                                        <select className="form-input" value={newService.vehicleType} onChange={e => setNewService({ ...newService, vehicleType: e.target.value })}>
                                            <option value="">Select</option>
                                            <option value="Sedan">Sedan</option>
                                            <option value="SUV">SUV</option>
                                            <option value="Luxury">Luxury</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label">Fuel Type</label>
                                        <select className="form-input" value={newService.fuelType} onChange={e => setNewService({ ...newService, fuelType: e.target.value })}>
                                            <option value="">Select</option>
                                            <option value="Petrol">Petrol</option>
                                            <option value="Diesel">Diesel</option>
                                            <option value="Electric">Electric</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div>
                                        <label className="form-label">Seats</label>
                                        <input className="form-input" type="number" value={newService.seats} onChange={e => setNewService({ ...newService, seats: e.target.value })} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '20px', marginTop: '5px' }}>
                                    <label><input type="radio" value="days" checked={newService.durationUnit === 'days'} onChange={() => setNewService({ ...newService, durationUnit: 'days' })} /> Days</label>
                                    <label><input type="radio" value="mins" checked={newService.durationUnit === 'mins'} onChange={() => setNewService({ ...newService, durationUnit: 'mins' })} /> Mins/Hours</label>
                                </div>
                            </>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <label className="form-label">Service Image</label>
                                <input className="form-input" type="file" id="fileInput" onChange={e => setNewService({ ...newService, image: e.target.files[0] })} />
                            </div>
                            <div>
                                <label className="form-label">{isCarRental ? 'Price / Hour' : labels.priceLabel}</label>
                                <input className="form-input" type="number" placeholder="0.00" value={newService.price} onChange={e => setNewService({ ...newService, price: e.target.value })} required />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <label className="form-label">{labels.durationLabel}</label>
                                {isCarRental && newService.durationUnit === 'days' ?
                                    <input className="form-input" type="number" value={newService.duration} onChange={e => setNewService({ ...newService, duration: e.target.value })} />
                                    :
                                    <select className="form-input" value={newService.duration} onChange={e => setNewService({ ...newService, duration: e.target.value })}>
                                        <option value="30">30 mins</option>
                                        <option value="60">1 Hour</option>
                                        <option value="90">1.5 Hours</option>
                                        <option value="120">2 Hours</option>
                                    </select>
                                }
                            </div>
                        </div>

                        <div>
                            <label className="form-label">{labels.descLabel}</label>
                            <textarea className="form-input" rows="3" value={newService.description} onChange={e => setNewService({ ...newService, description: e.target.value })} />
                        </div>

                        <button type="submit" style={{
                            background: '#1a73e8', color: 'white', padding: '12px', border: 'none', borderRadius: '8px',
                            fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', marginTop: '10px', boxShadow: '0 4px 6px rgba(26,115,232,0.3)'
                        }} className="hover-btn">
                            + Add Service
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
);

const ScheduleView = ({ schedule, fetchData, isLocked }) => (
    <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2>{isLocked ? 'Welcome! Set your availability to get started.' : 'Manage Your Schedule'}</h2>
            {isLocked && <p style={{ color: '#d93025' }}>You won't be visible to clients until you set your working hours.</p>}
        </div>

        <div style={{ display: 'flex', gap: '30px', flexDirection: 'column' }}>
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 15px 0' }}>Current Hours</h3>
                {schedule.length === 0 ? <p>No hours set.</p> : (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {schedule.map(s => (
                            <span key={s.id} style={{ background: '#e8f0fe', color: '#1a73e8', padding: '8px 16px', borderRadius: '20px', fontWeight: '500' }}>
                                {s.day_of_week}: {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 20px 0' }}>Add/Update Slot</h3>
                <ScheduleForm onUpdate={fetchData} />
            </div>
        </div>
    </div>
);

const ScheduleForm = ({ onUpdate }) => {
    const [formData, setFormData] = useState({ dayOfWeek: 'MON', startTime: '09:00', endTime: '17:00' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/schedule', formData);
            toast.success('Schedule updated!');
            onUpdate();
        } catch (error) { toast.error('Failed to update'); }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
                <label className="form-label">Day</label>
                <select className="form-input" value={formData.dayOfWeek} onChange={e => setFormData({ ...formData, dayOfWeek: e.target.value })}>
                    {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>
            <div>
                <label className="form-label">Start</label>
                <input className="form-input" type="time" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
            </div>
            <div style={{ paddingBottom: '10px' }}>to</div>
            <div>
                <label className="form-label">End</label>
                <input className="form-input" type="time" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} />
            </div>
            <button type="submit" style={{ background: '#1a73e8', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', height: '100%' }}>Save</button>
        </form>
    );
};

// Helpers & Styles
const getLabels = (category) => {
    switch (category) {
        case 'DOCTOR': return { title: 'Medical Practice Dashboard', serviceList: 'Consultation Types', addHeader: 'Add Consultation', nameLabel: 'Consultation Name', priceLabel: 'Fee ($)', descLabel: 'Notes', durationLabel: 'Duration' };
        case 'CAR_RENTAL': return { title: 'Car Rental Management', serviceList: 'Fleet', addHeader: 'Add Car', nameLabel: 'Model Name', priceLabel: 'Hourly Rate ($)', descLabel: 'Details', durationLabel: 'Min Duration' };
        case 'SALON': return { title: 'Salon Dashboard', serviceList: 'Services', addHeader: 'Add Service', nameLabel: 'Service Name', priceLabel: 'Price ($)', descLabel: 'Details', durationLabel: 'Duration' };
        default: return { title: 'Provider Dashboard', serviceList: 'Services', addHeader: 'Add Service', nameLabel: 'Name', priceLabel: 'Price', descLabel: 'Description', durationLabel: 'Duration' };
    }
};

const getTabStyle = (isActive, isDisabled) => ({
    padding: '15px 30px',
    background: 'none',
    borderBottom: isActive ? '3px solid #1a73e8' : '3px solid transparent',
    color: isDisabled ? '#ccc' : isActive ? '#1a73e8' : '#555',
    fontWeight: 'bold',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    fontSize: '1.1rem',
    outline: 'none',
    borderLeft: 'none', borderRight: 'none', borderTop: 'none'
});

export default ProviderDashboard;
