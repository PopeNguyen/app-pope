import { useAuth } from "@/hooks/useAuth";
import {
  addCategoryBank,
  deleteCategoryBank,
  getCategoryBank,
  updateCategoryBank,
} from "@/services/categoryBankService";
import {
  Button,
  Form,
  Input,
  List,
  message,
  Modal,
  Popconfirm,
  Spin,
  Select,
  Tag
} from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined } from "@ant-design/icons";

const CategoryBank = () => {
  const navigate = useNavigate();
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [spinning, setSpinning] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [categoryBank, setCategoryBank] = useState<any[]>([]);
  const { user, loading, isAuthenticated } = useAuth();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const callApiGetCategoryBank = async () => {
    if (!user) return;
    setSpinning(true);
    try {
      const list = await getCategoryBank(user.uid);
      setCategoryBank(list);
    } catch (error) {
      messageApi.error("Không lấy được danh sách danh mục");
    } finally {
      setSpinning(false);
    }
  };

  useEffect(() => {
    if (user) {
      callApiGetCategoryBank();
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
      await deleteCategoryBank(record.id);
      messageApi.success("Xóa danh mục thành công!");
      callApiGetCategoryBank();
    } catch (error) {
      messageApi.error("Xóa danh mục thất bại!");
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
          await updateCategoryBank({ ...dataApi, id: editingRecord.id });
          messageApi.success("Cập nhật danh mục thành công!");
        } else {
          await addCategoryBank(dataApi);
          messageApi.success("Thêm danh mục thành công!");
        }
        handleCancel();
        callApiGetCategoryBank();
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
      <div className="max-w-2xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
                Quay lại
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 text-center sm:text-left">Quản lý danh mục</h1>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
                Thêm danh mục
            </Button>
        </header>

        <Spin spinning={spinning}>
            <div className="bg-white p-4 rounded-lg shadow-sm">
                <List
                    itemLayout="horizontal"
                    dataSource={categoryBank}
                    renderItem={(item) => (
                        <List.Item
                            actions={[
                                <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(item)} />,
                                <Popconfirm
                                    title="Bạn có chắc chắn muốn xóa?"
                                    onConfirm={() => onDelete(item)}
                                    okText="Có"
                                    cancelText="Không"
                                >
                                    <Button type="text" danger icon={<DeleteOutlined />} />
                                </Popconfirm>,
                            ]}
                        >
                            <List.Item.Meta
                                title={<span className="font-semibold">{item.nameCategory}</span>}
                                description={<Tag color={item.type === 'income' ? 'green' : 'red'}>{item.type === 'income' ? 'Thu nhập' : 'Chi phí'}</Tag>}
                            />
                        </List.Item>
                    )}
                />
            </div>
        </Spin>
      </div>

      <Modal
        title={isEdit ? "Cập nhật danh mục" : "Thêm danh mục"}
        open={isModalVisible}
        onCancel={handleCancel}
        onOk={handleOk}
        okText={isEdit ? "Cập nhật" : "Lưu"}
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical" name="category_form" initialValues={{ type: 'expense' }}>
          <Form.Item
            name="nameCategory"
            label="Tên danh mục"
            rules={[{ required: true, message: "Vui lòng nhập tên danh mục!" }]}
          >
            <Input placeholder="Ví dụ: Ăn uống, Lương..." />
          </Form.Item>
          <Form.Item
            name="type"
            label="Loại danh mục"
            rules={[{ required: true, message: "Vui lòng chọn loại danh mục!" }]}
          >
            <Select>
              <Select.Option value="expense">Chi phí</Select.Option>
              <Select.Option value="income">Thu nhập</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoryBank;