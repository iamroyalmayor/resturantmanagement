import { User } from '../types';
import { mockUser } from '../data/mockData';

// Authentication service
export class AuthService {
  private static instance: AuthService;
  private user: User | null = null;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public async login(email: string, password: string): Promise<User> {
    // Mock login - in real app, this would call your API
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = { ...mockUser, email };
        this.user = user;
        localStorage.setItem('restaurant-user', JSON.stringify(user));
        resolve(user);
      }, 1000);
    });
  }

  public logout(): void {
    this.user = null;
    localStorage.removeItem('restaurant-user');
  }

  public getCurrentUser(): User | null {
    if (!this.user) {
      const savedUser = localStorage.getItem('restaurant-user');
      if (savedUser) {
        this.user = JSON.parse(savedUser);
      }
    }
    return this.user;
  }

  public isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }
}