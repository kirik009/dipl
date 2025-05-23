import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { GraduationCap, Loader2, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { AssingedTask } from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";

export function Navbar() {
  const { user, logoutMutation } = useAuth();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();
  const handleLogout = () => {
    logoutMutation.mutate();
  };
    const { data: assignedTasks, isLoading: assignedLoading, error: assignedError } = useQuery<(AssingedTask& { taskName: string | null }  & {authorName: string | null })[]>({
    queryKey: [`/api/assignedTasks/${Number(user?.id || 0)}`],
  });
  const menuItems = [
    { href: "/", label: "Главная" },
    { href: "/tasks", label: (assignedTasks && assignedTasks.length > 0) ? `Упражнения (${assignedTasks?.length})` : "Упражнения", protected: true },
    { href: "/profile", label: "Профиль", protected: true },
    { href: "/admin", label: "Панель администратора", admin: true },
    { href: "/admin", label: "Панель преподавателя", teacher: true}
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (item.admin && (!user || user.role !== 'admin')) return false;
    if (item.teacher && (!user || user.role !== 'teacher')) return false;
    if (item.protected && !user) return false;
    return true;
  });
 if (assignedLoading) {
    return (
        <>
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
      
      </>
    );
  }
  return (
    <header className="bg-white shadow-sm fixed w-full top-0 z-50">
      <nav className="container mx-auto px-4 py-3 flex items-center justify-between">
         <div className={` ${isMobile ? "flex flex-col" : "flex w-full justify-between"}`}> 
        <div className="flex items-center space-x-1">
          <GraduationCap className="h-6 w-6 text-primary" />
          <Link href="/" className="font-heading font-semibold text-xl text-gray-800">
            SentenceBuilder
          </Link>
        </div>
        
        <div className="hidden md:flex items-center space-x-8">
          {filteredMenuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-gray-600 hover:text-primary transition",
                location === item.href && "text-primary font-medium"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <span className="hidden md:inline text-sm text-gray-600">
                {user.fullName}
              </span>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                Выйти
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                asChild
              >
                <Link href="/auth">Войти/Зарегистрироваться</Link>
              </Button>
              
            </>
          )}
        </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X /> : <Menu />}
        </Button>
      </nav>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white">
          <div className="px-4 py-2 space-y-1">
            {filteredMenuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block py-2 text-base text-gray-600 hover:text-primary transition",
                  location === item.href && "text-primary font-medium"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
