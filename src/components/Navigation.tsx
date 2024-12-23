import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation: React.FC = () => {
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className="bg-white shadow-sm">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    <div className="flex space-x-4">
                        <Link
                            to="/"
                            className={`px-3 py-2 rounded-md text-sm font-medium ${
                                isActive('/') 
                                    ? 'text-indigo-600 bg-indigo-50' 
                                    : 'text-gray-600 hover:text-indigo-600'
                            }`}
                        >
                            New Session
                        </Link>
                        <Link
                            to="/videos"
                            className={`px-3 py-2 rounded-md text-sm font-medium ${
                                isActive('/videos')
                                    ? 'text-indigo-600 bg-indigo-50'
                                    : 'text-gray-600 hover:text-indigo-600'
                            }`}
                        >
                            Videos
                        </Link>
                        <Link
                            to="/history"
                            className={`px-3 py-2 rounded-md text-sm font-medium ${
                                isActive('/history')
                                    ? 'text-indigo-600 bg-indigo-50'
                                    : 'text-gray-600 hover:text-indigo-600'
                            }`}
                        >
                            History
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navigation; 