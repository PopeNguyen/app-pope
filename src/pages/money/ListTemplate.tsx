import { useAuth } from "@/hooks/useAuth";
import {
  addListTemplate,
  deleteListTemplate,
  getListTemplate,
  updateListTemplate,
  getListBank,
} from "@/services/moneyService";
import { getCategoryBank } from "@/services/categoryBankService";
import {
  Button,
  Form,
  Input,
  List,
  message,
  Modal,
  Popconfirm,
  Select,
  Tabs,
  InputNumber,
  Row,
  Col
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
  ThunderboltOutlined,
  WalletOutlined,
  AppstoreOutlined
} from "@ant-design/icons";
import FullScreenLoader from '@/components/FullScreenLoader';

const ListTemplate = () => {
  const navigate = useNavigate();
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [spinning, setSpinning] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  
  // Data States
  const [listTemplate, setListTemplate] = useState<any[]>([]);
  const [listBank, setListBank] = useState<any[]>([]);
  const [listCategory, setListCategory] = useState<any[]>([]);
  
  const { user, loading, isAuthenticated } = useAuth();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [activeTab, setActiveTab] = useState('expense');
  
  // State để filter danh mục trong Modal theo loại
  const [formType, setFormType] = useState('expense'); 

  const callApiGetData = async () => {
    if (!user) return;
    setSpinning(true);
    try {
      const [templates, banks, categories] = await Promise.all([
        getListTemplate(user.uid),
        getListBank(user.uid),
        getCategoryBank(user.uid)
      ]);
      setListTemplate(templates);
      setListBank(banks);
      setListCategory(categories);
    } catch (error) {
      messageApi.error("Không lấy được dữ liệu");
    } finally {
      setSpinning(false);
    }
  };

  useEffect(() => {
    if (user) {
      callApiGetData();
    }
  }, [user]);

  // Phân loại template ra 2 list
  const expenseList = useMemo(() => listTemplate.filter(item => item.type === 'expense'), [listTemplate]);
  const incomeList = useMemo(() => listTemplate.filter(item => item.type === 'income'), [listTemplate]);

  // Lọc danh mục trong Modal khi chọn Type
  const filteredCategories = useMemo(() => {
    return listCategory.filter(c => c.type === formType);
  }, [listCategory, formType]);

  const onEdit = (record: any) => {
    setIsEdit(true);
    setEditingRecord(record);
    setFormType(record.type); // Cập nhật state để filter category đúng
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const onDelete = async (record: any) => {
    setSpinning(true);
    try {
      await deleteListTemplate(record.id);
      messageApi.success("Xóa mẫu thành công!");
      // Cập nhật lại list local thay vì gọi API lại toàn bộ để nhanh hơn
      setListTemplate(prev => prev.filter(item => item.id !== record.id));
    } catch (error) {
      messageApi.error("Xóa mẫu thất bại!");
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
          await updateListTemplate({ ...dataApi, id: editingRecord.id });
          messageApi.success("Cập nhật mẫu thành công!");
        } else {
          await addListTemplate(dataApi);
          messageApi.success("Thêm mẫu thành công!");
        }
        handleCancel();
        callApiGetData(); // Reload lại data
      } catch (error) {
        messageApi.error("Thao tác thất bại!");
      } finally {
        setSpinning(false);
      }
    });
  };

  // Hàm render giao diện List Item
  const renderList = (data: any[], type: string) => (
    <List
      itemLayout="horizontal"
      dataSource={data}
      locale={{ emptyText: 'Chưa có mẫu nào' }}
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
              title="Xóa mẫu này?"
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
            title={
                <div className="flex flex-col gap-1">
                    {/* Tên mẫu */}
                    <span className="font-bold text-lg text-gray-800 leading-tight">
                        {item.nameTemplate}
                    </span>
                    
                    {/* Số tiền + Danh mục */}
                    <div className="flex items-center gap-2 text-sm">
                        <span className={`font-bold ${type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {Number(item.amount).toLocaleString('vi-VN')} đ
                        </span>
                        <span className="text-gray-300">|</span>
                        <span className="text-gray-600">{item.nameCategory}</span>
                    </div>

                    {/* Ngân hàng + Ghi chú */}
                    <div className="text-xs text-gray-400 truncate max-w-[200px]">
                        {item.nameBank} {item.note ? `• ${item.note}` : ''}
                    </div>
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
                Mẫu giao dịch
            </h1>
            
            <Button 
                type="primary" 
                shape="circle" 
                icon={<PlusOutlined />} 
                size="large"
                className="shadow-md"
                onClick={() => {
                    form.resetFields();
                    // Set default values
                    form.setFieldsValue({ type: activeTab });
                    setFormType(activeTab);
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
        title={isEdit ? "Cập nhật mẫu" : "Tạo mẫu mới"}
        open={isModalVisible}
        onCancel={handleCancel}
        onOk={handleOk}
        okText={isEdit ? "Cập nhật" : "Lưu"}
        cancelText="Hủy"
        destroyOnClose
        centered
        width={500}
        style={{ top: 20 }}
      >
        <Form form={form} layout="vertical" name="template_form" initialValues={{ type: activeTab }}>
          <Form.Item
            name="nameTemplate"
            label="Tên mẫu (Gợi nhớ)"
            rules={[{ required: true, message: "Ví dụ: Cà phê sáng, Tiền nhà..." }]}
          >
            <Input prefix={<ThunderboltOutlined className="text-gray-400" />} placeholder="Ví dụ: Cà phê sáng..." size="large" />
          </Form.Item>

          <Row gutter={16}>
             <Col span={12}>
                <Form.Item name="type" label="Loại" rules={[{ required: true }]}>
                  <Select size="large" onChange={(val) => setFormType(val)}>
                    <Select.Option value="expense">Chi phí</Select.Option>
                    <Select.Option value="income">Thu nhập</Select.Option>
                  </Select>
                </Form.Item>
             </Col>
             <Col span={12}>
                <Form.Item name="amount" label="Số tiền mặc định" rules={[{ required: true, message: "Nhập số tiền" }]}>
                  <InputNumber 
                    className="w-full" 
                    size="large"
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} 
                    parser={(value) => value!.replace(/\$\s?|(,*)/g, "")} 
                  />
                </Form.Item>
             </Col>
          </Row>

          <Form.Item name="nameCategory" label="Danh mục mặc định" rules={[{ required: true, message: "Chọn danh mục" }]}>
            <Select placeholder="Chọn danh mục" showSearch optionFilterProp="children" size="large">
              {filteredCategories.map((cat: any) => (
                <Select.Option key={cat.id} value={cat.nameCategory}>{cat.nameCategory}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="nameBank" label="Tài khoản mặc định" rules={[{ required: true, message: "Chọn tài khoản" }]}>
            <Select placeholder="Chọn tài khoản" showSearch optionFilterProp="children" size="large">
              {listBank.map((bank: any) => (
                <Select.Option key={bank.id} value={bank.nameBank}>{bank.nameBank}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name="note" label="Ghi chú mặc định">
            <Input.TextArea rows={2} placeholder="Nhập ghi chú..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ListTemplate;