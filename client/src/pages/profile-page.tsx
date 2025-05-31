import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Navbar } from "@/components/layout/navbar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const profileUpdateSchema = z
  .object({
    username: z
      .string()
      .min(1, "Никнейм должен содержать не менее одной буквы"),
    fullName: z
      .string()
      .min(2, "Полное имя должно содержать не менее двух букв"),
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(6, "Новый пароль должен содержать не менее 6 букв")
      .optional(),
    confirmNewPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.newPassword && !data.currentPassword) {
        return false;
      }
      return true;
    },
    {
      message: "Current password is required when setting a new password",
      path: ["currentPassword"],
    }
  )
  .refine(
    (data) => {
      if (data.newPassword && data.newPassword !== data.confirmNewPassword) {
        return false;
      }
      return true;
    },
    {
      message: "Passwords do not match",
      path: ["confirmNewPassword"],
    }
  );

type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      username: user?.username || "",
      fullName: user?.fullName || "",
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileUpdateFormData) => {
      const res = await apiRequest("PATCH", `/api/user/${user?.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Операция выполнена",
        description: "Ваш пароль изменен.",
      });

      // Clear password fields
      form.setValue("currentPassword", "");
      form.setValue("newPassword", "");
      form.setValue("confirmNewPassword", "");
    },
    onError: (error: Error) => {
      toast({
        title: "Обновление не выполнено",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileUpdateFormData) => {
    updateProfileMutation.mutate(data);
  };

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto pt-20 pb-12 px-4 min-h-screen flex items-center justify-center">
          <p>Пожалуйста войдите, чтобы увидеть эту страницу.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container mx-auto pt-20 pb-12 px-4">
        <div className="py-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-gray-800 text-white p-6">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-xl font-bold">
                    {user.fullName
                      .split(" ")
                      .map((name) => name[0])
                      .join("")}
                  </div>
                  <div className="ml-4">
                    <h2 className="font-heading text-2xl font-semibold">
                      {user.fullName}
                    </h2>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-8">
                  <h3 className="font-heading text-xl font-semibold mb-4">
                    Настройки профиля
                  </h3>

                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Полное имя</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ваше полное имя"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Никнейм</FormLabel>
                              <FormControl>
                                <Input placeholder="Ваше никнейм" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700 mb-4">
                          Сменить пароль
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <FormField
                            control={form.control}
                            name="currentPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Настоящий пароль</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    placeholder="••••••••"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Оставьте пустым, чтобы сохранить настоящий
                                  пароль
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="newPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Новый пароль</FormLabel>
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
                            control={form.control}
                            name="confirmNewPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Подтвердите новый пароль</FormLabel>
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
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          className="px-6"
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending
                            ? "Сохранение..."
                            : "Сохранить изменения"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
