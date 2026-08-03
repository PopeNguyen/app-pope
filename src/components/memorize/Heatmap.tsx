import React, { useState } from 'react';
import { Tooltip, Drawer, Typography, Grid } from 'antd';

const { Text } = Typography;
const { useBreakpoint } = Grid;

interface HeatmapProps {
  cards: any[];
  onCellClick?: (cell: any) => void;
}

const Heatmap: React.FC<HeatmapProps> = ({ cards, onCellClick }) => {
  const screens = useBreakpoint();

  // Generate 00-99 grid
  const grid = Array.from({ length: 100 }, (_, i) => {
    const numStr = i.toString().padStart(2, '0');
    // Find card for this number
    const card = cards.find(c => c.numberKey === numStr);
    return {
      number: numStr,
      card,
      // Color based on level (dummy logic)
      color: card ? (card.level > 3 ? '#52c41a' : card.level > 0 ? '#faad14' : '#ff4d4f') : '#f0f0f0'
    };
  });

  const handleCellClick = (cell: any) => {
    if (onCellClick) {
      onCellClick(cell);
    }
  };

  const renderCell = (cell: any) => {
    const content = (
      <div 
        key={cell.number}
        onClick={() => handleCellClick(cell)}
        style={{
          backgroundColor: cell.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          cursor: 'pointer',
          borderRadius: 4,
          aspectRatio: '1/1',
          fontSize: screens.md ? 14 : 10,
          color: cell.color === '#f0f0f0' ? '#bfbfbf' : '#fff'
        }}
      >
        {cell.number}
      </div>
    );

    if (screens.md && cell.card) {
      return (
        <Tooltip 
          key={cell.number} 
          title={
            <div style={{ textAlign: 'center', padding: 4 }}>
              {cell.card.image ? (
                (cell.card.image.startsWith('http') || cell.card.image.startsWith('data:image/')) ? (
                  <img src={cell.card.image} alt={cell.card.name} style={{ maxWidth: 150, maxHeight: 150, objectFit: 'contain', marginBottom: 8, borderRadius: 4 }} />
                ) : (
                  <div style={{ fontSize: 40 }}>{cell.card.image}</div>
                )
              ) : null}
              <div style={{ fontWeight: 'bold' }}>{cell.number} - {cell.card.name}</div>
            </div>
          }
          color="#fff" // White background for better image visibility
          overlayInnerStyle={{ color: '#000' }} // Black text
        >
          {content}
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(10, 1fr)',
        gap: screens.md ? 4 : 2,
        width: '100%'
      }}>
        {grid.map(renderCell)}
      </div>
    </>
  );
};

export default Heatmap;
