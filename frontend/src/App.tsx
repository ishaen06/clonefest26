import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { InteractiveParticleBackground } from './components/InteractiveParticleBackground';
import { Navbar } from './components/Navbar';
import { checkBackendHealth } from './api/client';

// Lazy loaded page bundles
const HomePage = lazy(() => import('./pages/HomePage'));
const CreateSecret = lazy(() => import('./pages/CreateSecret'));
const ViewSecret = lazy(() => import('./pages/ViewSecret'));
const ManageSecret = lazy(() => import('./pages/ManageSecret'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh] font-mono text-xs text-blue-400 space-x-2">
    <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
    <span>Loading Jigsaw module...</span>
  </div>
);

export function App() {
  // Pre-warm backend immediately on app launch
  useEffect(() => {
    checkBackendHealth();
  }, []);

  return (
    <LanguageProvider>
      <Router>
        <div className="app-shell min-h-screen flex flex-col selection:bg-blue-600 selection:text-white relative">
          {/* Interactive Background Canvas */}
          <InteractiveParticleBackground />

          <div className="relative z-10 flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 pb-16" id="main-content">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/create" element={<CreateSecret />} />
                  <Route path="/new" element={<CreateSecret />} />
                  <Route path="/secret" element={<Navigate to="/create" replace />} />
                  <Route path="/secret/:id" element={<ViewSecret />} />
                  <Route path="/view" element={<Navigate to="/create" replace />} />
                  <Route path="/view/:id" element={<ViewSecret />} />
                  <Route path="/manage" element={<ManageSecret />} />
                  <Route path="/manage/:id" element={<ManageSecret />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </main>

            <footer className="border-t border-zinc-800/80 bg-zinc-950/50 py-6 text-center text-xs font-mono text-zinc-500">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                <div>
                  <span>JigsawBin v2.0 • Zero-Knowledge Ephemeral Platform</span>
                </div>
                <div className="flex items-center space-x-4 text-zinc-400 text-[11px] flex-wrap justify-center gap-y-1">
                  <span>AES-256-GCM WebCrypto</span>
                  <span>•</span>
                  <span>Shamir GF(2^8) Quorum</span>
                  <span>•</span>
                  <span>Vanishing RAM Timers</span>
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
