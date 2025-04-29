import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ExercisePage from "@/pages/exercise-page";
import ExerciseResults from "@/pages/exercise-results";
import ProfilePage from "@/pages/profile-page";
import AdminDashboard from "@/pages/admin/dashboard";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "./lib/protected-route";
import TasksPage from "./pages/tasks-page";
import TaskEditor from "./pages/admin/task-editor";
import TaskPage from "./pages/task-page";
import TaskResults from "./pages/task-results";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/tasks/:taskId/prog/:progressId/exercises/:exerciseId/seq/:seq" component={ExercisePage} />
      <ProtectedRoute path="/tasks" component={TasksPage} />
      <ProtectedRoute path="/tasks/:id" component={TaskPage} />
      <ProtectedRoute path="/tasks/:taskId/prog/:progressId/exercises/:exerciseId/seq/:seq/results" component={ExerciseResults} />
      <ProtectedRoute path="/tasks/:taskId/prog/:progressId/results" component={TaskResults} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/admin" component={AdminDashboard} />
      <ProtectedRoute path="/admin/users" component={AdminDashboard} />
      <ProtectedRoute path="/admin/exercises" component={AdminDashboard} />
      <ProtectedRoute path="/admin/exercises/new" component={AdminDashboard} />
      <ProtectedRoute path="/admin/tasks" component={AdminDashboard} />
      <ProtectedRoute path="/admin/tasks/new" component={AdminDashboard} />
      <ProtectedRoute path="/admin/exercises/:id/edit" component={AdminDashboard} />
      <ProtectedRoute path="/admin/tasks/:id/edit" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DndProvider backend={HTML5Backend}>
          <Router />
          <Toaster />
        </DndProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
