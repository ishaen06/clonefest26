import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { InteractiveParticleBackground } from './components/InteractiveParticleBackground';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { CreateSecret } from './pages/CreateSecret';
import { ViewSecret } from './pages/ViewSecret';
import { ManageSecret } from './pages/ManageSecret';

export function App() {
  return (
    <LanguageProvider>
      <Router>
        <div className="app-shell min-h-screen flex flex-col selection:bg-blue-600 selection:text-white relative">
          {/* Interactive Background Canvas */}
          <InteractiveParticleBackground />

          <div className="relative z-10 flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 pb-16">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/create" element={<CreateSecret />} />
                <Route path="/new" element={<CreateSecret />} />
                <Route path="/secret/:id" element={<ViewSecret />} />
                <Route path="/manage" element={<ManageSecret />} />
                <Route path="/manage/:id" element={<ManageSecret />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            <footer className="border-t border-zinc-800/80 bg-zinc-950/50 py-6 text-center text-xs font-mono text-zinc-500">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                <div>
                  <span>Jigsaw v2.0 • Zero-Knowledge Ephemeral Platform</span>
                </div>
                <div className="flex items-center space-x-4 text-zinc-400 text-[11px]">
                  <span>AES-256-GCM</span>
                  <span>•</span>
                  <span>Shamir's Threshold SSS</span>
                  <span>•</span>
                  <span>Ephemeral Vanishing Timers</span>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </Router>
    </LanguageProvider>
  );
}

export default App;
