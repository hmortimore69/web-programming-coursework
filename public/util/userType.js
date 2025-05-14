/**
 * Object containing methods for managing and displaying user roles in the application.
 * @namespace
 * @property {Function} getRole - Gets the current user role from localStorage.
 * @property {Function} setRole - Sets a new user role in localStorage and updates the UI.
 * @property {Function} updateUI - Updates the UI based on the current user role.
 */
const userType = {
  /**
   * Retrieves the current user role from localStorage.
   * Defaults to 'spectator' if no role is stored.
   * @property
   * @returns {string} The current user role ('admin', 'marshall', or 'spectator').
   */
  getRole: () => localStorage.getItem('userRole') || 'spectator',

  /**
   * Sets a new user role in localStorage and updates the UI to reflect the change.
   * @property
   * @param {string} role - The new role to set ('admin', 'marshall', or 'spectator').
   * @returns {void}
   */
  setRole: (role) => {
    localStorage.setItem('userRole', role);
    userType.updateUI();
  },

  /**
   * Updates the user interface based on the current user role.
   * Shows/hides admin and marshall specific elements and updates the role selector.
   * @property
   * @returns {void}
   */
  updateUI: () => {
    const role = userType.getRole();

    const adminElements = document.querySelectorAll('.admin-only');
    const marshallElements = document.querySelectorAll('.marshall-only');

    // Toggle UI elements based on role
    switch (role) {
      case 'admin':
        for (const el of adminElements) el.style.display = 'block';
        for (const el of marshallElements) el.style.display = 'block';
        break;

      case 'marshall':
        for (const el of adminElements) el.style.display = 'none';
        for (const el of marshallElements) el.style.display = 'block';
        break;

      default:
        for (const el of adminElements) el.style.display = 'none';
        for (const el of marshallElements) el.style.display = 'none';
        break;
    }

    const roleSelector = document.querySelector('#role-selector');
    if (roleSelector) roleSelector.value = role;
  },
};

/**
 * DOMContentLoaded event listener that updates the UI based on the current user role.
 * @event
 */
document.addEventListener('DOMContentLoaded', userType.updateUI);