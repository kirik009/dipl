import { FC, useState, useEffect } from 'react';
import DraggableWord from './draggable-word';

interface WordItem {
  id: string;
  text: string;
}

interface WordBankProps {
  words: WordItem[];
  activeWords: WordItem[];
  onWordDragged: (word: WordItem) => void;
  onWordReturned: (word: WordItem) => void;
}

const WordBank: FC<WordBankProps> = ({ words, activeWords, onWordDragged, onWordReturned }) => {
  const [availableWords, setAvailableWords] = useState<WordItem[]>([]);

  useEffect(() => {
    const wordsNotInSentence = words.filter(
      (word) => !activeWords.some((w) => w.id === word.id)
    );
    setAvailableWords(wordsNotInSentence);
  }, [words, activeWords]);

  return (
    <div className="word-bank bg-gray-100 p-4 rounded-lg">
      <h4 className="text-sm font-medium text-gray-500 mb-3">Word Bank:</h4>
      <div className="flex flex-wrap gap-2">
        {availableWords.map((word) => (
          <DraggableWord 
            key={word.id} 
            word={word} 
            onDragStart={() => onWordDragged(word)}
            onDragEnd={(dropped) => {
              if (!dropped) {
                onWordReturned(word);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default WordBank;
