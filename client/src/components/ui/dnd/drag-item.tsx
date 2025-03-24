import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { cn } from '@/lib/utils';

interface DragItemProps {
  id: string;
  text: string;
  index: number;
  isDragging?: boolean;
  canMove?: boolean;
  moveCard?: (dragIndex: number, hoverIndex: number) => void;
  className?: string;
  onRemove?: (id: string) => void;
}

export const DragItem = ({ 
  id, 
  text, 
  index,
  isDragging: externalIsDragging,
  canMove = false,
  moveCard,
  className,
  onRemove
}: DragItemProps) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'word',
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));
  
  const [, drop] = useDrop({
    accept: 'word',
    hover(item: { id: string, index: number }, monitor) {
      if (!ref.current || !canMove || !moveCard) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
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
      // Dragging right
      if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) {
        return;
      }
      
      // Dragging left
      if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) {
        return;
      }
      
      // Time to actually perform the action
      moveCard(dragIndex, hoverIndex);
      
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });
  
  drag(drop(ref));
  
  const finalIsDragging = externalIsDragging !== undefined ? externalIsDragging : isDragging;
  
  return (
    <div
      ref={ref}
      className={cn(
        'px-3 py-2 rounded shadow-sm cursor-grab active:cursor-grabbing',
        'bg-white transition-all hover:bg-gray-50',
        finalIsDragging && 'opacity-50',
        'border border-gray-200',
        'inline-flex items-center',
        canMove && 'whitespace-nowrap',
        className
      )}
    >
      {text}
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(id)}
          className="ml-2 text-gray-400 hover:text-red-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
};
