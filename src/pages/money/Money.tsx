import { useAuth } from "@/hooks/useAuth";
import {
  addListTransaction,
  deleteListTransaction,
  getListBank,
  getListTransaction,
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
  Spin,
  Table,
  Radio,
  Row,
  Col,
  Statistic,
  Card,
  Popconfirm,
  Tag,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { getCategoryBank } from "@/services/categoryBankService";
import { Timestamp } from "firebase/firestore";
import { PlusOutlined, EditOutlined, DeleteOutlined, DollarCircleOutlined, ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";

const { RangePicker } = DatePicker;

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
        date: Timestamp.fromDate(values.date.toDate()),
        uid: user.uid,
      };
      setSpinning(true);
      try {
        if (isEdit && editingRecord) {
          await updateListTransaction({ ...dataApi, id: editingRecord.id });
          messageApi.success("Cập nhật giao dịch thành công!");
        } else {
          await addListTransaction(dataApi);
          messageApi.success("Thêm giao dịch thành công!");
        }
        handleCancel();
        callApiGetListTransaction();
      } catch (error) {
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
    setSpinning(true);
    try {
      await deleteListTransaction(record.id);
      messageApi.success("Xóa giao dịch thành công!");
      callApiGetListTransaction();
    } catch (error) {
      messageApi.error("Xóa giao dịch thất bại!");
    } finally {
      setSpinning(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Spin size="large" /></div>;
  }
  if (!isAuthenticated) {
    return <p className="text-center mt-4">Vui lòng đăng nhập để sử dụng chức năng này.</p>;
  }

  const columns = [
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
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
      render: (_: any, record: any) => (
        <div className="flex gap-2">
          <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(record)} />
          <Popconfirm title="Bạn có chắc chắn muốn xóa?" onConfirm={() => onDelete(record)} okText="Có" cancelText="Không">
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      {contextHolder}
      <Spin spinning={spinning} fullscreen={spinning}>
        <div className="max-w-7xl mx-auto">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Bảng điều khiển tài chính</h1>
            <div className="flex gap-2 flex-wrap">
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
                Thêm giao dịch
              </Button>
              <Button onClick={() => navigate(`/app-pope/account`)}>Quản lý tài khoản</Button>
              <Button onClick={() => navigate(`/app-pope/category-bank`)}>Quản lý danh mục</Button>
            </div>
          </header>

          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} md={12} lg={8}><Card><Statistic title="Tổng thu nhập" value={totalIncome} precision={0} prefix={<ArrowUpOutlined />} valueStyle={{ color: '#3f8600' }} suffix="VND" formatter={(value) => value.toLocaleString('vi-VN')} /></Card></Col>
            <Col xs={24} md={12} lg={8}><Card><Statistic title="Tổng chi phí" value={totalExpense} precision={0} prefix={<ArrowDownOutlined />} valueStyle={{ color: '#cf1322' }} suffix="VND" formatter={(value) => value.toLocaleString('vi-VN')} /></Card></Col>
            <Col xs={24} md={12} lg={8}><Card><Statistic title="Lợi nhuận ròng" value={netIncome} precision={0} prefix={<DollarCircleOutlined />} valueStyle={{ color: netIncome >= 0 ? '#3f8600' : '#cf1322' }} suffix="VND" formatter={(value) => value.toLocaleString('vi-VN')} /></Card></Col>
          </Row>

          <Card>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <Radio.Group value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                        <Radio.Button value="all">Tất cả</Radio.Button>
                        <Radio.Button value="income">Thu nhập</Radio.Button>
                        <Radio.Button value="expense">Chi phí</Radio.Button>
                    </Radio.Group>
                    <Radio.Group value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                        <Radio.Button value="date">Ngày</Radio.Button>
                        <Radio.Button value="month">Tháng</Radio.Button>
                        <Radio.Button value="range">Khoảng thời gian</Radio.Button>
                    </Radio.Group>
                </div>
              <div className="flex gap-2 flex-wrap">
                {filterType === 'date' && <DatePicker value={selectedDate} onChange={(date) => setSelectedDate(date)} />}
                {filterType === 'month' && <DatePicker picker="month" value={selectedMonth} onChange={(date) => setSelectedMonth(date)} />}
                {filterType === 'range' && <RangePicker value={dateRange} onChange={(dates) => setDateRange(dates)} />}
              </div>
            </div>
            <Table columns={columns} dataSource={filteredTransactions} rowKey="id" size="small" bordered
              scroll={{ x: 'max-content' }}
              expandable={{
                expandedRowRender: record => <p style={{ margin: 0 }}><b>Ghi chú:</b> {record.note || 'Không có'}</p>,
              }}
            />
          </Card>
        </div>
      </Spin>

      <Modal
        title={isEdit ? "Cập nhật giao dịch" : "Thêm giao dịch"}
        open={isModalVisible}
        onCancel={handleCancel}
        onOk={handleOk}
        okText={isEdit ? "Cập nhật" : "Lưu"}
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical" name="transaction_form" initialValues={{ type: 'expense', date: dayjs() }}>
          <Form.Item name="type" label="Loại giao dịch" rules={[{ required: true }]}>
            <Select placeholder="Chọn loại giao dịch">
              <Select.Option value="expense">Chi phí</Select.Option>
              <Select.Option value="income">Thu nhập</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="amount" label="Số tiền" rules={[{ required: true }]}>
            <InputNumber className="w-full" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} parser={(value) => value!.replace(/\$\s?|(,*)/g, "")} />
          </Form.Item>
          <Form.Item name="nameCategory" label="Danh mục" rules={[{ required: true }]}>
            <Select placeholder="Chọn danh mục">
              {listCategory.filter(c => c.type === form.getFieldValue('type')).map((cat: any) => (
                <Select.Option key={cat.id} value={cat.nameCategory}>{cat.nameCategory}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="nameBank" label="Tài khoản" rules={[{ required: true }]}>
            <Select placeholder="Chọn tài khoản">
              {listBank.map((bank: any) => (
                <Select.Option key={bank.id} value={bank.nameBank}>{bank.nameBank}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="date" label="Ngày giao dịch" rules={[{ required: true }]}>
            <DatePicker format="DD/MM/YYYY" className="w-full" />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={2} placeholder="Nhập ghi chú..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Money;
