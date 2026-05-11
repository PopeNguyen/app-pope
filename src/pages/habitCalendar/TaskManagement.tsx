import React, { useMemo, useState } from "react";
import {
  Table,
  Card,
  Button,
  Drawer,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
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
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

type TaskStatus =
  | "todo"
  | "in_progress"
  | "paused"
  | "completed"
  | "cancelled";

type TaskType = "day" | "month" | "year";

interface Task {
  id: string;

  name: string;
  description?: string;

  targetDuration?: number;
  actualDuration?: number;

  status: TaskStatus;

  type: TaskType;

  workDate?: Date;
  workMonth?: number;
  workYear?: number;

  createdAt: Date;
  updatedAt: Date;

  deletedAt?: Date;
  isDeleted: boolean;
}

const statusColorMap: Record<TaskStatus, string> = {
  todo: "default",
  in_progress: "processing",
  paused: "warning",
  completed: "success",
  cancelled: "error",
};

const fakeTasks: Task[] = [
  {
    id: "1",
    name: "Học tiếng Anh",
    targetDuration: 120,
    actualDuration: 45,
    status: "in_progress",
    type: "day",
    workDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
  },
  {
    id: "2",
    name: "Làm dự án",
    targetDuration: 240,
    actualDuration: 90,
    status: "todo",
    type: "month",
    workMonth: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
  },
];

const TaskManagement: React.FC = () => {
  const [form] = Form.useForm();

  const [tasks, setTasks] =
    useState<Task[]>(fakeTasks);

  const [selectedTask, setSelectedTask] =
    useState<Task | null>(null);

  const [open, setOpen] = useState(false);

  const taskType = Form.useWatch("type", form);

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
      type: "day",
    });

    setOpen(true);
  };

  const openEdit = (task: Task) => {
    setSelectedTask(task);

    form.setFieldsValue({
      ...task,
      workDate: task.workDate
        ? dayjs(task.workDate)
        : undefined,
    });

    setOpen(true);
  };

  const closeDrawer = () => {
    setOpen(false);
  };

  const handleDelete = (
    taskId: string,
  ) => {
    setTasks((prev) =>
      prev.map((item) =>
        item.id === taskId
          ? {
              ...item,
              isDeleted: true,
              deletedAt: new Date(),
            }
          : item,
      ),
    );

    message.success("Đã xóa task");
  };

  const handleSubmit = async () => {
    try {
      const values =
        await form.validateFields();

      const payload: Task = {
        id:
          selectedTask?.id ??
          Date.now().toString(),

        name: values.name,

        description:
          values.description,

        targetDuration:
          values.targetDuration,

        actualDuration:
          values.actualDuration,

        status: values.status,

        type: values.type,

        workDate: values.workDate
          ? values.workDate.toDate()
          : undefined,

        workMonth:
          values.workMonth,

        workYear:
          values.workYear,

        createdAt:
          selectedTask?.createdAt ??
          new Date(),

        updatedAt: new Date(),

        deletedAt:
          selectedTask?.deletedAt,

        isDeleted: false,
      };

      if (selectedTask) {
        setTasks((prev) =>
          prev.map((item) =>
            item.id === payload.id
              ? payload
              : item,
          ),
        );
      } else {
        setTasks((prev) => [
          payload,
          ...prev,
        ]);
      }

      message.success(
        "Lưu task thành công",
      );

      setOpen(false);
    } catch {}
  };

  const columns: ColumnsType<Task> =
    [
      {
        title: "Tên",
        dataIndex: "name",
        width: 220,
      },

      {
        title: "Loại",
        dataIndex: "type",
        width: 100,
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
            record.updatedAt,
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
          <Title
            level={3}
            className="!mb-0"
          >
            Task Management
          </Title>

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

          <Form.Item
            label="Loại"
            name="type"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Select>
              <Option value="day">
                Day
              </Option>

              <Option value="month">
                Month
              </Option>

              <Option value="year">
                Year
              </Option>
            </Select>
          </Form.Item>

          {taskType ===
            "day" && (
            <Form.Item
              label="Ngày làm"
              name="workDate"
              rules={[
                {
                  required: true,
                  message:
                    "Chọn ngày",
                },
              ]}
            >
              <DatePicker
                className="!w-full"
              />
            </Form.Item>
          )}

          {taskType ===
            "month" && (
            <Form.Item
              label="Tháng làm"
              name="workMonth"
              rules={[
                {
                  required: true,
                  message:
                    "Nhập tháng",
                },
              ]}
            >
              <InputNumber
                min={1}
                max={12}
                className="!w-full"
              />
            </Form.Item>
          )}

          {taskType ===
            "year" && (
            <Form.Item
              label="Năm làm"
              name="workYear"
              rules={[
                {
                  required: true,
                  message:
                    "Nhập năm",
                },
              ]}
            >
              <InputNumber
                min={2020}
                className="!w-full"
              />
            </Form.Item>
          )}
        </Form>
      </Drawer>
    </div>
  );
};

export default TaskManagement;