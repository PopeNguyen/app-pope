import { useState } from "react";
import { Layout, Menu as AntMenu, Grid, Drawer, Button } from "antd";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { menuItems } from "@/configs/menuConfig";
import Header from "@/components/Header";
import { ChevronsLeft, ChevronsRight } from "lucide-react";

const { Sider, Content, Header: AntHeader } = Layout;
const { useBreakpoint } = Grid;

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const selectedKey = menuItems.find((item) =>
    location.pathname.startsWith(item.path)
  )?.key;

  const handleMenuClick = (e: any) => {
    const selectedItem = menuItems.find((item) => item.key === e.key);
    if (selectedItem) {
      navigate(selectedItem.path);
      if (!screens.md) {
        setMobileDrawerOpen(false);
      }
    }
  };

  const menu = (
    <AntMenu
      theme="dark"
      mode="inline"
      selectedKeys={selectedKey ? [selectedKey] : []}
      onClick={handleMenuClick}
      items={menuItems}
    />
  );

  const sider = (
    <Sider
      theme="dark"
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
      trigger={null} // We use a custom trigger
      width={240}
      className="!fixed h-full z-10 shadow-lg"
    >
        <div className="h-16 flex items-center justify-center text-white font-bold text-lg bg-gray-900">
            {collapsed ? "M" : "MyAPP"}
        </div>
        {menu}
    </Sider>
  );

  return (
    <Layout className="min-h-screen bg-gray-100">
      {screens.md ? (
        sider
      ) : (
        <Drawer
          placement="left"
          onClose={() => setMobileDrawerOpen(false)}
          open={mobileDrawerOpen}
          bodyStyle={{ padding: 0, background: '#001529' }}
          closable={false}
          width={'85%'}
        >
            <div className="h-16 flex items-center justify-center text-white font-bold text-lg bg-gray-900">
                MyAPP
            </div>
            {menu}
        </Drawer>
      )}
      <Layout style={{ marginLeft: screens.md ? (collapsed ? 80 : 240) : 0, transition: 'margin-left 0.2s' }} className="h-screen flex flex-col">
        <AntHeader className="!p-0 !h-auto" style={{ position: 'sticky', top: 0, zIndex: 10}}>
            <Header onMenuClick={() => setMobileDrawerOpen(true)} />
        </AntHeader>
        <Content className="flex-auto overflow-y-auto p-4">
            <div className="bg-white p-4 rounded-lg shadow-md">
                <Outlet />
            </div>
        </Content>
      </Layout>
    </Layout>
  );
}