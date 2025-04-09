import { FC, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { XCircle } from 'lucide-react';

interface WordItem {
  id: string;
  text: string;
}
interface DraggableWordProps {
  word: WordItem;
  index?: number;
  onDragStart: () => void;
  onDragEnd: (dropped?: boolean) => void;
  onRemove?: () => void;
  inDropZone?: boolean;
  onReorder?: (dragIndex: number, hoverIndex: number) => void;
}

interface DragItem {
  type: string;
  word: string;
  index?: number;
}

const DraggableWord: FC<DraggableWordProps> = ({ 
  word, 
  index, 
  onDragStart, 
  onDragEnd, 
  onRemove, 
  inDropZone = false,
  onReorder
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'word',
    item: () => {
      onDragStart();
      
      return { id: word.id, text: word.text, index, from: 'wordBank' };
    },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult<{ dropped: boolean }>();
      onDragEnd(dropResult?.dropped);
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const [, drop] = useDrop<DragItem, void, {}>(() => ({
    accept: 'word',
    hover: (item, monitor) => {
      if (!ref.current || !onReorder || item.index === undefined || index === undefined) {
        return;
      }
      
      // Don't replace items with themselves
      if (item.index === index) {
        return;
      }
      
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      
      // Get horizontal middle
      const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
      
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      
      // Get pixels to the left
      const hoverClientX = (clientOffset?.x || 0) - hoverBoundingRect.left;
      
      // Only perform the move when the mouse has crossed half of the items width
      // When dragging rightward, only move when the cursor is past 50%
      // When dragging leftward, only move when the cursor is before 50%
      
      // Dragging rightward
      if (item.index < index && hoverClientX < hoverMiddleX) {
        return;
      }
      
      // Dragging leftward
      if (item.index > index && hoverClientX > hoverMiddleX) {
        return;
      }
      
      // Time to actually perform the action
      onReorder(item.index, index);
      
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = index;
    },
  }));
  
  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`drag-item bg-white px-3 py-2 rounded shadow-sm cursor-grab flex items-center ${
        isDragging ? 'opacity-50' : ''
      } ${inDropZone ? 'bg-primary-50' : ''}`}
    >
      {word.text}
      {inDropZone && onRemove && (
        <button 
          className="ml-2 text-gray-400 hover:text-red-500 focus:outline-none"
          onClick={onRemove}
        >
          <XCircle size={16} />
        </button>
      )}
    </div>
  );
};

export default DraggableWord;
