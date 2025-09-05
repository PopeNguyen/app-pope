import { db } from "@/firebase";
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
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
} from "antd";
import { useEffect, useState } from "react";

const CategoryBank = () => {
  const [isModalAddAccount, setIsModalAddAccount] = useState<boolean>(false);
  const [isModalCategoryBank, setIsModalCategoryBank] = useState<boolean>(false);
  const [spinning, setSpinning] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [dataForm, setDataForm] = useState<any>("");
  const [categoryBank, setCategoryBank] = useState<any>([]);
  const { user, loading, isAuthenticated } = useAuth();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const columns = [
    {
      title: "Tên danh mục",
      dataIndex: "nameCategory",
      key: "nameCategory",
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: any) => (
        <Space>
          <Button onClick={() => onEdit(record)}>Sửa</Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa?"
            onConfirm={() => {
              onDelete(record);
              message.success("Đã xóa thành công");
            }}
            okText="Có"
            cancelText="Không"
          >
            <Button danger>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const onEdit = (record: any) => {
    setDataForm(record);
    setIsEdit(true);
    setIsModalAddAccount(true);
  };

  const onDelete = async (record: any) => {
    setSpinning(true);
    try {
      await deleteCategoryBank(record?.id);
      messageApi.success("Xóa danh mục thành công!");
      callApiGetCategoryBank();
    } catch (error) {
      messageApi.error("Xóa danh mục thất bại!");
    } finally {
      setSpinning(false);
    }
  };

  const cancelForm = () => {
    setIsModalAddAccount(false);
    form.resetFields();
  };

  const handleOk = () => {
    form.validateFields().then(async (values) => {
      if (!user) return;
      var dataApi = {
        ...values,
        uid: user.uid,
      };
      setSpinning(true);
      try {
        if (isEdit) {
          dataApi.id = dataForm.id;
          await updateCategoryBank(dataApi);
          messageApi.success("Sửa danh mục thành công!");
          setIsEdit(false);
        } else {
          await addCategoryBank(dataApi);
          messageApi.success("Thêm danh mục thành công!");
        }
        setIsModalAddAccount(false);
        callApiGetCategoryBank();
      } catch (error) {
        messageApi.error("Thao tác thất bại!");
      } finally {
        setSpinning(false);
      }
    });
  };

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
    form.setFieldsValue(dataForm);
  }, [dataForm]);

  useEffect(() => {
    callApiGetCategoryBank();
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
      <h2>Quản lý danh mục</h2>
      <Button
        onClick={() => {
          setIsModalAddAccount(true);
        }}
      >
        Thêm danh mục
      </Button>
      <Table
        columns={columns}
        dataSource={categoryBank}
        rowKey={(record: any) => record?.id} // hoặc record.id nếu có id
        pagination={false}
      />
      <Modal
        title="Thêm danh mục"
        open={isModalAddAccount}
        onCancel={cancelForm}
        onOk={handleOk}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form
          layout="vertical"
          form={form}
          initialValues={{
            nameCategory: "",
          }}
        >
          <Form.Item
            label="Tên danh mục"
            name="nameCategory"
            rules={[{ required: true, message: "Vui lòng nhập tên danh mục" }]}
          >
            <Input placeholder="Nhập danh mục..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoryBank;
