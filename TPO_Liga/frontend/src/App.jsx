import './App.css';
import Standings from './components/Standings';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-extrabold text-center mt-6 mb-12 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 drop-shadow-md">
        Youth Basketball League Admin
      </h1>
      <Standings />
    </div>
  );
}

export default App;
