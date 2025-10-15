import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getWords, addWord, updateWord, deleteWords, updateWordStats } from '@/services/learnEnglishService';
import { useAuth } from '@/hooks/useAuth';
import { Layout, Typography, Form, Input, Button, List, Card, Modal, Checkbox, Row, Col, Radio, Badge, Tooltip, Space, Alert } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, ReadOutlined, CreditCardOutlined, UnorderedListOutlined, ArrowLeftOutlined, SoundOutlined, FormOutlined, AppstoreOutlined } from '@ant-design/icons';
import FullScreenLoader from '@/components/FullScreenLoader';
import FlashcardMode from '@/components/learnEnglish/FlashcardMode';
import LearnMode from '@/components/learnEnglish/LearnMode';

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const VocabularyList = () => {
  const { listId } = useParams<{ listId: string }>();
  const { user } = useAuth();
  const [words, setWords] = useState<any[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [editingWord, setEditingWord] = useState<any>(null);
  const [mode, setMode] = useState('view'); // view, learn, flashcard
  const [learningWords, setLearningWords] = useState<any[]>([]); // Words for the current session
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
        setWords(fetchedWords);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [user, listId]);

  const handleStartLearnSession = () => {
    setIsLearnModeModalVisible(true);
  };

  const handleSelectLearnMode = (type: 'typing' | 'multiple-choice') => {
    setLearnModeType(type);
    setLearningWords(words);
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
        if (parts.length === 2) {
          const [word, meaning] = parts;
          if (word.trim() !== '' && meaning.trim() !== '') {
            await addWord({ word: word.trim(), meaning: meaning.trim(), uid: user.uid, listId });
          }
        }
      }
      addForm.resetFields();
    }
  };

  const handleUpdateWord = async (values: { word: string; meaning: string }) => {
    if (editingWord && values.word.trim() !== '' && values.meaning.trim() !== '') {
      await updateWord(editingWord.id, { word: values.word.trim(), meaning: values.meaning.trim() });
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

  const renderContent = () => {
    switch (mode) {
      case 'learn':
        if (learningWords.length > 0) {
          return <LearnMode words={learningWords} onWordResult={handleWordResult} isActive={mode === 'learn'} learnType={learnModeType} />;
        }
        return (
            <div style={{textAlign: 'center', marginTop: 50}}>
                <Title level={3}>Ready to learn?</Title>
                <Paragraph>Click the "Start Learning" button above to begin.</Paragraph>
            </div>
        );
      case 'flashcard':
        return <FlashcardMode words={words} isActive={mode === 'flashcard'} />;
      case 'view':
      default:
        return (
          <>
            <Card style={{ marginBottom: '24px' }}>
              <Title level={4}>Add New Words</Title>
              <Paragraph type="secondary">Enter one word and its meaning per line, separated by at least 2 spaces or a tab.</Paragraph>
              <Form form={addForm} onFinish={handleAddWords}>
                <Form.Item name="bulkInput" rules={[{ required: true, message: 'Please input words!' }]}>
                  <TextArea rows={4} placeholder={"word  meaning\nhello  xin chào"} style={{fontSize: 16}} />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" icon={<PlusOutlined />} block size="large">
                    Add Words
                  </Button>
                </Form.Item>
              </Form>
            </Card>

            
              <List
                grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
                dataSource={words}
                renderItem={word => (
                  <List.Item>
                    <Card 
                      style={{border: selectedWords.includes(word.id) ? '1px solid #1890ff' : '1px solid #d9d9d9'}}
                      actions={[
                        editingWord?.id === word.id ? <SaveOutlined key="save" style={{fontSize: 20}} onClick={() => editForm.submit()} /> : <EditOutlined key="edit" style={{fontSize: 20}} onClick={() => { setEditingWord(word); editForm.setFieldsValue(word); }} />,
                        <Checkbox 
                        value={word.id} 
                        style={{fontSize: 20}}
                        checked={selectedWords.includes(word.id)}
                        onChange={(e) => handleSelectWord(word.id, e.target.checked)}
                      />
                      ]}
                    >
                      {editingWord?.id === word.id ? (
                        <Form form={editForm} onFinish={handleUpdateWord}>
                          <Form.Item name="word" noStyle rules={[{ required: true }]}>
                            <Input style={{ marginBottom: 8 }} />
                          </Form.Item>
                          <Form.Item name="meaning" noStyle rules={[{ required: true }]}>
                            <Input />
                          </Form.Item>
                        </Form>
                      ) : (
                        <Card.Meta
                          title={<Title level={5}>{word.word}</Title>}
                          description={<Text type="secondary">{word.meaning}</Text>}
                        />
                      )}
                    </Card>
                  </List.Item>
                )}
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
          <Col xs={24} sm={22} md={20} lg={18} xl={16}>
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
              <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)} buttonStyle="solid" size="large">
                <Radio.Button value="view"><UnorderedListOutlined /> List</Radio.Button>
                <Radio.Button value="learn"><ReadOutlined /> Learn</Radio.Button>
                <Radio.Button value="flashcard"><CreditCardOutlined /> Flashcards</Radio.Button>
              </Radio.Group>

              {selectedWords.length > 0 && mode === 'view' && (
                <Space style={{marginTop: 16}}>
                  <Button danger size="large" onClick={showDeleteConfirm} icon={<DeleteOutlined />}>
                    Delete ({selectedWords.length})
                  </Button>
                </Space>
              )}

              {mode === 'learn' && (
                <div style={{marginTop: 24}}>
                    <Button type="primary" size="large" block onClick={handleStartLearnSession} disabled={words.length === 0}>
                        Start Learning Session
                    </Button>
                </div>
              )}

            </Card>

            {renderContent()}

            <Modal
              title="Choose a Learning Mode"
              visible={isLearnModeModalVisible}
              onCancel={() => setIsLearnModeModalVisible(false)}
              footer={null}
              centered
            >
              <Row gutter={[16, 16]} style={{marginTop: 24}}>
                <Col span={12}>
                  <Button block size="large" icon={<FormOutlined />} onClick={() => handleSelectLearnMode('typing')}>
                    Input Mode
                  </Button>
                </Col>
                <Col span={12}>
                  <Button block size="large" icon={<AppstoreOutlined />} onClick={() => handleSelectLearnMode('multiple-choice')}>
                    Multiple Choice
                  </Button>
                </Col>
              </Row>
            </Modal>

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
