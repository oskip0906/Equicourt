
import React from 'react';
import { Scale } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-gradient-to-r from-amber-900 via-orange-900 to-amber-800 text-white shadow-2xl relative overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-700 to-transparent opacity-30"></div>
      <div className="relative container mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg">
              <Scale className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-200 to-orange-200 bg-clip-text text-transparent">
                AI Arbitration Panel
              </h1>
              <p className="text-amber-200 text-sm font-medium tracking-wide">
                Intelligent Dispute Resolution System
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-6 text-amber-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">24/7</div>
              <div className="text-xs">Available</div>
            </div>
            <div className="w-px h-12 bg-amber-400 opacity-50"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">AI</div>
              <div className="text-xs">Powered</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
