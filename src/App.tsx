import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { store } from './store';
import { useDispatch } from 'react-redux';
import { AppDispatch } from './store';
import { loadHistory } from './store/sessionSlice';
import Header from './components/layout/Header';
import Welcome from './components/onboarding/Welcome';
import EnhancedPreferencesForm from './components/EnhancedPreferencesForm';
import VideoList from './components/VideoList';
import SessionHistory from './components/history/SessionHistory';
import AdvancedSettings from './components/preferences/AdvancedSettings';

// Create a wrapper component to handle history loading
const AppContent: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        // Load history when app starts
        dispatch(loadHistory());
    }, [dispatch]);

    return (
        <div className="w-[400px] min-h-[600px] bg-gray-50">
            <Header />
            <main className="p-4">
                <Routes>
                    <Route path="/" element={<Welcome />} />
                    <Route path="/new-session" element={<EnhancedPreferencesForm />} />
                    <Route path="/videos" element={<VideoList />} />
                    <Route path="/history" element={<SessionHistory />} />
                    <Route path="/settings" element={<AdvancedSettings />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </div>
    );
};

function App() {
    return (
        <Provider store={store}>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <AppContent />
            </Router>
        </Provider>
    );
}

export default App;