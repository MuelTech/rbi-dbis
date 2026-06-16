import React from 'react';
import { Users, Home, User, Vote, Mars, Venus, UsersRound, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { StatCardProps } from '@/types';
import { dashboardService } from '@/services/dashboard';

interface StatsGridProps {
  selectedBlock?: string;
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function blockKey(selectedBlock: string): string {
  return selectedBlock.replace('Block ', '');
}

const StatCard: React.FC<StatCardProps & { loading?: boolean }> = ({ title, value, icon: Icon, iconColor, bgColor, loading }) => (
  <div className="bg-white p-[clamp(1rem,1.2vw,1.5rem)] rounded-3xl shadow-sm flex items-center justify-between border border-gray-100 min-h-[clamp(5.5rem,7.5vh,7.5rem)] transition-all">
    <div className="flex flex-col justify-center gap-0.5">
      <p className="text-gray-500 text-[clamp(0.75rem,0.8vw,0.875rem)] font-medium whitespace-nowrap">{title}</p>
      {loading ? (
        <div className="h-[clamp(1.25rem,1.75vw,1.6rem)] flex items-center">
          <div className="w-16 h-4 bg-gray-100 rounded animate-pulse" />
        </div>
      ) : (
        <h3 className="text-[clamp(1.25rem,1.75vw,1.6rem)] font-bold text-gray-900 tracking-tight">{value}</h3>
      )}
    </div>
    <div className={`p-[clamp(0.6rem,0.8vw,0.875rem)] rounded-2xl ${bgColor} flex-shrink-0`}>
      <Icon className={`${iconColor} w-[clamp(1.125rem,1.5vw,1.5rem)] h-[clamp(1.125rem,1.5vw,1.5rem)]`} />
    </div>
  </div>
);

const EMPTY = {
  totalPopulation: 0,
  totalHousehold: 0,
  totalFamily: 0,
  seniorCitizen: 0,
  pwd: 0,
  voters: 0,
  male: 0,
  female: 0,
};

const StatsGrid: React.FC<StatsGridProps> = ({ selectedBlock = 'All' }) => {
  const key = blockKey(selectedBlock);
  const param = key === 'All' ? undefined : key;

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['demographics', selectedBlock],
    queryFn: () => dashboardService.getResidentDemographics(param),
    staleTime: 60_000,
  });

  const statsData = data ?? EMPTY;

  const stats = [
    { title: 'Total Population', value: formatNumber(statsData.totalPopulation), icon: Users, bgColor: 'bg-blue-50', iconColor: 'text-blue-500' },
    { title: 'Total Household', value: formatNumber(statsData.totalHousehold), icon: Home, bgColor: 'bg-indigo-50', iconColor: 'text-indigo-500' },
    { title: 'Total Family', value: formatNumber(statsData.totalFamily), icon: UsersRound, bgColor: 'bg-purple-50', iconColor: 'text-purple-400' },
    { title: 'Senior Citizen', value: formatNumber(statsData.seniorCitizen), icon: User, bgColor: 'bg-blue-50', iconColor: 'text-blue-500' },
    { title: 'PWD', value: formatNumber(statsData.pwd), icon: Users, bgColor: 'bg-blue-50', iconColor: 'text-blue-500' },
    { title: 'Voters', value: formatNumber(statsData.voters), icon: Vote, bgColor: 'bg-blue-50', iconColor: 'text-blue-500' },
    { title: 'Male', value: formatNumber(statsData.male), icon: Mars, bgColor: 'bg-blue-50', iconColor: 'text-blue-500' },
    { title: 'Female', value: formatNumber(statsData.female), icon: Venus, bgColor: 'bg-purple-50', iconColor: 'text-purple-500' },
  ];

  return (
    <div className="relative mb-[clamp(1rem,2vh,2rem)]">
      {isFetching && !isLoading && (
        <div className="absolute -top-1 right-0 flex items-center gap-1.5 text-gray-400 text-xs font-medium z-10">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Updating…</span>
        </div>
      )}

      {error && !isLoading && data && (
        <div className="mb-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-medium flex items-center justify-between">
          <span>Could not refresh stats. Showing cached data.</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[clamp(0.75rem,1.25vw,1.25rem)]">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} loading={isLoading} />
        ))}
      </div>
    </div>
  );
};

export default StatsGrid;
