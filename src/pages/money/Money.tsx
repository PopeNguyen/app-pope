import { useAuth } from "@/hooks/useAuth";
import {
  addListTransaction,
  deleteListTransaction,
  getListBank,
  getListTransaction,
  updateListBank,
  updateListTransaction,
  addListTemplate,
  getListTemplate,
  deleteListTemplate,
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
  AppstoreOutlined,
  ThunderboltOutlined,
  CloseCircleFilled,
  UpOutlined,
  DownOutlined,
  FilterOutlined,
  MenuOutlined
} from "@ant-design/icons";
import FullScreenLoader from '@/components/FullScreenLoader';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const Money = () => {
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  const [isTemplateModalVisible, setIsTemplateModalVisible] = useState<boolean>(false);
  const [listTemplate, setListTemplate] = useState<any[]>([]);
  const [templateType, setTemplateType] = useState('expense');

  const [listBank, setListBank] = useState<any[]>([]);
  const [listCategory, setListCategory] = useState<any[]>([]);
  const [listTransaction, setListTransaction] = useState<any[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [showMobileStats, setShowMobileStats] = useState<boolean>(false);
  const [showMobileActions, setShowMobileActions] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const { user, loading, isAuthenticated } = useAuth();

  const [form] = Form.useForm();
  const [templateForm] = Form.useForm();

  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [filterType, setFilterType] = useState('date');
  const [selectedDate, setSelectedDate] = useState<any>(dayjs());
  const [selectedMonth, setSelectedMonth] = useState<any>(dayjs());
  const [dateRange, setDateRange] = useState<any>([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [isEdit, setIsEdit] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [transactionType, setTransactionType] = useState('expense');


  const callApiGetListTransaction = async () => {
    if (!user) return;
    setSpinning(true);
    try {
      const [transactions, banks, categories, templates] = await Promise.all([
        getListTransaction(user.uid),
        getListBank(user.uid),
        getCategoryBank(user.uid),
        getListTemplate(user.uid)
      ]);
      setListTransaction(transactions);
      setFilteredTransactions(transactions);
      setListBank(banks);
      setListCategory(categories);
      setListTemplate(templates);
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
              const originalBankBalance = currentBankAmount + (oldType === 'income' ? -oldAmount : oldAmount);
              await updateListBank({ ...originalBank, amount: originalBankBalance });

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
    setTransactionType(record.type);
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
      messageApi.error("Xóa giao dịch thất bại!");
    } finally {
      setSpinning(false);
    }
  };

  const handleSaveTemplate = () => {
    templateForm.validateFields().then(async (values) => {
      if (!user) return;
      setSpinning(true);
      try {
        await addListTemplate({ ...values, uid: user.uid });
        messageApi.success("Đã tạo mẫu giao dịch mới!");
        setIsTemplateModalVisible(false);
        templateForm.resetFields();

        const templates = await getListTemplate(user.uid);
        setListTemplate(templates);
      } catch (error) {
        messageApi.error("Lỗi khi tạo mẫu");
      } finally {
        setSpinning(false);
      }
    })
  }

  const handleDeleteTemplate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user) return;
    setSpinning(true);
    try {
      await deleteListTemplate(id);
      messageApi.success("Đã xóa mẫu!");
      const templates = await getListTemplate(user.uid);
      setListTemplate(templates);
    } catch (error) {
      messageApi.error("Lỗi xóa mẫu");
    } finally {
      setSpinning(false);
    }
  }

  const applyTemplate = (template: any) => {
    setIsEdit(false);
    setTransactionType(template.type);
    form.setFieldsValue({
      type: template.type,
      amount: template.amount,
      nameCategory: template.nameCategory,
      nameBank: template.nameBank,
      note: template.note,
      date: dayjs()
    });
    setIsModalVisible(true);
  }

  const filteredCategories = useMemo(() => {
    return listCategory.filter(c => c.type === transactionType);
  }, [listCategory, transactionType]);

  const filteredTemplateCategories = useMemo(() => {
    return listCategory.filter(c => c.type === templateType);
  }, [listCategory, templateType]);


  if (!isAuthenticated) {
    return <p className="text-center mt-4">Vui lòng đăng nhập để sử dụng chức năng này.</p>;
  }

  const renderMobileItem = (item: any) => {
    const dateStr = (item.date && typeof item.date.toDate === 'function' ? dayjs(item.date.toDate()) : dayjs(item.date)).format('DD/MM/YYYY');
    const isIncome = item.type === 'income';

    return (
      <List.Item className="bg-white rounded-xl shadow-sm mb-3 border border-gray-100 p-4 block px-2!">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="flex font-bold text-gray-800 text-base items-end">{item.nameCategory} {item.note && <div className="bg-gray-50 rounded text-sm text-gray-600 italic pl-1">/ {item.note}</div>}</div>
            <div className="text-xs text-gray-500 mt-1">{dateStr} • {item.nameBank}</div>
          </div>
          <div className={`font-bold text-lg ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
            {isIncome ? '+' : '-'}{Math.abs(item.amount).toLocaleString('vi-VN')}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(item)}></Button>
          <Popconfirm title="Xóa giao dịch này?" onConfirm={() => onDelete(item)} okText="Xóa" cancelText="Hủy">
            <Button size="small" danger icon={<DeleteOutlined />}></Button>
          </Popconfirm>
        </div>
      </List.Item>
    );
  };

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
    { title: 'Danh mục', dataIndex: 'nameCategory', key: 'nameCategory' },
    { title: 'Ngày', dataIndex: 'date', key: 'date', width: 120, render: (date: any) => (date && typeof date.toDate === 'function' ? dayjs(date.toDate()) : dayjs(date)).format('DD/MM/YYYY') },
    { title: 'Tài khoản', dataIndex: 'nameBank', key: 'nameBank' },
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
    <div className="min-h-screen">
      {contextHolder}
      <FullScreenLoader spinning={loading || spinning} />
      <div className="mx-auto">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Quản lý tài chính</h1>
          </div>

          <div className="flex flex-wrap md:flex-nowrap gap-2 w-full md:w-auto">
            <Button className="flex-1 md:flex-none" type="primary" size="large" icon={<PlusOutlined />} onClick={() => {
              form.resetFields();
              setIsEdit(false);
              setIsModalVisible(true);
            }}>
              Thêm giao dịch
            </Button>
            <Button className="md:hidden flex-none px-4" size="large" icon={<MenuOutlined />} onClick={() => setShowMobileActions(!showMobileActions)} />

            <div className={`${showMobileActions ? 'grid grid-cols-3' : 'hidden'} md:flex gap-2 w-full md:w-auto mt-2 md:mt-0`}>
              <Button className="w-full px-1 text-xs md:text-sm" icon={<WalletOutlined />} onClick={() => navigate(`/app-pope/account`)}>Tài khoản</Button>
              <Button className="w-full px-1 text-xs md:text-sm" icon={<AppstoreOutlined />} onClick={() => navigate(`/app-pope/category-bank`)}>Danh mục</Button>
              <Button className="w-full px-1 text-xs md:text-sm" icon={<ThunderboltOutlined />} onClick={() => navigate(`/app-pope/list-template`)}>Quản lý mẫu</Button>
            </div>
          </div>
        </div>

        <div className="mb-6 overflow-x-auto pb-2 -mx-3 px-3 md:mx-0 md:px-0 no-scrollbar">
          <div className="flex gap-2.5 min-w-max">
            <div
              onClick={() => setIsTemplateModalVisible(true)}
              className="flex flex-col items-center justify-center w-[84px] h-[72px] bg-white border border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 hover:text-blue-500 transition-colors flex-shrink-0 shadow-sm"
            >
              <PlusOutlined className="text-lg mb-0.5" />
              <span className="text-[11px] font-semibold">Tạo mẫu</span>
            </div>

            {listTemplate.map((item) => (
              <div
                key={item.id}
                onClick={() => applyTemplate(item)}
                className={`relative flex flex-col justify-between h-[72px] p-2.5 rounded-xl shadow-sm cursor-pointer border-l-[3px] flex-shrink-0 transition-transform active:scale-95 bg-white
                ${item.type === 'income' ? 'border-green-500' : 'border-red-500'}
            `}
              >
                <div className="absolute top-1.5 right-1.5">
                  <Popconfirm title="Xóa mẫu này?" onConfirm={(e: any) => handleDeleteTemplate(e, item.id)} okText="Xóa" cancelText="Hủy">
                    <CloseCircleFilled
                      className="text-gray-200 hover:text-red-500 text-base transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>
                </div>

                <div className="font-semibold text-gray-800 truncate pr-5 text-xs" title={item.nameTemplate}>
                  {item.nameTemplate}
                </div>
                <div>
                  <div className={`font-bold text-sm leading-none mb-1 ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {parseInt(item.amount).toLocaleString('vi-VN')}
                  </div>
                  <div className="text-[10px] text-gray-500 truncate leading-none">{item.nameCategory}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:hidden mb-4 flex items-center justify-between">
          <span className="font-semibold text-gray-600">Tổng quan tài chính</span>
          <Button
            type="text"
            icon={showMobileStats ? <UpOutlined /> : <DownOutlined />}
            onClick={() => setShowMobileStats(!showMobileStats)}
          >
            {showMobileStats ? 'Thu gọn' : 'Xem chi tiết'}
          </Button>
        </div>

        <Row gutter={[12, 12]} className={`mb-6 ${showMobileStats ? 'flex' : 'hidden'} lg:flex`}>
          <Col xs={12} lg={8}>
            <Card bordered={false} className="shadow-sm h-full" bodyStyle={{ padding: '12px' }}>
              <Statistic title={<span className="text-xs md:text-sm text-gray-500">Thu nhập</span>} value={totalIncome} precision={0} prefix={<ArrowUpOutlined className="text-green-500" />} valueStyle={{ color: '#3f8600', fontSize: '1.25rem', fontWeight: 600 }} formatter={(value) => value.toLocaleString('vi-VN')} />
            </Card>
          </Col>
          <Col xs={12} lg={8}>
            <Card bordered={false} className="shadow-sm h-full" bodyStyle={{ padding: '12px' }}>
              <Statistic title={<span className="text-xs md:text-sm text-gray-500">Chi phí</span>} value={totalExpense} precision={0} prefix={<ArrowDownOutlined className="text-red-500" />} valueStyle={{ color: '#cf1322', fontSize: '1.25rem', fontWeight: 600 }} formatter={(value) => value.toLocaleString('vi-VN')} />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card bordered={false} className="shadow-sm h-full" bodyStyle={{ padding: '12px' }}>
              <Statistic title={<span className="text-xs md:text-sm text-gray-500">Lợi nhuận ròng</span>} value={netIncome} precision={0} prefix={<DollarCircleOutlined />} valueStyle={{ color: netIncome >= 0 ? '#3f8600' : '#cf1322', fontSize: '1.25rem', fontWeight: 600 }} suffix="VND" formatter={(value) => value.toLocaleString('vi-VN')} />
            </Card>
          </Col>
        </Row>

        <Card className="shadow-sm rounded-xl" bodyStyle={{ padding: '16px' }}>

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800 m-0">Lịch sử giao dịch</h3>
            <Button
              type={showFilters ? "primary" : "default"}
              icon={<FilterOutlined />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Bộ lọc
            </Button>
          </div>

          <div className={`flex-col gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100 ${showFilters ? 'flex' : 'hidden'}`}>
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <Radio.Group value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} buttonStyle="solid" className="w-full md:w-auto flex">
                <Radio.Button value="all" className="flex-1 text-center">Tất cả</Radio.Button>
                <Radio.Button value="income" className="flex-1 text-center">Thu</Radio.Button>
                <Radio.Button value="expense" className="flex-1 text-center">Chi</Radio.Button>
              </Radio.Group>
              <Radio.Group value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full md:w-auto flex overflow-x-auto">
                <Radio.Button value="date" className="flex-1 text-center whitespace-nowrap">Ngày</Radio.Button>
                <Radio.Button value="month" className="flex-1 text-center whitespace-nowrap">Tháng</Radio.Button>
                <Radio.Button value="range" className="flex-1 text-center whitespace-nowrap">Khoảng</Radio.Button>
              </Radio.Group>
            </div>
            <div className="w-full">
              {filterType === 'date' && <DatePicker className="w-full" value={selectedDate} onChange={(date) => setSelectedDate(date)} format="DD/MM/YYYY" />}
              {filterType === 'month' && <DatePicker className="w-full" picker="month" value={selectedMonth} onChange={(date) => setSelectedMonth(date)} format="MM/YYYY" />}
              {filterType === 'range' && <RangePicker className="w-full" value={dateRange} onChange={(dates) => setDateRange(dates)} format="DD/MM/YYYY" />}
            </div>
          </div>

          <div className="hidden md:block">
            <Table columns={columns} dataSource={filteredTransactions} rowKey="id" size="middle" bordered={false} pagination={{ pageSize: 10 }} expandable={{ expandedRowRender: record => <p className="m-0 text-gray-500"><b>Ghi chú:</b> {record.note || 'Không có'}</p>, rowExpandable: record => !!record.note }} />
          </div>

          <div className="md:hidden">
            <List dataSource={filteredTransactions} renderItem={renderMobileItem} locale={{ emptyText: 'Không có giao dịch nào' }} pagination={{ onChange: (page) => { }, pageSize: 10, simple: true, align: 'center' }} />
          </div>
        </Card>
      </div>

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
                <InputNumber className="w-full!" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} parser={(value) => value!.replace(/\$\s?|(,*)/g, "")} placeholder="0" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="nameCategory" label="Danh mục" rules={[{ required: true }]}>
            <Select placeholder="Chọn danh mục" showSearch optionFilterProp="children">
              {filteredCategories.map((cat: any) => (<Select.Option key={cat.id} value={cat.nameCategory}>{cat.nameCategory}</Select.Option>))}
            </Select>
          </Form.Item>
          <Form.Item name="nameBank" label="Tài khoản nguồn" rules={[{ required: true }]}>
            <Select placeholder="Chọn tài khoản" showSearch optionFilterProp="children">
              {listBank.map((bank: any) => (<Select.Option key={bank.id} value={bank.nameBank}>{bank.nameBank}</Select.Option>))}
            </Select>
          </Form.Item>
          <Form.Item name="date" label="Thời gian" rules={[{ required: true }]}>
            <DatePicker format="DD/MM/YYYY" className="w-full" />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={2} placeholder="Ví dụ: Ăn sáng, tiền xăng..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Tạo mẫu giao dịch mới"
        open={isTemplateModalVisible}
        onCancel={() => setIsTemplateModalVisible(false)}
        onOk={handleSaveTemplate}
        okText="Lưu mẫu"
        cancelText="Hủy"
        destroyOnClose
        centered
        width={500}
      >
        <Form form={templateForm} layout="vertical" initialValues={{ type: 'expense' }}>
          <Form.Item name="nameTemplate" label="Tên mẫu (để gợi nhớ)" rules={[{ required: true, message: 'Nhập tên mẫu!' }]}>
            <Input prefix={<ThunderboltOutlined />} placeholder="Ví dụ: Cà phê sáng, Tiền nhà..." />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="Loại">
                <Select onChange={(val) => setTemplateType(val)}>
                  <Select.Option value="expense">Chi phí</Select.Option>
                  <Select.Option value="income">Thu nhập</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="amount" label="Số tiền mặc định" rules={[{ required: true }]}>
                <InputNumber className="w-full!" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} parser={(value) => value!.replace(/\$\s?|(,*)/g, "")} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="nameCategory" label="Danh mục mặc định" rules={[{ required: true }]}>
            <Select placeholder="Chọn danh mục" showSearch optionFilterProp="children">
              {filteredTemplateCategories.map((cat: any) => (<Select.Option key={cat.id} value={cat.nameCategory}>{cat.nameCategory}</Select.Option>))}
            </Select>
          </Form.Item>
          <Form.Item name="nameBank" label="Tài khoản mặc định" rules={[{ required: true }]}>
            <Select placeholder="Chọn tài khoản" showSearch optionFilterProp="children">
              {listBank.map((bank: any) => (<Select.Option key={bank.id} value={bank.nameBank}>{bank.nameBank}</Select.Option>))}
            </Select>
          </Form.Item>
          <Form.Item name="note" label="Ghi chú mặc định">
            <Input placeholder="Nhập ghi chú..." />
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
};

export default Money;