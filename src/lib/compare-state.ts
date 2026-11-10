export const COMPARE_MAX = 3;

export type ComparedHome = {
  id: string;
  mlsNumber: string;
  price: number;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  beds: number;
  baths: number;
  sqft: number;
  propertyType: string;
  yearBuilt: number;
  listedDaysAgo: number;
  brokerage: string;
  image?: string;
  neighborhood?: string;
};

export function nextCompare(
  homes: ComparedHome[],
  home: ComparedHome,
  max = COMPARE_MAX
): { homes: ComparedHome[]; ok: boolean; reason?: string } {
  if (homes.some((item) => item.id === home.id)) {
    return { homes: homes.filter((item) => item.id !== home.id), ok: true };
  }
  if (homes.length >= max) {
    return {
      homes,
      ok: false,
      reason: `Compare holds ${max} homes. Remove one to add a different home.`,
    };
  }
  return { homes: [...homes, home], ok: true };
}
