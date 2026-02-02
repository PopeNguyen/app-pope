import { useAuth } from "@/hooks/useAuth";
import {
  addListTransaction,
  deleteListTransaction,
  getListBank,
  getListTransaction,
  updateListBank,
  updateListTransaction,
} from "@/services/moneyService";
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Table,
  Radio,
  Row,
  Col,
  Statistic,
  Card,
  Popconfirm,
  Tag,
  List,
  Typography,
  Space
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { getCategoryBank } from "@/services/categoryBankService";
import { Timestamp } from "firebase/firestore";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  WalletOutlined,
  AppstoreOutlined
} from "@ant-design/icons";
import FullScreenLoader from '@/components/FullScreenLoader';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const Money = () => {
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [listBank, setListBank] = useState<any[]>([]);
  const [listCategory, setListCategory] = useState<any[]>([]);
  const [listTransaction, setListTransaction] = useState<any[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [spinning, setSpinning] = useState(false);
  const { user, loading, isAuthenticated } = useAuth();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [filterType, setFilterType] = useState('month');
  const [selectedDate, setSelectedDate] = useState<any>(dayjs());
  const [selectedMonth, setSelectedMonth] = useState<any>(dayjs());
  const [dateRange, setDateRange] = useState<any>([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [isEdit, setIsEdit] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'income', or 'expense'
  const [transactionType, setTransactionType] = useState('expense');


  const callApiGetListTransaction = async () => {
    if (!user) return;
    setSpinning(true);
    try {
      const [transactions, banks, categories] = await Promise.all([
        getListTransaction(user.uid),
        getListBank(user.uid),
        getCategoryBank(user.uid),
      ]);
      setListTransaction(transactions);
      setFilteredTransactions(transactions);
      setListBank(banks);
      setListCategory(categories);
    } catch (error) {
      messageApi.error("Đã có lỗi xảy ra khi tải dữ liệu.");
    } finally {
      setSpinning(false);
    }
  };

  useEffect(() => {
    if (user) {
      callApiGetListTransaction();
    }
  }, [user]);

  const handleFilter = () => {
    const dateFilterFunction = (item: any) => {
      const itemDate = item.date && typeof item.date.toDate === 'function' ? dayjs(item.date.toDate()) : dayjs(item.date);
      if (filterType === 'date') {
        return itemDate.isSame(selectedDate, 'day');
      }
      if (filterType === 'month') {
        return itemDate.isSame(selectedMonth, 'month');
      }
      if (filterType === 'range' && dateRange && dateRange[0] && dateRange[1]) {
        return itemDate.isAfter(dateRange[0].startOf('day')) && itemDate.isBefore(dateRange[1].endOf('day'));
      }
      return false;
    };

    const combinedFilterFunction = (item: any) => {
      const dateMatch = dateFilterFunction(item);
      const typeMatch = typeFilter === 'all' || item.type === typeFilter;
      return dateMatch && typeMatch;
    }

    const filtered = listTransaction.filter(combinedFilterFunction);
    setFilteredTransactions(filtered);
  };

  useEffect(() => {
    handleFilter();
  }, [listTransaction, selectedDate, selectedMonth, dateRange, filterType, typeFilter]);

  const { totalIncome, totalExpense, netIncome } = useMemo(() => {
    return filteredTransactions.reduce((acc, cur) => {
      if (cur.type === 'income') {
        acc.totalIncome += cur.amount;
      } else {
        acc.totalExpense += cur.amount;
      }
      acc.netIncome = acc.totalIncome - acc.totalExpense;
      return acc;
    }, { totalIncome: 0, totalExpense: 0, netIncome: 0 });
  }, [filteredTransactions]);

  const handleOk = () => {
    form.validateFields().then(async (values) => {
      if (!user) return;

      const dataApi = {
        ...values,
        note: values.note || null,
        date: Timestamp.fromDate(values.date.toDate()),
        uid: user.uid,
      };

      setSpinning(true);
      try {
        if (isEdit && editingRecord) {
          const newAmount = Number(values.amount) || 0;
          const originalBank = listBank.find(b => b.nameBank === editingRecord.nameBank);
          const newBank = listBank.find(b => b.nameBank === values.nameBank);

          if (originalBank && newBank) {
            const oldAmount = Number(editingRecord.amount) || 0;
            const oldType = editingRecord.type;
            const currentBankAmount = Number(originalBank.amount) || 0;

            if (originalBank.id === newBank.id) {
              const oldNumericAmount = oldType === 'income' ? oldAmount : -oldAmount;
              const newNumericAmount = values.type === 'income' ? newAmount : -newAmount;
              const adjustment = newNumericAmount - oldNumericAmount;
              const finalBalance = currentBankAmount + adjustment;
              await updateListBank({ ...originalBank, amount: finalBalance });
            } else {
              const newBankAmount = Number(newBank.amount) || 0;
              // Revert from original bank
              const originalBankBalance = currentBankAmount + (oldType === 'income' ? -oldAmount : oldAmount);
              await updateListBank({ ...originalBank, amount: originalBankBalance });

              // Apply to new bank
              const newBankBalance = newBankAmount + (values.type === 'income' ? newAmount : -newAmount);
              await updateListBank({ ...newBank, amount: newBankBalance });
            }
          }

          await updateListTransaction({ ...dataApi, id: editingRecord.id });
          messageApi.success("Cập nhật giao dịch thành công!");

        } else {
          const amount = Number(values.amount) || 0;
          await addListTransaction(dataApi);
          const selectedBank = listBank.find(b => b.nameBank === values.nameBank);

          if (selectedBank) {
            const currentBalance = Number(selectedBank.amount) || 0;
            const newBalance = values.type === 'income'
              ? currentBalance + amount
              : currentBalance - amount;
            await updateListBank({ ...selectedBank, amount: newBalance });
          }
          messageApi.success("Thêm giao dịch thành công!");
        }
        handleCancel();
        callApiGetListTransaction();
      } catch (error) {
        console.error("Transaction failed: ", error);
        messageApi.error("Thao tác thất bại!");
      } finally {
        setSpinning(false);
      }
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingRecord(null);
    setIsEdit(false);
  };

  const onEdit = (record: any) => {
    setIsEdit(true);
    setEditingRecord(record);
    form.setFieldsValue({ ...record, date: dayjs(record.date.toDate()) });
    setIsModalVisible(true);
  };

  const onDelete = async (record: any) => {
    if (!user) return;
    setSpinning(true);
    try {
      const selectedBank = listBank.find(b => b.nameBank === record.nameBank);
      if (selectedBank) {
        const currentBalance = Number(selectedBank.amount) || 0;
        const transactionAmount = Number(record.amount) || 0;
        const newBalance = record.type === 'income'
          ? currentBalance - transactionAmount
          : currentBalance + transactionAmount;
        await updateListBank({ ...selectedBank, amount: newBalance });
      }

      await deleteListTransaction(record.id);
      messageApi.success("Xóa giao dịch thành công!");
      callApiGetListTransaction();
    } catch (error) {
      console.error("Delete failed: ", error);
      messageApi.error("Xóa giao dịch thất bại!");
    } finally {
      setSpinning(false);
    }
  };

  const filteredCategories = useMemo(() => {
    return listCategory.filter(c => c.type === transactionType);
  }, [listCategory, transactionType]);

  if (!isAuthenticated) {
    return <p className="text-center mt-4">Vui lòng đăng nhập để sử dụng chức năng này.</p>;
  }

  // --- Render Functions for List (Mobile) ---
  const renderMobileItem = (item: any) => {
    const dateStr = (item.date && typeof item.date.toDate === 'function' ? dayjs(item.date.toDate()) : dayjs(item.date)).format('DD/MM/YYYY');
    const isIncome = item.type === 'income';
    
    return (
      <List.Item className="bg-white rounded-lg shadow-sm mb-3 border border-gray-100 p-4 block">
        <div className="flex justify-between items-start mb-2">
           <div>
              <div className="font-bold text-gray-800 text-base">{item.nameCategory}</div>
              <div className="text-xs text-gray-500 mt-1">{dateStr} • {item.nameBank}</div>
           </div>
           <div className={`font-bold text-lg ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
              {isIncome ? '+' : '-'}{Math.abs(item.amount).toLocaleString('vi-VN')}
           </div>
        </div>
        
        {item.note && (
           <div className="bg-gray-50 p-2 rounded text-sm text-gray-600 mb-3 italic">
             "{item.note}"
           </div>
        )}

        <div className="flex justify-end gap-2 border-t pt-3 mt-2 border-dashed border-gray-200">
           <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(item)}>Sửa</Button>
           <Popconfirm title="Xóa giao dịch này?" onConfirm={() => onDelete(item)} okText="Xóa" cancelText="Hủy">
             <Button size="small" danger icon={<DeleteOutlined />}>Xóa</Button>
           </Popconfirm>
        </div>
      </List.Item>
    );
  };

  // --- Columns for Table (Desktop) ---
  const columns = [
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => <Tag color={type === 'income' ? 'green' : 'red'}>{type === 'income' ? 'Thu nhập' : 'Chi phí'}</Tag>
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (text: number, record: any) => <span className={`font-semibold ${record.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>{record.type === 'income' ? '+' : '-'}{Math.abs(text).toLocaleString('vi-VN')} VND</span>,
    },
    {
      title: 'Danh mục',
      dataIndex: 'nameCategory',
      key: 'nameCategory',
    },
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: any) => (date && typeof date.toDate === 'function' ? dayjs(date.toDate()) : dayjs(date)).format('DD/MM/YYYY'),
    },
    {
      title: 'Tài khoản',
      dataIndex: 'nameBank',
      key: 'nameBank',
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 100,
      render: (_: any, record: any) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(record)} />
          <Popconfirm title="Bạn có chắc chắn muốn xóa?" onConfirm={() => onDelete(record)} okText="Có" cancelText="Không">
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-3 md:p-6 bg-gray-50 min-h-screen pb-24 md:pb-6">
      {contextHolder}
      <FullScreenLoader spinning={loading || spinning} />
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Quản lý tài chính</h1>
            <Text type="secondary" className="text-sm">Theo dõi thu chi hiệu quả</Text>
          </div>
          
          <div className="grid grid-cols-2 md:flex gap-2 w-full md:w-auto">
            <Button className="col-span-2 md:w-auto" type="primary" size="large" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
              Thêm giao dịch
            </Button>
            <Button icon={<WalletOutlined />} onClick={() => navigate(`/app-pope/account`)}>Tài khoản</Button>
            <Button icon={<AppstoreOutlined />} onClick={() => navigate(`/app-pope/category-bank`)}>Danh mục</Button>
          </div>
        </div>

        {/* Statistics Section */}
        <Row gutter={[12, 12]} className="mb-6">
          <Col xs={12} lg={8}>
             <Card bordered={false} className="shadow-sm h-full" bodyStyle={{ padding: '12px' }}>
                <Statistic 
                  title={<span className="text-xs md:text-sm text-gray-500">Thu nhập</span>}
                  value={totalIncome} 
                  precision={0} 
                  prefix={<ArrowUpOutlined className="text-green-500" />} 
                  valueStyle={{ color: '#3f8600', fontSize: '1.25rem', fontWeight: 600 }} 
                  formatter={(value) => value.toLocaleString('vi-VN')} 
                />
             </Card>
          </Col>
          <Col xs={12} lg={8}>
             <Card bordered={false} className="shadow-sm h-full" bodyStyle={{ padding: '12px' }}>
                <Statistic 
                  title={<span className="text-xs md:text-sm text-gray-500">Chi phí</span>}
                  value={totalExpense} 
                  precision={0} 
                  prefix={<ArrowDownOutlined className="text-red-500" />} 
                  valueStyle={{ color: '#cf1322', fontSize: '1.25rem', fontWeight: 600 }} 
                  formatter={(value) => value.toLocaleString('vi-VN')} 
                />
             </Card>
          </Col>
          <Col xs={24} lg={8}>
             <Card bordered={false} className="shadow-sm h-full" bodyStyle={{ padding: '12px' }}>
                <Statistic 
                  title={<span className="text-xs md:text-sm text-gray-500">Lợi nhuận ròng</span>}
                  value={netIncome} 
                  precision={0} 
                  prefix={<DollarCircleOutlined />} 
                  valueStyle={{ color: netIncome >= 0 ? '#3f8600' : '#cf1322', fontSize: '1.25rem', fontWeight: 600 }} 
                  suffix="VND" 
                  formatter={(value) => value.toLocaleString('vi-VN')} 
                />
             </Card>
          </Col>
        </Row>

        {/* Filter & Content Section */}
        <Card className="shadow-sm" bodyStyle={{ padding: '16px' }}>
          {/* Filters */}
          <div className="flex flex-col gap-4 mb-4">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                  {/* Type Filter */}
                  <Radio.Group 
                    value={typeFilter} 
                    onChange={(e) => setTypeFilter(e.target.value)} 
                    buttonStyle="solid"
                    className="w-full md:w-auto flex"
                  >
                      <Radio.Button value="all" className="flex-1 text-center">Tất cả</Radio.Button>
                      <Radio.Button value="income" className="flex-1 text-center">Thu</Radio.Button>
                      <Radio.Button value="expense" className="flex-1 text-center">Chi</Radio.Button>
                  </Radio.Group>

                  {/* Time Filter Type */}
                  <Radio.Group 
                    value={filterType} 
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full md:w-auto flex overflow-x-auto"
                  >
                      <Radio.Button value="date" className="flex-1 text-center whitespace-nowrap">Ngày</Radio.Button>
                      <Radio.Button value="month" className="flex-1 text-center whitespace-nowrap">Tháng</Radio.Button>
                      <Radio.Button value="range" className="flex-1 text-center whitespace-nowrap">Khoảng</Radio.Button>
                  </Radio.Group>
              </div>

              {/* Date Pickers */}
              <div className="w-full">
                {filterType === 'date' && <DatePicker className="w-full" value={selectedDate} onChange={(date) => setSelectedDate(date)} format="DD/MM/YYYY" />}
                {filterType === 'month' && <DatePicker className="w-full" picker="month" value={selectedMonth} onChange={(date) => setSelectedMonth(date)} format="MM/YYYY" />}
                {filterType === 'range' && <RangePicker className="w-full" value={dateRange} onChange={(dates) => setDateRange(dates)} format="DD/MM/YYYY" />}
              </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table 
              columns={columns} 
              dataSource={filteredTransactions} 
              rowKey="id" 
              size="middle" 
              bordered={false}
              pagination={{ pageSize: 10 }}
              expandable={{
                expandedRowRender: record => <p className="m-0 text-gray-500"><b>Ghi chú:</b> {record.note || 'Không có'}</p>,
                rowExpandable: record => !!record.note,
              }}
            />
          </div>

          {/* Mobile List View */}
          <div className="md:hidden">
            <List
              dataSource={filteredTransactions}
              renderItem={renderMobileItem}
              locale={{ emptyText: 'Không có giao dịch nào' }}
              pagination={{
                 onChange: (page) => { console.log(page); },
                 pageSize: 10,
                 simple: true, 
                 align: 'center'
              }}
            />
          </div>
        </Card>
      </div>

      {/* Modal - Made Responsive */}
      <Modal
        title={isEdit ? "Cập nhật giao dịch" : "Thêm giao dịch"}
        open={isModalVisible}
        onCancel={handleCancel}
        onOk={handleOk}
        okText={isEdit ? "Cập nhật" : "Lưu"}
        cancelText="Hủy"
        destroyOnClose
        width={500}
        centered
        style={{ top: 20 }}
      >
        <Form form={form} layout="vertical" name="transaction_form" initialValues={{ type: 'expense', date: dayjs() }}>
          
          <Row gutter={16}>
             <Col span={12}>
                <Form.Item name="type" label="Loại" rules={[{ required: true }]}>
                  <Select onChange={(value) => setTransactionType(value)}>
                    <Select.Option value="expense">Chi phí</Select.Option>
                    <Select.Option value="income">Thu nhập</Select.Option>
                  </Select>
                </Form.Item>
             </Col>
             <Col span={12}>
                <Form.Item name="amount" label="Số tiền" rules={[{ required: true }]}>
                  <InputNumber 
                    className="w-full" 
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} 
                    parser={(value) => value!.replace(/\$\s?|(,*)/g, "")} 
                    placeholder="0"
                  />
                </Form.Item>
             </Col>
          </Row>

          <Form.Item name="nameCategory" label="Danh mục" rules={[{ required: true }]}>
          <Select placeholder="Chọn danh mục" showSearch optionFilterProp="children">
              {filteredCategories.map((cat: any) => (
                <Select.Option key={cat.id} value={cat.nameCategory}>{cat.nameCategory}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name="nameBank" label="Tài khoản nguồn" rules={[{ required: true }]}>
            <Select placeholder="Chọn tài khoản" showSearch optionFilterProp="children">
              {listBank.map((bank: any) => (
                <Select.Option key={bank.id} value={bank.nameBank}>{bank.nameBank}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name="date" label="Thời gian" rules={[{ required: true }]}>
            <DatePicker format="DD/MM/YYYY" className="w-full" />
          </Form.Item>
          
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={3} placeholder="Ví dụ: Ăn sáng, tiền xăng..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Money;