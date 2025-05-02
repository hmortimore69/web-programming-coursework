const userType = {
  getRole: () => localStorage.getItem('userRole') || 'spectator',

  setRole: (role) => {
    localStorage.setItem('userRole', role);
    userType.updateUI();
  },

  updateUI: () => {
    const role = userType.getRole();
    console.log('Updated Role:', role);

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

document.addEventListener('DOMContentLoaded', userType.updateUI);
