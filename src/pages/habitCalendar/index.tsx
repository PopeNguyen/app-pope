import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Typography,
  Button,
  Space,
  Statistic,
  Row,
  Col,
  Tag,
  message,
} from "antd";
import {
  CheckCircleFilled,
  PlayCircleFilled,
  ClockCircleOutlined,
  PauseCircleFilled,
  CloseCircleFilled,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/hooks/useAuth";
import { subscribeSessions, updateSession } from "@/services/sessionService";
import type { PhienLamViec, TrangThaiPhien } from "@/services/sessionService";
import { updateTaskDuration } from "@/services/habitTaskService";
import { Timestamp } from "firebase/firestore";
import dayjs from "dayjs";

const { Title, Text } = Typography;

// ============================
// Helpers
// ============================
const formatMinutes = (minutes: number | null | undefined) => {
  if (!minutes) return "0m";
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }
  return `${minutes}m`;
};

const tinhThoiLuong = (batDau: string, ketThuc: string) => {
  const start = dayjs(batDau, "HH:mm");
  const end = dayjs(ketThuc, "HH:mm");
  return end.diff(start, "minute");
};

// ============================
// Components
// ============================
const SessionsBlockSection: React.FC<{ sessions: PhienLamViec[] }> = ({ sessions }) => {
  const [now, setNow] = useState(dayjs());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(dayjs());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const isCurrentSession = (batDau: string, ketThuc: string) => {
    const start = dayjs(batDau, "HH:mm");
    const end = dayjs(ketThuc, "HH:mm");
    const currentMins = now.hour() * 60 + now.minute();
    const startMins = start.hour() * 60 + start.minute();
    const endMins = end.hour() * 60 + end.minute();

    return currentMins >= startMins && currentMins < endMins;
  };

  const handleUpdateStatus = async (e: React.MouseEvent, session: PhienLamViec, newStatus: TrangThaiPhien) => {
    e.stopPropagation(); // Ngăn sự kiện click block bên ngoài
    try {
      await updateSession(session.id, { 
        trangThai: newStatus, 
        thoiGianCapNhat: Timestamp.now() 
      });

      // Nếu hoàn thành, cộng thời gian vào task liên kết
      if (newStatus === "hoan_thanh" && session.taskId) {
        const duration = tinhThoiLuong(session.gioBatDau, session.gioKetThuc);
        await updateTaskDuration(session.taskId, duration);
      }

      message.success("Đã cập nhật trạng thái");
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi cập nhật");
    }
  };

  const renderStatusIcon = (trangThai: PhienLamViec["trangThai"]) => {
    switch (trangThai) {
      case "hoan_thanh": return <CheckCircleFilled className="text-green-500 text-lg" />;
      case "dang_thuc_hien": return <PlayCircleFilled className="text-blue-500 text-lg" />;
      case "tam_dung": return <PauseCircleFilled className="text-yellow-500 text-lg" />;
      case "huy": return <CloseCircleFilled className="text-red-500 text-lg" />;
      default: return <div className="h-4 w-4 rounded-full border-2 border-gray-300 bg-white" />;
    }
  };

  return (
    <Card
      bordered={false}
      className="h-full w-full rounded-3xl border border-gray-200 bg-white shadow-sm"
    >
      <div className="mb-6 flex items-center justify-between">
        <Title level={4} className="!mb-0 !text-black">
          Today Sessions
        </Title>
        <Text className="!text-gray-500 font-medium">
          {now.format("HH:mm")}
        </Text>
      </div>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10">
          <Text type="secondary">Chưa có phiên làm việc nào hôm nay</Text>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sessions.map((session) => {
            const isHighlight = isCurrentSession(session.gioBatDau, session.gioKetThuc);
            const isFinished = session.trangThai === "hoan_thanh" || session.trangThai === "huy";
            const isExpanded = expandedId === session.id;

            return (
              <div
                key={session.id}
                onClick={() => setExpandedId(isExpanded ? null : session.id)}
                className={`cursor-pointer flex flex-col justify-between gap-3 rounded-2xl border-2 p-3 sm:p-4 transition-all duration-300 ${
                  isHighlight
                    ? "border-blue-400 bg-blue-50 shadow-md scale-[1.01]"
                    : "border-gray-100 bg-white hover:border-gray-200"
                }`}
              >
                {/* Dòng thông tin ngang (Icon, Giờ, Tên, Thời lượng) */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  {renderStatusIcon(session.trangThai)}
                  <Text className={`!font-bold ${isHighlight ? "!text-blue-600" : "!text-black"}`}>
                    {session.gioBatDau} - {session.gioKetThuc}
                  </Text>
                  <Text 
                    className={`!font-medium truncate flex-1 min-w-[80px] ${isHighlight ? "!text-blue-800" : "!text-gray-700"}`}
                    title={session.ten}
                  >
                    {session.ten}
                  </Text>
                  <Tag color={isHighlight ? "blue" : "default"} className="!m-0">
                    {tinhThoiLuong(session.gioBatDau, session.gioKetThuc)} phút
                  </Tag>
                </div>

                {/* Ghi chú */}
                {session.ghiChu && (
                  <Text className="!block !text-sm !text-gray-500 pl-6 line-clamp-2">
                    {session.ghiChu}
                  </Text>
                )}

                {/* Nút hành động (Chỉ hiện khi click vào block) */}
                {isExpanded && (
                  <div className="mt-2 flex gap-2 border-t border-gray-100 pt-3 animate-fade-in">
                    {!isFinished && (
                      <>
                        <Button
                          type="primary"
                          className="flex-1 bg-green-500"
                          icon={<CheckOutlined />}
                          onClick={(e) => handleUpdateStatus(e, session, "hoan_thanh")}
                        >
                          Xong
                        </Button>
                        <Button
                          danger
                          className="flex-1"
                          icon={<CloseOutlined />}
                          onClick={(e) => handleUpdateStatus(e, session, "huy")}
                        >
                          Hủy
                        </Button>
                      </>
                    )}
                    {session.trangThai === "hoan_thanh" && (
                      <Tag color="success" className="w-full !m-0 py-1 text-center font-medium">
                        Đã hoàn thành
                      </Tag>
                    )}
                    {session.trangThai === "huy" && (
                      <Tag color="error" className="w-full !m-0 py-1 text-center font-medium">
                        Đã hủy bỏ
                      </Tag>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

// ============================
// Main
// ============================
const TodayDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<PhienLamViec[]>([]);

  useEffect(() => {
    if (!user) return;
    
    const unsubSessions = subscribeSessions(user.uid, (data) => {
      const today = dayjs().startOf("day");
      const todaySessions = data.filter((s) =>
        dayjs(s.ngayLam.toDate()).isSame(today, "day")
      ).sort((a, b) => a.gioBatDau.localeCompare(b.gioBatDau));
      
      setSessions(todaySessions);
    });

    return () => {
      unsubSessions();
    };
  }, [user]);

  const stats = useMemo(() => {
    const totalMinutes = sessions.reduce((acc, s) => {
      if (s.trangThai === "hoan_thanh") {
        return acc + tinhThoiLuong(s.gioBatDau, s.gioKetThuc);
      }
      return acc;
    }, 0);

    return {
      totalTime: formatMinutes(totalMinutes),
      totalSessions: sessions.filter(s => s.trangThai === "hoan_thanh").length,
      allSessionsCount: sessions.length
    };
  }, [sessions]);

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] p-3 sm:p-6 lg:p-8">
      
      {/* Action Buttons Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Title level={2} className="!mb-0">My Dashboard</Title>
        <Space className="w-full sm:w-auto overflow-x-auto pb-1">
          <Button 
            type="primary" 
            onClick={() => navigate("/app-pope/task-management")}
          >
            Quản lý Task
          </Button>
          <Button 
            onClick={() => navigate("/app-pope/session-management")}
          >
            Quản lý Phiên
          </Button>
          <Button 
            onClick={() => navigate("/app-pope/template-management")}
          >
            Quản lý Mẫu
          </Button>
        </Space>
      </div>

      {/* Stats Summary */}
      <Row gutter={[12, 12]} className="mb-6">
        <Col xs={24} sm={12}>
          <Card bordered={false} className="rounded-2xl shadow-sm">
            <Statistic
              title="Tổng thời gian đã làm"
              value={stats.totalTime}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card bordered={false} className="rounded-2xl shadow-sm">
            <Statistic
              title="Phiên đã hoàn thành"
              value={`${stats.totalSessions} / ${stats.allSessionsCount}`}
              prefix={<PlayCircleFilled />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Sessions Block */}
      <div className="w-full">
        <SessionsBlockSection sessions={sessions} />
      </div>
    </div>
  );
};

export default TodayDashboard;