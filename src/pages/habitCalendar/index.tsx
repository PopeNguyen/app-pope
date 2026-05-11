import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Timeline,
  Progress,
  Typography,
  Button,
} from "antd";
import {
  CheckCircleFilled,
  PlayCircleFilled,
} from "@ant-design/icons";

const { Title, Text } = Typography;

// ============================
// Types
// ============================
interface Session {
  id: string;
  title: string;
  start: string;
  end: string;
  status: "completed" | "current" | "upcoming";
}

interface TaskItem {
  id: string;
  title: string;
  current: number;
  target: number;
}

// ============================
// Fake Data
// ============================
const sessions: Session[] = [
  {
    id: "1",
    title: "Ăn sáng",
    start: "08:00",
    end: "08:30",
    status: "completed",
  },
  {
    id: "2",
    title: "Làm dự án website",
    start: "09:00",
    end: "10:30",
    status: "current",
  },
  {
    id: "3",
    title: "Nghỉ giải lao",
    start: "10:30",
    end: "11:00",
    status: "upcoming",
  },
  {
    id: "4",
    title: "Học tiếng Anh",
    start: "11:00",
    end: "12:00",
    status: "upcoming",
  },
  {
    id: "5",
    title: "Coding",
    start: "14:00",
    end: "16:00",
    status: "upcoming",
  },
];

const tasks: TaskItem[] = [
  {
    id: "1",
    title: "Học tiếng Anh",
    current: 45,
    target: 120,
  },
  {
    id: "2",
    title: "Làm dự án",
    current: 90,
    target: 240,
  },
  {
    id: "3",
    title: "Gym",
    current: 0,
    target: 60,
  },
  {
    id: "4",
    title: "Đọc sách",
    current: 0,
    target: 30,
  },
];

// ============================
// Helpers
// ============================
const formatMinutes = (minutes: number) => {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;

    if (m === 0) {
      return `${h}h`;
    }

    return `${h}h${m}`;
  }

  return `${minutes}m`;
};

// ============================
// Components
// ============================
const TimelineSection: React.FC = () => {
  const renderIcon = (
    status: Session["status"],
  ) => {
    if (status === "completed") {
      return (
        <CheckCircleFilled className="text-gray-400" />
      );
    }

    if (status === "current") {
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

      <Timeline
        items={sessions.map((session) => ({
          dot: renderIcon(session.status),

          children: (
            <div
              className={`rounded-2xl p-4 transition-all ${
                session.status === "current"
                  ? "bg-blue-50"
                  : ""
              }`}
            >
              <Text
                className={`!block !font-semibold ${
                  session.status === "current"
                    ? "!text-[#1677ff]"
                    : "!text-black"
                }`}
              >
                {session.start} - {session.end}
              </Text>

              <Text className="!text-gray-500">
                {session.title}
              </Text>
            </div>
          ),
        }))}
      />
    </Card>
  );
};

const TasksSection: React.FC = () => {
  const completedCount = tasks.filter(
    (item) => item.current >= item.target,
  ).length;

  const totalProgress = useMemo(() => {
    return Math.round(
      (completedCount / tasks.length) * 100,
    );
  }, [completedCount]);

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
          Today Tasks
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
        {tasks.map((task) => {
          const percent = Math.round(
            (task.current / task.target) * 100,
          );

          return (
            <div key={task.id}>
              <div className="mb-2 flex items-center justify-between">
                <Text className="!font-medium !text-black">
                  {task.title}
                </Text>

                <Text className="!text-gray-500">
                  {percent}%
                </Text>
              </div>

              <div className="mb-3">
                <Text className="!text-gray-500">
                  {formatMinutes(task.current)} /{" "}
                  {formatMinutes(task.target)}
                </Text>
              </div>

              <Progress
                percent={percent}
                showInfo={false}
                strokeColor="#1677ff"
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// ============================
// Main
// ============================
const TodayDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] p-4 sm:p-6 lg:p-8 xl:p-10">
      
      {/* Action Buttons Header */}
      <div className="mb-6 flex items-center gap-4">
        <Button 
          type="primary" 
          size="large"
          onClick={() => navigate("/app-pope/task-management")}
        >
          Quản lý Task
        </Button>
        <Button 
          type="default" 
          size="large"
          onClick={() => navigate("/app-pope/session-management")}
        >
          Quản lý Phiên
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Left */}
        <TimelineSection />

        {/* Right */}
        <TasksSection />
      </div>
    </div>
  );
};

export default TodayDashboard;