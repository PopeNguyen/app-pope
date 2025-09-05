import { db } from "@/firebase";
import { useAuth } from "@/hooks/useAuth";
import {
  addListBank,
  deleteListBank,
  getListBank,
  updateListBank,
} from "@/services/moneyService";
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
} from "antd";
import { collection } from "firebase/firestore";
import { useEffect, useState } from "react";

const AccountBank = () => {
  const [isModalAddAccount, setIsModalAddAccount] = useState<boolean>(false);
  const [isModalListBank, setIsModalListBank] = useState<boolean>(false);
  const [spinning, setSpinning] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [dataForm, setDataForm] = useState<any>("");
  const [listBank, setListBank] = useState<any>([]);
  const { user, loading, isAuthenticated } = useAuth();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const columns = [
    {
      title: "Tên ngân hàng",
      dataIndex: "nameBank",
      key: "nameBank",
    },
    {
      title: "Tiền",
      dataIndex: "amount",
      key: "amount",
      render: (value: number) =>
        value.toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: any) => (
        <Space>
          <Button onClick={() => onEdit(record)}>Sửa</Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa?"
            onConfirm={() => {
              onDelete(record);
              message.success("Đã xóa thành công");
            }}
            okText="Có"
            cancelText="Không"
          >
            <Button danger>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const onEdit = (record: any) => {
    setDataForm(record);
    setIsEdit(true);
    setIsModalAddAccount(true);
  };

  const onDelete = async (record: any) => {
    setSpinning(true);
    try {
      await deleteListBank(record?.id);
      messageApi.success("Xóa tài khoản thành công!");
      callApiGetListBank();
    } catch (error) {
      messageApi.error("Xóa tài khoản thất bại!");
    } finally {
      setSpinning(false);
    }
  };

  const cancelForm = () => {
    setIsModalAddAccount(false);
    form.resetFields();
  };

  const handleOk = () => {
    form.validateFields().then(async (values) => {
      if (!user) return;
      var dataApi = {
        ...values,
        uid: user.uid,
      };
      setSpinning(true);
      try {
        if (isEdit) {
          dataApi.id = dataForm.id;
          await updateListBank(dataApi);
          messageApi.success("Sửa tài khoản thành công!");
          setIsEdit(false);
        } else {
          await addListBank(dataApi);
          messageApi.success("Thêm tài khoản thành công!");
        }
        setIsModalAddAccount(false);
        callApiGetListBank();
      } catch (error) {
        messageApi.error("Thao tác thất bại!");
      } finally {
        setSpinning(false);
      }
    });
  };

  const callApiGetListBank = async () => {
    if (!user) return;
    setSpinning(true);
    try {
      const list = await getListBank(user.uid);
      setListBank(list);
    } catch (error) {
        messageApi.error("Không lấy được danh sách tài khoản");
    } finally {
      setSpinning(false);
    }
  };

  useEffect(() => {
    form.setFieldsValue(dataForm);
  }, [dataForm]);

  useEffect(() => {
    callApiGetListBank();
  }, [user]);

  if (loading)
    return <p className="text-center mt-4">Đang kiểm tra đăng nhập...</p>;
  if (!isAuthenticated)
    return (
      <p className="text-center mt-4">Vui lòng đăng nhập để dùng TodoList</p>
    );

  return (
    <div>
      {contextHolder}
      <Spin spinning={spinning} fullscreen />
      <h2>Quản lý tài khoản</h2>
      <Button
        onClick={() => {
          setIsModalAddAccount(true);
        }}
      >
        Thêm tài khoản
      </Button>
      <Table
        columns={columns}
        dataSource={listBank}
        rowKey={(record: any) => record?.id} // hoặc record.id nếu có id
        pagination={false}
      />
      <Modal
        title="Thêm tài khoản"
        open={isModalAddAccount}
        onCancel={cancelForm}
        onOk={handleOk}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form
          layout="vertical"
          form={form}
          initialValues={{
            nameBank: "",
            amount: 0,
          }}
        >
          <Form.Item
            label="Tên tài khoản"
            name="nameBank"
            rules={[{ required: true, message: "Vui lòng nhập tên tài khoản" }]}
          >
            <Input placeholder="Nhập tài khoản..." />
          </Form.Item>

          <Form.Item
            label="Số tiền"
            name="amount"
            rules={[{ required: true, message: "Vui lòng nhập số tiền" }]}
          >
            <Input placeholder="Nhập số tiền..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AccountBank;
