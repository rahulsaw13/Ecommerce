import { allApiWithHeaderToken } from "@api/api";
import { API_CONSTANTS } from "@constants/apiurl";

/**
 * Get theme color from localStorage
 */
const getStoredThemeColor = () => {
  try {
    return localStorage.getItem('admin_theme_color') || '#000000';
  } catch (error) {
    return '#000000';
  }
};

/**
 * Save theme color to localStorage
 */
const saveThemeColorToStorage = (color) => {
  try {
    localStorage.setItem('admin_theme_color', color);
  } catch (error) {
  }
};

/**
 * Apply theme colors to CSS variables
 */
export const applyThemeColors = (adminColor, userColor) => {
  // Apply admin theme color
  if (adminColor) {
    document.documentElement.style.setProperty('--custom-secondary-color', adminColor);
    document.documentElement.style.setProperty('--color-TextPrimaryColor', adminColor);
    
    // Update admin scrollbar colors
    updateAdminScrollbarColor(adminColor);
  }

  // Apply user theme color
  if (userColor) {
    // User theme color is mainly for user-facing pages
    // We can apply it to user-specific CSS variables if needed
    document.documentElement.style.setProperty('--user-theme-color', userColor);
  }
};

/**
 * Update admin scrollbar colors
 */
const updateAdminScrollbarColor = (color) => {
  // Remove existing theme color style if any
  const existingStyle = document.getElementById('admin-theme-color-style');
  if (existingStyle) {
    existingStyle.remove();
  }

  // Create and inject new style
  const style = document.createElement('style');
  style.id = 'admin-theme-color-style';
  style.textContent = `
    .admin-scrollbar::-webkit-scrollbar-thumb {
      background: ${color} !important;
    }
    .admin-scrollbar::-webkit-scrollbar-thumb:hover {
      background: ${color}dd !important;
    }
    .admin-panel .p-component::-webkit-scrollbar-thumb {
      background: ${color} !important;
    }
    .admin-panel .p-component::-webkit-scrollbar-thumb:hover {
      background: ${color}dd !important;
    }
    .admin-panel .p-tooltip {
      background-color: ${color} !important;
    }
    .admin-panel .p-tooltip .p-tooltip-arrow {
      border-top-color: ${color} !important;
      border-bottom-color: ${color} !important;
      border-left-color: ${color} !important;
      border-right-color: ${color} !important;
    }
  `;
  document.head.appendChild(style);
};

/**
 * Initialize theme from localStorage (call this immediately on app load)
 */
export const initializeThemeFromStorage = () => {
  const storedColor = getStoredThemeColor();
  applyThemeColor('admin_theme_color', storedColor);
  return storedColor;
};

/**
 * Load theme colors from backend
 */
export const loadThemeColors = async () => {
  console.log('loadThemeColors called');
  try {
    console.log('Fetching settings from API:', API_CONSTANTS.COMMON_SETTINGS_URL);
    const response = await allApiWithHeaderToken(
      API_CONSTANTS.COMMON_SETTINGS_URL,
      "",
      "get"
    );
    
    console.log('Settings API response:', response);
    
    if (response?.status === 200) {
      const settings = response?.data?.data || [];
      console.log('Settings data:', settings);
      let adminColor = '#000000';
      
      // Find admin theme color setting
      const adminColorSetting = settings.find(s => {
        const attrs = s.attributes || s;
        return attrs.key === 'admin_theme_color';
      });
      
      console.log('Admin color setting found:', adminColorSetting);
      
      if (adminColorSetting) {
        const attrs = adminColorSetting.attributes || adminColorSetting;
        adminColor = attrs.value || '#000000';
        console.log('Admin color value:', adminColor);
      }
      
      // Save to localStorage for next time
      saveThemeColorToStorage(adminColor);
      console.log('Saved to localStorage:', adminColor);
      
      // Apply the color
      applyThemeColor('admin_theme_color', adminColor);
      console.log('Applied theme color:', adminColor);
      
      return { admin_theme_color: adminColor };
    }
  } catch (error) {
    console.error('Error loading theme colors:', error);
    const storedColor = getStoredThemeColor();
    console.log('Using stored color as fallback:', storedColor);
    applyThemeColor('admin_theme_color', storedColor);
    return { admin_theme_color: storedColor };
  }
};

/**
 * Reload theme colors (call this after settings update or login)
 */
export const reloadThemeColors = () => {
  return loadThemeColors();
};

/**
 * Apply single theme color (used when updating settings)
 */
export const applyThemeColor = (key, color) => {
  console.log('applyThemeColor called with key:', key, 'color:', color);
  if (key === 'admin_theme_color') {
    document.documentElement.style.setProperty('--custom-secondary-color', color);
    document.documentElement.style.setProperty('--color-TextPrimaryColor', color);
    updateAdminScrollbarColor(color);
    // Save to localStorage whenever we apply a color
    saveThemeColorToStorage(color);
    console.log('Theme color applied to CSS variables');
  } else if (key === 'user_theme_color') {
    document.documentElement.style.setProperty('--user-theme-color', color);
  }
};
