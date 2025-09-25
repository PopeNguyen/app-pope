import { Avatar, Dropdown, Menu as AntMenu, Space, Button } from "antd";
import { User, LogOut, Menu as MenuIcon } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from '@/firebase';
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth();

  const handleMenuClick = async ({ key }: { key: string }) => {
    switch (key) {
      case "profile":
        // Navigate to profile or open modal
        break;
      case "logout":
        await signOut(auth);
        break;
    }
  };

  const dropdownMenu = (
    <AntMenu
      onClick={handleMenuClick}
      items={[
        { key: "profile", label: "Hồ sơ", icon: <User size={16} /> },
        { type: "divider" },
        { key: "logout", label: "Đăng xuất", icon: <LogOut size={16} />, danger: true },
      ]}
    />
  );

  return (
    <div className="bg-white h-16 px-4 flex items-center justify-between shadow-sm border-b border-gray-200">
      {/* Mobile Menu Button & App Logo */}
      <div className="flex items-center gap-4">
        <Button
          type="text"
          icon={<MenuIcon size={20} />}
          onClick={onMenuClick}
          className="md:hidden"
        />
        <div className="font-bold text-lg text-blue-600">MyAPP</div>
      </div>

      {/* Right side User Menu */}
      <Space align="center">
        <span className="hidden sm:block font-semibold text-gray-700">
          {user?.displayName || user?.email}
        </span>
        <Dropdown overlay={dropdownMenu} trigger={["click"]}>
          <div className="cursor-pointer">
            <Avatar src={user?.photoURL}>
              {user?.email?.charAt(0).toUpperCase()}
            </Avatar>
          </div>
        </Dropdown>
      </Space>
    </div>
  );
}