import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Typography, Button, Space, Grid, Badge, Modal, Form, Input, List, Upload, message, Tabs } from 'antd';
import { RocketOutlined, PlusOutlined, FireOutlined, InboxOutlined, PlayCircleOutlined, ThunderboltOutlined, BookOutlined, UploadOutlined } from '@ant-design/icons';
import Heatmap from '@/components/memorize/Heatmap';
import { useAuth } from '@/hooks/useAuth';
import { getDecks, getCards, addDeck, addCard, updateCard, deleteCard } from '@/services/memorizeService';

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
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm();
  const [bulkForm] = Form.useForm();

  useEffect(() => {
    if (user) {
      const unsub = getDecks(user.uid, (fetchedDecks) => {
        setDecks(fetchedDecks);
        // Default to first deck if exists
        if (fetchedDecks.length > 0 && !selectedDeck) {
          setSelectedDeck(fetchedDecks[0].id);
        }
      });
      return () => unsub();
    }
  }, [user]);

  useEffect(() => {
    if (user && selectedDeck) {
      const unsub = getCards(user.uid, selectedDeck, setCards);
      return () => unsub();
    }
  }, [user, selectedDeck]);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // Prevent trigger when typing in inputs
    if (['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName)) return;

    switch(event.key.toLowerCase()) {
      case ' ':
        event.preventDefault(); // Prevent scrolling
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
          
          // Nén lại dưới định dạng webp hoặc jpeg với chất lượng 0.7 để giảm size
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleCellClick = (cell: any) => {
    if (cell.card) {
      setEditingCard(cell.card);
      form.setFieldsValue({
        numberKey: cell.card.numberKey,
        name: cell.card.name,
        // we can't easily prefill the Upload component with a base64 string, so leave it empty for new upload
      });
      setIsAddCardModalOpen(true);
    } else {
      setEditingCard(null);
      form.resetFields();
      form.setFieldsValue({
        numberKey: cell.number,
      });
      setIsAddCardModalOpen(true);
    }
  };

  const openAddModal = () => {
    setEditingCard(null);
    form.resetFields();
    setIsAddCardModalOpen(true);
  };

  const handleAddOrEditCard = async (values: any) => {
    if (user && selectedDeck) {
      try {
        setUploading(true);
        let imageUrl = editingCard ? editingCard.image : '';
        if (values.image && values.image.length > 0) {
          const file = values.image[0].originFileObj;
          imageUrl = await getBase64AndCompress(file);
        }

        if (editingCard) {
          await updateCard(editingCard.id, {
            numberKey: values.numberKey,
            name: values.name,
            image: imageUrl,
          });
          message.success('Cập nhật thẻ thành công!');
        } else {
          await addCard({
            numberKey: values.numberKey,
            name: values.name,
            image: imageUrl,
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
      Modal.confirm({
        title: 'Xác nhận xóa',
        content: `Bạn có chắc chắn muốn xóa thẻ ${editingCard.numberKey} - ${editingCard.name}?`,
        onOk: async () => {
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
      });
    }
  };

  const handleBulkAdd = async (values: any) => {
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
              await addCard({
                numberKey,
                name,
                image,
                deckId: selectedDeck,
                uid: user.uid
              });
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
      {/* Header Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card bodyStyle={{ padding: '16px 24px', display: 'flex', alignItems: 'center', background: 'linear-gradient(90deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)' }}>
            <FireOutlined style={{ fontSize: 24, color: '#ff4d4f', marginRight: 12 }} />
            <Title level={4} style={{ margin: 0 }}>{streak} Ngày Streak</Title>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card bodyStyle={{ padding: '16px 24px', display: 'flex', alignItems: 'center', background: 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)' }}>
            <InboxOutlined style={{ fontSize: 24, color: '#1890ff', marginRight: 12 }} />
            <Title level={4} style={{ margin: 0 }}>{srsCount} Thẻ cần ôn hôm nay</Title>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* Actions - Mobile puts this first */}
        <Col xs={24} md={10} order={screens.md ? 1 : 1}>
          <Card title={<><RocketOutlined /> Hành động nhanh</>} style={{ height: '100%' }}>
            <Button 
              type="primary" 
              size="large" 
              block 
              style={{ height: 80, fontSize: 20, marginBottom: 16, fontWeight: 'bold' }}
              icon={<PlayCircleOutlined />}
            >
              BẮT ĐẦU ÔN TẬP (Space)
            </Button>
            <Row gutter={16}>
              <Col span={12}>
                <Button size="large" block icon={<BookOutlined />}>
                  Học mới (N)
                </Button>
              </Col>
              <Col span={12}>
                <Button size="large" block icon={<ThunderboltOutlined />}>
                  Phản xạ (S)
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Heatmap */}
        <Col xs={24} md={14} order={screens.md ? 2 : 2}>
          <Card title="Bản đồ nhiệt (00-99)" style={{ height: '100%' }}>
            <Heatmap cards={cards} onCellClick={handleCellClick} />
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
        destroyOnClose
      >
        <Tabs defaultActiveKey="1">
          <Tabs.TabPane tab={editingCard ? "Sửa thẻ" : "Thêm từng thẻ"} key="1">
            <Form form={form} layout="vertical" onFinish={handleAddOrEditCard}>
              <Form.Item name="numberKey" label="Số (00-99)" rules={[{ required: true }]}>
                <Input placeholder="Ví dụ: 00" disabled={!!editingCard} />
              </Form.Item>
              <Form.Item name="name" label="Tên hình ảnh" rules={[{ required: true }]}>
                <Input placeholder="Ví dụ: Quả trứng" />
              </Form.Item>
              <Form.Item 
                name="image" 
                label={editingCard ? "Tải ảnh mới lên (để trống nếu giữ nguyên)" : "Tải ảnh lên"} 
                valuePropName="fileList" 
                getValueFromEvent={normFile}
              >
                <Upload beforeUpload={() => false} maxCount={1} listType="picture">
                  <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
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
                      <Button danger block onClick={handleDeleteCard}>
                        Xóa thẻ này
                      </Button>
                    </Col>
                  )}
                </Row>
              </Form.Item>
            </Form>
          </Tabs.TabPane>
          {!editingCard && (
            <Tabs.TabPane tab="Thêm hàng loạt (Excel)" key="2">
            <Typography.Paragraph type="secondary">
              Copy dữ liệu từ Excel (mỗi cột là một thuộc tính) và dán vào đây.<br/>
              Thứ tự cột: <strong>Số</strong> (Tab) <strong>Tên hình ảnh</strong> (Tab) <strong>Icon/Emoji (tùy chọn)</strong>
            </Typography.Paragraph>
            <Form form={bulkForm} layout="vertical" onFinish={handleBulkAdd}>
              <Form.Item name="bulkInput" rules={[{ required: true, message: 'Vui lòng nhập dữ liệu!' }]}>
                <Input.TextArea rows={8} placeholder={"00\tQuả trứng\t🥚\n01\tKhăn mặt\t🧻"} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block loading={uploading}>Lưu tất cả thẻ</Button>
              </Form.Item>
            </Form>
          </Tabs.TabPane>
          )}
        </Tabs>
      </Modal>
    </div>
  );
};

export default MemorizeDashboard;
