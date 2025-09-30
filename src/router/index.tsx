import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from '@/pages/Home';
import Register from '@/pages/Register';
import Login from '@/pages/Login';
import TodoList from '@/pages/todolist/Todolist';
import MainLayout from '@/layouts/MainLayout';
import NotFound from '@/pages/NotFound';
import Money from '@/pages/money/Money';
import Casino from '@/pages/casino/Casino';
import CasinoMatch from '@/pages/casino/CasinoMatch';

import { withAuth } from '@/utils/withAuth';
import AccountBank from '@/pages/money/AccountBank';
import CategoryBank from '@/pages/money/CategoryBank';
import ListProject from '@/pages/learnEnglish/LearnEnglish';
import VocabularyList from '@/pages/learnEnglish/VocabularyList';

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
      { path: 'casino', element: withAuth(<Casino />) },
      { path: 'casino/:id', element: withAuth(<CasinoMatch />) },
      { path: 'learn-english', element: withAuth(<ListProject />) },
      { path: 'learn-english/:listId', element: withAuth(<VocabularyList />) },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
