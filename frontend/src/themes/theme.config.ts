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
      backgroundColor: '#FFFFFF',
      textColor: '#000000',
      primaryColor: '#007BFF',
      secondaryColor: '#6C757D',
    },
  },
  halloween: {
    name: 'Halloween',
    styles: {
      backgroundColor: '#000000',
      textColor: '#FFFFFF',
      primaryColor: '#FF7900',
      secondaryColor: '#663399',
    },
  },
  thanksgiving: {
    name: 'Thanksgiving',
    styles: {
      backgroundColor: '#F8F9FA',
      textColor: '#212529',
      primaryColor: '#D2691E',
      secondaryColor: '#8B4513',
    },
  },
  christmas: {
    name: 'Christmas',
    styles: {
      backgroundColor: '#FFFFFF',
      textColor: '#000000',
      primaryColor: '#DC3545',
      secondaryColor: '#28A745',
    },
  },
  newYears: {
    name: 'New Year\'s',
    styles: {
      backgroundColor: '#000000',
      textColor: '#FFFFFF',
      primaryColor: '#FFD700',
      secondaryColor: '#C0C0C0',
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