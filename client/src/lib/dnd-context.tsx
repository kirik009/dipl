import { createContext, useContext, useState, ReactNode } from 'react';

// Types for our drag and drop context
type Word = {
  id: string;
  text: string;
};

type DndContextType = {
  wordBank: Word[];
  sentence: Word[];
  moveWordToSentence: (wordId: string) => void;
  moveWordToBank: (wordId: string) => void;
  reorderSentence: (dragIndex: number, hoverIndex: number) => void;
  resetExercise: (words: string[]) => void;
  getSentenceText: () => string;
  clearSentence: () => void;
};

// Create the context
const DndContext = createContext<DndContextType | undefined>(undefined);

// Context provider component
export function DndProvider({ children, initialWords = [] }: { children: ReactNode; initialWords?: string[] }) {
  const [wordBank, setWordBank] = useState<Word[]>([]);
  const [sentence, setSentence] = useState<Word[]>([]);

  // Initialize word bank when initialWords change
  useState(() => {
    resetExercise(initialWords);
  });

  // Move a word from bank to sentence
  const moveWordToSentence = (wordId: string) => {
    const wordIndex = wordBank.findIndex((w) => w.id === wordId);
    if (wordIndex === -1) return;

    const word = wordBank[wordIndex];
    setWordBank(wordBank.filter((_, i) => i !== wordIndex));
    setSentence([...sentence, word]);
  };

  // Move a word from sentence back to bank
  const moveWordToBank = (wordId: string) => {
    const wordIndex = sentence.findIndex((w) => w.id === wordId);
    if (wordIndex === -1) return;

    const word = sentence[wordIndex];
    setSentence(sentence.filter((_, i) => i !== wordIndex));
    setWordBank([...wordBank, word]);
  };

  // Reorder words in the sentence
  const reorderSentence = (dragIndex: number, hoverIndex: number) => {
    const dragWord = sentence[dragIndex];
    const newSentence = [...sentence];
    
    // Remove the dragged item
    newSentence.splice(dragIndex, 1);
    // Insert it at the new position
    newSentence.splice(hoverIndex, 0, dragWord);
    
    setSentence(newSentence);
  };

  // Reset the exercise with new words
  const resetExercise = (words: string[]) => {
    const newWordBank = words.map((text, index) => ({
      id: `word-${index}-${text}`,
      text,
    }));
    setWordBank(newWordBank);
    setSentence([]);
  };

  // Get the sentence as a space-separated string
  const getSentenceText = () => {
    return sentence.map((word) => word.text).join(' ');
  };

  // Clear the sentence, returning all words to the bank
  const clearSentence = () => {
    setWordBank([...wordBank, ...sentence]);
    setSentence([]);
  };

  return (
    <DndContext.Provider
      value={{
        wordBank,
        sentence,
        moveWordToSentence,
        moveWordToBank,
        reorderSentence,
        resetExercise,
        getSentenceText,
        clearSentence,
      }}
    >
      {children}
    </DndContext.Provider>
  );
}

// Hook to use the DND context
export function useDnd() {
  const context = useContext(DndContext);
  if (context === undefined) {
    throw new Error('useDnd must be used within a DndProvider');
  }
  return context;
}
