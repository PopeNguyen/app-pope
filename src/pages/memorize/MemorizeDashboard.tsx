import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Typography, Button, Space, Grid, Badge, Modal, Form, Input, List, Upload, message, Tabs, Dropdown, Checkbox, Radio, Divider } from 'antd';
import { RocketOutlined, PlusOutlined, FireOutlined, InboxOutlined, PlayCircleOutlined, ThunderboltOutlined, BookOutlined, UploadOutlined, DeleteOutlined, EllipsisOutlined, CopyOutlined } from '@ant-design/icons';
import Heatmap from '@/components/memorize/Heatmap';
import { useAuth } from '@/hooks/useAuth';
import { getDecks, getCards, addDeck, addCard, updateCard, deleteCard, deleteDeck } from '@/services/memorizeService';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const MemorizeDashboard = () => {
  const { user } = useAuth();
  const screens = useBreakpoint();
  
  const [decks, setDecks] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<any>(null);
  const [selectedNumber, setSelectedNumber] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [bulkMode, setBulkMode] = useState<'person' | 'action' | 'object'>('object');
  const [displayOptions, setDisplayOptions] = useState<{ person: boolean; action: boolean; object: boolean }>({ person: false, action: false, object: true });
  const [form] = Form.useForm();
  const [bulkForm] = Form.useForm();

  useEffect(() => {
    if (user) {
      const unsub = getDecks(user.uid, (fetchedDecks) => {
        setDecks(fetchedDecks);
        if (fetchedDecks.length > 0 && !selectedDeck) {
          setSelectedDeck(fetchedDecks[0].id);
        }
      });
      return () => unsub();
    }
  }, [user, selectedDeck]);

  useEffect(() => {
    if (user && selectedDeck) {
      const unsub = getCards(user.uid, selectedDeck, setCards);
      return () => unsub();
    }
  }, [user, selectedDeck]);

  // Use useEffect to reliably populate the form after the Modal is open
  useEffect(() => {
    if (isAddCardModalOpen) {
      // setTimeout ensures the Form inside Modal/Tabs is fully mounted
      const timer = setTimeout(() => {
        if (editingCard) {
          form.setFieldsValue({
            numberKey: editingCard.numberKey,
            name: editingCard.name,
            personName: editingCard.personName,
            actionName: editingCard.actionName,
          });
        } else {
          form.resetFields();
          form.setFieldsValue({
            numberKey: selectedNumber,
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAddCardModalOpen, editingCard, selectedNumber, form]);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName)) return;

    switch(event.key.toLowerCase()) {
      case ' ':
        event.preventDefault();
        console.log('Bắt đầu ôn tập (Space)');
        break;
      case 'n':
        console.log('Học mới (N)');
        break;
      case 's':
        console.log('Phản xạ (S)');
        break;
      case 'a':
        setIsAddCardModalOpen(true);
        break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  const getBase64AndCompress = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 300;
          const MAX_HEIGHT = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleCellClick = (cell: any) => {
    setSelectedNumber(cell.number);
    if (cell.card) {
      setEditingCard(cell.card);
    } else {
      setEditingCard(null);
    }
    setIsAddCardModalOpen(true);
  };

  const openAddModal = () => {
    setEditingCard(null);
    setSelectedNumber('');
    setIsAddCardModalOpen(true);
  };

  const handleAddOrEditCard = async (values: any) => {
    if (!selectedDeck) {
      message.error('Bạn cần chọn hoặc tạo một Bộ thẻ (Deck) trước khi lưu thẻ!');
      return;
    }
    if (user && selectedDeck) {
      try {
        setUploading(true);
        let imageUrl = editingCard ? editingCard.image : '';
        let personImageUrl = editingCard ? editingCard.personImage : '';
        let actionImageUrl = editingCard ? editingCard.actionImage : '';

        if (values.image && values.image.length > 0) {
          imageUrl = await getBase64AndCompress(values.image[0].originFileObj);
        }
        if (values.personImage && values.personImage.length > 0) {
          personImageUrl = await getBase64AndCompress(values.personImage[0].originFileObj);
        }
        if (values.actionImage && values.actionImage.length > 0) {
          actionImageUrl = await getBase64AndCompress(values.actionImage[0].originFileObj);
        }

        const data = {
          numberKey: values.numberKey,
          name: values.name || '',
          image: imageUrl || '',
          personName: values.personName || '',
          personImage: personImageUrl || '',
          actionName: values.actionName || '',
          actionImage: actionImageUrl || '',
        };

        if (editingCard) {
          await updateCard(editingCard.id, data);
          message.success('Cập nhật thẻ thành công!');
        } else {
          await addCard({
            ...data,
            deckId: selectedDeck,
            uid: user.uid
          });
          message.success('Thêm thẻ thành công!');
        }
        
        setIsAddCardModalOpen(false);
        form.resetFields();
        setEditingCard(null);
      } catch (error) {
        console.error(error);
        message.error('Có lỗi xảy ra khi xử lý ảnh hoặc lưu thẻ.');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleDeleteCard = async () => {
    if (editingCard) {
      if (window.confirm(`Bạn có chắc chắn muốn xóa thẻ ${editingCard.numberKey} - ${editingCard.name}?`)) {
        try {
          await deleteCard(editingCard.id);
          message.success('Xóa thẻ thành công!');
          setIsAddCardModalOpen(false);
          setEditingCard(null);
          form.resetFields();
        } catch (e) {
          message.error('Xóa thất bại.');
        }
      }
    }
  };

  const handleBulkAdd = async (values: any) => {
    if (!selectedDeck) {
      message.error('Bạn cần chọn hoặc tạo một Bộ thẻ (Deck) trước khi lưu thẻ!');
      return;
    }
    if (user && selectedDeck && values.bulkInput) {
      setUploading(true);
      try {
        const lines = values.bulkInput.trim().split('\n');
        for (const line of lines) {
          const parts = line.split(/\t/);
          if (parts.length >= 2) {
            const numberKey = parts[0]?.trim();
            const name = parts[1]?.trim();
            const image = parts[2]?.trim() || '';

            if (numberKey !== '' && name !== '') {
              const existingCard = cards.find(c => c.numberKey === numberKey && c.deckId === selectedDeck);
              const mergeData: any = {};
              
              if (bulkMode === 'person') {
                mergeData.personName = name;
                if (image) mergeData.personImage = image;
              } else if (bulkMode === 'action') {
                mergeData.actionName = name;
                if (image) mergeData.actionImage = image;
              } else {
                mergeData.name = name;
                if (image) mergeData.image = image;
              }

              if (existingCard) {
                await updateCard(existingCard.id, mergeData);
              } else {
                await addCard({
                  numberKey,
                  deckId: selectedDeck,
                  uid: user.uid,
                  ...mergeData
                });
              }
            }
          }
        }
        message.success('Thêm hàng loạt thành công!');
        setIsAddCardModalOpen(false);
        bulkForm.resetFields();
      } catch (error) {
        console.error(error);
        message.error('Có lỗi xảy ra khi thêm hàng loạt.');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleDeleteDeck = async (deckId: string, deckName: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn bộ thẻ "${deckName}" và tất cả các thẻ bên trong không?`)) {
      try {
        await deleteDeck(deckId);
        message.success('Đã xóa bộ thẻ!');
        if (selectedDeck === deckId) {
          setSelectedDeck(null);
          setCards([]);
        }
      } catch (error) {
        message.error('Không thể xóa bộ thẻ.');
      }
    }
  };

  const handleCopyData = () => {
    if (cards.length === 0) {
      message.warning('Chưa có dữ liệu nào để sao chép!');
      return;
    }

    const lines: string[] = [];
    for (let i = 0; i < 100; i++) {
      const numStr = i.toString().padStart(2, '0');
      const card = cards.find(c => c.numberKey === numStr);
      if (card) {
        const rowData = [numStr];
        if (displayOptions.person) rowData.push(card.personName || '');
        if (displayOptions.action) rowData.push(card.actionName || '');
        if (displayOptions.object) rowData.push(card.name || '');
        lines.push(rowData.join('\t'));
      }
    }

    if (lines.length === 0) {
      message.warning('Dữ liệu đang hiển thị trống!');
      return;
    }

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      message.success('Đã sao chép dữ liệu vào khay nhớ tạm!');
    }).catch(() => {
      message.error('Không thể sao chép, vui lòng thử lại.');
    });
  };

  // Mock data for UI
  const streak = 12;
  const srsCount = 25;

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  return (
    <div style={{ margin: '0 auto' }}>
      <Row gutter={[24, 24]}>
        {/* Heatmap */}
        <Col xs={24}>
          <Card 
            title="Bản đồ nhiệt (00-99)" 
            style={{ height: '100%' }}
            extra={
              <Space>
                <Button 
                  icon={<CopyOutlined />} 
                  onClick={handleCopyData}
                  title="Sao chép dữ liệu đang hiển thị"
                >
                  Sao chép
                </Button>
                <Dropdown 
                  menu={{ 
                    items: [
                      {
                        key: 'person',
                        label: <Checkbox checked={displayOptions.person} onChange={(e) => setDisplayOptions(prev => ({...prev, person: e.target.checked}))}>Người</Checkbox>
                      },
                      {
                        key: 'action',
                        label: <Checkbox checked={displayOptions.action} onChange={(e) => setDisplayOptions(prev => ({...prev, action: e.target.checked}))}>Hành động</Checkbox>
                      },
                      {
                        key: 'object',
                        label: <Checkbox checked={displayOptions.object} onChange={(e) => setDisplayOptions(prev => ({...prev, object: e.target.checked}))}>Hình ảnh</Checkbox>
                      }
                    ]
                  }} 
                  trigger={['click']}
                >
                  <Button type="text" icon={<EllipsisOutlined style={{ fontSize: 20 }} />} />
                </Dropdown>
              </Space>
            }
          >
            <Heatmap cards={cards} onCellClick={handleCellClick} displayOptions={displayOptions} />
            <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: '#888' }}>
              (Nhấp vào ô bất kỳ để Sửa/Thêm)
            </div>
          </Card>
        </Col>

        {/* Decks */}
        <Col xs={24} order={3}>
          <Card 
            title="Các bộ thẻ (Decks)" 
            extra={
              <Button type="dashed" icon={<PlusOutlined />} onClick={openAddModal}>
                Thêm thẻ mới (A)
              </Button>
            }
          >
            {decks.length === 0 ? (
              <Button 
                type="primary" 
                onClick={() => user && addDeck({ name: 'Bộ số 00-99', description: 'Ghi nhớ số thành hình ảnh', uid: user.uid })}
              >
                Tạo bộ thẻ mặc định
              </Button>
            ) : (
              <List
                grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
                dataSource={decks}
                renderItem={item => (
                  <List.Item>
                    <Card 
                      hoverable 
                      onClick={() => setSelectedDeck(item.id)}
                      style={{ border: selectedDeck === item.id ? '2px solid #1890ff' : undefined }}
                      actions={[
                        <Button 
                          type="text" 
                          danger 
                          icon={<DeleteOutlined />} 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDeck(item.id, item.name);
                          }}
                        >
                          Xóa
                        </Button>
                      ]}
                    >
                      <Card.Meta title={item.name} description={item.description} />
                    </Card>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title={editingCard ? "Sửa thẻ" : "Thêm thẻ mới"}
        open={isAddCardModalOpen}
        onCancel={() => {
          setIsAddCardModalOpen(false);
          setEditingCard(null);
          form.resetFields();
        }}
        footer={null}
        forceRender
      >
        <Tabs 
          defaultActiveKey="1"
          items={[
            {
              key: "1",
              label: editingCard ? "Sửa thẻ" : "Thêm từng thẻ",
              children: (
                <Form form={form} layout="vertical" onFinish={handleAddOrEditCard}>
                  <Form.Item name="numberKey" label="Số (00-99)" rules={[{ required: true, message: 'Vui lòng nhập số' }]}>
                    <Input placeholder="Ví dụ: 00" disabled={!!editingCard} />
                  </Form.Item>
                  <Divider orientation="left">Người</Divider>
                  <Form.Item name="personName">
                    <Input placeholder="Ví dụ: Einstein" />
                  </Form.Item>
                  <Form.Item 
                    name="personImage" 
                    valuePropName="fileList" 
                    getValueFromEvent={normFile}
                  >
                    <Upload beforeUpload={() => false} maxCount={1} listType="picture">
                      <Button icon={<UploadOutlined />}>Tải ảnh người lên</Button>
                    </Upload>
                  </Form.Item>

                  <Divider orientation="left">Hành động</Divider>
                  <Form.Item name="actionName">
                    <Input placeholder="Ví dụ: Viết bảng" />
                  </Form.Item>
                  <Form.Item 
                    name="actionImage" 
                    valuePropName="fileList" 
                    getValueFromEvent={normFile}
                  >
                    <Upload beforeUpload={() => false} maxCount={1} listType="picture">
                      <Button icon={<UploadOutlined />}>Tải ảnh hành động lên</Button>
                    </Upload>
                  </Form.Item>

                  <Divider orientation="left">Hình ảnh (Vật)</Divider>
                  <Form.Item name="name">
                    <Input placeholder="Ví dụ: Quả trứng" />
                  </Form.Item>
                  <Form.Item 
                    name="image" 
                    valuePropName="fileList" 
                    getValueFromEvent={normFile}
                  >
                    <Upload beforeUpload={() => false} maxCount={1} listType="picture">
                      <Button icon={<UploadOutlined />}>Tải ảnh vật lên</Button>
                    </Upload>
                  </Form.Item>
                  <Form.Item>
                    <Row gutter={16}>
                      <Col span={editingCard ? 12 : 24}>
                        <Button type="primary" htmlType="submit" block loading={uploading}>
                          {editingCard ? "Cập nhật" : "Lưu thẻ"}
                        </Button>
                      </Col>
                      {editingCard && (
                        <Col span={12}>
                          <Button danger block htmlType="button" onClick={(e) => { e.preventDefault(); handleDeleteCard(); }}>
                            Xóa thẻ này
                          </Button>
                        </Col>
                      )}
                    </Row>
                  </Form.Item>
                </Form>
              )
            },
            !editingCard ? {
              key: "2",
              label: "Thêm hàng loạt (Excel)",
              children: (
                <>
                  <Typography.Paragraph type="secondary">
                    Chọn loại dữ liệu bạn muốn dán vào:
                  </Typography.Paragraph>
                  <div style={{ marginBottom: 16 }}>
                    <Radio.Group value={bulkMode} onChange={e => setBulkMode(e.target.value)} buttonStyle="solid">
                      <Radio.Button value="person">Người</Radio.Button>
                      <Radio.Button value="action">Hành động</Radio.Button>
                      <Radio.Button value="object">Hình ảnh</Radio.Button>
                    </Radio.Group>
                  </div>
                  <Typography.Paragraph type="secondary">
                    Thứ tự cột: <strong>Số</strong> (Tab) <strong>Tên {bulkMode === 'person' ? 'Người' : bulkMode === 'action' ? 'Hành động' : 'Hình ảnh'}</strong> (Tab) <strong>Link URL Ảnh (tùy chọn)</strong>
                  </Typography.Paragraph>
                  <Form form={bulkForm} layout="vertical" onFinish={handleBulkAdd}>
                    <Form.Item name="bulkInput" rules={[{ required: true, message: 'Vui lòng nhập dữ liệu!' }]}>
                      <Input.TextArea rows={8} placeholder={"00\tQuả trứng\t🥚\n01\tKhăn mặt\t🧻"} />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit" block loading={uploading}>Lưu tất cả thẻ</Button>
                    </Form.Item>
                  </Form>
                </>
              )
            } : null
          ].filter(Boolean) as any}
        />
      </Modal>
    </div>
  );
};

export default MemorizeDashboard;
