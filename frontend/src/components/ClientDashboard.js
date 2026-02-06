
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';

const ClientDashboard = () => {
    const [bookings, setBookings] = useState([]);
    const [showBookings, setShowBookings] = useState(false); // Toggle view
    const navigate = useNavigate();

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const response = await api.get('/bookings');
            setBookings(response.data);
        } catch (error) {
            console.error('Failed to fetch bookings', error);
        }
    };

    const cancelBooking = async (id, status) => {
        if (status === 'CONFIRMED') {
            toast.info('Booking is confirmed and cannot be cancelled.');
            return;
        }

        try {
            await api.patch(`/bookings/${id}/status`, { status: 'CANCELLED' });
            toast.success('Booking cancelled');
            fetchBookings();
        } catch (error) {
            toast.error('Failed to cancel');
        }
    };

    const goToCategory = (category) => {
        navigate('/book', { state: { category } });
    };

    return (
        <div>
            {/* Top Bar Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                <button
                    className="logout-btn"
                    onClick={() => setShowBookings(!showBookings)}
                    style={{ background: showBookings ? '#e8f0fe' : 'white', color: '#1a73e8', border: '1px solid #1a73e8' }}
                >
                    {showBookings ? 'Hide My Bookings' : 'View My Bookings'}
                </button>
            </div>

            {showBookings ? (
                <div className="dashboard-section">
                    <div className="section-title">
                        <h2>My Appointments</h2>
                    </div>
                    <BookingsList bookings={bookings} onCancel={cancelBooking} />
                </div>
            ) : (
                <div>
                    <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>What would you like to book today?</h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '30px',
                        padding: '0 20px'
                    }}>
                        <ServiceCard
                            title="Medical / Doctor"
                            image="https://placehold.co/600x400/e8f0fe/1a73e8?text=Doctor+Appointment"
                            icon="🩺"
                            desc="Find specialists near you"
                            onClick={() => goToCategory('DOCTOR')}
                        />
                        <ServiceCard
                            title="Salon & Beauty"
                            image="https://placehold.co/600x400/fff0f5/d63384?text=Salon+Services"
                            icon="✂️"
                            desc="Hair, Nails, and Spa"
                            onClick={() => goToCategory('SALON')}
                        />
                        <ServiceCard
                            title="Car Rental"
                            image="https://placehold.co/600x400/e9ecef/495057?text=Rent+a+Car"
                            icon="🚗"
                            desc="City and Luxury Cars"
                            onClick={() => goToCategory('CAR_RENTAL')}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

const ServiceCard = ({ title, image, icon, desc, onClick }) => (
    <div style={{
        background: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        transition: 'transform 0.2s',
        cursor: 'pointer'
    }}
        onClick={onClick}
        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'}
        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
        <div style={{ height: '200px', overflow: 'hidden' }}>
            <img src={image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                <h3 style={{ margin: 0 }}>{title}</h3>
            </div>
            <p style={{ color: '#666', marginBottom: '20px' }}>{desc}</p>
            <button className="auth-button" style={{ width: '100%', marginTop: 0 }}>
                Book Appointment
            </button>
        </div>
    </div>
);

const BookingsList = ({ bookings, onCancel }) => {
    if (bookings.length === 0) return <p>No appointments found.</p>;

    const getStatusColor = (status) => {
        switch (status) {
            case 'CONFIRMED': return 'green';
            case 'PENDING': return 'orange';
            case 'CANCELLED': return 'red';
            default: return 'gray';
        }
    };

    return (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
                <tr style={{ textAlign: 'left' }}>
                    <th style={{ padding: '10px', borderBottom: '1px solid #eee' }}>Time Period</th>
                    <th style={{ padding: '10px', borderBottom: '1px solid #eee' }}>Service</th>
                    <th style={{ padding: '10px', borderBottom: '1px solid #eee' }}>Status</th>
                    <th style={{ padding: '10px', borderBottom: '1px solid #eee' }}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {bookings.map(booking => {
                    const start = booking.start_datetime ? new Date(booking.start_datetime) : new Date(`${booking.booking_date}T${booking.start_time}`);
                    // If end_datetime exists use it, otherwise use start_time logic (fallback)
                    // But migration populated all.
                    const end = booking.end_datetime ? new Date(booking.end_datetime) : null;

                    return (
                        <tr key={booking.id}>
                            <td style={{ padding: '10px', borderBottom: '1px solid #eee', fontSize: '0.9rem' }}>
                                <strong>{start.toLocaleDateString()}</strong><br />
                                {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {end && (
                                    <> - {end.toLocaleDateString() === start.toLocaleDateString() ?
                                        end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
                                        <><br />{end.toLocaleDateString()} {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                                    }
                                    </>
                                )}
                            </td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                                <strong>{booking.service_name}</strong> <br />
                                <small>{booking.counterpart_name}</small>
                            </td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                                <span style={{ color: getStatusColor(booking.status), fontWeight: 'bold' }}>
                                    {booking.status}
                                </span>
                            </td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                                {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                                    <button
                                        onClick={() => onCancel(booking.id, booking.status)}
                                        style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}
                                    >
                                        Cancel
                                    </button>
                                )}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};

export default ClientDashboard;
