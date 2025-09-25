import { useEffect, useState } from "react";
import { Button, Modal, Input, message } from "antd";
import { useNavigate } from "react-router-dom";
import { db } from "@/firebase";
import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";

const matchRef = collection(db, "matches");

export default function Casino() {
  const [messageApi, contextHolder] = message.useMessage();
  const [matches, setMatches] = useState<any>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nameMatch, setNameMatch] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  // Lấy danh sách ván từ Firestore (realtime)
  useEffect(() => {
    if (!user?.uid) return; // tránh chạy khi uid chưa có

    const q = query(matchRef, where("uid", "==", user?.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const result = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMatches(result);
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
      await addDoc(matchRef, { name, uid: user?.uid });
      setNameMatch("");
      setIsModalOpen(false);
      messageApi.success("Thêm ván thành công!");
    } catch (error) {
      console.error(error);
      messageApi.error("Thêm thất bại.");
    }
  };

  const goTo = (name: any) => {
    navigate(`/app-pope/casino/${name}`);
  };

  return (
    <div style={{ padding: 16 }}>
      {contextHolder}
      <Button type="primary" onClick={() => setIsModalOpen(true)}>
        Thêm Ván
      </Button>

      <div
        className="mt-10"
        style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
      >
        {matches?.map((item: any) => (
          <Button
            key={item?.id}
            type="default"
            onClick={() => goTo(item?.id)}
            className="border border-gray-300 rounded-lg px-4 py-1 bg-white shadow-sm hover:border-blue-500 transition-all"
          >
            {item?.name}
          </Button>
        ))}
      </div>

      <Modal
        title="Thêm ván mới"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleAddMatch}
      >
        <p>Đặt tên theo cú pháp ngày-tháng-năm. VD: 23-6-2025</p>
        <Input
          placeholder="Tên ván mới"
          value={nameMatch}
          onChange={(e) => setNameMatch(e.target.value)}
        />
      </Modal>
    </div>
  );
}
