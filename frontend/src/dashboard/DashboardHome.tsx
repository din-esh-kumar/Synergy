import React from 'react';

const cards = [
  {
    title: "Meetings This Week",
    value: 8,
    change: "+5% from last week",
    color: "bg-blue-700",
  },
  {
    title: "New Contacts",
    value: 12,
    change: "+2% from last week",
    color: "bg-green-600",
  },
  {
    title: "Pending Invites",
    value: 3,
    change: "-1% from last week",
    color: "bg-red-500",
  }
];

const DashboardHome: React.FC = () => (
  <div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
      {cards.map(card => (
        <div key={card.title} className={`rounded-xl shadow-lg p-6 ${card.color} text-white`}>
          <div className="text-lg font-semibold mb-2">{card.title}</div>
          <div className="text-5xl font-black">{card.value}</div>
          <div className="text-xs mt-2">{card.change}</div>
        </div>
      ))}
    </div>
    <div className="grid md:grid-cols-3 gap-8">
      <div className="col-span-2 bg-[#181f32] rounded-xl p-6 min-h-[300px]">
        <h2 className="text-xl font-bold text-white mb-4">Upcoming Meetings</h2>
        {/* Place your meeting cards/calendars here */}
      </div>
      <div className="bg-[#181f32] rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
        {/* Place your activity feed here */}
      </div>
    </div>
  </div>
);

export default DashboardHome;
