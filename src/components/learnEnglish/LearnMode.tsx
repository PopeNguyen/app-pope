import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Progress, Typography, Input, Form, Row, Col, Result, Space } from 'antd';
import { CheckCircleTwoTone, CloseCircleTwoTone, SoundOutlined, EditOutlined, AppstoreOutlined } from '@ant-design/icons';
import { speak } from '@/utils/tts';

const { Title, Paragraph, Text } = Typography;

interface LearnModeProps {
  words: any[];
  onWordResult: (wordId: string, isCorrect: boolean) => void;
  isActive: boolean;
}

const LearnMode: React.FC<LearnModeProps> = ({ words, onWordResult, isActive }) => {
  const [learnType, setLearnType] = useState<'typing' | 'multiple-choice' | null>('typing');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [shuffledWords, setShuffledWords] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | 'none'>('none');
  const [isFinished, setIsFinished] = useState(false);
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState<any[]>([]);
  const [questionType, setQuestionType] = useState<'word' | 'meaning'>('word');

  const [form] = Form.useForm();
  const inputRef = useRef<any>(null);

  useEffect(() => {
    startSession('typing');
  }, []);

  // Typing Test Logic
  useEffect(() => {
    if (learnType === 'typing' && feedback === 'none' && !isFinished) {
      inputRef.current?.focus();
    }
  }, [currentIndex, feedback, isFinished, learnType]);

  const handleCheckTypingAnswer = (values: { answer: string }) => {
    const isCorrect = values.answer.trim().toLowerCase() === shuffledWords[currentIndex].word.toLowerCase();
    if (isCorrect) {
      setFeedback('correct');
      setScore(prev => prev + 1);
    } else {
      setFeedback('incorrect');
    }
    onWordResult(shuffledWords[currentIndex].id, isCorrect);
    moveToNext();
  };

  // Multiple Choice Logic
  useEffect(() => {
    if (learnType === 'multiple-choice' && shuffledWords.length > 0 && currentIndex < shuffledWords.length) {
      generateOptions();
    }
  }, [learnType, currentIndex, shuffledWords]);

  const generateOptions = () => {
    const currentWord = shuffledWords[currentIndex];
    const isAskingForMeaning = Math.random() > 0.5;
    setQuestionType(isAskingForMeaning ? 'word' : 'meaning');

    const correctAnswer = isAskingForMeaning ? currentWord.meaning : currentWord.word;
    const distractors = shuffledWords
      .filter(w => w.id !== currentWord.id)
      .map(w => isAskingForMeaning ? w.meaning : w.word)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const options = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);
    setMultipleChoiceOptions(options);
  };

  const handleCheckMultipleChoiceAnswer = (selectedAnswer: string) => {
    const currentWord = shuffledWords[currentIndex];
    const correctAnswer = questionType === 'word' ? currentWord.meaning : currentWord.word;
    const isCorrect = selectedAnswer === correctAnswer;
    if (isCorrect) {
      setFeedback('correct');
      setScore(prev => prev + 1);
    }
    else {
      setFeedback('incorrect');
    }
    onWordResult(currentWord.id, isCorrect);
    moveToNext();
  };

  // Common Logic
  const startSession = (type: 'typing' | 'multiple-choice') => {
    setLearnType(type);
    setShuffledWords([...words].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setScore(0);
    setIsFinished(false);
    setFeedback('none');
    form.resetFields();
  };

  const moveToNext = () => {
    setTimeout(() => {
      if (currentIndex < shuffledWords.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setFeedback('none');
        form.resetFields();
      } else {
        setIsFinished(true);
      }
    }, 2000);
  };

  const handleSpeak = (text: string) => speak(text);

  useEffect(() => {
    if (!isActive) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Control') {
        if (!isFinished && shuffledWords.length > 0) {
           event.preventDefault();
           handleSpeak(shuffledWords[currentIndex].word);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, currentIndex, shuffledWords, isFinished]);

  // Render Logic
  if (words.length === 0) {
    return <Title level={3} style={{ textAlign: 'center', marginTop: 50 }}>No words to start learning.</Title>;
  }



  if (isFinished) {
    return (
      <Result
        status={score / shuffledWords.length >= 0.8 ? "success" : "warning"}
        title={`Session Complete! You scored ${score} out of ${shuffledWords.length}`}
        extra={[
          <Button type="primary" key="restart" onClick={() => startSession(learnType!)}>
            Learn Again
          </Button>,
          <Button key="back" onClick={() => { setLearnType(null); setIsFinished(false); }}>
            Back to Menu
          </Button>,
        ]}
      />
    );
  }

  const currentWord = shuffledWords[currentIndex];
  const progressPercent = Math.round(((currentIndex) / shuffledWords.length) * 100);

  return (
    <Card bordered={false} style={{ background: 'transparent' }}>
      <Progress percent={progressPercent} strokeColor={{ from: '#108ee9', to: '#87d068' }} />
      {learnType === 'typing' ? (
        // Typing Test UI
        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <Paragraph style={{fontSize: 18, color: 'gray'}}>Meaning:</Paragraph>
          <Title level={2} style={{ minHeight: 60 }}>{currentWord.meaning}</Title>
          <Form form={form} onFinish={handleCheckTypingAnswer} style={{ marginTop: 24 }}>
            <Form.Item name="answer"><Input ref={inputRef} placeholder="Type the English word" size="large" disabled={feedback !== 'none'} autoComplete="off" style={{fontSize: 18, textAlign: 'center'}} /></Form.Item>
            {feedback === 'none' && <Button type="primary" htmlType="submit" size="large">Check Answer</Button>}
          </Form>
        </div>
      ) : (
        // Multiple Choice UI
        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <Paragraph style={{fontSize: 18, color: 'gray'}}>{questionType === 'word' ? 'Word:' : 'Meaning:'}</Paragraph>
          <Title level={2} style={{ minHeight: 60 }}>{questionType === 'word' ? currentWord.word : currentWord.meaning}</Title>
          <Space direction="vertical" style={{width: '100%', marginTop: 24}}>
            {multipleChoiceOptions.map((option, index) => (
              <Button key={index} block size="large" disabled={feedback !== 'none'} onClick={() => handleCheckMultipleChoiceAnswer(option)}>
                {option}
              </Button>
            ))}
          </Space>
        </div>
      )}

      {feedback !== 'none' && (
        <Card style={{marginTop: 24, background: feedback === 'correct' ? '#f6ffed' : '#fff1f0', borderColor: feedback === 'correct' ? '#b7eb8f' : '#ffa39e'}}>
            {feedback === 'correct' && <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: 24, marginRight: 8 }} />} 
            {feedback === 'incorrect' && <CloseCircleTwoTone twoToneColor="#eb2f96" style={{ fontSize: 24, marginRight: 8 }} />} 
            <Text strong style={{fontSize: 18, color: feedback === 'correct' ? '#52c41a' : '#eb2f96'}}>
              {feedback === 'correct' ? 'Correct!' : 'Incorrect!'}
            </Text>
            {feedback === 'incorrect' && (
              <Paragraph style={{marginTop: 8}}>
                The correct answer was: <Text strong>{questionType === 'word' ? currentWord.meaning : currentWord.word}</Text>
                <Button type="text" icon={<SoundOutlined />} onClick={() => handleSpeak(currentWord.word)} />
              </Paragraph>
            )}
        </Card>
      )}
    </Card>
  );
};

export default LearnMode;
