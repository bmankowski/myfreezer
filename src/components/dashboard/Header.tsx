import React, { useState, useEffect } from 'react';
import { Search, X, User, LogOut } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useDebounce } from '@/lib/hooks/useDebounce';
import type { ItemWithLocationDTO } from '@/types';

interface HeaderProps {
  onSearch: (query: string) => void;
  searchResults?: ItemWithLocationDTO[];
  isSearching?: boolean;
  searchQuery: string;
}

export function Header({ onSearch, searchResults, isSearching, searchQuery }: HeaderProps) {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [user, setUser] = useState<any>(null);
  const debouncedQuery = useDebounce(localQuery, 300);

  console.log('🏠 Header rendering:', { user, hasToken: !!localStorage.getItem('access_token') });

  // Get user info from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Trigger search when debounced query changes
  useEffect(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  const handleClearSearch = () => {
    setLocalQuery('');
  };

  const handleSignOut = () => {
    // Clear all auth data from localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    
    console.log('🔐 User logged out, tokens cleared');
    
    // Redirect to login page
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">MyFreezer</h1>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-lg mx-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search items..."
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {localQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
              
              {/* Search loading indicator */}
              {isSearching && (
                <div className="absolute inset-y-0 right-8 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>

            {/* Search Results Dropdown */}
            {localQuery.length >= 2 && searchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                {searchResults.map((item) => (
                  <div
                    key={item.item_id}
                    className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          {item.container.name} → {item.shelf.name} • Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400">
                        {item.container.type === 'freezer' ? '❄️' : '🧊'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.firstName || user?.lastName ? 
                        `${user.firstName || ''} ${user.lastName || ''}`.trim() : 
                        'User'
                      }
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || 'No email'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
} 