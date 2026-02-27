export const drinksByCategory = {
  cervejas: {
    guests: {
      "Chopp Pilsen": 12,
      "Chopp Mutum": 22,
      "Long Neck Heineken": 15,
      "Long Neck Corona": 14,
      "Long Neck Stella Artois": 12,
      "Long Neck Sol": 12,
      "Long Neck Therezópolis": 12,
      "Long Neck Amstel": 12,
      "Long Neck Ultra": 12,
    },
    members: {
      "Chopp Pilsen": 10,
      "Chopp Mutum": 18,
      "Long Neck Heineken": 12,
      "Long Neck Corona": 12,
      "Long Neck Stella Artois": 8,
      "Long Neck Sol": 8,
      "Long Neck Therezópolis": 8,
      "Long Neck Amstel": 8,
      "Long Neck Ultra": 8,
    },
  },
  // cervejasPremium: {
  //   guests: {
  //     "Mutum Lata": 25,
  //     "Mutum Groller": 40,
  //   },
  //   members: {
  //     "Mutum Lata": 25,
  //     "Mutum Groller": 40,
  //   },
  // },
  comidas: {
    guests: {
      "Espetinho de Carne": 12,
      "Espetinho de Cafta": 12,
      "Espetinho de Coração": 10,
      "Espetinho de Queijo": 10,
      "Pão de Alho": 10,
      "Pipoca": 25,
    },
    members: {
      "Espetinho de Carne": 10,
      "Espetinho de Cafta": 10,
      "Espetinho de Coração": 8,
      "Espetinho de Queijo": 8,
      "Pão de Alho": 8,
      "Pipoca": 25,
    },
  },
  bebidasNaoAlcoolicas: {
    guests: {
      "Água sem gás": 5,
      "Água com gás": 5,
      "Água Tônica Zero": 8,
      "Café": 5,
      "Coca-Cola": 8,
      "Coca-Cola Zero": 8,
      "Coca-Cola Light": 8,
      "Guaraná Zero": 8,
      "Sprite Zero": 8,
      "Suco de Laranja": 5,
      "Schweppes Citrus": 8,
    },
    members: {
      "Água sem gás": 3,
      "Água com gás": 3,
      "Água Tônica Zero": 6,
      "Café": 3,
      "Coca-Cola": 6,
      "Coca-Cola Zero": 6,
      "Coca-Cola Light": 6,
      "Guaraná Zero": 6,
      "Sprite Zero": 6,
      "Suco de Laranja": 4,
      "Schweppes Citrus": 6,
    },
  },
  energetico: {
    guests: {
      "Monster Zero": 15,
      "Red Bull": 16,
      "Red Bull Sugar Free": 16,
    },
    members: {
      "Monster Zero": 12,
      "Red Bull": 12,
      "Red Bull Sugar Free": 12,
    },
  },
  doses: {
    guests: {
      "Dose Gin": 10,
      "Dose Jagermeister": 20,
      "Dose Whiskey": 20,
      "Dose Campari": 10,
      "Dose Rum": 15,
    },
    members: {
      "Dose Gin": 5,
      "Dose Jagermeister": 15,
      "Dose Whiskey": 15,
      "Dose Campari": 5,
      "Dose Rum": 10,
    },
  },
  vinhos: {
    guests: {
      "Vinho Cordero": 89,
      "Vinho Caoba": 69,
    },
    members: {
      "Vinho Cordero": 80,
      "Vinho Caoba": 43,
    },
  },
  snacks: {
    guests: {
      "Goma de Mascar": 3,
    },
    members: {
      "Goma de Mascar": 2,
    },
  },
};

// Mantendo compatibilidade com código existente
export const drinksPricesGuests: Record<string, number> = Object.values(drinksByCategory).reduce(
  (acc, category) => ({ ...acc, ...category.guests }),
  {}
);

export const drinksPricesMembers: Record<string, number> = Object.values(drinksByCategory).reduce(
  (acc, category) => ({ ...acc, ...category.members }),
  {}
);
