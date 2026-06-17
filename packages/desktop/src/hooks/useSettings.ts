import { useQuery } from '@tanstack/react-query';
import { settingsService, BarangaySettings } from '@/services/settings';

const DEFAULT_SETTINGS: BarangaySettings = {
  slogan: 'Serbisyong Tapat, Para sa Lahat',
  barangayName: 'Barangay 418',
  municipality: 'Manila City',
  province: 'Metro Manila',
  telephone: '8921-1234',
  punongBarangay: 'Juan Dela Cruz',
  councilor1: 'Pedro Penduko',
  councilor2: 'Maria Makiling',
  councilor3: 'Jose Rizal',
  councilor4: 'Andres Bonifacio',
  councilor5: 'Emilio Aguinaldo',
  councilor6: 'Gabriela Silang',
  councilor7: 'Melchora Aquino',
  skChairman: 'Kabataan Pagasa',
  treasurer: 'Yaman Bayan',
  secretary: 'Sulat Kamay',
  clearanceFee: '200',
  residencyFee: '150',
  businessFee: '500',
  ownershipFee: '300',
  purposes: [],
};

export function useSettings() {
  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.get(),
    staleTime: 60_000,
  });

  return { settings: data ?? DEFAULT_SETTINGS, isLoading };
}
