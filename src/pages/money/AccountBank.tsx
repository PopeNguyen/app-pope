import { useAuth } from "@/hooks/useAuth";
import {
  addListBank,
  deleteListBank,
  getListBank,
  updateListBank,
} from "@/services/moneyService";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  List,
  message,
  Modal,
  Popconfirm,
  Row,
  Spin,
} from "antd";
import { useEffect, useState } from "react";
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const AccountBank = () => {
  const navigate = useNavigate();
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [spinning, setSpinning] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [listBank, setListBank] = useState<any[]>([]);
  const { user, loading, isAuthenticated } = useAuth();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

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
    if (user) {
      callApiGetListBank();
    }
  }, [user]);

  const onEdit = (record: any) => {
    setIsEdit(true);
    setEditingRecord(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const onDelete = async (record: any) => {
    setSpinning(true);
    try {
      await deleteListBank(record.id);
      messageApi.success("Xóa tài khoản thành công!");
      callApiGetListBank();
    } catch (error) {
      messageApi.error("Xóa tài khoản thất bại!");
    } finally {
      setSpinning(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingRecord(null);
    setIsEdit(false);
  };

  const handleOk = () => {
    form.validateFields().then(async (values) => {
      if (!user) return;
      const dataApi = { ...values, uid: user.uid };
      setSpinning(true);
      try {
        if (isEdit && editingRecord) {
          await updateListBank({ ...dataApi, id: editingRecord.id });
          messageApi.success("Cập nhật tài khoản thành công!");
        } else {
          await addListBank(dataApi);
          messageApi.success("Thêm tài khoản thành công!");
        }
        handleCancel();
        callApiGetListBank();
      } catch (error) {
        messageApi.error("Thao tác thất bại!");
      } finally {
        setSpinning(false);
      }
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Spin size="large" /></div>;
  }
  if (!isAuthenticated) {
    return <p className="text-center mt-4">Vui lòng đăng nhập để sử dụng chức năng này.</p>;
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      {contextHolder}
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Quay lại
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 text-center sm:text-left">Quản lý tài khoản</h1>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
            Thêm tài khoản
          </Button>
        </header>

        <Spin spinning={spinning}>
          <List
            grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 3, xl: 3 }}
            dataSource={listBank}
            renderItem={(item) => (
              <List.Item>
                <Card
                  hoverable
                  actions={[
                    <EditOutlined key="edit" onClick={() => onEdit(item)} />,
                    <Popconfirm
                      title="Bạn có chắc chắn muốn xóa?"
                      onConfirm={() => onDelete(item)}
                      okText="Có"
                      cancelText="Không"
                    >
                      <DeleteOutlined key="delete" />
                    </Popconfirm>,
                  ]}
                >
                  <Card.Meta
                    title={<span className="font-semibold text-lg">{item.nameBank}</span>}
                    description={
                      <span className="text-green-600 font-medium text-xl">
                        {Number(item.amount || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                      </span>
                    }
                  />
                </Card>
              </List.Item>
            )}
          />
        </Spin>
      </div>

      <Modal
        title={isEdit ? "Cập nhật tài khoản" : "Thêm tài khoản"}
        open={isModalVisible}
        onCancel={handleCancel}
        onOk={handleOk}
        okText={isEdit ? "Cập nhật" : "Lưu"}
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical" name="account_form" initialValues={{ amount: 0 }}>
          <Form.Item
            name="nameBank"
            label="Tên tài khoản"
            rules={[{ required: true, message: "Vui lòng nhập tên tài khoản!" }]}
          >
            <Input placeholder="Ví dụ: Vietcombank, Tiền mặt..." />
          </Form.Item>
          <Form.Item
            name="amount"
            label="Số dư ban đầu"
            rules={[{ required: true, message: "Vui lòng nhập số dư!" }]}
          >
            <InputNumber
              className="w-full"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
              placeholder="0"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AccountBank;