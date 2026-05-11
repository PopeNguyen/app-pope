import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Timeline,
  Progress,
  Typography,
  Button,
  message,
  Space,
  Statistic,
  Row,
  Col,
  Tag,
} from "antd";
import {
  CheckCircleFilled,
  PlayCircleFilled,
  ClockCircleOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/hooks/useAuth";
import { subscribeSessions } from "@/services/sessionService";
import type { PhienLamViec } from "@/services/sessionService";
import { subscribeHabitTasks } from "@/services/habitTaskService";
import type { HabitTask } from "@/services/habitTaskService";
import dayjs from "dayjs";

const { Title, Text } = Typography;

// ============================
// Helpers
// ============================
const formatMinutes = (minutes: number) => {
  if (!minutes) return "0m";
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;

    if (m === 0) {
      return `${h}h`;
    }

    return `${h}h${m}m`;
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
const TimelineSection: React.FC<{ sessions: PhienLamViec[] }> = ({ sessions }) => {
  const renderIcon = (
    trangThai: PhienLamViec["trangThai"],
  ) => {
    if (trangThai === "hoan_thanh") {
      return (
        <CheckCircleFilled className="text-gray-400" />
      );
    }

    if (trangThai === "dang_thuc_hien") {
      return (
        <PlayCircleFilled className="text-[#1677ff]" />
      );
    }

    return (
      <div className="h-3 w-3 rounded-full border border-gray-400 bg-white" />
    );
  };

  return (
    <Card
      bordered={false}
      className="h-full rounded-3xl border border-gray-200 bg-white shadow-sm"
    >
      <Title
        level={4}
        className="!mb-8 !text-black"
      >
        Today Sessions
      </Title>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10">
          <Text type="secondary">Chưa có phiên làm việc nào hôm nay</Text>
        </div>
      ) : (
        <Timeline
          items={sessions.map((session) => ({
            dot: renderIcon(session.trangThai),

            children: (
              <div
                className={`rounded-2xl p-4 transition-all ${
                  session.trangThai === "dang_thuc_hien"
                    ? "bg-blue-50"
                    : ""
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <Text
                      className={`!block !font-semibold ${
                        session.trangThai === "dang_thuc_hien"
                          ? "!text-[#1677ff]"
                          : "!text-black"
                      }`}
                    >
                      {session.gioBatDau} - {session.gioKetThuc}
                    </Text>
                    <Text className="!text-gray-500">
                      {session.ten}
                    </Text>
                  </div>
                  <Tag color="default">
                    {tinhThoiLuong(session.gioBatDau, session.gioKetThuc)}m
                  </Tag>
                </div>
              </div>
            ),
          }))}
        />
      )}
    </Card>
  );
};

const TasksSection: React.FC<{ tasks: HabitTask[] }> = ({ tasks }) => {
  const completedCount = tasks.filter(
    (item) => item.status === "completed" || ((item.actualDuration || 0) >= (item.targetDuration || 0) && item.targetDuration && item.targetDuration > 0)
  ).length;

  const totalProgress = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.round(
      (completedCount / tasks.length) * 100,
    );
  }, [completedCount, tasks.length]);

  return (
    <Card
      bordered={false}
      className="h-full rounded-3xl border border-gray-200 bg-white shadow-sm"
    >
      <div className="mb-6 flex items-center justify-between">
        <Title
          level={4}
          className="!mb-0 !text-black"
        >
          Today's Active Tasks
        </Title>

        <Text className="!text-gray-500">
          {completedCount}/{tasks.length}
        </Text>
      </div>

      <Progress
        percent={totalProgress}
        showInfo={false}
        strokeColor="#1677ff"
        className="mb-8"
      />

      <div className="space-y-6">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Text type="secondary">Không có task nào được thực hiện hôm nay</Text>
          </div>
        ) : (
          tasks.map((task) => {
            const current = task.actualDuration || 0;
            const target = task.targetDuration || 0;
            const percent = target > 0 ? Math.round((current / target) * 100) : 0;

            return (
              <div key={task.id}>
                <div className="mb-2 flex items-center justify-between">
                  <Text className="!font-medium !text-black">
                    {task.name}
                  </Text>

                  <Text className="!text-gray-500">
                    {task.status === "completed" ? "100%" : `${percent}%`}
                  </Text>
                </div>

                <div className="mb-3">
                  <Text className="!text-gray-500">
                    {formatMinutes(current)} /{" "}
                    {formatMinutes(target)}
                  </Text>
                </div>

                <Progress
                  percent={task.status === "completed" ? 100 : percent}
                  showInfo={false}
                  strokeColor={task.status === "completed" ? "#52c41a" : "#1677ff"}
                />
              </div>
            );
          })
        )}
      </div>
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
  const [allTasks, setAllTasks] = useState<HabitTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    
    const today = dayjs().startOf("day");

    const unsubSessions = subscribeSessions(user.uid, (data) => {
      const todaySessions = data.filter((s) =>
        dayjs(s.ngayLam.toDate()).isSame(today, "day")
      ).sort((a, b) => a.gioBatDau.localeCompare(b.gioBatDau));
      
      setSessions(todaySessions);
      setLoading(false);
    });

    const unsubTasks = subscribeHabitTasks(user.uid, (data) => {
      setAllTasks(data);
    });

    return () => {
      unsubSessions();
      unsubTasks();
    };
  }, [user]);

  const todayTasks = useMemo(() => {
    if (!allTasks.length || !sessions.length) return [];
    const todaySessionTaskIds = new Set(sessions.map(s => s.taskId).filter(Boolean));
    return allTasks.filter(t => todaySessionTaskIds.has(t.id as string));
  }, [allTasks, sessions]);

  const stats = useMemo(() => {
    const totalMinutes = sessions.reduce((acc, s) => {
      if (s.trangThai === "hoan_thanh") {
        return acc + tinhThoiLuong(s.gioBatDau, s.gioKetThuc);
      }
      return acc;
    }, 0);

    const completedTasks = todayTasks.filter(t => t.status === "completed").length;

    return {
      totalTime: formatMinutes(totalMinutes),
      completedTasks,
      totalSessions: sessions.filter(s => s.trangThai === "hoan_thanh").length
    };
  }, [sessions, todayTasks]);

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] p-4 sm:p-6 lg:p-8 xl:p-10">
      
      {/* Action Buttons Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <Title level={2} className="!mb-0">My Dashboard</Title>
        <Space>
          <Button 
            type="primary" 
            size="large"
            onClick={() => navigate("/app-pope/task-management")}
          >
            Quản lý Task
          </Button>
          <Button 
            size="large"
            onClick={() => navigate("/app-pope/session-management")}
          >
            Quản lý Phiên
          </Button>
        </Space>
      </div>

      {/* Stats Summary */}
      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24} sm={8}>
          <Card bordered={false} className="rounded-3xl shadow-sm">
            <Statistic
              title="Tổng thời gian đã làm"
              value={stats.totalTime}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="rounded-3xl shadow-sm">
            <Statistic
              title="Phiên đã hoàn thành"
              value={stats.totalSessions}
              prefix={<PlayCircleFilled />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="rounded-3xl shadow-sm">
            <Statistic
              title="Task đã xong"
              value={stats.completedTasks}
              prefix={<CheckOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Left */}
        <TimelineSection sessions={sessions} />

        {/* Right */}
        <TasksSection tasks={todayTasks} />
      </div>
    </div>
  );
};

export default TodayDashboard;