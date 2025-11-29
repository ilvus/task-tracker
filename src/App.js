import React, { useState, useMemo, useEffect } from 'react';
import { CheckCircle2, Circle, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DailyTasksTracker = () => {
  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  
  const [currentYear, setCurrentYear] = useState(2025);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(10); // Ноябрь
  const [saveMessage, setSaveMessage] = useState('');
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [pendingMonthChange, setPendingMonthChange] = useState(null);
  
  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  const weeksInMonth = Math.ceil(daysInMonth / 7);
  
  const getStorageKey = () => `dailyTasks_${currentYear}_${currentMonthIndex}`;
  
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem(getStorageKey());
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      { id: 1, name: 'Завтрак', completed: Array(daysInMonth).fill(false) },
      { id: 2, name: 'Обед', completed: Array(daysInMonth).fill(false) },
      { id: 3, name: 'Ужин', completed: Array(daysInMonth).fill(false) },
    ];
  });

  const [newTaskName, setNewTaskName] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(getStorageKey());
    if (saved) {
      setTasks(JSON.parse(saved));
    } else {
      setTasks([
      { id: 1, name: 'Завтрак', completed: Array(daysInMonth).fill(false) },
      { id: 2, name: 'Обед', completed: Array(daysInMonth).fill(false) },
      { id: 3, name: 'Ужин', completed: Array(daysInMonth).fill(false) },
      ]);
    }
  }, [currentYear, currentMonthIndex, daysInMonth]);

  const saveData = () => {
    localStorage.setItem(getStorageKey(), JSON.stringify(tasks));
    setSaveMessage('✓ Данные сохранены');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const toggleTask = (taskId, dayIndex) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, completed: task.completed.map((c, i) => i === dayIndex ? !c : c) }
        : task
    ));
  };

  const addTask = () => {
    if (newTaskName.trim()) {
      setTasks([...tasks, {
        id: Date.now(),
        name: newTaskName,
        completed: Array(daysInMonth).fill(false)
      }]);
      setNewTaskName('');
    }
  };

  const deleteTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const changeMonth = (direction) => {
    let newMonthIndex = currentMonthIndex;
    let newYear = currentYear;
    
    if (direction === 'prev') {
      if (currentMonthIndex === 0) {
        newMonthIndex = 11;
        newYear = currentYear - 1;
      } else {
        newMonthIndex = currentMonthIndex - 1;
      }
    } else {
      if (currentMonthIndex === 11) {
        newMonthIndex = 0;
        newYear = currentYear + 1;
      } else {
        newMonthIndex = currentMonthIndex + 1;
      }
    }
    
    const newStorageKey = `dailyTasks_${newYear}_${newMonthIndex}`;
    const existingData = localStorage.getItem(newStorageKey);
    
    if (!existingData) {
      setPendingMonthChange({ newMonthIndex, newYear });
      setShowCopyDialog(true);
    } else {
      setCurrentMonthIndex(newMonthIndex);
      setCurrentYear(newYear);
    }
  };

  const handleCopyTasks = (copyTasks) => {
    const { newMonthIndex, newYear } = pendingMonthChange;
    const newDaysInMonth = new Date(newYear, newMonthIndex + 1, 0).getDate();
    
    if (copyTasks) {
      const copiedTasks = tasks.map(task => ({
        ...task,
        completed: Array(newDaysInMonth).fill(false)
      }));
      localStorage.setItem(`dailyTasks_${newYear}_${newMonthIndex}`, JSON.stringify(copiedTasks));
    }
    
    setCurrentMonthIndex(newMonthIndex);
    setCurrentYear(newYear);
    setShowCopyDialog(false);
    setPendingMonthChange(null);
  };

  const dailyPercentages = useMemo(() => {
    return Array(daysInMonth).fill(0).map((_, dayIndex) => {
      const completedToday = tasks.reduce((sum, task) => sum + (task.completed[dayIndex] ? 1 : 0), 0);
      const total = tasks.length;
      return total > 0 ? Math.round((completedToday / total) * 100) : 0;
    });
  }, [tasks, daysInMonth]);

  const totalCompleted = tasks.reduce((sum, task) => 
    sum + task.completed.filter(Boolean).length, 0
  );
  const totalPossible = tasks.length * daysInMonth;
  const overallProgress = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

  const chartData = dailyPercentages.map((percent, index) => ({
    day: index + 1,
    percent: percent
  }));

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      {/* Copy Dialog */}
      {showCopyDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-600 rounded-lg p-6 max-w-md mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-100 mb-4">
              Создать новый месяц
            </h3>
            <p className="text-slate-300 mb-6">
              Хотите перенести задачи из текущего месяца или начать с пустого списка?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleCopyTasks(true)}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
              >
                Перенести задачи
              </button>
              <button
                onClick={() => handleCopyTasks(false)}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition font-medium"
              >
                Начать с нуля
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-[95vw] mx-auto bg-slate-800 rounded-lg shadow-2xl p-6 border border-slate-700">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => changeMonth('prev')}
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
              >
                <ChevronLeft className="w-5 h-5 text-slate-200" />
              </button>
              <h1 className="text-3xl font-bold text-slate-100">
                {months[currentMonthIndex]} {currentYear}
              </h1>
              <button
                onClick={() => changeMonth('next')}
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
              >
                <ChevronRight className="w-5 h-5 text-slate-200" />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-slate-400">Задач: {tasks.length}</p>
                <p className="text-lg font-semibold text-blue-400">{totalCompleted} / {totalPossible}</p>
              </div>
              <button
                onClick={saveData}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
              >
                <Save className="w-4 h-4" />
                Сохранить
              </button>
            </div>
          </div>
          
          {saveMessage && (
            <div className="text-center text-green-400 text-sm mb-2 font-medium">
              {saveMessage}
            </div>
          )}
          
          {/* Progress Bar */}
          <div className="w-full bg-slate-700 rounded h-6 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-600 to-blue-500 h-6 transition-all duration-500 flex items-center justify-center text-white text-sm font-semibold"
              style={{ width: `${overallProgress}%` }}
            >
              {overallProgress}%
            </div>
          </div>
        </div>

        {/* Add Task */}
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTask()}
            placeholder="Добавить новую задачу..."
            className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-100 placeholder-slate-400"
          />
          <button
            onClick={addTask}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            Добавить
          </button>
        </div>

        {/* Excel-style Table */}
        <div className="mb-6 overflow-x-auto border border-slate-600 rounded">
          <table className="w-full border-collapse bg-slate-800" style={{ fontFamily: 'Arial, sans-serif' }}>
            <thead>
              <tr>
                <th className="sticky left-0 bg-slate-700 border border-slate-600 px-4 py-3 text-left font-bold text-slate-200 text-sm min-w-[180px]">
                  Задача
                </th>
                {[...Array(weeksInMonth)].map((_, weekIndex) => {
                  const startDay = weekIndex * 7;
                  const endDay = Math.min(startDay + 7, daysInMonth);
                  const daysInThisWeek = endDay - startDay;
                  return (
                    <th key={weekIndex} colSpan={daysInThisWeek} className="border border-slate-600 px-2 py-3 text-center bg-slate-700 font-bold text-slate-200 text-sm">
                      Неделя {weekIndex + 1}
                    </th>
                  );
                })}
                <th className="border border-slate-600 px-2 py-3 bg-slate-700 w-12"></th>
              </tr>
              <tr>
                <th className="sticky left-0 bg-slate-750 border border-slate-600"></th>
                {[...Array(daysInMonth)].map((_, i) => (
                  <th key={i} className="border border-slate-600 px-2 py-2 text-xs text-slate-300 bg-slate-750 font-semibold">
                    {i + 1}
                  </th>
                ))}
                <th className="border border-slate-600 bg-slate-750"></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-700">
                  <td className="sticky left-0 bg-slate-800 border border-slate-600 px-4 py-3 font-medium text-slate-200 text-sm">
                    {task.name}
                  </td>
                  {task.completed.map((completed, dayIndex) => (
                    <td 
                      key={dayIndex} 
                      className="border border-slate-600 text-center cursor-pointer hover:bg-slate-600 transition p-2"
                      onClick={() => toggleTask(task.id, dayIndex)}
                    >
                      {completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-500 mx-auto" />
                      )}
                    </td>
                  ))}
                  <td className="border border-slate-600 text-center bg-slate-750">
                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="text-red-400 hover:text-red-300 text-sm px-2"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
              
              {/* Percentage Row - Completed */}
              <tr className="bg-emerald-900 bg-opacity-30">
                <td className="sticky left-0 bg-emerald-900 bg-opacity-50 border border-slate-600 px-4 py-3 font-bold text-emerald-300 text-sm">
                  Выполнено (%)
                </td>
                {dailyPercentages.map((percent, dayIndex) => (
                  <td 
                    key={dayIndex} 
                    className="border border-slate-600 text-center font-semibold text-emerald-400 text-sm py-2"
                  >
                    {percent}%
                  </td>
                ))}
                <td className="border border-slate-600 bg-emerald-900 bg-opacity-50"></td>
              </tr>
              
              {/* Percentage Row - Not Completed */}
              <tr className="bg-red-900 bg-opacity-30">
                <td className="sticky left-0 bg-red-900 bg-opacity-50 border border-slate-600 px-4 py-3 font-bold text-red-300 text-sm">
                  Не выполнено (%)
                </td>
                {dailyPercentages.map((percent, dayIndex) => (
                  <td 
                    key={dayIndex} 
                    className="border border-slate-600 text-center font-semibold text-red-400 text-sm py-2"
                  >
                    {100 - percent}%
                  </td>
                ))}
                <td className="border border-slate-600 bg-red-900 bg-opacity-50"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Chart */}
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-6">
          <h2 className="text-xl font-bold text-slate-100 mb-4">График выполнения задач</h2>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis 
                dataKey="day" 
                label={{ value: 'День месяца', position: 'insideBottom', offset: -5, fill: '#cbd5e1' }}
                tick={{ fontSize: 12, fill: '#cbd5e1' }}
                stroke="#64748b"
              />
              <YAxis 
                domain={[0, 100]}
                label={{ value: 'Процент выполнения (%)', angle: -90, position: 'insideLeft', fill: '#cbd5e1' }}
                tick={{ fontSize: 12, fill: '#cbd5e1' }}
                stroke="#64748b"
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '6px' }}
                labelStyle={{ color: '#cbd5e1' }}
                itemStyle={{ color: '#60a5fa' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-800 p-3 border border-slate-600 rounded shadow-lg">
                        <p className="text-sm font-semibold text-slate-200">День {payload[0].payload.day}</p>
                        <p className="text-sm text-blue-400">Выполнено: {payload[0].value}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="percent" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DailyTasksTracker;