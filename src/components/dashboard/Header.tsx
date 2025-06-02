import React, { useState, useEffect } from "react";
import { Search, X, User, LogOut, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "@/lib/hooks/useDebounce";
import type { CreateContainerCommandDTO } from "@/types";
import type { Toast } from "@/lib/hooks/useToasts";

interface HeaderProps {
  onSearch: (query: string) => void;
  isSearching?: boolean;
  searchQuery: string;
  onContainerCreate: (data: CreateContainerCommandDTO) => void;
  onToast: (toast: Omit<Toast, "id">) => void;
}

export function Header({ onSearch, isSearching, searchQuery, onContainerCreate, onToast }: HeaderProps) {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [user, setUser] = useState<{ firstName?: string; lastName?: string; email?: string } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"freezer" | "fridge">("freezer");
  const debouncedQuery = useDebounce(localQuery, 300);

  console.log("🏠 Header rendering:", { user, hasToken: !!localStorage.getItem("access_token") });

  // Get user info from localStorage
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Trigger search when debounced query changes
  useEffect(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  const handleClearSearch = () => {
    setLocalQuery("");
  };

  const handleSignOut = () => {
    // Clear all auth data from localStorage
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");

    console.log("🔐 User logged out, tokens cleared");

    // Redirect to login page
    window.location.href = "/login";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onContainerCreate({ name: name.trim(), type });
    setName("");
    setType("freezer");
    setIsDialogOpen(false);
    onToast({
      type: "success",
      title: "Container Created",
      description: `${name} has been added successfully.`,
    });
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
                <button onClick={handleClearSearch} className="absolute inset-y-0 right-0 pr-3 flex items-center">
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
          </div>

          {/* Actions and User Menu */}
          <div className="flex items-center space-x-3">
            {/* Add Container Button */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Container
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Container</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Container Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Main Freezer, Kitchen Fridge"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select value={type} onValueChange={(value: "freezer" | "fridge") => setType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="freezer">❄️ Freezer</SelectItem>
                        <SelectItem value="fridge">🧊 Fridge</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Container</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* User Menu */}
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
                      {user?.firstName || user?.lastName
                        ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                        : "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email || "No email"}</p>
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
