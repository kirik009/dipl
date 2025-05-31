import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Redirect } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap } from "lucide-react";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(1, "Никнейм необходим"),
  password: z.string().min(1, "Пароль необходим"),
});

// Register form schema
const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Полное имя должно содержать не менее двух букв"),
    username: z.string().min(3, "Никнем должен содержать не менее трех букв"),
    password: z.string().min(6, "Пароль должен содержать не менее 6 букв"),
    confirmPassword: z.string().min(1, "Пожалуйста введите ваш пароль"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormData) => {
    const { confirmPassword, ...userData } = data;
    registerMutation.mutate({
      ...userData,
      role: "user",
      confirmPassword,
    });
  };

  // If user is already logged in, redirect to home
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20 pb-12">
        <div className="container mx-auto px-4 flex flex-col items-center">
          <div className="w-full max-w-4xl mx-auto mt-10 grid md:grid-cols-2 gap-8">
            {/* Left column - Auth form */}
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="mb-6 text-center">
                <GraduationCap className="w-12 h-12 text-primary mx-auto mb-2" />
                <h1 className="text-2xl font-bold font-heading">
                  Добро пожаловать
                </h1>
                <p className="text-gray-600 mt-2">
                  Войдите или создайти аккаунт, чтобы начать изучение
                </p>
              </div>

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="login">Войти</TabsTrigger>
                  <TabsTrigger value="register">Зарегистрироваться</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form
                      onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Никнейм</FormLabel>
                            <FormControl>
                              <Input placeholder="Ваш никнейм" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Пароль</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full mt-6"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? "Вход..." : "Войти"}
                      </Button>
                    </form>
                  </Form>

                  <div className="mt-6 text-center text-sm text-gray-500">
                    Нет аккаунта?{" "}
                    <Button
                      variant="link"
                      className="p-0"
                      onClick={() => setActiveTab("register")}
                    >
                      Зарегистрироваться
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form
                      onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={registerForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Полное имя</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Введите ваше полное имя"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Никнейм</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Введите ваш никнейм"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Пароль</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Подтвердите пароль</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full mt-6"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending
                          ? "Создание аккаунта..."
                          : "Создать аккаунт"}
                      </Button>
                    </form>
                  </Form>

                  <div className="mt-6 text-center text-sm text-gray-500">
                    Есть аккаунт?{" "}
                    <Button
                      variant="link"
                      className="p-0"
                      onClick={() => setActiveTab("login")}
                    >
                      Войти
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right column - Hero */}
            <div className="bg-primary text-white p-8 rounded-xl shadow-sm hidden md:flex md:flex-col md:justify-center">
              <h2 className="text-3xl font-bold font-heading mb-6">
                Улучшай свои навыки владений английским
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="bg-white bg-opacity-20 rounded-full p-1 mr-3 mt-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p>Интерактивные упражнения по построению предложений</p>
                </li>
                <li className="flex items-start">
                  <div className="bg-white bg-opacity-20 rounded-full p-1 mr-3 mt-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p>Следи за своим прогрессом</p>
                </li>
                <li className="flex items-start">
                  <div className="bg-white bg-opacity-20 rounded-full p-1 mr-3 mt-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p>
                    Изучай грамматические правила благодаря практике и
                    объяснениям
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="bg-white bg-opacity-20 rounded-full p-1 mr-3 mt-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p>
                    Упражнения для всех уровней: от начинающего до продвинутого
                  </p>
                </li>
              </ul>
              <div className="mt-8">
                <img
                  src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=500&h=300"
                  alt="Student studying"
                  className="rounded-lg shadow-lg object-cover w-full h-48"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
