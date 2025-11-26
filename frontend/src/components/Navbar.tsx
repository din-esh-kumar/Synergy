import React from 'react';

const Navbar: React.FC = () => (
  <header className="flex items-center justify-between px-8 py-4 bg-[#192135] border-b border-[#233050]">
    <div className="text-lg font-bold text-white">Good morning, Alex</div>
    <div className="flex gap-3 items-center">
      <input
        type="search"
        placeholder="Search meetings, contacts..."
        className="px-3 py-2 rounded bg-[#233050] text-white focus:outline-none w-64"
      />
      <button className="p-2 rounded-full bg-[#262e49] hover:bg-blue-600 text-white">
        <span className="material-symbols-outlined">notifications</span>
      </button>
      <img src="/avatar.jpg" alt="User Avatar" className="w-10 h-10 rounded-full border-2 border-blue-600" />
      <button className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition">
        + New Meeting
      </button>
    </div>
  </header>
);

export default Navbar;
