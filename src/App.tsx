import { Provider } from 'react-redux';
import { store } from './store';
import { DetoxPanel } from './components/DetoxPanel';
import { Toaster } from './components/ui/toaster';

function App() {
  return (
    <Provider store={store}>
      <div className="w-[400px] h-[600px] bg-[#1a1f2e] text-white p-6">
        <DetoxPanel />
      </div>
      <Toaster />
    </Provider>
  );
}

export default App;