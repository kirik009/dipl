import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserManagement from "./user-management";
import ExerciseManagement from "./exercise-management";
import ExerciseEditor from "./exercise-editor";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

export default function AdminDashboard() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Determine which tab should be active based on the URL
  let initialTab = "users";
  
  if (location.startsWith("/admin/exercises")) {
    initialTab = "exercises";
  } else if (location.startsWith("/admin/grammar")) {
    initialTab = "grammar";
  }
  
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Check if we're in an editor mode
  const isEditing = location.includes("/exercises/new") || location.includes("/exercises/") && location.includes("/edit");
  
  // Redirect non-admin users
  if (!user || user.role !== "admin") {
    return <Redirect to="/" />;
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
                  <h2 className="font-heading text-2xl font-semibold">Admin Dashboard</h2>
                  <div className="bg-red-500 px-3 py-1 rounded-full text-sm font-medium">Administrator</div>
                </div>
              </div>
              
              {isEditing ? (
                <ExerciseEditor />
              ) : (
                <>
                  {/* Admin Tabs */}
                  <div className="bg-gray-100 px-6 flex border-b border-gray-200">
                    <Link href="/admin/users">
                      <a className={`py-4 px-4 font-medium ${activeTab === 'users' ? 'text-primary border-b-2 border-primary' : 'text-gray-600'}`}
                         onClick={() => setActiveTab('users')}>
                        Users
                      </a>
                    </Link>
                    <Link href="/admin/exercises">
                      <a className={`py-4 px-4 font-medium ${activeTab === 'exercises' ? 'text-primary border-b-2 border-primary' : 'text-gray-600'}`}
                         onClick={() => setActiveTab('exercises')}>
                        Exercises
                      </a>
                    </Link>
                    <Link href="/admin/grammar">
                      <a className={`py-4 px-4 font-medium ${activeTab === 'grammar' ? 'text-primary border-b-2 border-primary' : 'text-gray-600'}`}
                         onClick={() => setActiveTab('grammar')}>
                        Grammar Topics
                      </a>
                    </Link>
                  </div>
                  
                  {/* Tab Content */}
                  <div className="p-6">
                    {activeTab === 'users' && <UserManagement />}
                    {activeTab === 'exercises' && <ExerciseManagement />}
                    {activeTab === 'grammar' && (
                      <div className="py-8 text-center">
                        <h3 className="text-lg font-medium text-gray-500">Grammar Topics Management Coming Soon</h3>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
