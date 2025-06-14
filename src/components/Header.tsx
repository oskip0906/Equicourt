
import React from 'react';
import { Scale } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-slate-900 text-white shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center space-x-3">
          <Scale className="h-8 w-8 text-blue-400" />
          <div>
            <h1 className="text-3xl font-bold">AI Arbitration Panel</h1>
            <p className="text-slate-300 text-sm">Intelligent Dispute Resolution System</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
