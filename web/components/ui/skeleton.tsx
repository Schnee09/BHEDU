/**
 * Skeleton Loading Components
 * Content-aware loading states for better perceived performance
 */

import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  circle?: boolean;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height = '1rem',
  circle = false,
  count = 1,
}) => {
  const skeletons = Array.from({ length: count }, (_, i) => i);
  
  const baseStyles = 'animate-pulse bg-gradient-to-r from-amber-100 via-amber-200 to-amber-100 bg-[length:200%_100%]';
  const shapeStyles = circle ? 'rounded-full' : 'rounded-lg';
  
  const style: React.CSSProperties = {
    width: width || '100%',
    height: height,
  };
  
  if (count === 1) {
    return (
      <div
        className={`${baseStyles} ${shapeStyles} ${className}`}
        style={style}
      />
    );
  }
  
  return (
    <div className="space-y-2">
      {skeletons.map(i => (
        <div
          key={i}
          className={`${baseStyles} ${shapeStyles} ${className}`}
          style={style}
        />
      ))}
    </div>
  );
};

// Specialized skeleton components for common patterns

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-amber-100 shadow-md p-6">
      <div className="space-y-4">
        <Skeleton height="1.5rem" width="60%" />
        <Skeleton height="1rem" count={3} />
        <div className="flex gap-2 mt-4">
          <Skeleton height="2.5rem" width="5rem" />
          <Skeleton height="2.5rem" width="5rem" />
        </div>
      </div>
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => {
  const rowArray = Array.from({ length: rows }, (_, i) => i);
  const colArray = Array.from({ length: columns }, (_, i) => i);
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-amber-200">
        <thead className="bg-gradient-to-r from-amber-50 to-yellow-50">
          <tr>
            {colArray.map(i => (
              <th key={i} className="px-6 py-3">
                <Skeleton height="1rem" width="80%" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-stone-200">
          {rowArray.map(rowIdx => (
            <tr key={rowIdx}>
              {colArray.map(colIdx => (
                <td key={colIdx} className="px-6 py-4">
                  <Skeleton height="1rem" width="90%" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const SkeletonStatCard: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-amber-100 shadow-md p-6">
      <div className="text-center space-y-3">
        <Skeleton height="3rem" width="5rem" className="mx-auto" />
        <Skeleton height="0.875rem" width="7rem" className="mx-auto" />
      </div>
    </div>
  );
};

export const SkeletonList: React.FC<{ items?: number }> = ({ items = 5 }) => {
  const itemArray = Array.from({ length: items }, (_, i) => i);
  
  return (
    <div className="space-y-3">
      {itemArray.map(i => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-stone-200 hover:border-amber-200 transition-colors">
          <Skeleton circle width="3rem" height="3rem" />
          <div className="flex-1 space-y-2">
            <Skeleton height="1rem" width="40%" />
            <Skeleton height="0.875rem" width="60%" />
          </div>
          <Skeleton height="2rem" width="4rem" />
        </div>
      ))}
    </div>
  );
};
