import React, { useMemo, useState } from "react";
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
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";

const { Title } = Typography;

type TrangThaiPhien =
  | "da_len_ke_hoach"
  | "dang_thuc_hien"
  | "tam_dung"
  | "hoan_thanh"
  | "huy";

interface PhienLamViec {
  id: string;

  taskId?: string;

  ten: string;

  ghiChu?: string;

  ngayLam: Date;

  gioBatDau: string;

  gioKetThuc: string;

  trangThai: TrangThaiPhien;

  thoiGianTao: Date;

  thoiGianCapNhat: Date;

  thoiGianXoa?: Date;

  daXoa: boolean;
}

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

const fakeData: PhienLamViec[] = [
  {
    id: "1",

    ten: "Làm dashboard",

    ngayLam: new Date(),

    gioBatDau: "09:00",

    gioKetThuc: "10:30",

    trangThai: "dang_thuc_hien",

    thoiGianTao: new Date(),

    thoiGianCapNhat: new Date(),

    daXoa: false,
  },

  {
    id: "2",

    ten: "Học tiếng Anh",

    ngayLam: dayjs()
      .subtract(1, "day")
      .toDate(),

    gioBatDau: "14:00",

    gioKetThuc: "15:00",

    trangThai: "hoan_thanh",

    thoiGianTao: new Date(),

    thoiGianCapNhat: new Date(),

    daXoa: false,
  },
];

const SessionManagement: React.FC =
  () => {
    const [form] = Form.useForm();

    const [danhSach, setDanhSach] =
      useState<
        PhienLamViec[]
      >(fakeData);

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
                item.ngayLam,
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
              record.ngayLam,
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
      (id: string) => {
        setDanhSach(
          (prev) =>
            prev.map(
              (item) =>
                item.id ===
                id
                  ? {
                      ...item,

                      daXoa:
                        true,

                      thoiGianXoa:
                        new Date(),
                    }
                  : item,
            ),
        );

        message.success(
          "Đã xóa phiên",
        );
      };

    const luu =
      async () => {
        try {
          const values =
            await form.validateFields();

          const payload: PhienLamViec =
            {
              id:
                phienDangSua?.id ??
                Date.now().toString(),

              taskId:
                values.taskId,

              ten:
                values.ten,

              ghiChu:
                values.ghiChu,

              ngayLam:
                values.ngayLam.toDate(),

              gioBatDau:
                values.gioBatDau.format(
                  "HH:mm",
                ),

              gioKetThuc:
                values.gioKetThuc.format(
                  "HH:mm",
                ),

              trangThai:
                values.trangThai,

              thoiGianTao:
                phienDangSua?.thoiGianTao ??
                new Date(),

              thoiGianCapNhat:
                new Date(),

              daXoa:
                false,
            };

          if (
            phienDangSua
          ) {
            setDanhSach(
              (prev) =>
                prev.map(
                  (
                    item,
                  ) =>
                    item.id ===
                    payload.id
                      ? payload
                      : item,
                ),
            );
          } else {
            setDanhSach(
              (prev) => [
                payload,
                ...prev,
              ],
            );
          }

          message.success(
            "Lưu thành công",
          );

          setOpen(false);
        } catch {}
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
          title:
            "Ngày",

          render:
            (
              _,
              record,
            ) =>
              dayjs(
                record.ngayLam,
              ).format(
                "DD/MM/YYYY",
              ),
        },

        {
          title:
            "Bắt đầu",

          dataIndex:
            "gioBatDau",
        },

        {
          title:
            "Kết thúc",

          dataIndex:
            "gioKetThuc",
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
          bordered={
            false
          }
          className="rounded-3xl"
        >
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Title
              level={3}
              className="!mb-0"
            >
              Quản lý phiên
            </Title>

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