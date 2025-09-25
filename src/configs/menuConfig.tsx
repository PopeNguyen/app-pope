import { ListTodo, Wallet, Swords } from 'lucide-react';

export const menuItems = [
  {
    key: '1',
    icon: <ListTodo size={18} />,
    label: 'Việc cần làm',
    path: '/app-pope/todolist',
  },
  {
    key: '2',
    icon: <Wallet size={18} />,
    label: 'Thu chi cá nhân',
    path: '/app-pope/money',
  },
  {
    key: '3',
    icon: <Swords size={18} />,
    label: 'Sổ đỏ đen',
    path: '/app-pope/casino',
  },
];
