import AppRoutes from './routes/AppRoutes';
import './index.css';
import { BrowserRouter } from 'react-router-dom';

function App() {
  return (
    <div className='bg-gray-100 text-gray-900'>
      <BrowserRouter>
        <AppRoutes />;
      </BrowserRouter>
    </div>
  )
}

export default App;