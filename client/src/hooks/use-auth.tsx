import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { InsertUser, LoginUserInput, RegisterUserInput, User } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: Omit<User, 'password'> | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<Omit<User, 'password'>, Error, LoginUserInput>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<Omit<User, 'password'>, Error, RegisterUserInput>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<Omit<User, 'password'> | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginUserInput) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: Omit<User, 'password'>) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Вход выполнен",
        description: `Добро пожаловать, ${user.fullName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Вход не выполнен",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterUserInput) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (user: Omit<User, 'password'>) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Регистрация успешна",
        description: `Добро пожаловать, ${user.fullName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Регистрация не выполнена",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Выход успешен",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Выход не выполнен",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
}
