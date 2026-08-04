import React from 'react';
import { Tooltip, Typography, Grid } from 'antd';

const { useBreakpoint } = Grid;

export interface DisplayOptions {
  person: boolean;
  action: boolean;
  object: boolean;
}

interface HeatmapProps {
  cards: any[];
  onCellClick?: (cell: any) => void;
  displayOptions?: DisplayOptions;
}

const Heatmap: React.FC<HeatmapProps> = ({ cards, onCellClick, displayOptions = { object: true, person: false, action: false } }) => {
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
    const cellContents: string[] = [];
    if (cell.card) {
      if (displayOptions.person && cell.card.personName) cellContents.push(cell.card.personName);
      if (displayOptions.action && cell.card.actionName) cellContents.push(cell.card.actionName);
      if (displayOptions.object && cell.card.name) cellContents.push(cell.card.name);
    }

    const content = (
      <div 
        key={cell.number}
        onClick={() => handleCellClick(cell)}
        style={{
          backgroundColor: cell.color,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          borderRadius: 4,
          padding: '4px',
          minHeight: screens.md ? '80px' : '40px',
          fontSize: screens.md ? 12 : 10,
          color: cell.color === '#f0f0f0' ? '#bfbfbf' : '#fff',
          textAlign: 'center',
          overflow: 'hidden',
          wordBreak: 'break-word',
          lineHeight: '1.2'
        }}
      >
        <div style={{ fontWeight: 'bold', fontSize: screens.md ? 16 : 12, marginBottom: cellContents.length > 0 ? 4 : 0 }}>
          {cell.number}
        </div>
        {cellContents.map((txt, idx) => (
          <div key={idx}>{txt}</div>
        ))}
      </div>
    );

    if (screens.md && cell.card) {
      return (
        <Tooltip 
          key={cell.number} 
          title={
            <div style={{ padding: 4 }}>
              <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>{cell.number}</div>
              
              {cell.card.personName && (
                <div style={{ marginBottom: 8 }}>
                  <strong>Người:</strong> {cell.card.personName}
                  {cell.card.personImage && (
                    <div style={{marginTop: 4}}>
                      {(cell.card.personImage.startsWith('http') || cell.card.personImage.startsWith('data:image/')) ? (
                        <img src={cell.card.personImage} alt={cell.card.personName} style={{ maxWidth: 100, maxHeight: 100, objectFit: 'contain', borderRadius: 4 }} />
                      ) : (
                        <div style={{ fontSize: 40 }}>{cell.card.personImage}</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {cell.card.actionName && (
                <div style={{ marginBottom: 8 }}>
                  <strong>Hành động:</strong> {cell.card.actionName}
                  {cell.card.actionImage && (
                    <div style={{marginTop: 4}}>
                      {(cell.card.actionImage.startsWith('http') || cell.card.actionImage.startsWith('data:image/')) ? (
                        <img src={cell.card.actionImage} alt={cell.card.actionName} style={{ maxWidth: 100, maxHeight: 100, objectFit: 'contain', borderRadius: 4 }} />
                      ) : (
                        <div style={{ fontSize: 40 }}>{cell.card.actionImage}</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {cell.card.name && (
                <div style={{ marginBottom: 8 }}>
                  <strong>Hình ảnh:</strong> {cell.card.name}
                  {cell.card.image && (
                    <div style={{marginTop: 4}}>
                      {(cell.card.image.startsWith('http') || cell.card.image.startsWith('data:image/')) ? (
                        <img src={cell.card.image} alt={cell.card.name} style={{ maxWidth: 100, maxHeight: 100, objectFit: 'contain', borderRadius: 4 }} />
                      ) : (
                        <div style={{ fontSize: 40 }}>{cell.card.image}</div>
                      )}
                    </div>
                  )}
                </div>
              )}
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
    <div style={{ width: '100%', overflowX: 'auto', paddingBottom: 8 }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(10, 1fr)',
        gap: screens.md ? 4 : 2,
        minWidth: screens.md ? '100%' : '800px'
      }}>
        {grid.map(renderCell)}
      </div>
    </div>
  );
};

export default Heatmap;
