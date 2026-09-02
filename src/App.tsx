import { Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { WeekendPage } from './pages/WeekendPage';
import { CalendarPage } from './pages/CalendarPage';
import { OfficeHoursPage } from './pages/OfficeHoursPage';

export default function App() {
  return (
    <div className="app">
      <Header />
      <main className="app__main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/weekend/:id" element={<WeekendPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/office-hours" element={<OfficeHoursPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
