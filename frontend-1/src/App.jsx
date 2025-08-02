import AppRoutes from './routes/AppRoutes';
import './index.css';
import { BrowserRouter } from 'react-router-dom';

function App() {
  return (
    <div className=''>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </div>
  )
}

export default App;