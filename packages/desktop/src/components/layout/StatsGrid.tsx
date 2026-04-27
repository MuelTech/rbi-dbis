import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Users, Home, User, Vote, Mars, Venus, UsersRound, Loader2 } from 'lucide-react';
import { StatCardProps } from '@/types';
import { dashboardService, ResidentDemographics } from '@/services/dashboard';

const REFRESH_INDICATOR_DELAY_MS = 180;

interface StatsGridProps {
  selectedBlock?: string;
}

const EMPTY: ResidentDemographics = {
  totalPopulation: 0,
  totalHousehold: 0,
  totalFamily: 0,
  seniorCitizen: 0,
  pwd: 0,
  voters: 0,
  male: 0,
  female: 0,
};

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

const StatsGrid: React.FC<StatsGridProps> = ({ selectedBlock = 'All' }) => {
  const cacheRef = useRef<Record<string, ResidentDemographics>>({});
  const [data, setData] = useState<ResidentDemographics>(EMPTY);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showRefreshing, setShowRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const hasDataRef = useRef(false);
  const indicatorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearIndicatorTimer = useCallback(() => {
    if (indicatorTimerRef.current !== null) {
      clearTimeout(indicatorTimerRef.current);
      indicatorTimerRef.current = null;
    }
  }, []);

  const fetchBlock = useCallback((block: string, cancelled: () => boolean) => {
    const key = blockKey(block);
    const param = key === 'All' ? undefined : key;

    const cached = cacheRef.current[key];
    if (cached) {
      setData(cached);
      if (!hasDataRef.current) {
        hasDataRef.current = true;
        setInitialLoading(false);
      }
    }

    clearIndicatorTimer();
    setRefreshError(null);

    if (hasDataRef.current) {
      indicatorTimerRef.current = setTimeout(() => {
        if (!cancelled()) setShowRefreshing(true);
      }, REFRESH_INDICATOR_DELAY_MS);
    }

    dashboardService
      .getResidentDemographics(param)
      .then((res) => {
        if (cancelled()) return;
        cacheRef.current[key] = res;
        setData(res);
        if (!hasDataRef.current) {
          hasDataRef.current = true;
          setInitialLoading(false);
        }
      })
      .catch((err) => {
        if (cancelled()) return;
        const msg = err instanceof Error ? err.message : 'Failed to load demographics';
        if (!hasDataRef.current) {
          setInitialLoading(false);
        }
        setRefreshError(msg);
      })
      .finally(() => {
        if (cancelled()) return;
        clearIndicatorTimer();
        setShowRefreshing(false);
      });
  }, [clearIndicatorTimer]);

  useEffect(() => {
    let cancelled = false;
    fetchBlock(selectedBlock, () => cancelled);
    return () => {
      cancelled = true;
      clearIndicatorTimer();
    };
  }, [selectedBlock, fetchBlock, clearIndicatorTimer]);

  const stats = [
    { title: 'Total Population', value: formatNumber(data.totalPopulation), icon: Users, bgColor: 'bg-blue-50', iconColor: 'text-blue-500' },
    { title: 'Total Household', value: formatNumber(data.totalHousehold), icon: Home, bgColor: 'bg-indigo-50', iconColor: 'text-indigo-500' },
    { title: 'Total Family', value: formatNumber(data.totalFamily), icon: UsersRound, bgColor: 'bg-purple-50', iconColor: 'text-purple-400' },
    { title: 'Senior Citizen', value: formatNumber(data.seniorCitizen), icon: User, bgColor: 'bg-blue-50', iconColor: 'text-blue-500' },
    { title: 'PWD', value: formatNumber(data.pwd), icon: Users, bgColor: 'bg-blue-50', iconColor: 'text-blue-500' },
    { title: 'Voters', value: formatNumber(data.voters), icon: Vote, bgColor: 'bg-blue-50', iconColor: 'text-blue-500' },
    { title: 'Male', value: formatNumber(data.male), icon: Mars, bgColor: 'bg-blue-50', iconColor: 'text-blue-500' },
    { title: 'Female', value: formatNumber(data.female), icon: Venus, bgColor: 'bg-purple-50', iconColor: 'text-purple-500' },
  ];

  return (
    <div className="relative mb-[clamp(1rem,2vh,2rem)]">
      {showRefreshing && (
        <div className="absolute -top-1 right-0 flex items-center gap-1.5 text-gray-400 text-xs font-medium z-10">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Updating…</span>
        </div>
      )}

      {refreshError && !initialLoading && (
        <div className="mb-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-medium flex items-center justify-between">
          <span>Could not refresh stats. Showing cached data.</span>
          <button
            onClick={() => setRefreshError(null)}
            className="ml-3 text-red-400 hover:text-red-600 font-bold text-sm leading-none"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[clamp(0.75rem,1.25vw,1.25rem)]">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} loading={initialLoading} />
        ))}
      </div>
    </div>
  );
};

export default StatsGrid;
