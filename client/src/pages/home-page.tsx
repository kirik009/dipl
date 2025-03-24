import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  GraduationCap, 
  TrendingUp, 
  Layers, 
  MessageSquare, 
  Languages, 
  Smartphone,
  ChevronRight,
  Info
} from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <main className="container mx-auto pt-20 pb-12 px-4">
        {/* Landing Section */}
        <div id="landing" className="py-12 md:py-20">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="font-heading text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Master English Sentence Structure
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Improve your English skills with our interactive sentence builder. Practice arranging words in the correct order, learn grammar rules, and track your progress.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Button
                  size="lg"
                  className="gap-2"
                  asChild
                >
                  <Link href={user ? "/exercises/1" : "/auth"}>
                    <GraduationCap className="w-5 h-5" />
                    Start Learning
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2"
                  asChild
                >
                  <a href="#features">
                    <Info className="w-5 h-5" />
                    Learn More
                  </a>
                </Button>
              </div>
            </div>
            <div className="md:flex justify-end">
              <img 
                src="https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=600&h=500" 
                alt="Student learning English" 
                className="rounded-xl shadow-lg w-full max-w-md mx-auto md:mx-0" 
              />
            </div>
          </div>
          
          {/* Stats Section */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <p className="text-4xl font-bold text-primary mb-2">25K+</p>
              <p className="text-gray-600">Active Users</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <p className="text-4xl font-bold text-primary mb-2">1000+</p>
              <p className="text-gray-600">Exercise Templates</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <p className="text-4xl font-bold text-primary mb-2">98%</p>
              <p className="text-gray-600">User Satisfaction</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <p className="text-4xl font-bold text-primary mb-2">3</p>
              <p className="text-gray-600">Difficulty Levels</p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="py-16 bg-gray-50">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 mb-4">Key Features</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our platform provides everything you need to master English sentence structure effectively
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-heading text-xl font-semibold mb-3">Drag & Drop Interface</h3>
              <p className="text-gray-600">
                Arrange words intuitively using our interactive drag-and-drop system to form correct sentences.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-heading text-xl font-semibold mb-3">Progress Tracking</h3>
              <p className="text-gray-600">
                Monitor your improvement with detailed statistics and performance insights.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <Layers className="h-6 w-6 text-amber-500" />
              </div>
              <h3 className="font-heading text-xl font-semibold mb-3">Difficulty Levels</h3>
              <p className="text-gray-600">
                Progress from beginner to advanced with exercises tailored to your skill level.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="font-heading text-xl font-semibold mb-3">Instant Feedback</h3>
              <p className="text-gray-600">
                Get immediate corrections and explanations to understand your mistakes.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Languages className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="font-heading text-xl font-semibold mb-3">Grammar Explanations</h3>
              <p className="text-gray-600">
                Learn the rules behind each sentence construction with clear grammar notes.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mb-4">
                <Smartphone className="h-6 w-6 text-pink-500" />
              </div>
              <h3 className="font-heading text-xl font-semibold mb-3">Cross-Device Access</h3>
              <p className="text-gray-600">
                Practice on desktop, tablet, or mobile with a responsive design that works everywhere.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-16 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Ready to improve your English?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Start building correct English sentences today and watch your language skills grow.
          </p>
          <Button 
            size="lg" 
            className="gap-2"
            asChild
          >
            <Link href={user ? "/exercises/1" : "/auth"}>
              Get Started Now
              <ChevronRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </main>
      <Footer />
    </>
  );
}
