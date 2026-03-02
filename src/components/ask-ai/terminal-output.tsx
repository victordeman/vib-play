import React, { useEffect, useRef } from 'react';

interface TerminalOutputProps {
  output: {
    command: string;
    stdout: string;
    stderr?: string;
    exitCode?: number;
    timestamp: number;
  }[];
  isVisible: boolean;
  onClose: () => void;
}

const TerminalOutput: React.FC<TerminalOutputProps> = ({ output, isVisible, onClose }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-64 bg-black text-green-400 font-mono text-xs rounded-lg shadow-2xl flex flex-col border border-gray-700 z-50">
      <div className="flex items-center justify-between p-2 bg-gray-800 rounded-t-lg border-b border-gray-700">
        <div className="flex space-x-1.5 px-1">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
        </div>
        <span className="text-gray-400 text-[10px] uppercase tracking-wider font-bold">Vibe Terminal</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-gray-700"
      >
        {output.length === 0 ? (
          <div className="text-gray-600 italic">No activity recorded...</div>
        ) : (
          output.map((entry, i) => (
            <div key={i} className="animate-in fade-in slide-in-from-bottom-1 duration-300">
              <div className="flex items-center space-x-2 text-blue-400">
                <span className="text-gray-500">[{new Date(entry.timestamp).toLocaleTimeString()}]</span>
                <span className="text-white">$</span>
                <span className="font-bold">{entry.command}</span>
              </div>
              {entry.stdout && <pre className="mt-1 whitespace-pre-wrap pl-4">{entry.stdout}</pre>}
              {entry.stderr && <pre className="mt-1 whitespace-pre-wrap pl-4 text-red-400">{entry.stderr}</pre>}
              {entry.exitCode !== undefined && entry.exitCode !== 0 && (
                <div className="text-red-500 text-[10px] mt-1">Process exited with code {entry.exitCode}</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TerminalOutput;
