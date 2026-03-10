import { useEffect, useState } from "react";
import { getDrinksByCategory, getGuestsPrices, getMembersPrices } from "@/services/drinksService";

export function useDrinks() {
  const [drinksByCategory, setDrinksByCategory] = useState<any>({});
  const [drinksPricesGuests, setGuestsPrices] = useState<any>({});
  const [drinksPricesMembers, setMembersPrices] = useState<any>({});
  useEffect(() => {
    async function load() {
      const drinks = await getDrinksByCategory();

      setDrinksByCategory(drinks);
      setGuestsPrices(getGuestsPrices(drinks));
      setMembersPrices(getMembersPrices(drinks));
    }

    load();
  }, []);

  return {
    drinksByCategory,
    drinksPricesGuests,
    drinksPricesMembers,
  };
}