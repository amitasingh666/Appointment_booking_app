
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import './Dashboard.css';

const BookAppointment = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Initialize Category
    const [category, setCategory] = useState(location.state?.category || 'DOCTOR');

    // Data States
    const [allServices, setAllServices] = useState([]);
    const [filteredServices, setFilteredServices] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter States
    const [specialization, setSpecialization] = useState('');
    const [uniqueSpecializations, setUniqueSpecializations] = useState([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // Booking Selection States (Common)
    const [selectedService, setSelectedService] = useState(null);

    // Standard Appointment States
    const [date, setDate] = useState('');
    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Car Rental States
    const [startDateTime, setStartDateTime] = useState('');
    const [endDateTime, setEndDateTime] = useState('');

    useEffect(() => {
        fetchServices();
        const today = new Date().toISOString().split('T')[0];
        setDate(today);
    }, []);

    const fetchServices = async () => {
        try {
            const response = await api.get('/services/public');
            setAllServices(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to load services');
            setLoading(false);
        }
    };

    // Filter Logic
    useEffect(() => {
        let results = allServices.filter(s => s.provider_category === category);
        const specs = [...new Set(results.map(s => s.provider_specialization).filter(Boolean))];
        setUniqueSpecializations(specs);

        if (specialization) {
            results = results.filter(s => s.provider_specialization === specialization);
        }
        setFilteredServices(results);
        setCurrentPage(1);
    }, [allServices, category, specialization]);

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentServices = filteredServices.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredServices.length / itemsPerPage);

    // Standard Slot Fetching
    const fetchSlots = async () => {
        if (!selectedService || !date || category === 'CAR_RENTAL') return;
        setLoadingSlots(true);
        setSlots([]);
        try {
            const response = await api.get('/bookings/slots', {
                params: {
                    providerId: selectedService.provider_id,
                    date: date,
                    serviceId: selectedService.id
                }
            });
            setSlots(response.data);
        } catch (error) {
            console.error('Failed to load slots');
        } finally {
            setLoadingSlots(false);
        }
    };

    useEffect(() => {
        if (selectedService && date && category !== 'CAR_RENTAL') {
            fetchSlots();
        }
    }, [selectedService, date]);

    // Standard Booking
    const handleBookSlot = async (slotTime) => {
        try {
            await api.post('/bookings', {
                providerId: selectedService.provider_id,
                serviceId: selectedService.id,
                date,
                startTime: slotTime
            });
            toast.success('Booking Confirmed!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Booking Failed');
            fetchSlots();
        }
    };

    // Car Rental Booking
    const handleCarBooking = async () => {
        if (!startDateTime || !endDateTime) {
            toast.warning('Please select both start and end times');
            return;
        }
        if (new Date(startDateTime) >= new Date(endDateTime)) {
            toast.warning('End time must be after start time');
            return;
        }

        try {
            await api.post('/bookings', {
                providerId: selectedService.provider_id,
                serviceId: selectedService.id,
                startDateTime,
                endDateTime
            });
            toast.success('Car Rented Successfully!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Booking Failed');
        }
    };

    const calculateRentalCost = () => {
        if (!startDateTime || !endDateTime || !selectedService) return null;
        const start = new Date(startDateTime);
        const end = new Date(endDateTime);
        if (start >= end) return null;

        const diffMs = end - start;
        const diffHours = diffMs / (1000 * 60 * 60);
        // Round up to nearest hour? or exact? Let's do exact with 2 decimals
        const hours = parseFloat(diffHours.toFixed(2));
        const cost = (hours * parseFloat(selectedService.price)).toFixed(2);

        return { hours, cost };
    };

    const rentalDetails = calculateRentalCost();

    const getPageTitle = () => {
        switch (category) {
            case 'DOCTOR': return 'Find a Specialist';
            case 'SALON': return 'Book Salon & Beauty Services';
            case 'CAR_RENTAL': return 'Rent a Vehicle (Self-Drive)';
            default: return 'Find a Service';
        }
    };

    return (
        <div className="dashboard-content">
            <button onClick={() => navigate('/dashboard')} className="logout-btn" style={{ marginBottom: '20px' }}>
                ← Back to Dashboard
            </button>
            <div className="dashboard-section">
                <div className="section-title">
                    <h2 style={{ color: '#1a73e8' }}>{getPageTitle()}</h2>
                </div>

                {/* Filters */}
                <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <label style={{ fontWeight: '500' }}>Filter by:</label>
                    <select
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        style={{ padding: '8px', minWidth: '200px', borderRadius: '4px', border: '1px solid #ddd' }}
                    >
                        <option value="">All Specializations</option>
                        {uniqueSpecializations.map(spec => (
                            <option key={spec} value={spec}>{spec}</option>
                        ))}
                    </select>
                </div>

                {/* Services Grid */}
                <div style={{ marginBottom: '20px' }}>
                    {loading ? <p>Loading services...</p> : (
                        filteredServices.length === 0 ? (
                            <p>No services found in this category.</p>
                        ) : (
                            <>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                    gap: '20px'
                                }}>
                                    {currentServices.map(service => (
                                        <div
                                            key={service.id}
                                            onClick={() => {
                                                setSelectedService(service);
                                                setSlots([]);
                                                setStartDateTime('');
                                                setEndDateTime('');
                                            }}
                                            style={{
                                                border: selectedService?.id === service.id ? '2px solid #1a73e8' : '1px solid #eee',
                                                borderRadius: '12px',
                                                cursor: 'pointer',
                                                background: selectedService?.id === service.id ? '#f8fbff' : 'white',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                                transition: 'all 0.2s',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            {service.image_url ? (
                                                <div style={{ height: '180px', overflow: 'hidden' }}>
                                                    <img src={service.image_url} alt={service.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                            ) : (
                                                <div style={{ height: '100px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                                                    <span>No Image</span>
                                                </div>
                                            )}

                                            <div style={{ padding: '20px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                                                    <div>
                                                        <h4 style={{ margin: '0 0 5px 0', fontSize: '1.2rem' }}>{service.name}</h4>
                                                        <span style={{ fontSize: '0.85rem', color: '#666', background: '#f0f2f5', padding: '2px 8px', borderRadius: '4px' }}>
                                                            {service.vehicle_type || service.provider_specialization || 'Service'}
                                                        </span>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <span style={{ display: 'block', fontWeight: 'bold', color: '#1a73e8', fontSize: '1.2rem' }}>${service.price}</span>
                                                        <span style={{ fontSize: '0.8rem', color: '#666' }}>
                                                            {category === 'CAR_RENTAL' ? '/ hour' : `${service.duration} mins`}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Chip Details */}
                                                {(service.seats || service.fuel_type) && (
                                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                                                        {service.seats && (
                                                            <span style={{ fontSize: '0.85rem', background: '#e9ecef', padding: '4px 8px', borderRadius: '4px' }}>
                                                                💺 {service.seats} Seats
                                                            </span>
                                                        )}
                                                        {service.fuel_type && (
                                                            <span style={{ fontSize: '0.85rem', background: '#e9ecef', padding: '4px 8px', borderRadius: '4px' }}>
                                                                ⛽ {service.fuel_type}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee', fontSize: '0.85rem', color: '#888' }}>
                                                    Provider: {service.provider_name}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Pagination Controls (Simplified) */}
                                {totalPages > 1 && (
                                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(c => c - 1)}>Prev</button>
                                        <span style={{ margin: '0 10px' }}>Page {currentPage}</span>
                                        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(c => c + 1)}>Next</button>
                                    </div>
                                )}
                            </>
                        )
                    )}
                </div>

                {/* Booking Section */}
                {selectedService && (
                    <div style={{ marginTop: '30px', padding: '25px', background: '#fff', borderRadius: '12px', border: '1px solid #e0e0e0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ marginTop: 0, color: '#1a73e8' }}>
                            {category === 'CAR_RENTAL' ? 'Rent this Vehicle' : `Book Appointment for ${selectedService.name}`}
                        </h3>

                        {category === 'CAR_RENTAL' ? (
                            // CAR RENTAL INTERFACE
                            <div style={{ maxWidth: '400px' }}>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>From When</label>
                                    <input
                                        type="datetime-local"
                                        value={startDateTime}
                                        onChange={(e) => setStartDateTime(e.target.value)}
                                        min={new Date().toISOString().slice(0, 16)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>To When</label>
                                    <input
                                        type="datetime-local"
                                        value={endDateTime}
                                        onChange={(e) => setEndDateTime(e.target.value)}
                                        min={startDateTime || new Date().toISOString().slice(0, 16)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                                    />
                                </div>

                                {rentalDetails && (
                                    <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                                        <p style={{ margin: '5px 0' }}>Duration: <strong>{rentalDetails.hours} Hours</strong></p>
                                        <p style={{ margin: '5px 0', fontSize: '1.2rem', color: '#1a73e8' }}>Total Cost: <strong>${rentalDetails.cost}</strong></p>
                                    </div>
                                )}

                                <button
                                    onClick={handleCarBooking}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: '#1a73e8',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Book Now (Check Availability)
                                </button>
                            </div>
                        ) : (
                            // STANDARD APPOINTMENT INTERFACE
                            <>
                                <div style={{ marginBottom: '20px', maxWidth: '300px' }}>
                                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Select Date</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '15px', fontWeight: 'bold' }}>Available Time Slots</label>
                                    {loadingSlots ? <p>Checking...</p> : (
                                        slots.length === 0 ? <p style={{ color: '#d93025' }}>No available slots.</p> : (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                {slots.map(slot => (
                                                    <button
                                                        key={slot}
                                                        onClick={() => handleBookSlot(slot)}
                                                        style={{
                                                            padding: '10px 20px',
                                                            background: 'white',
                                                            border: '1px solid #1a73e8',
                                                            color: '#1a73e8',
                                                            borderRadius: '30px',
                                                            cursor: 'pointer',
                                                            fontWeight: '600'
                                                        }}
                                                        onMouseOver={(e) => { e.target.style.background = '#1a73e8'; e.target.style.color = 'white'; }}
                                                        onMouseOut={(e) => { e.target.style.background = 'white'; e.target.style.color = '#1a73e8'; }}
                                                    >
                                                        {slot}
                                                    </button>
                                                ))}
                                            </div>
                                        )
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookAppointment;
