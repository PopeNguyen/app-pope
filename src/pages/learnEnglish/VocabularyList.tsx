import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getWords, addWord, updateWord, deleteWords, updateWordStats } from '@/services/learnEnglishService';
import { useAuth } from '@/hooks/useAuth';
import { Layout, Typography, Form, Input, Button, List, Card, Modal, Checkbox, Row, Col, Radio, Space, Alert } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, ReadOutlined, CreditCardOutlined, UnorderedListOutlined, ArrowLeftOutlined, FormOutlined, AppstoreOutlined, RedoOutlined, SoundOutlined, CopyOutlined } from '@ant-design/icons';
import FullScreenLoader from '@/components/FullScreenLoader';
import FlashcardMode from '@/components/learnEnglish/FlashcardMode';
import LearnMode from '@/components/learnEnglish/LearnMode';
import RetypeMode from '@/components/learnEnglish/RetypeMode';

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const VocabularyList = () => {
  const { listId } = useParams<{ listId: string }>();
  const { user } = useAuth();
  const [words, setWords] = useState<any[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [editingWord, setEditingWord] = useState<any>(null);
  const [mode, setMode] = useState('view');
  const [viewStyle, setViewStyle] = useState<'grid' | 'list'>('grid');
  const [learningWords, setLearningWords] = useState<any[]>([]);
  const [learnModeType, setLearnModeType] = useState<'typing' | 'multiple-choice'>('typing');
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isLearnModeModalVisible, setIsLearnModeModalVisible] = useState(false);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && listId) {
      setLoading(true);
      const unsubscribe = getWords(user.uid, listId, (fetchedWords) => {
        const sortedWords = [...fetchedWords].sort((a, b) => 
          (b.createdAt || '').localeCompare(a.createdAt || '')
        );
        setWords(sortedWords);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [user, listId]);

  const handlePronounce = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      
      const voices = window.speechSynthesis.getVoices();
      // Try to find a known female voice for English
      const femaleVoice = voices.find(voice => 
        voice.lang.startsWith('en') && 
        (voice.name.includes('Zira') || voice.name.includes('Samantha') || voice.name.includes('Google US English') || voice.name.includes('Victoria'))
      );
      
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      } else {
        // Fallback to the first available English voice
        const anyEnVoice = voices.find(voice => voice.lang === 'en-US' || voice.lang.startsWith('en'));
        if (anyEnVoice) {
          utterance.voice = anyEnVoice;
        }
      }

      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStartLearnSession = () => {
    setIsLearnModeModalVisible(true);
  };

  const handleSelectLearnMode = (type: 'typing' | 'multiple-choice') => {
    setLearnModeType(type);
    setLearningWords(words);
    setMode('learn');
    setIsLearnModeModalVisible(false);
  };

  const handleWordResult = (wordId: string, isCorrect: boolean) => {
    updateWordStats(wordId, isCorrect);
  };

  const handleAddWords = async (values: { bulkInput: string }) => {
    if (user && listId && values.bulkInput.trim() !== '') {
      const lines = values.bulkInput.trim().split('\n');
      for (const line of lines) {
        const parts = line.split(/\s{2,}|\t/);
        if (parts.length >= 2) {
          const word = parts[0]?.trim();
          const meaning = parts[1]?.trim();
          const note = parts[2]?.trim() || '';

          if (word !== '' && meaning !== '') {
            await addWord({ word, meaning, note, uid: user.uid, listId });
          }
        }
      }
      addForm.resetFields();
    }
  };

  const handleUpdateWord = async (values: { word: string; meaning: string; note?: string }) => {
    if (editingWord && values.word.trim() !== '' && values.meaning.trim() !== '') {
      await updateWord(editingWord.id, { 
        word: values.word.trim(), 
        meaning: values.meaning.trim(),
        note: values.note ? values.note.trim() : ''
      });
      setEditingWord(null);
    }
  };

  const showDeleteConfirm = () => {
    setIsDeleteModalVisible(true);
  };

  const handleDeleteOk = async () => {
    await deleteWords(selectedWords);
    setSelectedWords([]);
    setIsDeleteModalVisible(false);
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalVisible(false);
  };

  const handleSelectWord = (wordId: string, checked: boolean) => {
    if (checked) {
      setSelectedWords([...selectedWords, wordId]);
    } else {
      setSelectedWords(selectedWords.filter((id) => id !== wordId));
    }
  };

  const handleCopyWords = () => {
    if (words.length === 0) {
      message.warning('Không có từ vựng nào để sao chép!');
      return;
    }
    const textToCopy = words.map(w => w.word).join('\n');
    navigator.clipboard.writeText(textToCopy)
      .then(() => message.success('Đã sao chép danh sách từ vựng!'))
      .catch(() => message.error('Sao chép thất bại.'));
  };

  const renderContent = () => {
    switch (mode) {
      case 'learn':
        return <LearnMode words={learningWords} onWordResult={handleWordResult} isActive={mode === 'learn'} learnType={learnModeType} />;
      case 'retype':
        return <RetypeMode words={words} onWordResult={handleWordResult} isActive={mode === 'retype'} />;
      case 'flashcard':
        return <FlashcardMode words={words} isActive={mode === 'flashcard'} />;
      case 'view':
      default:
        return (
          <>
            <Card 
              style={{ marginBottom: '24px' }}
              title={<Title level={4} style={{ margin: 0 }}>Add New Words</Title>}
            >
              <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center' }}>
                <Paragraph type="secondary" style={{ margin: 0, flex: '1 1 100%' }}>Nhập từ, nghĩa và chú thích trên cùng 1 dòng, cách nhau ít nhất 2 dấu cách hoặc 1 tab.</Paragraph>
                <Space wrap>
                  <Button icon={<CopyOutlined />} onClick={handleCopyWords}>Copy Từ vựng</Button>
                  <Radio.Group value={viewStyle} onChange={(e) => setViewStyle(e.target.value)} buttonStyle="solid">
                    <Radio.Button value="grid"><AppstoreOutlined /> Lưới</Radio.Button>
                    <Radio.Button value="list"><UnorderedListOutlined /> Danh sách</Radio.Button>
                  </Radio.Group>
                </Space>
              </div>
              <Form form={addForm} onFinish={handleAddWords}>
                <Form.Item name="bulkInput" rules={[{ required: true, message: 'Please input words!' }]}>
                  <TextArea rows={4} placeholder={"word  meaning  note\nhello  xin chào  dùng để chào hỏi"} style={{fontSize: 16}} />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" icon={<PlusOutlined />} block size="large">
                    Add Words
                  </Button>
                </Form.Item>
              </Form>
            </Card>

            <List
              grid={viewStyle === 'grid' ? { gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 } : undefined}
              dataSource={words}
              renderItem={word => {
                const isEditing = editingWord?.id === word.id;
                const isSelected = selectedWords.includes(word.id);

                const actions = [
                  isEditing ? <SaveOutlined key="save" style={{fontSize: 20}} onClick={() => editForm.submit()} /> : <EditOutlined key="edit" style={{fontSize: 20}} onClick={() => { setEditingWord(word); editForm.setFieldsValue(word); }} />,
                  <Checkbox 
                    value={word.id} 
                    style={{fontSize: 20}}
                    checked={isSelected}
                    onChange={(e) => handleSelectWord(word.id, e.target.checked)}
                  />
                ];

                if (viewStyle === 'list') {
                  return (
                    <List.Item
                      style={{
                        background: '#fff',
                        marginBottom: 4,
                        padding: '8px 16px',
                        borderRadius: 4,
                        border: '1px solid #d9d9d9'
                      }}
                    >
                      <div style={{ width: '100%', fontSize: 16, userSelect: 'text' }}>
                        {word.word}
                      </div>
                    </List.Item>
                  );
                }

                return (
                  <List.Item>
                    <Card 
                      style={{border: isSelected ? '1px solid #1890ff' : '1px solid #d9d9d9'}}
                      actions={actions}
                    >
                      {isEditing ? (
                        <Form form={editForm} onFinish={handleUpdateWord}>
                          <Form.Item name="word" noStyle rules={[{ required: true }]}>
                            <Input style={{ marginBottom: 8 }} placeholder="Word" />
                          </Form.Item>
                          <Form.Item name="meaning" noStyle rules={[{ required: true }]}>
                            <Input style={{ marginBottom: 8 }} placeholder="Meaning" />
                          </Form.Item>
                          <Form.Item name="note" noStyle>
                            <Input placeholder="Note" />
                          </Form.Item>
                        </Form>
                      ) : (
                        <Card.Meta
                          title={
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Title level={5} style={{ margin: 0 }}>{word.word}</Title>
                              <Button 
                                type="text" 
                                icon={<SoundOutlined />} 
                                onClick={() => handlePronounce(word.word)}
                              />
                            </div>
                          }
                          description={
                            <>
                              <Text type="secondary">{word.meaning}</Text>
                              {word.note && <div><Text type="secondary" italic>{word.note}</Text></div>}
                            </>
                          }
                        />
                      )}
                    </Card>
                  </List.Item>
                );
              }}
            />
          </>
        );
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <FullScreenLoader spinning={loading} />
      <Content style={{ padding: '24px' }}>
        <Row justify="center">
          <Col xs={24}>
            <Row align="middle" justify="space-between" style={{ marginBottom: 24 }}>
              <Col>
                <Button onClick={() => window.history.back()} type="text" icon={<ArrowLeftOutlined />}>
                  Back to Lists
                </Button>
              </Col>
              <Col>
                <Text type="secondary">{words.length > 0 ? `${words.length} words` : 'No words yet'}</Text>
              </Col>
              <Col>
              </Col>
            </Row>
            
            <Card style={{ marginBottom: 24 }}>
              <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: 8 }}>
                <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)} buttonStyle="solid" size="large">
                  <Radio.Button value="view"><UnorderedListOutlined /> List</Radio.Button>
                  <Radio.Button value="learn"><ReadOutlined /> Learn</Radio.Button>
                  <Radio.Button value="flashcard"><CreditCardOutlined /> Flashcards</Radio.Button>
                  <Radio.Button value="retype"><RedoOutlined /> Retype</Radio.Button>
                </Radio.Group>
              </div>

              {selectedWords.length > 0 && mode === 'view' && (
                <div style={{ marginTop: 16 }}>
                  <Button danger size="large" onClick={showDeleteConfirm} icon={<DeleteOutlined />}>
                    Delete ({selectedWords.length})
                  </Button>
                </div>
              )}

              {mode === 'learn' && (
                <div style={{marginTop: 24}}>
                    <Space wrap>
                        <Button type="primary" size="large" onClick={() => handleSelectLearnMode('typing')} disabled={words.length === 0} icon={<FormOutlined />}>
                            Input Mode
                        </Button>
                        <Button type="primary" size="large" onClick={() => handleSelectLearnMode('multiple-choice')} disabled={words.length === 0} icon={<AppstoreOutlined />}>
                            Multiple Choice
                        </Button>
                    </Space>
                </div>
              )}
            </Card>

            {renderContent()}

            <Modal
              title={<div className="text-white font-bold p-2">{`Delete ${selectedWords.length} word(s)?`}</div>}
              visible={isDeleteModalVisible}
              onOk={handleDeleteOk}
              onCancel={handleDeleteCancel}
              okText="Yes, Delete Them"
              okType="danger"
              cancelText="No"
              closable={false}
              styles={{ header: { backgroundColor: '#ff4d4f', color: 'white' } }}
            >
              <Alert
                message="Warning"
                description="This action cannot be undone."
                type="warning"
                showIcon
              />
            </Modal>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default VocabularyList;