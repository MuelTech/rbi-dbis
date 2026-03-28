import React from 'react';
import { Users, Home, User, Vote, Mars, Venus, UsersRound } from 'lucide-react';
import { StatCardProps } from '@/types';

const MOCK_DATA = {
  'All': {
    population: '3,689',
    household: '367',
    family: '213',
    senior: '834',
    pwd: '321',
    voters: '2,803',
    male: '1,985',
    female: '1,643'
  },
  'Block 1': {
    population: '1,250',
    household: '125',
    family: '75',
    senior: '280',
    pwd: '110',
    voters: '950',
    male: '680',
    female: '570'
  },
  'Block 2': {
    population: '1,150',
    household: '115',
    family: '65',
    senior: '260',
    pwd: '105',
    voters: '880',
    male: '620',
    female: '530'
  },
  'Block 3': {
    population: '1,289',
    household: '127',
    family: '73',
    senior: '294',
    pwd: '106',
    voters: '973',
    male: '685',
    female: '604'
  }
};

interface StatsGridProps {
  selectedBlock?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, iconColor, bgColor }) => (
  <div className="bg-white p-[clamp(1rem,1.2vw,1.5rem)] rounded-3xl shadow-sm flex items-center justify-between border border-gray-100 min-h-[clamp(5.5rem,7.5vh,7.5rem)] transition-all">
    <div className="flex flex-col justify-center gap-0.5">
      <p className="text-gray-500 text-[clamp(0.75rem,0.8vw,0.875rem)] font-medium whitespace-nowrap">{title}</p>
      <h3 className="text-[clamp(1.25rem,1.75vw,1.6rem)] font-bold text-gray-900 tracking-tight">{value}</h3>
    </div>
    <div className={`p-[clamp(0.6rem,0.8vw,0.875rem)] rounded-2xl ${bgColor} flex-shrink-0`}>
      <Icon className={`${iconColor} w-[clamp(1.125rem,1.5vw,1.5rem)] h-[clamp(1.125rem,1.5vw,1.5rem)]`} />
    </div>
  </div>
);

const StatsGrid: React.FC<StatsGridProps> = ({ selectedBlock = 'All' }) => {
  const data = MOCK_DATA[selectedBlock as keyof typeof MOCK_DATA] || MOCK_DATA['All'];

  const stats = [
    { title: 'Total Population', value: data.population, icon: Users, bgColor: 'bg-blue-50', iconColor: 'text-blue-500' },
    { title: 'Total Household', value: data.household, icon: Home, bgColor: 'bg-indigo-50', iconColor: 'text-indigo-500' },
    { title: 'Total Family', value: data.family, icon: UsersRound, bgColor: 'bg-purple-50', iconColor: 'text-purple-400' },
    { title: 'Senior Citizen', value: data.senior, icon: User, bgColor: 'bg-blue-50', iconColor: 'text-blue-500' },
    { title: 'PWD', value: data.pwd, icon: Users, bgColor: 'bg-blue-50', iconColor: 'text-blue-500' },
    { title: 'Voters', value: data.voters, icon: Vote, bgColor: 'bg-blue-50', iconColor: 'text-blue-500' },
    { title: 'Male', value: data.male, icon: Mars, bgColor: 'bg-blue-50', iconColor: 'text-blue-500' },
    { title: 'Female', value: data.female, icon: Venus, bgColor: 'bg-purple-50', iconColor: 'text-purple-500' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[clamp(0.75rem,1.25vw,1.25rem)] mb-[clamp(1rem,2vh,2rem)]">
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  );
};

export default StatsGrid;