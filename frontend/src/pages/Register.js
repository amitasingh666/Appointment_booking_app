import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        phone: '',
        role: 'CLIENT',
        category: 'DOCTOR', // Default if provider selected
        specialization: ''
    });
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(
                formData.fullName,
                formData.email,
                formData.password,
                formData.phone,
                formData.role,
                formData.role === 'PROVIDER' ? formData.category : null,
                formData.role === 'PROVIDER' ? formData.specialization : null
            );
            navigate('/dashboard');
        } catch (err) {
            setError(err);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Register</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Phone</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>I am a:</label>
                        <select name="role" value={formData.role} onChange={handleChange}>
                            <option value="CLIENT">Consumer (Book Services)</option>
                            <option value="PROVIDER">Service Provider (Offer Services)</option>
                        </select>
                    </div>

                    {formData.role === 'PROVIDER' && (
                        <>
                            <div className="form-group">
                                <label>Category</label>
                                <select name="category" value={formData.category} onChange={handleChange}>
                                    <option value="DOCTOR">Doctor</option>
                                    <option value="SALON">Salon</option>
                                    <option value="CAR_RENTAL">Car Rental</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Specialization / Main Type</label>
                                <input
                                    type="text"
                                    name="specialization"
                                    placeholder="e.g. Dentist, Unisex Salon, Luxury Cars"
                                    value={formData.specialization}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </>
                    )}

                    <button type="submit" className="auth-button">Register</button>
                </form>
                <div className="auth-footer">
                    Already have an account? <Link to="/login">Login</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
