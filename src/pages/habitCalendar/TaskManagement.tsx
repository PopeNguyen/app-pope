import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Card,
  Button,
  Drawer,
  Form,
  Input,
  Select,
  InputNumber,
  Typography,
  Space,
  Tag,
  Popconfirm,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  addHabitTask,
  deleteHabitTask,
  subscribeHabitTasks,
  updateHabitTask,
} from "@/services/habitTaskService";
import type {
  HabitTask,
  TaskStatus,
} from "@/services/habitTaskService";
import { Timestamp } from "firebase/firestore";

const { Title } = Typography;
const { Option } = Select;

const statusColorMap: Record<TaskStatus, string> = {
  todo: "default",
  in_progress: "processing",
  paused: "warning",
  completed: "success",
  cancelled: "error",
};

const TaskManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [tasks, setTasks] =
    useState<HabitTask[]>([]);

  const [loading, setLoading] = useState(true);

  const [selectedTask, setSelectedTask] =
    useState<HabitTask | null>(null);

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    const unsub = subscribeHabitTasks(user.uid, (data) => {
      setTasks(data);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const activeTasks = useMemo(() => {
    return tasks.filter(
      (item) => !item.isDeleted,
    );
  }, [tasks]);

  const openCreate = () => {
    setSelectedTask(null);

    form.resetFields();

    form.setFieldsValue({
      status: "todo",
    });

    setOpen(true);
  };

  const openEdit = (task: HabitTask) => {
    setSelectedTask(task);

    form.setFieldsValue({
      ...task
    });

    setOpen(true);
  };

  const closeDrawer = () => {
    setOpen(false);
  };

  const handleDelete = async (
    taskId: string,
  ) => {
    try {
      await deleteHabitTask(taskId);
      message.success("Đã xóa task");
    } catch (error) {
      console.error("Error deleting task:", error);
      message.error("Lỗi khi xóa task");
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    try {
      const values =
        await form.validateFields();

      const basePayload = {
        name: values.name,
        description: values.description || null,
        targetDuration: values.targetDuration || null,
        actualDuration: values.actualDuration || null,
        status: values.status,
        updatedAt: Timestamp.now(),
      };

      if (selectedTask) {
        await updateHabitTask(selectedTask.id, basePayload);
        message.success("Cập nhật thành công");
      } else {
        const payload: Omit<HabitTask, "id"> = {
          ...basePayload,
          uid: user.uid,
          createdAt: Timestamp.now(),
          isDeleted: false,
        };
        await addHabitTask(payload);
        message.success("Thêm mới thành công");
      }

      setOpen(false);
    } catch (error) {
      console.error("Error saving task:", error);
      message.error("Lỗi khi lưu task");
    }
  };

  const columns: ColumnsType<HabitTask> =
    [
      {
        title: "Tên",
        dataIndex: "name",
        width: 220,
      },
      {
        title: "Kế hoạch",
        render: (_, record) =>
          record.targetDuration
            ? `${record.targetDuration} phút`
            : "-",
      },

      {
        title: "Đã làm",
        render: (_, record) =>
          record.actualDuration
            ? `${record.actualDuration} phút`
            : "-",
      },

      {
        title: "Trạng thái",
        render: (_, record) => (
          <Tag
            color={
              statusColorMap[
                record.status
              ]
            }
          >
            {record.status}
          </Tag>
        ),
      },

      {
        title: "Cập nhật",
        render: (_, record) =>
          dayjs(
            record.updatedAt.toDate(),
          ).format(
            "DD/MM/YYYY HH:mm",
          ),
      },

      {
        title: "Action",
        width: 150,
        render: (_, record) => (
          <Space>
            <Button
              icon={
                <EditOutlined />
              }
              onClick={() =>
                openEdit(
                  record,
                )
              }
            />

            <Popconfirm
              title="Xóa task?"
              onConfirm={() =>
                handleDelete(
                  record.id,
                )
              }
            >
              <Button
                danger
                icon={
                  <DeleteOutlined />
                }
              />
            </Popconfirm>
          </Space>
        ),
      },
    ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <Card
        className="rounded-3xl"
        bordered={false}
      >
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate("/app-pope/habit-calendar")}
            />
            <Title
              level={3}
              className="!mb-0"
            >
              Task Management
            </Title>
          </Space>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={
              openCreate
            }
          >
            Tạo task
          </Button>
        </div>

        <Table
          loading={loading}
          rowKey="id"
          columns={columns}
          dataSource={
            activeTasks
          }
          scroll={{
            x: 1000,
          }}
          pagination={{
            pageSize: 10,
          }}
        />
      </Card>

      <Drawer
        title={
          selectedTask
            ? "Cập nhật task"
            : "Tạo task"
        }
        open={open}
        width={520}
        onClose={
          closeDrawer
        }
        extra={
          <Button
            type="primary"
            onClick={
              handleSubmit
            }
          >
            Lưu
          </Button>
        }
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            label="Tên task"
            name="name"
            rules={[
              {
                required: true,
                message:
                  "Nhập tên task",
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Mô tả"
            name="description"
          >
            <Input.TextArea
              rows={4}
            />
          </Form.Item>

          <Form.Item
            label="Thời gian dự kiến"
            name="targetDuration"
          >
            <InputNumber
              className="!w-full"
              addonAfter="phút"
            />
          </Form.Item>

          <Form.Item
            label="Thời gian đã làm"
            name="actualDuration"
          >
            <InputNumber
              className="!w-full"
              addonAfter="phút"
            />
          </Form.Item>

          <Form.Item
            label="Trạng thái"
            name="status"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Select>
              <Option value="todo">
                Todo
              </Option>

              <Option value="in_progress">
                In Progress
              </Option>

              <Option value="paused">
                Paused
              </Option>

              <Option value="completed">
                Completed
              </Option>

              <Option value="cancelled">
                Cancelled
              </Option>
            </Select>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default TaskManagement;