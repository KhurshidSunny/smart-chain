import AppRoutes from './routes/AppRoutes';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import FeedbackModal from './components/common/FeedbackModal/FeedbackModal';

function App() {
  return (
    <div className=''>
      <BrowserRouter>
        <AppRoutes />
        <FeedbackModal />
      </BrowserRouter>
    </div>
  )
}

export default App;