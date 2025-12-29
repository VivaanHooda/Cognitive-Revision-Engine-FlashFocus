
import { User } from '../types';
import { v4 as uuidv4 } from 'uuid';

const USERS_KEY = 'flashfocus-users-v1';
const TOKEN_KEY = 'flashfocus-jwt-token';

// Simple JWT Simulation: btoa(header).btoa(payload).signature
const createJWT = (user: User): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ ...user, exp: Date.now() + 86400000 }));
  const signature = 'mock_signature_for_demo';
  return `${header}.${payload}.${signature}`;
};

const decodeJWT = (token: string): any => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch (e) {
    return null;
  }
};

export const authService = {
  async register(name: string, email: string, password: string): Promise<{ user: User; token: string }> {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 800));
    
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (users.find((u: any) => u.email === email)) {
      throw new Error('User already exists');
    }

    const newUser: User = { id: uuidv4(), name, email };
    users.push({ ...newUser, password });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    const token = createJWT(newUser);
    localStorage.setItem(TOKEN_KEY, token);
    return { user: newUser, token };
  },

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    await new Promise(r => setTimeout(r, 600));

    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const found = users.find((u: any) => u.email === email && u.password === password);

    if (!found) {
      throw new Error('Invalid credentials');
    }

    const user: User = { id: found.id, name: found.name, email: found.email };
    const token = createJWT(user);
    localStorage.setItem(TOKEN_KEY, token);
    return { user, token };
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
  },

  getCurrentUser(): User | null {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const payload = decodeJWT(token);
    if (!payload || payload.exp < Date.now()) {
      this.logout();
      return null;
    }
    return { id: payload.id, name: payload.name, email: payload.email };
  }
};
