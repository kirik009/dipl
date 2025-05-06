import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import UserManagement from "./user-management";
import ExerciseManagement from "./exercise-management";
import ExerciseEditor from "./exercise-editor";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import TaskManagement from "./task-management";
import TaskEditor from "./task-editor";
import GrammarManagement from "./grammar-management";

export default function AdminDashboard() {
  const [location] = useLocation();
  const { user } = useAuth();

  // Determine which tab should be active based on the URL
  let initialTab = user?.role === "admin" ? "users" : "tasks";
  
  if (location.startsWith("/admin/tasks")) {
    initialTab = "tasks";
  } else if (location.startsWith("/admin/grammar")) {
    initialTab = "grammar";
  }
  
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Check if we're in an editor mode
  const isEditingExercise = location.includes("/exercises/new") || (location.includes("/exercises/") && location.includes("/edit"))
  const isEditingTask = location.includes("/tasks/new") || (location.includes("/tasks/") && location.includes("/edit"))

  // Redirect non-admin users
  if (!user || !['admin', 'teacher'].includes(user.role)) {
    return <Redirect to="/" />;
  }

  let content
  if (isEditingExercise) { 
    content = <ExerciseEditor />
  
}
  else if (isEditingTask) { 

    content = <TaskEditor />
  }
else {
  content = (
    <>
      {/* Admin Tabs */}
      <div className="bg-gray-100 px-6 flex border-b border-gray-200">
      {user?.role === "admin" &&
        <Link href="/admin/users">
          <a className={`py-4 px-4 font-medium ${activeTab === 'users' ? 'text-primary border-b-2 border-primary' : 'text-gray-600'}`}
             onClick={() => setActiveTab('users')}>
            Пользователи
          </a>
        </Link>
}
        <Link href="/admin/tasks">
          <a className={`py-4 px-4 font-medium ${activeTab === 'tasks' ? 'text-primary border-b-2 border-primary' : 'text-gray-600'}`}
             onClick={() => setActiveTab('tasks')}>
            Упражнения
          </a>
        </Link>
        <Link href="/admin/grammar">
          <a className={`py-4 px-4 font-medium ${activeTab === 'grammar' ? 'text-primary border-b-2 border-primary' : 'text-gray-600'}`}
             onClick={() => setActiveTab('grammar')}>
            Грамматические темы
          </a>
        </Link>
      </div>
      
      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'tasks' && <TaskManagement />}
        {activeTab === 'grammar' && <GrammarManagement/>}
      </div>
    </>
  )
}
  return (
    <>
      <Navbar />
      <main className="container mx-auto pt-20 pb-12 px-4">
        <div className="py-16">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-gray-800 text-white p-6">
                <div className="flex justify-between items-center">
                  {user.role == "admin" ? 
                  <>
                  <h2 className="font-heading text-2xl font-semibold">Панель администратора</h2>
                  <div className="bg-red-500 px-3 py-1 rounded-full text-sm font-medium">Администратор</div>
                  </>:   
                <>
                <h2 className="font-heading text-2xl font-semibold">Панель преподавателя</h2>
                <div className="bg-red-500 px-3 py-1 rounded-full text-sm font-medium">Преподаватель</div>
                </>
                }
                  </div>
              </div>             
              {content}
            </div>
          </div>
        </div>
      </main>
    </>
  );
  }