import React from 'react';
import { Sparkles } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Logo and Brand */}
        <div className="flex items-center space-x-4">
          <div className="bg-blue-500 rounded-2xl p-3 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-bold text-blue-600">LocalBook</h1>
          <span className="bg-purple-100 text-purple-600 px-4 py-1.5 rounded-full text-sm font-medium">
            Admin
          </span>
        </div>

        {/* Right side - Welcome message and Avatar */}
        <div className="flex items-center space-x-4">
          <p className="text-gray-600 text-base">Welcome back, Admin User</p>
          <div className="bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-lg">A</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
