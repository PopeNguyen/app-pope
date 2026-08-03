import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from '@/pages/home/Home';
import Register from '@/pages/Register';
import Login from '@/pages/Login';
import TodoList from '@/pages/todolist/Todolist';
import NotFound from '@/pages/NotFound';
import Money from '@/pages/money/Money';
import Casino from '@/pages/casino/Casino';
import CasinoMatch from '@/pages/casino/CasinoMatch';
import AccountBank from '@/pages/money/AccountBank';
import CategoryBank from '@/pages/money/CategoryBank';
import ListTemplate from '@/pages/money/ListTemplate';
import ListProject from '@/pages/learnEnglish/LearnEnglish';
import VocabularyList from '@/pages/learnEnglish/VocabularyList';
import HabitCalendar from '@/pages/habitCalendar';
import SessionManagement from '@/pages/habitCalendar/SessionManagement';
import TaskManagement from '@/pages/habitCalendar/TaskManagement';
import TemplateManagement from '@/pages/habitCalendar/TemplateManagement';
import MemorizeDashboard from '@/pages/memorize/MemorizeDashboard';
import MainLayout from '@/layouts/MainLayout';
import { withAuth } from '@/utils/withAuth';

const baseURL = import.meta.env.VITE_BASE_URL;

const router = createBrowserRouter([
  {
    path: '',
    children: [
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    path: baseURL,
    children: [
      { path: '', element: <Home /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    path: baseURL,
    element: <MainLayout />,
    children: [
      { path: 'todolist', element: withAuth(<TodoList />) },
      { path: 'money', element: withAuth(<Money />) },
      { path: 'account', element: withAuth(<AccountBank />) },
      { path: 'category-bank', element: withAuth(<CategoryBank />) },
      { path: 'list-template', element: withAuth(<ListTemplate />) },
      { path: 'casino', element: withAuth(<Casino />) },
      { path: 'casino/:id', element: withAuth(<CasinoMatch />) },
      { path: 'learn-english', element: withAuth(<ListProject />) },
      { path: 'learn-english/:listId', element: withAuth(<VocabularyList />) },
      { path: 'habit-calendar', element: withAuth(<HabitCalendar />) },
      { path: 'task-management', element: withAuth(<TaskManagement />) },
      { path: 'session-management', element: withAuth(<SessionManagement />) },
      { path: 'template-management', element: withAuth(<TemplateManagement />) },
      { path: 'memorize', element: withAuth(<MemorizeDashboard />) },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
