import React, { useState, useEffect } from 'react';
import { Button, Progress, Typography, Space } from 'antd';
import { LeftOutlined, RightOutlined, SoundOutlined } from '@ant-design/icons';
import { speak } from '@/utils/tts';
import './Flashcard.css';

const { Title, Text } = Typography;

interface FlashcardModeProps {
  words: any[];
  isActive: boolean;
}

const FlashcardMode: React.FC<FlashcardModeProps> = ({ words, isActive }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffledWords, setShuffledWords] = useState<any[]>([]);

  useEffect(() => {
    setShuffledWords([...words].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
  }, [words]);

  const handleFlip = () => setIsFlipped(prev => !prev);

  const handleNext = () => {
    if (currentIndex < shuffledWords.length - 1) {
      setIsFlipped(false);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSpeak = () => {
    if (shuffledWords.length > 0) {
      speak(shuffledWords[currentIndex].word);
    }
  };

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement).tagName === 'INPUT' || (event.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      if (event.key === ' ') {
        event.preventDefault();
        handleFlip();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        handleNext();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handlePrev();
      } else if (event.key === 'Control') {
        event.preventDefault();
        handleSpeak();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, currentIndex, shuffledWords]);

  if (shuffledWords.length === 0) {
    return <Title level={3} style={{ textAlign: 'center', marginTop: 50 }}>No words in this list to start flashcards.</Title>;
  }

  const currentWord = shuffledWords[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / shuffledWords.length) * 100);

  return (
    <div style={{ maxWidth: 600, margin: 'auto' }}>
      <div className="flashcard-container" onClick={handleFlip}>
        <div className={`flashcard ${isFlipped ? 'is-flipped' : ''}`}>
          <div className="flashcard-face flashcard-face-front">
            <Button 
              type="text" 
              icon={<SoundOutlined />} 
              onClick={(e) => { e.stopPropagation(); handleSpeak(); }} 
              style={{ position: 'absolute', top: 20, right: 20, fontSize: 24 }}
            />
            <Title level={2}>{currentWord.word}</Title>
          </div>
          <div className="flashcard-face flashcard-face-back" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <Title level={2} style={{ margin: 0 }}>{currentWord.meaning}</Title>
            {currentWord.note && (
              <Text type="secondary" italic style={{ fontSize: '1.2rem', marginTop: 16 }}>
                {currentWord.note}
              </Text>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Progress percent={progressPercent} />
        <Title level={4} style={{ marginTop: 16 }}>{currentIndex + 1} / {shuffledWords.length}</Title>
        <Space size="large" style={{ marginTop: 16 }}>
          <Button size="large" icon={<LeftOutlined />} onClick={(e) => { e.stopPropagation(); handlePrev(); }} disabled={currentIndex === 0} />
          <Button type="primary" size="large" onClick={(e) => { e.stopPropagation(); handleFlip(); }}>Flip (Space)</Button>
          <Button size="large" icon={<RightOutlined />} onClick={(e) => { e.stopPropagation(); handleNext(); }} disabled={currentIndex === shuffledWords.length - 1} />
        </Space>
      </div>
    </div>
  );
};

export default FlashcardMode;