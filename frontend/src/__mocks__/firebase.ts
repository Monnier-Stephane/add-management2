export const auth = {
  onAuthStateChanged: function(_auth: any, callback: (user: null | object) => void) { 
    callback(null);
    return function() {}; 
  },
  signOut: function() { return Promise.resolve() },
  currentUser: null,
}

export const getAuth = function() { return auth }

export const initializeApp = function() {}

// Version simplifiée sans référence à jest
export function mockClear() {
  // Cette fonction sera remplacée par les mocks de test Jest
} 