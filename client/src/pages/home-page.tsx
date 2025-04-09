import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/layout/navbar";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  GraduationCap, 
  TrendingUp, 
  Layers, 
  MessageSquare, 
  Languages, 
  Smartphone,
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
                Развивай свое понимание английского языка
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Тренируйся в составлении английских предложений, изучай грамматические правила и следи за своим прогрессом
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Button
                  size="lg"
                  className="gap-2"
                  asChild
                >
                  <Link href={user ? "/exercises/1" : "/auth"}>
                    <GraduationCap className="w-5 h-5" />
                    Начать изучение
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
                    Узнать больше
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
        </div>

        {/* Features Section */}
<div id="features" className="py-16 bg-gray-50">
  <div className="text-center mb-16">
    <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 mb-4">
      Ключевые особенности
    </h2>
    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
      Платформа предоставит все, что нужно для эффективной тренировки построения предложений.
    </p>
  </div>

  <div className="grid grid-cols-3 gap-8">
    {/* Первый ряд - три элемента */}
    <div className="bg-white p-8 rounded-xl shadow-sm">
      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
        <GraduationCap className="h-6 w-6 text-primary" />
      </div>
      <h3 className="font-heading text-xl font-semibold mb-3">Удобный интерфейс</h3>
      <p className="text-gray-600">
        Составляй слова интуитивно, используя drag-and-drop систему для формирования правильных предложений.
      </p>
    </div>

    <div className="bg-white p-8 rounded-xl shadow-sm">
      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <TrendingUp className="h-6 w-6 text-green-600" />
      </div>
      <h3 className="font-heading text-xl font-semibold mb-3">Следи за прогрессом</h3>
      <p className="text-gray-600">
        Следи за своим совершенствованием, используя детальную статистику.
      </p>
    </div>

    <div className="bg-white p-8 rounded-xl shadow-sm">
      <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
        <Layers className="h-6 w-6 text-amber-500" />
      </div>
      <h3 className="font-heading text-xl font-semibold mb-3">Уровни сложности</h3>
      <p className="text-gray-600">
        Развивайся от начального до продвинутого уровня с упражнениями, подобранными под ваш уровень.
      </p>
    </div>

    {/* Второй ряд - два элемента, центрированные */}
    <div className="bg-white p-8 rounded-xl shadow-sm col-span-1 col-start-1">
      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <MessageSquare className="h-6 w-6 text-green-500" />
      </div>
      <h3 className="font-heading text-xl font-semibold mb-3">Обратная связь</h3>
      <p className="text-gray-600">
        Мгновенные исправления и пояснения, помогающие понять допущенную ошибку.
      </p>
    </div>

    <div className="bg-white p-8 rounded-xl shadow-sm col-span-1 col-start-3">
      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
        <Languages className="h-6 w-6 text-purple-500" />
      </div>
      <h3 className="font-heading text-xl font-semibold mb-3">Грамматические правила</h3>
      <p className="text-gray-600">
        Изучай правила, необходимые для формирования каждого предложения.
      </p>
    </div>
  </div>
</div>


      </main>
    </>
  );
}
