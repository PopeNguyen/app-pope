import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getVocabularyLists, addVocabularyList, updateVocabularyList, deleteVocabularyList } from '@/services/learnEnglishListService';
import { useAuth } from '@/hooks/useAuth';
import { Layout, Typography, Form, Input, Button, List, Card, Modal, Col, Row, Space, DatePicker, Popover, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import FullScreenLoader from '@/components/FullScreenLoader';
import moment from 'moment';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

const LearnEnglish = () => {
  const { user } = useAuth();
  const [lists, setLists] = useState<any[]>([]);
  const [editingList, setEditingList] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setLoading(true);
      const unsubscribe = getVocabularyLists(user.uid, (fetchedLists) => {
        setLists(fetchedLists);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [user]);

  const showModal = (list: any = null) => {
    setEditingList(list);
    form.setFieldsValue({ 
      name: list ? list.name : '',
      date1: list?.date1 ? moment(list.date1.toDate()) : null
    });
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingList(null);
    form.resetFields();
  };

  const handleFormSubmit = async (values: { name: string; date1?: any }) => {
    if (user && values.name.trim() !== '') {
      const data = {
        name: values.name.trim(),
        date1: values.date1 ? values.date1.toDate() : null
      };

      if (editingList) {
        await updateVocabularyList(editingList.id, data);
      } else {
        await addVocabularyList({ ...data, uid: user.uid });
      }
    }
    handleCancel();
  };

  const showDeleteConfirm = (listId: string) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this list?',
      content: 'All words within this list will be permanently removed.',
      okText: 'Yes, Delete It',
      okType: 'danger',
      onOk: async () => await deleteVocabularyList(listId),
    });
  };

  const isReviewDue = (list: any) => {
    const today = moment().startOf('day');
    for (let i = 1; i <= 5; i++) {
      if (list[`date${i}`] && moment(list[`date${i}`].toDate()).startOf('day').isSame(today)) {
        return true;
      }
    }
    return false;
  };

  const renderDatePopover = (list: any) => {
    const content = (
      <div>
        {([1, 2, 3, 4, 5]).map(i => (
          list[`date${i}`] ? (
            <p key={i} style={{ margin: 0 }}>
              <strong>Date {i}:</strong> {moment(list[`date${i}`].toDate()).format('YYYY-MM-DD')}
            </p>
          ) : null
        ))}
      </div>
    );
    return (
      <Popover content={content} title="Review Schedule" trigger="click">
        <InfoCircleOutlined key="info" />
      </Popover>
    );
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <FullScreenLoader spinning={loading} />
      <Content style={{ padding: '24px' }}>
        <Row justify="center">
          <Col xs={24} sm={22} md={20} lg={18} xl={16}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <Title level={1} style={{ color: '#1890ff' }}>Vocabulary Lists</Title>
              <Paragraph type="secondary">Manage your vocabulary lists and review schedules.</Paragraph>
            </div>

            <Card style={{ marginBottom: '24px' }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()} size="large" block>
                Create New List
              </Button>
            </Card>

            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 4 }}
              dataSource={lists}
              renderItem={list => {
                const due = isReviewDue(list);
                return (
                  <List.Item>
                    <Card
                      hoverable
                      style={{ background: due ? '#e6f7ff' : 'white' }}
                      actions={[
                        renderDatePopover(list),
                        <Tooltip title="Edit List"><EditOutlined key="edit" onClick={() => showModal(list)} /></Tooltip>,
                        <Tooltip title="Delete List"><DeleteOutlined key="delete" onClick={() => showDeleteConfirm(list.id)} /></Tooltip>,
                      ]}
                    >
                      <Link to={`/app-pope/learn-english/${list.id}`}>
                        <Card.Meta
                          title={<Title level={4}>{list.name}</Title>}
                        />
                      </Link>
                    </Card>
                  </List.Item>
                )
              }}
            />
          </Col>
        </Row>
      </Content>

      <Modal
        title={editingList ? 'Edit List' : 'Create a New List'}
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: '24px' }}>
          <Form.Item name="name" label="List Name" rules={[{ required: true, message: 'Please input the list name!' }]}>
            <Input size="large" placeholder="e.g., IELTS, Travel Words..." />
          </Form.Item>
          <Form.Item name="date1" label="First Review Date">
            <DatePicker size="large" style={{ width: '100%' }} />
          </Form.Item>
          <Paragraph type="secondary">Set a date to start the review cycle. The next 4 review dates will be automatically scheduled.</Paragraph>
          <Form.Item style={{ textAlign: 'right', marginTop: 24 }}>
            <Space>
              <Button size="large" onClick={handleCancel}>Cancel</Button>
              <Button size="large" type="primary" htmlType="submit">
                {editingList ? 'Save Changes' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default LearnEnglish;
