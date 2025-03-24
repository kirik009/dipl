import { FC, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { School, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const Header: FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-white shadow-sm fixed w-full top-0 z-50">
      <nav className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <School className="h-6 w-6 text-primary" />
          <Link href="/" className="font-heading font-semibold text-xl text-gray-800">
            SentenceBuilder
          </Link>
        </div>
        
        <div className="hidden md:flex items-center space-x-8">
          <Link href="/" className={`${location === '/' ? 'text-primary' : 'text-gray-600 hover:text-primary'} transition`}>
            Home
          </Link>
          <Link href="/#features" className="text-gray-600 hover:text-primary transition">
            Features
          </Link>
          {user && (
            <Link href="/dashboard" className={`${location === '/dashboard' ? 'text-primary' : 'text-gray-600 hover:text-primary'} transition`}>
              Dashboard
            </Link>
          )}
          {user?.role === 'admin' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`${location.startsWith('/admin') ? 'text-primary' : 'text-gray-600 hover:text-primary'} transition`}>
                  Admin
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Admin Panel</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/users">Manage Users</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/exercises">Manage Exercises</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-0">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(user.username)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user.username}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                {user.role === 'admin' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin/users">Admin: Users</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/exercises">Admin: Exercises</Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/auth">
                <Button variant="ghost" className="px-4 py-2 text-primary font-medium">
                  Log in
                </Button>
              </Link>
              <Link href="/auth">
                <Button className="px-4 py-2 bg-primary text-white rounded-md font-medium">
                  Sign up
                </Button>
              </Link>
            </>
          )}
          
          <button 
            className="md:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 py-2">
          <div className="container mx-auto px-4 flex flex-col space-y-2">
            <Link href="/" 
              className={`py-2 ${location === '/' ? 'text-primary' : 'text-gray-600'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link href="/#features" 
              className="py-2 text-gray-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            {user && (
              <Link href="/dashboard" 
                className={`py-2 ${location === '/dashboard' ? 'text-primary' : 'text-gray-600'}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
            )}
            {user && (
              <Link href="/profile" 
                className={`py-2 ${location === '/profile' ? 'text-primary' : 'text-gray-600'}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Profile
              </Link>
            )}
            {user?.role === 'admin' && (
              <>
                <div className="py-2 font-semibold text-gray-800">Admin</div>
                <Link href="/admin/users" 
                  className={`py-2 pl-4 ${location === '/admin/users' ? 'text-primary' : 'text-gray-600'}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Manage Users
                </Link>
                <Link href="/admin/exercises" 
                  className={`py-2 pl-4 ${location === '/admin/exercises' ? 'text-primary' : 'text-gray-600'}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Manage Exercises
                </Link>
              </>
            )}
            {user && (
              <button 
                className="py-2 text-red-500 text-left"
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
