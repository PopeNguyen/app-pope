import { useAuth } from "@/hooks/useAuth";
import {
  addListBank,
  addListTransaction,
  getListBank,
  getListTransaction,
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
} from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { getCategoryBank } from "@/services/categoryBankService";
import { Timestamp } from "firebase/firestore";

const Money = () => {
  const [isModalAddAccount, setIsModalAddAccount] = useState<boolean>(false);
  const [listBank, setListBank] = useState<any>([]);
  const [listCategory, setListCategory] = useState<any>([]);
  const [listTransaction, setListTransaction] = useState<any>([]);
  const [spinning, setSpinning] = useState(false);
  const { user, loading, isAuthenticated } = useAuth();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const handleOk = () => {
    form.validateFields().then(async (values) => {
      if (!user) return;
      var dataApi = {
        ...values,
        date: Timestamp.fromDate(values.date.toDate()),
        uid: user.uid,
      };
      setSpinning(true);
      try {
        await addListTransaction(dataApi);
        messageApi.success("Thêm tài khoản thành công!");
        setIsModalAddAccount(false);
        form.resetFields();
      } catch (error) {
        messageApi.error("Thêm tài khoản thất bại!");
      } finally {
        setSpinning(false);
      }
    });
  };

  const callApiGetListBank = async () => {
    if (!user) return;
    const list = await getListBank(user.uid);
    setListBank(list);
  };

  const callApiGetListCategory = async () => {
    if (!user) return;
    const list = await getCategoryBank(user.uid);
    setListCategory(list);
  };

  const callApiGetListTransaction = async () => {
    if (!user) return;
    const list = await getListTransaction(user.uid);
    setListTransaction(list);
    console.log("list", list);
  };

  useEffect(() => {
    callApiGetListBank();
    callApiGetListCategory();
    callApiGetListTransaction();
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
      <h2>Quản lý dòng tiền</h2>
      <Button
        onClick={() => {
          setIsModalAddAccount(true);
        }}
      >
        Thêm giao dịch
      </Button>
      <Button
        className="!ml-2"
        onClick={() => {
          navigate(`/app-pope/account`);
        }}
      >
        Quản lý tài khoản
      </Button>
      <Button
        className="!ml-2"
        onClick={() => {
          navigate(`/app-pope/category-bank`);
        }}
      >
        Quản lý danh mục
      </Button>
      <div>
        {
          listTransaction?.map((item: any)=>{
            return (
              <div>
                {item?.nameCategory} - {item?.amount}
              </div>
            )
          })
        }
      </div>
      <Modal
        title="Thêm giao dịch"
        open={isModalAddAccount}
        onCancel={() => setIsModalAddAccount(false)}
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
            label="Loại giao dịch"
            name="type"
            initialValue="expense"
            rules={[
              { required: true, message: "Vui lòng chọn loại giao dịch" },
            ]}
          >
            <Select placeholder="Chọn loại giao dịch">
              <Select.Option value="expense">Chi phí</Select.Option>
              <Select.Option value="income">Thu nhập</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Số tiền"
            name="amount"
            rules={[{ required: true, message: "Vui lòng nhập số tiền" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Nhập số tiền..."
              formatter={
                (value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") // Thêm dấu phẩy
              }
              parser={(value) => value!.replace(/\$\s?|(,*)/g, "")} // Bỏ dấu phẩy khi lưu
            />
          </Form.Item>

          <Form.Item
            label="Tên tài khoản"
            name="nameBank"
            rules={[{ required: true, message: "Vui lòng chọn tên tài khoản" }]}
          >
            <Select placeholder="Chọn tài khoản...">
              {listBank?.map((bank: any) => (
                <Select.Option key={bank?.id} value={bank?.nameBank}>
                  {bank?.nameBank}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Tên danh mục"
            name="nameCategory"
            rules={[{ required: true, message: "Vui lòng nhập tên danh mục" }]}
          >
            <Select placeholder="Chọn danh mục...">
              {listCategory?.map((category: any) => (
                <Select.Option
                  key={category?.id}
                  value={category?.nameCategory}
                >
                  {category?.nameCategory}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Ngày giao dịch"
            name="date"
            rules={[
              { required: true, message: "Vui lòng chọn ngày giao dịch" },
            ]}
            initialValue={dayjs()} // mặc định là ngày + giờ hiện tại
          >
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item label="Ghi chú" name="note" initialValue={''}>
            <Input placeholder="Nhập ghi chú..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Money;
