import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Card,
  Button,
  Drawer,
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  Space,
  Tag,
  Typography,
  Popconfirm,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  addSession,
  deleteSession,
  subscribeSessions,
  updateSession,
} from "@/services/sessionService";
import type {
  PhienLamViec,
  TrangThaiPhien,
} from "@/services/sessionService";
import { subscribeHabitTasks, updateTaskDuration } from "@/services/habitTaskService";
import type { HabitTask } from "@/services/habitTaskService";
import { Timestamp } from "firebase/firestore";

const { Title, Text } = Typography;

const mauTrangThai: Record<
  TrangThaiPhien,
  string
> = {
  da_len_ke_hoach: "default",
  dang_thuc_hien: "processing",
  tam_dung: "warning",
  hoan_thanh: "success",
  huy: "error",
};

// Helper to calculate duration in minutes
const tinhThoiLuong = (batDau: string, ketThuc: string) => {
  const start = dayjs(batDau, "HH:mm");
  const end = dayjs(ketThuc, "HH:mm");
  return end.diff(start, "minute");
};

const SessionManagement: React.FC =
  () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [form] = Form.useForm();

    const [danhSach, setDanhSach] =
      useState<
        PhienLamViec[]
      >([]);
    
    const [tasks, setTasks] = useState<HabitTask[]>([]);

    const [loading, setLoading] = useState(true);

    const [
      phienDangSua,
      setPhienDangSua,
    ] =
      useState<PhienLamViec | null>(
        null,
      );

    const [open, setOpen] =
      useState(false);

    // mặc định hôm nay
    const [
      ngayLoc,
      setNgayLoc,
    ] =
      useState<Dayjs>(
        dayjs(),
      );

    useEffect(() => {
      if (!user) return;
      
      setLoading(true);
      const unsubSessions = subscribeSessions(user.uid, (data) => {
        setDanhSach(data);
        setLoading(false);
      });

      const unsubTasks = subscribeHabitTasks(user.uid, (data) => {
        setTasks(data);
      });

      return () => {
        unsubSessions();
        unsubTasks();
      };
    }, [user]);

    const data =
      useMemo(() => {
        return danhSach
          .filter(
            (item) =>
              !item.daXoa,
          )
          .filter(
            (item) =>
              dayjs(
                item.ngayLam.toDate(),
              ).isSame(
                ngayLoc,
                "day",
              ),
          );
      }, [
        danhSach,
        ngayLoc,
      ]);

    const moTaoMoi =
      () => {
        setPhienDangSua(
          null,
        );

        form.resetFields();

        form.setFieldsValue({
          trangThai:
            "da_len_ke_hoach",

          ngayLam:
            ngayLoc,
        });

        setOpen(true);
      };

    const moSua =
      (
        record: PhienLamViec,
      ) => {
        setPhienDangSua(
          record,
        );

        form.setFieldsValue({
          ...record,

          ngayLam:
            dayjs(
              record.ngayLam.toDate(),
            ),

          gioBatDau:
            dayjs(
              record.gioBatDau,
              "HH:mm",
            ),

          gioKetThuc:
            dayjs(
              record.gioKetThuc,
              "HH:mm",
            ),
        });

        setOpen(true);
      };

    const xoaPhien =
      async (record: PhienLamViec) => {
        try {
          await deleteSession(record.id);
          
          // Trừ thời gian khỏi task nếu phiên đã hoàn thành
          if (record.trangThai === "hoan_thanh" && record.taskId) {
            const duration = tinhThoiLuong(record.gioBatDau, record.gioKetThuc);
            await updateTaskDuration(record.taskId, -duration);
          }
          
          message.success(
            "Đã xóa phiên",
          );
        } catch (error) {
          console.error("Error deleting session:", error);
          message.error("Lỗi khi xóa phiên");
        }
      };

    const luu =
      async () => {
        if (!user) return;
        try {
          const values =
            await form.validateFields();

          const currentDuration = tinhThoiLuong(values.gioBatDau.format("HH:mm"), values.gioKetThuc.format("HH:mm"));

          const basePayload = {
            taskId: values.taskId || null,
            ten: values.ten,
            ghiChu: values.ghiChu || null,
            ngayLam: Timestamp.fromDate(values.ngayLam.toDate()),
            gioBatDau: values.gioBatDau.format("HH:mm"),
            gioKetThuc: values.gioKetThuc.format("HH:mm"),
            trangThai: values.trangThai,
            thoiGianCapNhat: Timestamp.now(),
          };

          if (phienDangSua) {
            const oldStatus = phienDangSua.trangThai;
            const newStatus = values.trangThai;
            const oldTaskId = phienDangSua.taskId;
            const newTaskId = values.taskId || null;
            const oldDuration = tinhThoiLuong(phienDangSua.gioBatDau, phienDangSua.gioKetThuc);

            await updateSession(phienDangSua.id, basePayload);

            // Xử lý logic đồng bộ thời gian khi cập nhật
            if (oldTaskId === newTaskId && oldTaskId) {
               let diff = 0;
               if (oldStatus === "hoan_thanh" && newStatus === "hoan_thanh") {
                 diff = currentDuration - oldDuration;
               } else if (oldStatus !== "hoan_thanh" && newStatus === "hoan_thanh") {
                 diff = currentDuration;
               } else if (oldStatus === "hoan_thanh" && newStatus !== "hoan_thanh") {
                 diff = -oldDuration;
               }
               if (diff !== 0) await updateTaskDuration(oldTaskId, diff);
            } else {
               if (oldTaskId && oldStatus === "hoan_thanh") {
                 await updateTaskDuration(oldTaskId, -oldDuration);
               }
               if (newTaskId && newStatus === "hoan_thanh") {
                 await updateTaskDuration(newTaskId, currentDuration);
               }
            }

            message.success("Cập nhật thành công");
          } else {
            const payload: Omit<PhienLamViec, "id"> = {
              ...basePayload,
              uid: user.uid,
              thoiGianTao: Timestamp.now(),
              daXoa: false,
            };
            await addSession(payload);
            
            if (values.trangThai === "hoan_thanh" && values.taskId) {
              await updateTaskDuration(values.taskId, currentDuration);
            }

            message.success("Thêm mới thành công");
          }

          setOpen(false);
        } catch (error) {
          console.error("Error saving session:", error);
          message.error("Lỗi khi lưu phiên");
        }
      };

    const columns: ColumnsType<PhienLamViec> =
      [
        {
          title:
            "Tên phiên",

          dataIndex:
            "ten",

          width: 250,
        },
        {
          title: "Task liên kết",
          render: (_, record) => {
            const task = tasks.find(t => t.id === record.taskId);
            return task ? <Tag color="blue">{task.name}</Tag> : "-";
          }
        },
        {
          title:
            "Ngày",

          render:
            (
              _,
              record,
            ) =>
              dayjs(
                record.ngayLam.toDate(),
              ).format(
                "DD/MM/YYYY",
              ),
        },

        {
          title:
            "Thời gian",

          render:
            (
              _,
              record,
            ) => (
              <Space direction="vertical" size={0}>
                <Text>
                  {record.gioBatDau} - {record.gioKetThuc}
                </Text>
                <Tag icon={<ClockCircleOutlined />} color="default">
                  {tinhThoiLuong(record.gioBatDau, record.gioKetThuc)} phút
                </Tag>
              </Space>
            ),
        },

        {
          title:
            "Trạng thái",

          render:
            (
              _,
              record,
            ) => (
              <Tag
                color={
                  mauTrangThai[
                    record.trangThai
                  ]
                }
              >
                {
                  record.trangThai
                }
              </Tag>
            ),
        },

        {
          title:
            "Thao tác",

          width: 150,

          render:
            (
              _,
              record,
) => (
              <Space>
                <Button
                  icon={
                    <EditOutlined />
                  }
                  onClick={() =>
                    moSua(
                      record,
                    )
                  }
                />

                <Popconfirm
                  title="Xóa phiên?"
                  onConfirm={() =>
                    xoaPhien(
                      record
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
          bordered={
            false
          }
          className="rounded-3xl"
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
                Quản lý phiên
              </Title>
            </Space>

            <div className="flex flex-wrap gap-3">
              <DatePicker
                value={
                  ngayLoc
                }
                format="DD/MM/YYYY"
                onChange={(
                  value,
                ) => {
                  if (
                    !value
                  ) {
                    return;
                  }

                  setNgayLoc(
                    value,
                  );
                }}
              />

              <Button
                type="primary"
                icon={
                  <PlusOutlined />
                }
                onClick={
                  moTaoMoi
                }
              >
                Tạo phiên
              </Button>
            </div>
          </div>

          <Table
            loading={loading}
            rowKey="id"
            columns={
              columns
            }
            dataSource={
              data
            }
            scroll={{
              x: 1000,
            }}
          />
        </Card>

        <Drawer
          title="Thông tin phiên"
          open={open}
          width={560}
          onClose={() =>
            setOpen(
              false,
            )
          }
          extra={
            <Button
              type="primary"
              onClick={
                luu
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
              label="Tên phiên"
              name="ten"
              rules={[
                {
                  required: true,
                  message:
                    "Nhập tên phiên",
                },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Task liên kết"
              name="taskId"
            >
              <Select placeholder="Chọn task" allowClear>
                {tasks.map(task => (
                  <Select.Option key={task.id} value={task.id}>
                    {task.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Ghi chú"
              name="ghiChu"
            >
              <Input.TextArea
                rows={4}
              />
            </Form.Item>

            <Form.Item
              label="Ngày làm"
              name="ngayLam"
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <DatePicker className="!w-full" />
            </Form.Item>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Form.Item
                label="Giờ bắt đầu"
                name="gioBatDau"
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <TimePicker
                  format="HH:mm"
                  className="!w-full"
                />
              </Form.Item>

              <Form.Item
                label="Giờ kết thúc"
                name="gioKetThuc"
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <TimePicker
                  format="HH:mm"
                  className="!w-full"
                />
              </Form.Item>
            </div>

            <Form.Item
              label="Trạng thái"
              name="trangThai"
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Select>
                <Select.Option value="da_len_ke_hoach">
                  Đã lên kế hoạch
                </Select.Option>

                <Select.Option value="dang_thuc_hien">
                  Đang thực hiện
                </Select.Option>

                <Select.Option value="tam_dung">
                  Tạm dừng
                </Select.Option>

                <Select.Option value="hoan_thanh">
                  Hoàn thành
                </Select.Option>

                <Select.Option value="huy">
                  Hủy
                </Select.Option>
              </Select>
            </Form.Item>
          </Form>
        </Drawer>
      </div>
    );
  };

export default SessionManagement;