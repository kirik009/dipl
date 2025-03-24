import { FC, useState, useEffect } from 'react';
import DraggableWord from './draggable-word';

interface WordBankProps {
  words: string[];
  activeWords: string[];
  onWordDragged: (word: string) => void;
  onWordReturned: (word: string) => void;
}

const WordBank: FC<WordBankProps> = ({ words, activeWords, onWordDragged, onWordReturned }) => {
  const [availableWords, setAvailableWords] = useState<string[]>([]);

  useEffect(() => {
    // Filter out words that are already in the sentence
    const wordsNotInSentence = words.filter(word => !activeWords.includes(word));
    setAvailableWords(wordsNotInSentence);
  }, [words, activeWords]);

  return (
    <div className="word-bank bg-gray-100 p-4 rounded-lg">
      <h4 className="text-sm font-medium text-gray-500 mb-3">Word Bank:</h4>
      <div className="flex flex-wrap gap-2">
        {availableWords.map((word, index) => (
          <DraggableWord 
            key={`${word}-${index}`} 
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
