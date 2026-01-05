// Supabase authentication and user management

// NOTE: Storing keys in source is not recommended. Move these to env/config and rotate the key if it was committed.
const SUPABASE_URL = 'https://dwhnjikownwksbamdqdm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aG5qaWtvd253a3NiYW1kcWRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MjQ3ODEsImV4cCI6MjA4MzEwMDc4MX0.nKIUy3o5[...]';

// User roles
const USER_ROLES = {
  GUEST: 'guest',
  FREE: 'free',
  PRO: 'pro',
  ELITE: 'elite',
  ADMIN: 'admin'
};

// Current user state
let currentUser = null;

// Supabase client (initialized when library available)
let supabase = null;

// Initialize authentication
async function initAuth() {
  if (!supabase) {
    console.error('Supabase not initialized');
    return;
  }
  
  // Check if user is already logged in
  try {
    const { data: { session } = {}, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error);
    }

    if (session) {
      currentUser = session.user;
      await loadUserProfile();
      updateUIForUser();
    }
  } catch (err) {
    console.error('initAuth error:', err);
    return;
  }
  
  // Listen for auth changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session) {
      currentUser = session.user;
      await loadUserProfile();
      updateUIForUser();
      // Redirect to dashboard if on login page
      if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        window.location.href = 'dashboard.html';
      }
    } else {
      currentUser = null;
      updateUIForGuest();
    }
  });
}

// Load user profile from database
async function loadUserProfile() {
  if (!currentUser || !supabase) return;
  
  // Get user profile
  let { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', currentUser.id)
    .single();
  
  if (profileError) {
    console.error('Error loading user profile:', profileError);
    return;
  }
  
  if (profile) {
    currentUser.profile = profile;
    
    // Get subscription status
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', currentUser.id)
      .single();
    
    if (!subError && subscription) {
      currentUser.subscription = subscription;
      // Update user role based on subscription
      if (subscription.status === 'active') {
        if (subscription.plan === 'pro') {
          currentUser.profile.role = USER_ROLES.PRO;
        } else if (subscription.plan === 'elite') {
          currentUser.profile.role = USER_ROLES.ELITE;
        }
      } else {
        // If subscription is not active, check if user was previously a pro/elite
        if (profile.role !== USER_ROLES.ADMIN && profile.role !== USER_ROLES.FREE) {
          currentUser.profile.role = USER_ROLES.FREE; // Downgrade to free
        }
      }
    }
  } else {
    // Create user profile if it doesn't exist
    await createUserProfile();
  }
}

// Create user profile in database
async function createUserProfile() {
  if (!currentUser || !supabase) return;
  
  const { error } = await supabase
    .from('users')
    .insert([{
      id: currentUser.id,
      email: currentUser.email,
      username: currentUser.email.split('@')[0], // Default username
      role: USER_ROLES.FREE,
      created_at: new Date().toISOString()
    }]);
  
  if (error) {
    console.error('Error creating user profile:', error);
  }
}

// Update UI based on user state
function updateUIForUser() {
  document.querySelectorAll('.auth-required').forEach(el => el.style.display = 'block');
  document.querySelectorAll('.guest-only').forEach(el => el.style.display = 'none');
  
  // Update user info in header
  if (currentUser && currentUser.profile) {
    document.querySelectorAll('.user-email').forEach(el => {
      el.textContent = currentUser.email;
    });
    
    document.querySelectorAll('.user-role').forEach(el => {
      el.textContent = currentUser.profile.role || USER_ROLES.FREE;
    });
  }
}

function updateUIForGuest() {
  document.querySelectorAll('.auth-required').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.guest-only').forEach(el => el.style.display = 'block');
}

// Login function
async function login(email, password) {
  if (!supabase) {
    throw new Error('Supabase not initialized');
  }
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) {
    throw error;
  }
}

// Register function
async function register(email, password, username) {
  if (!supabase) {
    throw new Error('Supabase not initialized');
  }
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username
      }
    }
  });
  
  if (error) {
    throw error;
  }
  
  // Create user profile
  if (data && data.user) {
    const { error: profileError } = await supabase
      .from('users')
      .insert([{
        id: data.user.id,
        email: data.user.email,
        username: username,
        role: USER_ROLES.FREE,
        created_at: new Date().toISOString()
      }]);
    
    if (profileError) {
      console.error('Error creating user profile:', profileError);
    }
  }
  
  return data;
}

// Logout function
async function logout() {
  if (!supabase) {
    console.error('Supabase not initialized');
    window.location.href = 'index.html';
    return;
  }
  
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error logging out:', error);
  } else {
    currentUser = null;
    window.location.href = 'index.html';
  }
}

// Check user role
function hasRole(requiredRole) {
  if (!currentUser || !currentUser.profile) return false;
  
  const userRole = currentUser.profile.role || USER_ROLES.FREE;
  const roleHierarchy = [USER_ROLES.GUEST, USER_ROLES.FREE, USER_ROLES.PRO, USER_ROLES.ELITE, USER_ROLES.ADMIN];
  
  return roleHierarchy.indexOf(userRole) >= roleHierarchy.indexOf(requiredRole);
}

// Check if user has access to a specific feature
function hasAccess(requiredRole) {
  return hasRole(requiredRole);
}

// Function to initialize Supabase when the library is available
function initializeSupabase() {
  if (typeof window.supabase !== 'undefined' && window.supabase) {
    // The loaded script should provide a createClient function or you may import createClient from @supabase/supabase-js
    if (typeof window.supabase.createClient === 'function') {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
      // If you instead load @supabase/supabase-js as a module and expose createClient globally, adjust accordingly
      console.error('Supabase library loaded but createClient not found on window.supabase');
      return false;
    }
    
    // Initialize auth when Supabase is available
    initAuth();
    
    // Make functions available globally
    window.login = login;
    window.register = register;
    window.logout = logout;
    window.hasRole = hasRole;
    window.hasAccess = hasAccess;
    
    return true;
  }
  return false;
}

// Try to initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (!initializeSupabase()) {
    // If Supabase is not available immediately, wait a bit and try again
    setTimeout(() => {
      if (!initializeSupabase()) {
        console.error('Supabase library not available');
      }
    }, 100);
  }
});
