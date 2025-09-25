import { useEffect, useState } from "react";
import { Button, Modal, Input, message, List, Card, Spin, Popconfirm } from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getMatches, addMatch, deleteMatch } from "@/services/casinoService";
import { PlusOutlined, DeleteOutlined, RightOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

export default function Casino() {
  const [messageApi, contextHolder] = message.useMessage();
  const [matches, setMatches] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nameMatch, setNameMatch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = getMatches(user.uid, (matches) => {
      setMatches(matches);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleAddMatch = async () => {
    const name = nameMatch.trim();
    if (!name) {
      messageApi.warning("Vui lòng nhập tên ván.");
      return;
    }

    try {
      await addMatch({ name, uid: user!.uid });
      setNameMatch("");
      setIsModalOpen(false);
      messageApi.success("Thêm ván thành công!");
    } catch (error) {
      console.error(error);
      messageApi.error("Thêm ván thất bại.");
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    try {
        await deleteMatch(matchId);
        messageApi.success("Xóa ván thành công!");
    } catch (error) {
        messageApi.error("Xóa ván thất bại.");
    }
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
        {contextHolder}
        <div className="max-w-4xl mx-auto">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Sổ đỏ đen</h1>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
                    Thêm Ván
                </Button>
            </header>

            <Spin spinning={loading}>
                <List
                    grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 3 }}
                    dataSource={matches}
                    renderItem={(item) => (
                    <List.Item>
                        <Card hoverable onClick={() => navigate(`/app-pope/casino/${item.id}`)}>
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="font-semibold text-lg">{item.name}</div>
                                    <div className="text-sm text-gray-500">
                                        {item.createdAt ? dayjs(item.createdAt.toDate()).format('DD/MM/YYYY') : ''}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Popconfirm
                                        title="Bạn có chắc chắn muốn xóa ván này?"
                                        onConfirm={(e) => {
                                            e?.stopPropagation();
                                            handleDeleteMatch(item.id);
                                        }}
                                        onCancel={(e) => e?.stopPropagation()}
                                        okText="Có"
                                        cancelText="Không"
                                    >
                                        <Button type="text" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
                                    </Popconfirm>
                                    <RightOutlined />
                                </div>
                            </div>
                        </Card>
                    </List.Item>
                    )}
                />
            </Spin>
        </div>

        <Modal
            title="Thêm ván mới"
            open={isModalOpen}
            onCancel={() => setIsModalOpen(false)}
            onOk={handleAddMatch}
            okText="Thêm"
            cancelText="Hủy"
        >
            <Input
            placeholder="Tên ván, ví dụ: Tối ngày 25/09"
            value={nameMatch}
            onChange={(e) => setNameMatch(e.target.value)}
            />
        </Modal>
    </div>
  );
}