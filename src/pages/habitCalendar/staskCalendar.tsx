import React, { useState, useMemo } from 'react';
import { Button } from 'antd';
import { LeftOutlined, RightOutlined, CheckOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';

const HabitCalendar: React.FC = () => {
  // Quản lý tháng/năm đang xem
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  
  // Quản lý danh sách các ngày đã hoàn thành (format: YYYY-MM-DD)
  const [completedDays, setCompletedDays] = useState<string[]>([]);

  // Chuyển đổi tháng
  const handlePrevMonth = () => setCurrentDate(currentDate.subtract(1, 'month'));
  const handleNextMonth = () => setCurrentDate(currentDate.add(1, 'month'));

  // Xử lý logic click vào một ngày
  const toggleDay = (date: Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    setCompletedDays((prev) =>
      prev.includes(dateStr)
        ? prev.filter((d) => d !== dateStr) // Đã tick thì bỏ tick
        : [...prev, dateStr]                // Chưa tick thì thêm vào mảng
    );
  };

  // Tính toán mảng lưới ngày để render (bao gồm cả ô trống đầu tháng)
  const calendarDays = useMemo(() => {
    const startOfMonth = currentDate.startOf('month');
    const endOfMonth = currentDate.endOf('month');
    
    // dayjs().day() trả về 0 (Chủ nhật) đến 6 (Thứ 7).
    // Vì lịch bắt đầu từ Thứ 2, ta cần tính số ô trống phía trước.
    const startDayOfWeek = startOfMonth.day();
    const emptyDaysCount = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const days: (Dayjs | null)[] = [];
    
    // Đẩy các ô trống vào mảng
    for (let i = 0; i < emptyDaysCount; i++) {
      days.push(null);
    }
    
    // Đẩy các ngày chính thức trong tháng vào mảng
    for (let i = 1; i <= endOfMonth.date(); i++) {
      days.push(startOfMonth.date(i));
    }
    
    return days;
  }, [currentDate]);

  const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  return (
    <div className="max-w-md mx-auto bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
      {/* Header: Chuyển tháng */}
      <div className="flex justify-between items-center mb-6">
        <Button 
          type="text" 
          icon={<LeftOutlined />} 
          onClick={handlePrevMonth} 
          className="text-gray-500 hover:text-gray-800"
        />
        <h2 className="text-lg font-bold text-gray-800 m-0">
          Tháng {currentDate.format('MM')}, {currentDate.format('YYYY')}
        </h2>
        <Button 
          type="text" 
          icon={<RightOutlined />} 
          onClick={handleNextMonth} 
          className="text-gray-500 hover:text-gray-800"
        />
      </div>

      {/* Tên các thứ trong tuần */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map((day, index) => (
          <div key={index} className="text-center text-sm font-semibold text-gray-400">
            {day}
          </div>
        ))}
      </div>

      {/* Lưới ngày tháng */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((date, index) => {
          if (!date) {
            // Render ô trống
            return <div key={`empty-${index}`} className="aspect-square"></div>;
          }

          const dateStr = date.format('YYYY-MM-DD');
          const isCompleted = completedDays.includes(dateStr);
          const isToday = date.isSame(dayjs(), 'day');

          return (
            <div
              key={dateStr}
              onClick={() => toggleDay(date)}
              className={`
                relative flex items-center justify-center aspect-square rounded-lg cursor-pointer transition-all duration-200 select-none
                ${isCompleted 
                  ? 'bg-green-500 text-white shadow-md transform scale-105' 
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }
                ${isToday && !isCompleted ? 'border-2 border-green-500 text-green-600 font-bold' : ''}
              `}
            >
              <span className={`text-sm md:text-base ${isCompleted ? 'font-bold' : ''}`}>
                {date.date()}
              </span>
              
              {/* Icon tick xanh nhỏ ở góc nếu đã hoàn thành (tùy chọn UI) */}
              {isCompleted && (
                <CheckOutlined className="absolute text-white/50 text-4xl" />
              )}
            </div>
          );
        })}
      </div>

      {/* Thông kê ngắn gọn bên dưới */}
      <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
        <span>Tổng số ngày đã hoàn thành:</span>
        <span className="font-bold text-green-600 text-lg">{completedDays.length}</span>
      </div>
    </div>
  );
};

export default HabitCalendar;