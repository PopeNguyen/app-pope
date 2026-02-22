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
  Form,
  Input,
  InputNumber,
  List,
  message,
  Modal,
  Popconfirm,
  Select, // Thêm Select để làm dropdown chọn tài khoản
} from "antd";
import { useEffect, useState } from "react";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  SwapOutlined, // Thêm icon cho nút chuyển tiền
} from "@ant-design/icons";
import FullScreenLoader from '@/components/FullScreenLoader';
import { useNavigate } from "react-router-dom";

const AccountBank = () => {
  const navigate = useNavigate();
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isTransferModalVisible, setIsTransferModalVisible] = useState<boolean>(false); // State cho modal chuyển tiền
  const [spinning, setSpinning] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [listBank, setListBank] = useState<any[]>([]);
  const { user, loading, isAuthenticated } = useAuth();

  const [form] = Form.useForm();
  const [transferForm] = Form.useForm(); // Form riêng cho tính năng chuyển tiền
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

  const handleTransferCancel = () => {
    setIsTransferModalVisible(false);
    transferForm.resetFields();
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

  // Logic xử lý chuyển tiền
  const handleTransferOk = () => {
    transferForm.validateFields().then(async (values) => {
      const { fromBankId, toBankId, transferAmount } = values;

      if (fromBankId === toBankId) {
        messageApi.error("Tài khoản nguồn và đích phải khác nhau!");
        return;
      }

      const fromBank = listBank.find((b) => b.id === fromBankId);
      const toBank = listBank.find((b) => b.id === toBankId);

      if (!fromBank || !toBank) return;

      if (Number(fromBank.amount) < transferAmount) {
        messageApi.error("Số dư không đủ để thực hiện giao dịch!");
        return;
      }

      setSpinning(true);
      try {
        // Trừ tiền tài khoản nguồn và cộng tiền tài khoản đích
        const updatedFromBank = { ...fromBank, amount: Number(fromBank.amount) - Number(transferAmount) };
        const updatedToBank = { ...toBank, amount: Number(toBank.amount) + Number(transferAmount) };

        // Gọi API cập nhật song song cả 2 tài khoản
        await Promise.all([
          updateListBank(updatedFromBank),
          updateListBank(updatedToBank)
        ]);

        messageApi.success("Chuyển tiền thành công!");
        handleTransferCancel();
        callApiGetListBank(); // Tải lại danh sách
      } catch (error) {
        messageApi.error("Chuyển tiền thất bại!");
      } finally {
        setSpinning(false);
      }
    });
  };

  if (!isAuthenticated) {
    return <p className="text-center mt-4">Vui lòng đăng nhập để sử dụng chức năng này.</p>;
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      {contextHolder}
      <FullScreenLoader spinning={loading || spinning} />
      <div className="mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Quay lại
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 text-center sm:text-left">Quản lý tài khoản</h1>
          <div className="flex gap-2">
            <Button
              icon={<SwapOutlined />}
              onClick={() => setIsTransferModalVisible(true)}
              disabled={listBank.length < 2} // Cần ít nhất 2 tài khoản để chuyển tiền
            >
              Chuyển tiền
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
              Thêm tài khoản
            </Button>
          </div>
        </header>

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
      </div>

      {/* Modal Thêm / Cập nhật tài khoản */}
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

      {/* Modal Chuyển tiền */}
      <Modal
        title="Chuyển tiền giữa các tài khoản"
        open={isTransferModalVisible}
        onCancel={handleTransferCancel}
        onOk={handleTransferOk}
        okText="Chuyển tiền"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={transferForm} layout="vertical" name="transfer_form">
          <Form.Item
            name="fromBankId"
            label="Từ tài khoản (Nguồn)"
            rules={[{ required: true, message: "Vui lòng chọn tài khoản nguồn!" }]}
          >
            <Select placeholder="Chọn tài khoản nguồn">
              {listBank.map((bank) => (
                <Select.Option key={bank.id} value={bank.id}>
                  {bank.nameBank} (Số dư: {Number(bank.amount || 0).toLocaleString("vi-VN")}đ)
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="toBankId"
            label="Đến tài khoản (Đích)"
            rules={[{ required: true, message: "Vui lòng chọn tài khoản đích!" }]}
          >
            <Select placeholder="Chọn tài khoản đích">
              {listBank.map((bank) => (
                <Select.Option key={bank.id} value={bank.id}>
                  {bank.nameBank} (Số dư: {Number(bank.amount || 0).toLocaleString("vi-VN")}đ)
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="transferAmount"
            label="Số tiền muốn chuyển"
            rules={[
              { required: true, message: "Vui lòng nhập số tiền!" },
              { type: 'number', min: 1, message: "Số tiền phải lớn hơn 0!" }
            ]}
          >
            <InputNumber
              className="w-full"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
              placeholder="Nhập số tiền"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AccountBank;