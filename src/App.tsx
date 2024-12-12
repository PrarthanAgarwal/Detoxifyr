import { Provider } from 'react-redux';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { store } from './store';
import Header from './components/layout/Header';
import Welcome from './components/onboarding/Welcome';
import PreferencesForm from './components/PreferencesForm';
import VideoList from './components/VideoList';
import SessionHistory from './components/history/SessionHistory';
import AdvancedSettings from './components/preferences/AdvancedSettings';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="w-[400px] min-h-[600px] bg-gray-50">
          <Header />
          <main className="p-4">
            <Routes>
              <Route path="/" element={<Welcome />} />
              <Route path="/new-session" element={<PreferencesForm />} />
              <Route path="/videos" element={<VideoList />} />
              <Route path="/history" element={<SessionHistory />} />
              <Route path="/settings" element={<AdvancedSettings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </Provider>
  );
}

export default App;