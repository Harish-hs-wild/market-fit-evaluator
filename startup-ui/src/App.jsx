import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  
  // New state for mobile sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fetch history when the page loads
  const fetchHistory = async () => {
    try {
      const response = await axios.get('https://market-fit-api.onrender.com/api/history');
      setHistory(response.data);
    } catch (err) {
      console.error("Failed to load history", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleValidate = async () => {
    if (!idea.trim()) {
      setError("Please describe your vision.");
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.post('https://market-fit-api.onrender.com/api/validate', {
        idea: idea
      });
      setResult(response.data);
      // Refresh the sidebar immediately after generating a new one!
      fetchHistory(); 
    } catch (err) {
      setError("Connection to the intelligence layer failed. Check your backend.");
    } finally {
      setLoading(false);
    }
  };

  // Reconstruct the DB object back into the UI format when a user clicks a history item
  const loadPastEvaluation = (pastItem) => {
    setIdea(pastItem.originalIdea);
    setResult({
      scores: {
        overallFeasibility: pastItem.overallFeasibility,
        systemComplexity: pastItem.systemComplexity,
        scalabilityRisk: pastItem.scalabilityRisk,
        securityRequirements: pastItem.securityRequirements,
        mvpSpeed: pastItem.mvpSpeed
      },
      brutalVerdict: pastItem.brutalVerdict,
      techStackRecommendation: pastItem.techStackRecommendation,
      complianceChecklist: pastItem.complianceChecklist || []
    });
    
    // Auto-close sidebar on mobile after selection
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const ScoreBar = ({ label, score }) => {
    let glowColor = 'shadow-[0_0_15px_rgba(74,222,128,0.2)] bg-green-400';
    if (score < 40) glowColor = 'shadow-[0_0_15px_rgba(248,113,113,0.2)] bg-red-400';
    else if (score < 70) glowColor = 'shadow-[0_0_15px_rgba(250,204,21,0.2)] bg-yellow-400';

    return (
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm tracking-wide text-zinc-400 font-medium">{label}</span>
          <span className="text-sm font-mono text-zinc-300">{score}/100</span>
        </div>
        <div className="w-full bg-zinc-800/50 rounded-full h-1.5 overflow-hidden backdrop-blur-sm">
          <div 
            className={`h-1.5 rounded-full ${glowColor} transition-all duration-1000 ease-out`} 
            style={{ width: `${score}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 selection:bg-zinc-800 font-sans antialiased relative overflow-hidden">
      
      {/* Subtle Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-zinc-800/30 blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto py-8 lg:py-12 px-6 sm:px-8 relative z-10 flex gap-12">
        
        {/* Mobile Sidebar Overlay (Click outside to close) */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* LEFT COLUMN: History Sidebar (Responsive Drawer) */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-80 bg-zinc-950 lg:bg-transparent border-r border-zinc-800/50 lg:border-none p-6 lg:p-0 
          transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:w-1/4 h-full lg:h-auto overflow-y-auto
          ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        `}>
          <div className="flex justify-between items-center mb-6 pl-2 border-l border-zinc-700">
            <h2 className="text-zinc-500 text-sm uppercase tracking-widest font-mono">Recent Blueprints</h2>
            
            {/* Mobile Close Button */}
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 text-zinc-400 hover:text-white rounded-md bg-zinc-900/50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-3 pb-20 lg:pb-0">
            {history.length === 0 && (
              <p className="text-zinc-600 text-sm italic pl-2">No past blueprints found.</p>
            )}
            
            {history.map((item) => (
              <div 
                key={item._id} 
                onClick={() => loadPastEvaluation(item)}
                className="group cursor-pointer bg-zinc-900/40 hover:bg-zinc-800/80 border border-zinc-800/50 hover:border-zinc-600/50 rounded-2xl p-4 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-mono text-zinc-500 group-hover:text-zinc-400">Score: {item.overallFeasibility}</span>
                  <span className="text-[10px] uppercase text-zinc-600">{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-zinc-300 font-light line-clamp-2 leading-relaxed">
                  {item.originalIdea}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Main Input & Results */}
        <div className="w-full lg:w-3/4">
          
          {/* Mobile Hamburger Menu Toggle */}
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2.5 text-zinc-300 hover:text-white rounded-xl bg-zinc-900/80 border border-zinc-800/50 shadow-lg backdrop-blur-sm transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-zinc-500 font-mono text-sm uppercase tracking-widest">History</span>
          </div>

          {/* Header */}
          <div className="mb-12 space-y-4">
            <h1 className="select-none text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500 pb-2">
              Market Fit Evaluator.
            </h1>
            <p className="text-base sm:text-lg text-zinc-400 font-light max-w-xl">
              Pitch your vision. Get a brutal, data-driven technical architecture and compliance blueprint.
            </p>
          </div>

          {/* Input Area */}
          <div className="relative group mb-12">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-2 shadow-2xl">
              <textarea
                rows="4"
                className="w-full bg-transparent border-0 text-zinc-200 placeholder-zinc-600 focus:ring-0 p-4 sm:p-6 resize-none text-base sm:text-lg font-light leading-relaxed outline-none"
                placeholder="Describe your software idea..."
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
              />
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-t border-zinc-800/50 gap-4 sm:gap-0">
                <div className="text-red-400 text-sm pl-2">{error}</div>
                <button
                  onClick={handleValidate}
                  disabled={loading}
                  className="w-full sm:w-auto bg-white text-black hover:bg-zinc-200 disabled:opacity-50 disabled:hover:bg-white font-medium py-3 px-8 rounded-full transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      Processing
                    </>
                  ) : 'Generate Blueprint'}
                </button>
              </div>
            </div>
          </div>

          {/* Results Dashboard */}
          {result && !loading && (
            <div className="animate-fade-in-up space-y-6">
              
              {/* Top Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center">
                  <span className="text-zinc-500 text-sm uppercase tracking-widest mb-2 font-mono">Feasibility</span>
                  <div className="text-6xl sm:text-7xl font-light tracking-tighter text-white mb-2">
                    {result.scores?.overallFeasibility || 0}
                  </div>
                  <span className="text-zinc-500 text-sm">Out of 100</span>
                </div>

                <div className="col-span-1 md:col-span-2 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-3xl p-6 sm:p-8 flex flex-col justify-center">
                  <h3 className="text-zinc-500 text-sm uppercase tracking-widest mb-4 font-mono">Architect's Verdict</h3>
                  <p className="text-lg sm:text-xl text-zinc-300 font-light leading-relaxed">
                    "{result.brutalVerdict}"
                  </p>
                </div>
              </div>

              {/* Bottom Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                
                <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-3xl p-6 sm:p-8">
                  <h3 className="text-zinc-500 text-sm uppercase tracking-widest mb-8 font-mono">Technical Load</h3>
                  <ScoreBar label="System Complexity" score={result.scores?.systemComplexity || 0} />
                  <ScoreBar label="Scalability Risk" score={result.scores?.scalabilityRisk || 0} />
                  <ScoreBar label="Security Requirements" score={result.scores?.securityRequirements || 0} />
                  <ScoreBar label="MVP Speed" score={result.scores?.mvpSpeed || 0} />
                </div>

                <div className="space-y-6">
                  
                  <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-3xl p-6 sm:p-8">
                    <h3 className="text-zinc-500 text-sm uppercase tracking-widest mb-4 font-mono">Recommended Stack</h3>
                    <p className="text-zinc-200 font-medium leading-relaxed">{result.techStackRecommendation}</p>
                  </div>

                  <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-3xl p-6 sm:p-8">
                    <h3 className="text-zinc-500 text-sm uppercase tracking-widest mb-4 font-mono">Infrastructure Overview</h3>
                    <div className="text-zinc-300 font-light leading-relaxed space-y-4 text-sm">
                      <p>
                        The proposed system architecture is designed for <strong>high-concurrency data ingestion</strong> and 
                        <strong> transactional integrity</strong>, leveraging a microservices pattern to isolate core services.
                      </p>
                    </div>
                  </div>

                  <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-3xl p-6 sm:p-8">
                    <h3 className="text-zinc-500 text-sm uppercase tracking-widest mb-4 font-mono text-yellow-400">Compliance & Legal</h3>
                    <ul className="space-y-3">
                      {result.complianceChecklist?.map((item, index) => (
                        <li key={index} className="flex items-start text-zinc-400 text-sm leading-relaxed">
                          <span className="text-yellow-500 mr-3 mt-0.5">⚠</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default App;