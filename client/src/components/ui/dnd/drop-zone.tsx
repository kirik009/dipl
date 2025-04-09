import { useDrop } from 'react-dnd';
import { cn } from '@/lib/utils';
import { ConsoleLogWriter } from 'drizzle-orm';

interface WordItem {
  id: string;
  text: string;
}
interface DropZoneProps {
  onDrop: ({ id, text }: { id: string; text: string }) => void;
  children: React.ReactNode;
  className?: string;
  isActive?: boolean;
  placeholder?: string;
  isEmpty?: boolean;
}

export const DropZone = ({
  onDrop,
  children,
  className,
  isActive: externalIsActive,
  placeholder = 'Формируй слова в предложения здесь',
  isEmpty = false,
}: DropZoneProps) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'word',
    drop: (item: {id: string, text: string, from: string }) => {
      
      if (item.from === 'wordBank') {
        onDrop({ id: item.id, text: item.text }); 
      }
      return undefined;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  const isActive = externalIsActive !== undefined ? externalIsActive : (isOver && canDrop);

  return (
    <div
      ref={drop}
      className={cn(
        'min-h-[100px] border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-wrap gap-2',
        isActive && 'border-primary-500 bg-primary-50/50',
        className
      )}
    >
      {isEmpty && (
        <p className="w-full text-gray-400 text-center">{placeholder}</p>
      )}
      {children}
    </div>
  );
};
