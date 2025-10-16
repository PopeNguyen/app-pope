import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Progress, Typography, Input, Form, Result, Spin, Space, Alert } from 'antd';
import { CheckCircleTwoTone, SoundOutlined } from '@ant-design/icons';
import { speak } from '@/utils/tts';
import './RetypeMode.css';

const { Title, Paragraph } = Typography;

interface RetypeModeProps {
  words: any[];
  onWordResult: (wordId: string, isCorrect: boolean) => void;
  isActive: boolean;
}

const RetypeMode: React.FC<RetypeModeProps> = ({ words, onWordResult, isActive }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [repetitionCount, setRepetitionCount] = useState(0);
  const [shuffledWords, setShuffledWords] = useState<any[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | 'none'>('none');

  const [form] = Form.useForm();
  const inputRef = useRef<any>(null);

  useEffect(() => {
    startSession();
  }, []);

  useEffect(() => {
    if (isActive && !isFinished) {
      inputRef.current?.focus();
    }
  }, [currentIndex, isFinished, isActive, feedback]);

  const startSession = () => {
    setShuffledWords([...words].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setRepetitionCount(0);
    setIsFinished(false);
    setFeedback('none');
    form.resetFields();
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (feedback !== 'none') {
      setFeedback('none');
    }
  };

  const handleCheckAnswer = () => {
    const currentWord = shuffledWords[currentIndex];
    if (inputValue.trim().toLowerCase() === currentWord.word.toLowerCase()) {
      onWordResult(currentWord.id, true);
      
      const newRepetitionCount = repetitionCount + 1;

      if (newRepetitionCount >= 3) {
        if (currentIndex < shuffledWords.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setRepetitionCount(0);
        } else {
          setIsFinished(true);
        }
      } else {
        setRepetitionCount(newRepetitionCount);
      }

    } else {
      onWordResult(currentWord.id, false);
      setFeedback('incorrect');
    }
    setInputValue('');
    form.setFieldsValue({ answer: '' });
  };

  const handleSpeak = (text: string) => speak(text);

  useEffect(() => {
    if (!isActive) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Control') {
        if (!isFinished && shuffledWords.length > 0 && shuffledWords[currentIndex]) {
           event.preventDefault();
           handleSpeak(shuffledWords[currentIndex].word);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, currentIndex, shuffledWords, isFinished]);

  if (words.length === 0) {
    return <Title level={3} style={{ textAlign: 'center', marginTop: 50 }}>No words to start learning.</Title>;
  }

  if (isFinished) {
    return (
      <Result
        status="success"
        title="Session Complete! You've mastered these words."
        extra={[
          <Button type="primary" key="restart" onClick={startSession}>
            Practice Again
          </Button>,
          <Button key="back" onClick={() => window.location.reload()}>
            Back to List
          </Button>,
        ]}
      />
    );
  }

  const currentWord = shuffledWords[currentIndex];

  if (!currentWord) {
    return (
      <div style={{textAlign: 'center', marginTop: 50}}>
        <Spin size="large" />
        <Title level={3} style={{marginTop: 16}}>Loading session...</Title>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex) / shuffledWords.length) * 100);

  return (
    <Card bordered={false} style={{ background: 'transparent' }}>
      <Progress percent={progressPercent} strokeColor={{ from: '#108ee9', to: '#87d068' }} />
      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <Title level={2} style={{ minHeight: 60 }}>{currentWord.word}</Title>
        <Paragraph style={{fontSize: 18, color: 'gray'}}>{currentWord.meaning}</Paragraph>
        <Button type="text" icon={<SoundOutlined />} onClick={() => handleSpeak(currentWord.word)} />

        <Form form={form} onFinish={handleCheckAnswer} style={{ marginTop: 24 }}>
          <Form.Item name="answer">
            <Input 
              ref={inputRef} 
              placeholder="Retype the English word" 
              size="large" 
              autoComplete="off" 
              style={{fontSize: 18, textAlign: 'center'}}
              onChange={handleInputChange}
              value={inputValue}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large">Check</Button>
        </Form>

        <div style={{ marginTop: 24, minHeight: 80 }}>
            {feedback === 'incorrect' && (
                 <Alert
                    message="Incorrect. Please try again!"
                    type="error"
                    showIcon
                  />
            )}
            <Space style={{marginTop: 16}}>
                {[1, 2, 3].map(i => (
                <CheckCircleTwoTone 
                    key={i}
                    twoToneColor={i <= repetitionCount ? "#52c41a" : "#d9d9d9"} 
                    style={{ fontSize: 24 }} 
                />
                ))}
            </Space>
        </div>
      </div>
    </Card>
  );
};

export default RetypeMode;
