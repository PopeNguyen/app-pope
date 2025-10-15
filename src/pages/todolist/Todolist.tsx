import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getTodos, addTodo, deleteTodo, updateTodo } from "@/services/todoService";
import type { Todo, TodoStatus, TodoPriority } from "@/services/todoService";
import { Button, Modal, Form, Input, Select, DatePicker, message, Card, Tag, Popconfirm } from "antd";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import FullScreenLoader from '@/components/FullScreenLoader';
import dayjs from "dayjs";
import { Timestamp } from "firebase/firestore";

const columns: Record<TodoStatus, string> = {
  todo: "Việc cần làm",
  inprogress: "Đang thực hiện",
  done: "Hoàn thành",
};

const priorityColors: Record<TodoPriority, string> = {
  High: "red",
  Medium: "orange",
  Low: "blue",
};

interface BoardState {
  tasks: { [key: string]: Todo };
  columns: {
    [key: string]: {
      id: TodoStatus;
      title: string;
      taskIds: string[];
    };
  };
  columnOrder: TodoStatus[];
}

function TodoList() {
  const { user, loading: authLoading } = useAuth();
  const [board, setBoard] = useState<BoardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Todo | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!user) return;

    const loadTodos = async () => {
      setLoading(true);
      const todos = await getTodos(user.uid);
      const tasks = todos.reduce((acc, task) => {
        acc[task.id] = task;
        return acc;
      }, {} as { [key: string]: Todo });

      const initialBoard: BoardState = {
        tasks,
        columns: {
          todo: { id: "todo", title: "Việc cần làm", taskIds: [] },
          inprogress: { id: "inprogress", title: "Đang thực hiện", taskIds: [] },
          done: { id: "done", title: "Hoàn thành", taskIds: [] },
        },
        columnOrder: ["todo", "inprogress", "done"],
      };

      todos.forEach(task => {
        if (initialBoard.columns[task.status]) {
          initialBoard.columns[task.status].taskIds.push(task.id);
        }
      });

      setBoard(initialBoard);
      setLoading(false);
    };

    loadTodos();
  }, [user]);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const startColumn = board!.columns[source.droppableId];
    const endColumn = board!.columns[destination.droppableId];

    if (startColumn === endColumn) {
      // Reorder within the same column
      const newTaskIds = Array.from(startColumn.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const newColumn = { ...startColumn, taskIds: newTaskIds };
      const newBoard = { ...board!, columns: { ...board!.columns, [newColumn.id]: newColumn } };
      setBoard(newBoard);
      // No db update needed for reordering yet, but can be added
    } else {
      // Move to a different column
      const startTaskIds = Array.from(startColumn.taskIds);
      startTaskIds.splice(source.index, 1);
      const newStartColumn = { ...startColumn, taskIds: startTaskIds };

      const endTaskIds = Array.from(endColumn.taskIds);
      endTaskIds.splice(destination.index, 0, draggableId);
      const newEndColumn = { ...endColumn, taskIds: endTaskIds };

      const newBoard = {
        ...board!,
        columns: {
          ...board!.columns,
          [newStartColumn.id]: newStartColumn,
          [newEndColumn.id]: newEndColumn,
        },
      };
      setBoard(newBoard);

      // Update status in Firebase
      const newStatus = endColumn.id as TodoStatus;
      updateTodo(draggableId, { status: newStatus });
    }
  };

  const showModal = (task: Todo | null) => {
    setEditingTask(task);
    if (task) {
      form.setFieldsValue({ ...task, dueDate: task.dueDate ? dayjs(task.dueDate.toDate()) : null });
    } else {
      form.resetFields();
      form.setFieldsValue({ priority: 'Medium', status: 'todo' });
    }
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleOk = () => {
    form.validateFields().then(async (values) => {
      const { title, content, priority, dueDate, status } = values;
      const data = {
        title,
        content: content || '',
        priority,
        dueDate: dueDate ? Timestamp.fromDate(dueDate.toDate()) : null,
        status,
      };

      try {
        if (editingTask) {
          // Update existing task
          await updateTodo(editingTask.id, data);
          setBoard(prev => {
            const newTasks = { ...prev!.tasks, [editingTask.id]: { ...prev!.tasks[editingTask.id], ...data } };
            return { ...prev!, tasks: newTasks };
          });
          message.success("Cập nhật công việc thành công!");
        } else {
          // Add new task
          const newTodo = { ...data, uid: user!.uid };
          const docRef = await addTodo(newTodo);
          const newTask: Todo = { id: docRef.id, ...newTodo };
          setBoard(prev => {
            const newTasks = { ...prev!.tasks, [newTask.id]: newTask };
            const column = prev!.columns[newTask.status];
            const newTaskIds = [...column.taskIds, newTask.id];
            const newColumn = { ...column, taskIds: newTaskIds };
            return { ...prev!, tasks: newTasks, columns: { ...prev!.columns, [newColumn.id]: newColumn } };
          });
          message.success("Thêm công việc thành công!");
        }
        handleCancel();
      } catch (error) {
        message.error("Thao tác thất bại!");
      }
    });
  };

  const handleDelete = async (task: Todo) => {
    try {
        await deleteTodo(task.id);
        setBoard(prev => {
            const newTasks = { ...prev!.tasks };
            delete newTasks[task.id];
            const column = prev!.columns[task.status];
            const newTaskIds = column.taskIds.filter(id => id !== task.id);
            const newColumn = { ...column, taskIds: newTaskIds };
            return { ...prev!, tasks: newTasks, columns: { ...prev!.columns, [newColumn.id]: newColumn } };
        });
        message.success("Xóa công việc thành công!");
    } catch (error) {
        message.error("Xóa thất bại!");
    }
  }

  if (authLoading || loading || !board) {
    return <FullScreenLoader spinning={true} />;
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-full">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Việc cần làm</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal(null)}>
          Thêm công việc
        </Button>
      </header>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {board.columnOrder.map((columnId) => {
            const column = board.columns[columnId];
            const tasks = column.taskIds.map((taskId) => board.tasks[taskId]);
            return (
              <Droppable droppableId={column.id} key={column.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`bg-gray-100 p-2 rounded-lg transition-colors ${snapshot.isDraggingOver ? 'bg-blue-100' : ''}`}
                  >
                    <h2 className="font-semibold p-2 mb-2">{column.title} ({tasks.length})</h2>
                    <div className="min-h-[200px]">
                        {tasks.map((task, index) => (
                        <Draggable draggableId={task.id} index={index} key={task.id}>
                            {(provided, snapshot) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`mb-2 ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                            >
                                <Card size="small" hoverable>
                                    <div className="flex justify-between">
                                        <span className="font-semibold">{task.title}</span>
                                        <div className="flex items-center gap-1">
                                            <Button size="small" type="text" icon={<EditOutlined />} onClick={() => showModal(task)} />
                                            <Popconfirm title="Bạn chắc chắn muốn xóa?" onConfirm={() => handleDelete(task)}>
                                                <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                                            </Popconfirm>
                                        </div>
                                    </div>
                                    <p className="text-gray-600 text-sm mt-1">{task.content}</p>
                                    <div className="flex justify-between items-center mt-2">
                                        <Tag color={priorityColors[task.priority]}>{task.priority}</Tag>
                                        {task.dueDate && <span className="text-xs text-gray-500">{dayjs(task.dueDate.toDate()).format('DD/MM/YYYY')}</span>}
                                    </div>
                                </Card>
                            </div>
                            )}
                        </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>

      <Modal
        title={editingTask ? "Sửa công việc" : "Thêm công việc mới"}
        open={isModalOpen}
        onCancel={handleCancel}
        onOk={handleOk}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: "Vui lòng nhập tiêu đề!" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="content" label="Nội dung">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="priority" label="Độ ưu tiên" initialValue="Medium" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="High">Cao</Select.Option>
              <Select.Option value="Medium">Trung bình</Select.Option>
              <Select.Option value="Low">Thấp</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="dueDate" label="Hạn chót">
            <DatePicker format="DD/MM/YYYY" />
          </Form.Item>
           <Form.Item name="status" label="Trạng thái" initialValue="todo" rules={[{ required: true }]}>
            <Select disabled={!!editingTask}>
              <Select.Option value="todo">Cần làm</Select.Option>
              <Select.Option value="inprogress">Đang thực hiện</Select.Option>
              <Select.Option value="done">Hoàn thành</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default TodoList;