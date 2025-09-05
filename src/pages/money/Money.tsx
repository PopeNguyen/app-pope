import { useAuth } from "@/hooks/useAuth";
import { addListBank, getListBank } from "@/services/moneyService";
import { Button, Form, Input, message, Modal, Table } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Money = () => {
  const [isModalAddAccount, setIsModalAddAccount] = useState<boolean>(false);
  const [listBank, setListBank] = useState<any>([]);
  const { user, loading, isAuthenticated } = useAuth();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const handleOk = () => {
    form.validateFields().then(async (values) => {
      if (!user) return;
      var dataApi = {
        ...values,
        uid: user.uid,
      };
      try {
        await addListBank(dataApi);
        messageApi.success("Thêm tài khoản thành công!");
      } catch (error) {
        messageApi.error("Thêm tài khoản thất bại!");
      }
    });
  };

  const callApiGetListBank = async () => {
    if (!user) return;
    const list = await getListBank(user.uid);
    setListBank(list);
  };

  useEffect(() => {
    callApiGetListBank();
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
            label="Tên tài khoản"
            name="nameBank"
            rules={[{ required: true, message: "Vui lòng nhập tên tài khoản" }]}
          >
            <Input placeholder="Nhập tài khoản..." />
          </Form.Item>

          <Form.Item
            label="Số tiền"
            name="amount"
            rules={[{ required: true, message: "Vui lòng nhập số tiền" }]}
          >
            <Input placeholder="Nhập số tiền..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Money;
