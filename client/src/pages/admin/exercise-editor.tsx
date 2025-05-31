import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Exercise, insertExerciseSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import mammoth from "mammoth";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus, Loader2, ArrowLeft } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import {
  useCreateExerciseMutation,
  useUpdateExerciseMutation,
} from "@/hooks/use-mutate";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const formSchema = insertExerciseSchema.extend({
  newWord: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ExerciseEditor() {
  const { task_id, id } = useParams<{ task_id: string; id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [wordInput, setWordInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const isEditing = !!id && id !== "new";

  // Fetch exercise if editing
  const { data: exercise, isLoading: isLoadingExercise } = useQuery<Exercise>({
    queryKey: [`/api/exercises/${id}`],
    enabled: isEditing,
  });

  // Fetch grammar topics

  // Form definition
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      translation: "",
      correctSentence: "",
      words: [],
      grammarExplanation: "",
      newWord: "",
      task_id: null,
    },
  });

  // Update form values when exercise data is loaded
  useEffect(() => {
    if (exercise) {
      form.reset({
        ...exercise,
        newWord: "",
      });
    }
  }, [exercise, form]);

  // Create exercise mutation
  const createExerciseMutation = useCreateExerciseMutation(task_id);

  // Update exercise mutation
  const updateExerciseMutation = useUpdateExerciseMutation(id, task_id);

  // Handle adding a word
  const handleAddWord = () => {
    if (!wordInput.trim()) return;

    const currentWords = form.getValues("words") || [];
    form.setValue("words", [...currentWords, wordInput.trim()]);
    setWordInput("");
  };

  // Handle removing a word
  const handleRemoveWord = (word: string) => {
    const currentWords = form.getValues("words") || [];
    form.setValue(
      "words",
      currentWords.filter((w) => w !== word)
    );
  };

  // Handle form submission
  const onSubmit = (values: FormValues) => {
    // Remove the extra fields we added for UI purposes
    const { newWord, ...exerciseData } = values;

    if (isEditing) {
      updateExerciseMutation.mutate(exerciseData);
    } else {
      createExerciseMutation.mutate(exerciseData);
    }
  };

  const isLoading = isLoadingExercise;

  const extractTextFromPdf = async (arrayBuffer: ArrayBuffer) => {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str);
      fullText += strings.join(" ") + "\n";
    }

    return fullText;
  };
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    formName: "translation" | "correctSentence"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split(".").pop()?.toLowerCase();

    try {
      let text = "";

      if (fileExtension === "pdf") {
        const arrayBuffer = await file.arrayBuffer();

        text = await extractTextFromPdf(arrayBuffer);
      } else if (fileExtension === "docx") {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else if (fileExtension === "txt") {
        text = await file.text();
      } else {
        toast({
          title: "Unsupported file type",
          description: "Only PDF, DOCX, and TXT files are supported.",
          variant: "destructive",
        });
        return;
      }

      // Trim and set the translation
      form.setValue(formName, text.trim());

      if (formName == "correctSentence") {
        const words = text.trim().toLowerCase().split(" ");
        form.setValue("words", words);
      }
    } catch (err: any) {
      toast({
        title: "Error reading file",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="bg-gray-100 px-6 py-4 flex items-center border-b border-gray-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>
        <h2 className="text-xl font-semibold">
          {isEditing ? "Редактирование предложения" : "Создание предложения"}
        </h2>
      </div>

      <div className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="mb-4">
              <FormLabel>
                Можно задать перевод файлом (.pdf, .docx, .txt)
              </FormLabel>
              <Input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(e) => handleFileUpload(e, "translation")}
              />
            </div>
            <FormField
              control={form.control}
              name="translation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Перевод на русский</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Введите перевод предложения на русский язык"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="mb-4">
              <FormLabel>
                Можно задать предложение файлом (.pdf, .docx, .txt)
              </FormLabel>
              <Input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(e) => handleFileUpload(e, "correctSentence")}
              />
            </div>
            <FormField
              control={form.control}
              name="correctSentence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Предложение на английском</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Введите предложение на английском языке"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Words for Exercise</FormLabel>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex flex-wrap gap-2 mb-4">
                  {form.watch("words")?.map((word, index) => (
                    <div
                      key={index}
                      className="bg-white px-3 py-2 rounded shadow-sm flex items-center"
                    >
                      {word}
                      <button
                        type="button"
                        onClick={() => handleRemoveWord(word)}
                        className="ml-2 text-gray-400 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex">
                  <Input
                    value={wordInput}
                    onChange={(e) => setWordInput(e.target.value)}
                    placeholder="Добавьте слова..."
                    className="rounded-r-none"
                  />
                  <Button
                    type="button"
                    onClick={handleAddWord}
                    className="rounded-l-none"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {form.formState.errors.words && (
                <p className="text-sm font-medium text-destructive mt-2">
                  {form.formState.errors.words.message}
                </p>
              )}
            </div>

            <FormField
              control={form.control}
              name="grammarExplanation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Пояснение</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Дополните упражнение пояснением, которое будет предоставлено после предоставления ответа"
                      rows={4}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
                className="mr-2"
              >
                Отменить
              </Button>
              <Button
                type="submit"
                disabled={
                  createExerciseMutation.isPending ||
                  updateExerciseMutation.isPending
                }
              >
                {createExerciseMutation.isPending ||
                updateExerciseMutation.isPending
                  ? "Сохранение..."
                  : isEditing
                  ? "Обновить предложение"
                  : "Создать предложение"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
