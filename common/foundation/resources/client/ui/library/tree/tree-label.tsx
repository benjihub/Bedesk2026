import {ArrowRightIcon} from '@ui/icons/material/ArrowRight';
import clsx from 'clsx';
import {forwardRef, MouseEventHandler, ReactNode, useContext} from 'react';
import {TreeContext} from './tree-context';

interface TreeLabelProps {
  level?: number;
  node: any;
  icon?: ReactNode;
  label?: ReactNode;
  className?: string;
}
export const TreeLabel = forwardRef<HTMLDivElement, TreeLabelProps>(
  ({icon, label, level = 0, node, className, ...domProps}, ref) => {
    const {expandedKeys, setExpandedKeys, selectedKeys, setSelectedKeys} =
      useContext(TreeContext);
    const isExpanded = expandedKeys.includes(node.id);
    const isSelected = selectedKeys.includes(node.id);

    const handleExpandIconClick: MouseEventHandler = e => {
      e.stopPropagation();
      const index = expandedKeys.indexOf(node.id);
      const newExpandedKeys = [...expandedKeys];
      if (index > -1) {
        newExpandedKeys.splice(index, 1);
      } else {
        newExpandedKeys.push(node.id);
      }
      setExpandedKeys(newExpandedKeys);
    };

    return (
      <div
        {...domProps}
        ref={ref}
        onClick={e => {
          e.stopPropagation();
          setSelectedKeys([node.id]);
        }}
        className={clsx(
          'header tree-label flex cursor-pointer flex-nowrap items-center gap-4 overflow-hidden text-ellipsis whitespace-nowrap rounded-button py-6',
          className,
          isSelected && 'bg-primary/selected font-bold text-primary',
          !isSelected && 'hover:bg-hover',
        )}
      >
        {level > 0 && (
          <div className="flex">
            {Array.from({length: level}).map((_, i) => {
              return <div key={i} className="h-24 w-24" />;
            })}
          </div>
        )}
        <div onClick={handleExpandIconClick}>
          <ArrowRightIcon
            className={clsx(
              'cursor-default transition-transform icon-sm',
              isExpanded && 'rotate-90',
            )}
          />
        </div>
        {icon}
        <div className="overflow-hidden text-ellipsis pr-6">{label}</div>
      </div>
    );
  },
);
TreeLabel.displayName = 'TreeLabel';
