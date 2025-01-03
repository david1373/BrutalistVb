import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import { ArticleDetail } from './pages/ArticleDetail';
import { AdminPage } from './pages/AdminPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/articles/:id',
    element: <ArticleDetail />,
  },
  {
    path: '/admin',
    element: <AdminPage />,
  },
]);