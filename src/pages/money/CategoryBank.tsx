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

  const renderList = (data: any[], type: string) => (
    <List
      itemLayout="horizontal"
      dataSource={data}
      locale={{ emptyText: 'Chưa có danh mục nào' }}
      renderItem={(item) => (
        <List.Item
          className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 mb-4 px-4! transition-all duration-300 flex items-center justify-between"
          actions={[
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-colors"
              onClick={() => onEdit(item)}
              key="edit"
            >
              <EditOutlined className="text-lg" />
            </div>,
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa?"
              onConfirm={() => onDelete(item)}
              okText="Xóa"
              okButtonProps={{ danger: true }}
              cancelText="Hủy"
              key="delete"
              placement="topRight"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-600 cursor-pointer transition-colors">
                <DeleteOutlined className="text-lg" />
              </div>
            </Popconfirm>,
          ]}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 flex-shrink-0 rounded-2xl flex items-center justify-center text-xl font-bold ${
              type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}>
              {item.nameCategory ? item.nameCategory.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="flex flex-col flex-grow truncate">
              <span className="font-bold text-gray-800 text-lg truncate pr-2">
                {item.nameCategory}
              </span>
              <span className={`text-sm font-medium ${type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                {type === 'income' ? '+ Thu nhập' : '- Chi phí'}
              </span>
            </div>
          </div>
        </List.Item>
      )}
    />
  );

  const items = [
    {
      key: 'expense',
      label: (
        <div className="flex items-center gap-2 px-2 py-1 text-base font-medium">
          <ArrowDownOutlined className="text-red-500" /> Chi phí
        </div>
      ),
      children: renderList(expenseList, 'expense'),
    },
    {
      key: 'income',
      label: (
        <div className="flex items-center gap-2 px-2 py-1 text-base font-medium">
          <ArrowUpOutlined className="text-green-500" /> Thu nhập
        </div>
      ),
      children: renderList(incomeList, 'income'),
    },
  ];

  if (!isAuthenticated) {
    return <p className="text-center mt-10 text-gray-500 font-medium">Vui lòng đăng nhập để sử dụng chức năng này.</p>;
  }

  return (
    <div className="min-h-screen">
      {contextHolder}
      <FullScreenLoader spinning={loading || spinning} />
      
      <div className="w-full mx-auto">
        <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 sticky top-4 z-10">
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined className="text-xl" />} 
            onClick={() => navigate(-1)} 
            className="flex items-center justify-center w-10 h-10 text-gray-600 hover:bg-gray-100 rounded-full"
          />
          
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 m-0">
            Danh mục tài chính
          </h1>
          
          <Button 
            type="primary" 
            icon={<PlusOutlined className="text-lg" />} 
            onClick={() => {
              form.setFieldValue('type', activeTab);
              setIsModalVisible(true);
            }}
            className="flex items-center justify-center w-10 h-10 rounded-full shadow-md shadow-blue-200"
          />
        </header>

        <div className="min-h-[60vh]">
          <Tabs 
            defaultActiveKey="expense" 
            activeKey={activeTab}
            onChange={setActiveTab}
            items={items} 
            centered
            size="large"
            tabBarStyle={{ marginBottom: 24, borderBottom: '1px solid #f3f4f6' }}
            indicatorSize={(origin) => origin - 16}
          />
        </div>
      </div>

      <Modal
        title={<span className="text-xl font-bold text-gray-800">{isEdit ? "Cập nhật danh mục" : "Thêm danh mục mới"}</span>}
        open={isModalVisible}
        onCancel={handleCancel}
        onOk={handleOk}
        okText={isEdit ? "Cập nhật" : "Lưu danh mục"}
        cancelText="Hủy bỏ"
        destroyOnClose
        centered
        className="rounded-2xl overflow-hidden"
        okButtonProps={{ size: 'large', className: 'rounded-lg shadow-md' }}
        cancelButtonProps={{ size: 'large', className: 'rounded-lg' }}
      >
        <Form form={form} layout="vertical" name="category_form" initialValues={{ type: activeTab }} className="mt-6">
          <Form.Item
            name="nameCategory"
            label={<span className="font-semibold text-gray-700">Tên danh mục</span>}
            rules={[{ required: true, message: "Vui lòng nhập tên danh mục!" }]}
          >
            <Input 
              prefix={<AppstoreOutlined className="text-gray-400 mr-2" />} 
              placeholder="Ví dụ: Ăn uống, Tiền lương..." 
              size="large" 
              className="rounded-xl px-4 py-2"
            />
          </Form.Item>
          <Form.Item
            name="type"
            label={<span className="font-semibold text-gray-700">Loại giao dịch</span>}
            rules={[{ required: true, message: "Vui lòng chọn loại danh mục!" }]}
            className="mb-2"
          >
            <Select size="large" className="rounded-xl">
              <Select.Option value="expense">
                <div className="flex items-center gap-2 text-red-600 font-medium">
                  <ArrowDownOutlined /> Chi phí
                </div>
              </Select.Option>
              <Select.Option value="income">
                <div className="flex items-center gap-2 text-green-600 font-medium">
                  <ArrowUpOutlined /> Thu nhập
                </div>
              </Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoryBank;