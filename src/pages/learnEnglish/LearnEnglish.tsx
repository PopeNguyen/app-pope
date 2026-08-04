import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getVocabularyLists, addVocabularyList, updateVocabularyList, deleteVocabularyList } from '@/services/learnEnglishListService';
import { useAuth } from '@/hooks/useAuth';
import { Form, Input, Button, List, Card, Modal, DatePicker, Popover, Tooltip, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined, BookOutlined } from '@ant-design/icons';
import FullScreenLoader from '@/components/FullScreenLoader';
import moment from 'moment';

const LearnEnglish = () => {
  const { user } = useAuth();
  const [lists, setLists] = useState<any[]>([]);
  const [editingList, setEditingList] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [modal, contextHolder] = Modal.useModal();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setLoading(true);
      const unsubscribe = getVocabularyLists(user.uid, (fetchedLists) => {
        const sortedLists = [...fetchedLists].sort((a, b) => 
          (b.createdAt || '').localeCompare(a.createdAt || '')
        );
        setLists(sortedLists);
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
    modal.confirm({
      title: 'Are you sure you want to delete this list?',
      content: 'All words within this list will be permanently removed.',
      okText: 'Yes, Delete It',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
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
      <div className="space-y-1">
        {([1, 2, 3, 4, 5]).map(i => (
          list[`date${i}`] ? (
            <div key={i} className="flex justify-between items-center gap-4 border-b border-gray-50 pb-1 last:border-0 last:pb-0">
              <span className="text-gray-500 font-medium text-xs">Date {i}:</span> 
              <span className="text-gray-800 text-sm font-semibold">{moment(list[`date${i}`].toDate()).format('DD-MM-YYYY')}</span>
            </div>
          ) : null
        ))}
      </div>
    );
    return (
      <Popover content={content} title="Review Schedule" trigger="click" placement="top">
        <div 
          className="flex justify-center items-center text-gray-500 hover:text-blue-500 transition-colors py-2 cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <InfoCircleOutlined key="info" className="text-lg" />
        </div>
      </Popover>
    );
  };

  return (
    <div className="min-h-screen">
      <FullScreenLoader spinning={loading} />
      {contextHolder}
      
      <div className="mx-auto">
        <header className="flex justify-between items-center mb-6 md:mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-blue-600 m-0 flex items-center gap-2">
              <BookOutlined /> Vocabulary
            </h1>
            <p className="text-gray-500 text-sm mt-1 mb-0 hidden sm:block">
              Manage your vocabulary lists and review schedules.
            </p>
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => showModal()} 
            size="large"
            className="flex items-center rounded-lg shadow-md shadow-blue-200"
          >
            <span className="hidden sm:inline">Create List</span>
          </Button>
        </header>

        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 4 }}
          dataSource={lists}
          renderItem={list => {
            const due = isReviewDue(list);
            return (
              <List.Item>
                <Card
                  hoverable
                  className={`rounded-2xl overflow-hidden border transition-all duration-300 ${
                    due ? 'border-blue-300 shadow-md shadow-blue-100' : 'border-gray-200 shadow-sm'
                  }`}
                  bodyStyle={{ padding: 0 }}
                  actions={[
                    renderDatePopover(list),
                    <Tooltip title="Edit List" key="edit">
                      <div 
                        className="flex justify-center items-center text-gray-500 hover:text-green-500 transition-colors py-2 cursor-pointer" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          showModal(list);
                        }}
                      >
                        <EditOutlined className="text-lg" />
                      </div>
                    </Tooltip>,
                    <Tooltip title="Delete List" key="delete">
                      <div 
                        className="flex justify-center items-center text-gray-500 hover:text-red-500 transition-colors py-2 cursor-pointer" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          showDeleteConfirm(list.id);
                        }}
                      >
                        <DeleteOutlined className="text-lg" />
                      </div>
                    </Tooltip>,
                  ]}
                >
                  <Link to={`/app-pope/learn-english/${list.id}`} className="block p-5">
                    <div className="flex justify-between items-start">
                      <div className="w-full">
                        <h3 className="text-lg font-bold text-gray-800 mb-1 truncate pr-2">
                          {list.name}
                        </h3>
                        {due ? (
                          <Tag color="blue" className="mt-2 rounded-full px-3 py-1 border-0 bg-blue-50 text-blue-600 font-semibold">
                            🔥 Review Due Today
                          </Tag>
                        ) : (
                          <Tag color="default" className="mt-2 rounded-full px-3 py-1 border-0 bg-gray-100 text-gray-500">
                            Up to date
                          </Tag>
                        )}
                      </div>
                    </div>
                  </Link>
                </Card>
              </List.Item>
            );
          }}
        />
      </div>

      <Modal
        title={<span className="text-lg font-bold">{editingList ? 'Edit List' : 'Create a New List'}</span>}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
        centered
        className="rounded-xl overflow-hidden"
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit} className="mt-4">
          <Form.Item 
            name="name" 
            label={<span className="font-semibold text-gray-700">List Name</span>} 
            rules={[{ required: true, message: 'Please input the list name!' }]}
          >
            <Input size="large" placeholder="e.g., IELTS, Travel Words..." className="rounded-lg" />
          </Form.Item>
          
          <Form.Item 
            name="date1" 
            label={<span className="font-semibold text-gray-700">First Review Date</span>}
            className="mb-2"
          >
            <DatePicker size="large" style={{ width: '100%' }} className="rounded-lg" />
          </Form.Item>
          
          <p className="text-xs text-gray-500 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
            💡 Set a date to start the review cycle. The next 4 review dates will be automatically scheduled.
          </p>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button size="large" onClick={handleCancel} className="rounded-lg">
              Cancel
            </Button>
            <Button size="large" type="primary" htmlType="submit" className="rounded-lg shadow-md shadow-blue-200">
              {editingList ? 'Save Changes' : 'Create List'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default LearnEnglish;