export interface Theme {
  name: string;
  styles: {
    backgroundColor: string;
    textColor: string;
    primaryColor: string;
    secondaryColor: string;
  };
}

export const themes: Record<string, Theme> = {
  default: {
    name: 'Default',
    styles: {
      backgroundColor: '#F9FAFB',
      textColor: '#1F2937',
      primaryColor: '#6366F1',
      secondaryColor: '#8B5CF6',
    },
  },
  halloween: {
    name: 'Halloween',
    styles: {
      backgroundColor: '#1F1F2E',
      textColor: '#F3F4F6',
      primaryColor: '#FF8C42',
      secondaryColor: '#7C3AED',
    },
  },
  thanksgiving: {
    name: 'Thanksgiving',
    styles: {
      backgroundColor: '#FAF5F0',
      textColor: '#292524',
      primaryColor: '#EA580C',
      secondaryColor: '#92400E',
    },
  },
  christmas: {
    name: 'Christmas',
    styles: {
      backgroundColor: '#F8FAFC',
      textColor: '#1E293B',
      primaryColor: '#DC2626',
      secondaryColor: '#16A34A',
    },
  },
  newYears: {
    name: 'New Year\'s',
    styles: {
      backgroundColor: '#0F172A',
      textColor: '#F1F5F9',
      primaryColor: '#FBBF24',
      secondaryColor: '#1E40AF',
    },
  },
};

export const getTheme = (): Theme => {
  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();

  if (month === 9) { // October
    return themes.halloween;
  }

  if (month === 10) { // November
    return themes.thanksgiving;
  }

  if (month === 11) { // December
    if (day <= 28) {
      return themes.christmas;
    } else {
      return themes.newYears;
    }
  }

  if (month === 0 && day <= 7) { // January
    return themes.newYears;
  }

  return themes.default;
};