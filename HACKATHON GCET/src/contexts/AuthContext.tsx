import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'fisherman' | 'authority';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  phone?: string;
  boatId?: string; // For fishermen
  authorityId?: string; // For authorities
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user database
const mockUsers: (User & { password: string })[] = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    email: 'fisherman@tidewise.com',
    password: 'fisherman123',
    role: 'fisherman',
    phone: '+91 98765 43210',
    boatId: 'F-001'
  },
  {
    id: '2',
    name: 'Suresh Patel',
    email: 'fisherman2@tidewise.com',
    password: 'fisherman123',
    role: 'fisherman',
    phone: '+91 98765 43211',
    boatId: 'F-002'
  },
  {
    id: '3',
    name: 'Coastal Authority',
    email: 'authority@tidewise.com',
    password: 'authority123',
    role: 'authority',
    phone: '+91 98765 43212',
    authorityId: 'A-001'
  }
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored authentication on app load
    const storedUser = localStorage.getItem('tidewise_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem('tidewise_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const foundUser = mockUsers.find(u => 
      u.email === email && 
      u.password === password && 
      u.role === role
    );

    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('tidewise_user', JSON.stringify(userWithoutPassword));
      setIsLoading(false);
      return true;
    }

    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('tidewise_user');
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
