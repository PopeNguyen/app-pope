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
  Select,
  Tabs
} from "antd";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ArrowLeftOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  AppstoreOutlined
} from "@ant-design/icons";
import FullScreenLoader from '@/components/FullScreenLoader';

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
  const [activeTab, setActiveTab] = useState('expense');

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

  // Phân loại dữ liệu
  const expenseList = useMemo(() => categoryBank.filter(item => item.type === 'expense'), [categoryBank]);
  const incomeList = useMemo(() => categoryBank.filter(item => item.type === 'income'), [categoryBank]);

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

  // Hàm render chung cho danh sách
  const renderList = (data: any[], type: string) => (
    <List
      itemLayout="horizontal"
      dataSource={data}
      locale={{ emptyText: 'Chưa có danh mục nào' }}
      renderItem={(item) => (
        <List.Item
          className="bg-white rounded-lg shadow-sm mb-3 border border-gray-100 py-4 px-5 transition-all active:bg-gray-50 flex items-center"
          actions={[
            <Button 
                type="text" 
                size="large" 
                className="text-gray-400 hover:text-blue-600 flex items-center justify-center" 
                icon={<EditOutlined style={{ fontSize: '20px' }} />} 
                onClick={() => onEdit(item)} 
                key="edit" 
            />,
            <Popconfirm
              title="Xóa mục này?"
              onConfirm={() => onDelete(item)}
              okText="Xóa"
              cancelText="Hủy"
              key="delete"
              placement="topRight"
            >
              <Button 
                type="text" 
                size="large" 
                danger 
                className="flex items-center justify-center opacity-80 hover:opacity-100"
                icon={<DeleteOutlined style={{ fontSize: '20px' }} />} 
              />
            </Popconfirm>,
          ]}
        >
          <List.Item.Meta
            // Đã xóa avatar
            title={
                <div className="flex flex-col justify-center h-10">
                    <span className={`font-bold text-lg leading-tight ${type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {item.nameCategory}
                    </span>
                </div>
            }
          />
        </List.Item>
      )}
    />
  );

  const items = [
    {
      key: 'expense',
      label: (
        <span className="flex items-center gap-2 px-1 text-base">
          <ArrowDownOutlined /> Chi phí
        </span>
      ),
      children: renderList(expenseList, 'expense'),
    },
    {
      key: 'income',
      label: (
        <span className="flex items-center gap-2 px-1 text-base">
          <ArrowUpOutlined /> Thu nhập
        </span>
      ),
      children: renderList(incomeList, 'income'),
    },
  ];

  if (!isAuthenticated) {
    return <p className="text-center mt-4">Vui lòng đăng nhập để sử dụng chức năng này.</p>;
  }

  return (
    <div className="p-3 md:p-6 bg-gray-50 min-h-screen">
      {contextHolder}
      <FullScreenLoader spinning={loading || spinning} />
      
      <div className="w-full">
        {/* Header */}
        <header className="flex justify-between items-center mb-6 sticky top-0 bg-gray-50 z-10 py-2">
            <Button type="text" size="large" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} className="flex items-center text-gray-600">
            </Button>
            
            <h1 className="text-xl font-bold text-gray-800 m-0 absolute left-1/2 transform -translate-x-1/2">
                Danh mục
            </h1>
            
            <Button 
                type="primary" 
                shape="circle" 
                icon={<PlusOutlined />} 
                size="large"
                className="shadow-md"
                onClick={() => {
                    form.setFieldValue('type', activeTab);
                    setIsModalVisible(true);
                }}
            />
        </header>

        {/* Tabs Content */}
        <div className="category-tabs">
            <Tabs 
                defaultActiveKey="expense" 
                activeKey={activeTab}
                onChange={setActiveTab}
                items={items} 
                centered
                size="large"
                className="bg-transparent"
                tabBarStyle={{ marginBottom: 16, borderBottom: 'none' }}
            />
        </div>
      </div>

      <Modal
        title={isEdit ? "Cập nhật danh mục" : "Thêm danh mục"}
        open={isModalVisible}
        onCancel={handleCancel}
        onOk={handleOk}
        okText={isEdit ? "Cập nhật" : "Lưu"}
        cancelText="Hủy"
        destroyOnClose
        centered
        style={{ top: 20 }}
      >
        <Form form={form} layout="vertical" name="category_form" initialValues={{ type: activeTab }}>
          <Form.Item
            name="nameCategory"
            label="Tên danh mục"
            rules={[{ required: true, message: "Vui lòng nhập tên danh mục!" }]}
          >
            <Input prefix={<AppstoreOutlined className="text-gray-400" />} placeholder="Ví dụ: Ăn uống, Lương..." size="large" />
          </Form.Item>
          <Form.Item
            name="type"
            label="Loại danh mục"
            rules={[{ required: true, message: "Vui lòng chọn loại danh mục!" }]}
          >
            <Select size="large">
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