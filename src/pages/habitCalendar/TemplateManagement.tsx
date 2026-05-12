import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Button,
  Drawer,
  Form,
  Input,
  Select,
  TimePicker,
  Space,
  Typography,
  Popconfirm,
  message,
  Tabs,
  List,
  Empty,
  Spin,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { nanoid } from 'nanoid';
import { subscribeHabitTasks, type HabitTask } from "@/services/habitTaskService";
import {
  subscribeSessionTemplates,
  upsertSessionTemplate,
  type SessionTemplate,
  type TemplateSession,
} from "@/services/sessionTemplateService";

const { Title, Text } = Typography;
const { Option } = Select;

const daysOfWeek = [
  { key: '1', label: 'Thứ Hai', day: 1 },
  { key: '2', label: 'Thứ Ba', day: 2 },
  { key: '3', label: 'Thứ Tư', day: 3 },
  { key: '4', label: 'Thứ Năm', day: 4 },
  { key: '5', label: 'Thứ Sáu', day: 5 },
  { key: '6', label: 'Thứ Bảy', day: 6 },
  { key: '0', label: 'Chủ Nhật', day: 0 },
];

const TemplateManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
  const [templates, setTemplates] = useState<SessionTemplate[]>([]);
  const [tasks, setTasks] = useState<HabitTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [editingSession, setEditingSession] = useState<TemplateSession | null>(null);
  const [activeDay, setActiveDay] = useState<number>(1); // Monday

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const unsubTemplates = subscribeSessionTemplates(user.uid, (data) => {
      setTemplates(data);
      setLoading(false);
    });

    const unsubTasks = subscribeHabitTasks(user.uid, (data) => {
      setTasks(data);
    });

    return () => {
      unsubTemplates();
      unsubTasks();
    };
  }, [user]);

  const currentTemplate = useMemo(() => {
    return templates.find(t => t.dayOfWeek === activeDay);
  }, [templates, activeDay]);

  const handleOpenDrawer = (session: TemplateSession | null = null) => {
    setEditingSession(session);
    form.resetFields();
    if (session) {
      form.setFieldsValue({
        ...session,
        gioBatDau: dayjs(session.gioBatDau, "HH:mm"),
        gioKetThuc: dayjs(session.gioKetThuc, "HH:mm"),
      });
    }
    setIsDrawerVisible(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerVisible(false);
    setEditingSession(null);
  };

  const handleSaveSession = async () => {
    if (!user) return;
    try {
      const values = await form.validateFields();
      const sessionData: Omit<TemplateSession, 'id'> = {
        ten: values.ten,
        ghiChu: values.ghiChu || null,
        gioBatDau: values.gioBatDau.format("HH:mm"),
        gioKetThuc: values.gioKetThuc.format("HH:mm"),
        taskId: values.taskId || null,
      };

      let updatedSessions: TemplateSession[] = currentTemplate?.sessions ? [...currentTemplate.sessions] : [];

      if (editingSession) {
        // Update existing session
        updatedSessions = updatedSessions.map(s => s.id === editingSession.id ? { ...s, ...sessionData } : s);
      } else {
        // Add new session
        updatedSessions.push({ id: nanoid(), ...sessionData });
      }

      // Sort by start time
      updatedSessions.sort((a, b) => a.gioBatDau.localeCompare(b.gioBatDau));

      const dayLabel = daysOfWeek.find(d => d.day === activeDay)?.label || '';
      await upsertSessionTemplate(user.uid, activeDay, dayLabel, updatedSessions);

      message.success("Lưu mẫu thành công!");
      handleCloseDrawer();

    } catch (error) {
      console.error("Error saving template session:", error);
      message.error("Đã có lỗi xảy ra.");
    }
  };
  
  const handleDeleteSession = async (sessionId: string) => {
    if (!user || !currentTemplate) return;
    
    try {
      const updatedSessions = currentTemplate.sessions.filter(s => s.id !== sessionId);
      await upsertSessionTemplate(user.uid, activeDay, currentTemplate.name, updatedSessions);
      message.success("Đã xóa phiên khỏi mẫu.");
    } catch (error) {
        console.error("Error deleting template session:", error);
        message.error("Lỗi khi xóa phiên.");
    }
  };

  const renderTabContent = (day: number) => {
    const template = templates.find(t => t.dayOfWeek === day);
    const sessions = template?.sessions || [];

    if (loading) {
      return <div className="flex justify-center p-10"><Spin /></div>;
    }

    return (
      <>
        <div className="flex justify-end mb-4">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenDrawer()}>
                Thêm phiên vào mẫu
            </Button>
        </div>
        {sessions.length > 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={sessions}
            renderItem={item => (
              <List.Item
                actions={[
                  <Button icon={<EditOutlined />} onClick={() => handleOpenDrawer(item)} />,
                  <Popconfirm title="Xóa phiên này?" onConfirm={() => handleDeleteSession(item.id)}>
                    <Button danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta
                  title={`${item.gioBatDau} - ${item.gioKetThuc}: ${item.ten}`}
                  description={tasks.find(t => t.id === item.taskId)?.name || item.ghiChu || 'Không có ghi chú'}
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="Chưa có phiên nào trong mẫu này." />
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <Card bordered={false} className="rounded-3xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/app-pope/habit-calendar")} />
            <Title level={3} className="!mb-0">
              Quản lý Mẫu phiên
            </Title>
          </Space>
        </div>

        <Tabs defaultActiveKey="1" onChange={(key) => setActiveDay(parseInt(key, 10))}>
          {daysOfWeek.map(day => (
            <Tabs.TabPane tab={day.label} key={day.key}>
              {renderTabContent(day.day)}
            </Tabs.TabPane>
          ))}
        </Tabs>
      </Card>

      <Drawer
        title={editingSession ? "Sửa phiên trong mẫu" : "Thêm phiên vào mẫu"}
        open={isDrawerVisible}
        width={520}
        onClose={handleCloseDrawer}
        extra={
          <Button type="primary" onClick={handleSaveSession}>
            Lưu
          </Button>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Tên phiên" name="ten" rules={[{ required: true, message: "Nhập tên phiên" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Task liên kết" name="taskId">
            <Select placeholder="Chọn task liên kết (tùy chọn)" allowClear>
              {tasks.map(task => (
                <Option key={task.id} value={task.id}>
                  {task.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Ghi chú" name="ghiChu">
            <Input.TextArea rows={3} />
          </Form.Item>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Form.Item label="Giờ bắt đầu" name="gioBatDau" rules={[{ required: true }]}>
              <TimePicker format="HH:mm" className="!w-full" />
            </Form.Item>
            <Form.Item label="Giờ kết thúc" name="gioKetThuc" rules={[{ required: true }]}>
              <TimePicker format="HH:mm" className="!w-full" />
            </Form.Item>
          </div>
        </Form>
      </Drawer>
    </div>
  );
};

export default TemplateManagement;
