// App.js
import React, { useState, useEffect } from 'react';
import './Home.css';
import background from '@/assets/img/background_home.jpg';
import avatar from '@/assets/img/avatar.png';
import logo from '@/assets/img/logo_full.png';
import { useNavigate } from 'react-router-dom';
import { MenuOutlined, CodeOutlined, DatabaseOutlined, HddOutlined, ToolOutlined, HighlightOutlined, MobileOutlined, GithubOutlined, LinkOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined, LinkedinOutlined, FacebookOutlined, TwitterOutlined, InstagramOutlined, } from '@ant-design/icons';
import { notification } from 'antd';
import ScrollToTop from '@/components/ScrollToTop';

import AOS from 'aos';
import { sendMessage } from '@/services/telegramService';
import 'aos/dist/aos.css';

const Home = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const [loading, setLoading] = useState(false);
  const [api, contextHolder] = notification.useNotification();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { name, email, subject, message } = formData;

    if (!name.trim()) {
      api.error({ message: 'Lỗi', description: 'Vui lòng nhập họ và tên.' });
      return;
    }
    if (!email.trim()) {
      api.error({ message: 'Lỗi', description: 'Vui lòng nhập email.' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      api.error({ message: 'Lỗi', description: 'Vui lòng nhập một địa chỉ email hợp lệ.' });
      return;
    }
    if (!subject.trim()) {
      api.error({ message: 'Lỗi', description: 'Vui lòng nhập chủ đề.' });
      return;
    }
    if (!message.trim()) {
      api.error({ message: 'Lỗi', description: 'Vui lòng nhập tin nhắn.' });
      return;
    }

    setLoading(true);
    const success = await sendMessage(formData);
    setLoading(false);

    if (success) {
      api.success({
        message: 'Thành công',
        description: 'Tin nhắn của bạn đã được gửi thành công!',
      });
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
    } else {
      api.error({
        message: 'Lỗi',
        description: 'Không thể gửi tin nhắn. Vui lòng thử lại sau.',
      });
    }
  };

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'about', 'skills', 'projects', 'contact'];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetHeight = element.offsetHeight;

          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const gotoCV = () => {
    window.open('https://www.topcv.vn/xem-cv/VFwBUA9RVlwJA1UHXQAJBgxdVFYPUgxSV1oEBg23f6', '_blank');
  };


  const scrollToSection = (sectionId: any) => {
    if (sectionId === 'app') {
      navigate(`/app-pope/todolist`)
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsMenuOpen(false);
  };

  const skills = [
    {
      category: 'Frontend',
      icon: <CodeOutlined />,
      items: [
        { name: 'HTML5 & CSS3', level: 95 },
        { name: 'React', level: 80 },
        { name: 'Vue.js', level: 90 }
      ]
    },
    {
      category: 'Backend',
      icon: <DatabaseOutlined />,
      items: [
        { name: 'Node.js', level: 40 },
        { name: 'PHP', level: 10 },
        // { name: 'PHP & Laravel', level: 75 }
      ]
    },
    {
      category: 'Database',
      icon: <HddOutlined />,
      items: [
        { name: 'MySQL', level: 50 },
        { name: 'MongoDB', level: 40 },
        { name: 'Firebase', level: 45 }
      ]
    },
    {
      category: 'Tools & DevOps',
      icon: <ToolOutlined />,
      items: [
        { name: 'Git & GitHub', level: 90 },
        { name: 'Docker', level: 10 },
        // { name: 'Linux & CI/CD', level: 70 }
      ]
    },
    {
      category: 'Design',
      icon: <HighlightOutlined />,
      items: [
        { name: 'Figma', level: 60 },
        { name: 'Adobe XD', level: 15 },
        { name: 'Photoshop & Illustrator', level: 20 }
      ]
    },
    {
      category: 'Mobile',
      icon: <MobileOutlined />,
      items: [
        { name: 'React Native', level: 30 },
        // { name: 'Flutter', level: 65 },
        // { name: 'Progressive Web Apps', level: 80 }
      ]
    }
  ];

  const projects = [
    {
      title: 'LPBI insurance',
      description: 'Dự án phát triển hệ thống quản lý bảo hiểm theo yêu cầu của đối tác, bao gồm các tính năng quản lý bảo hiểm, hoa hồng, khách hàng, ...',
      tags: ['React', 'Typescript', 'Git'],
      image: 'https://readdy.ai/api/search-image?query=modern%20e-commerce%20website%20interface%20clean%20design%20product%20showcase%20shopping%20cart%20responsive%20layout%20professional%20online%20store%20user%20friendly%20interface%20contemporary%20web%20design%20minimalist%20style&width=400&height=250&seq=project1&orientation=landscape',
      demo: '#',
      code: '#'
    },
    {
      title: 'BIOPORT',
      description: 'Dự án BIOPORT là ứng dụng web hỗ trợ tư vấn y tế từ xa, cho phép bác sĩ khám và kê đơn trực tuyến, người dùng thanh toán online. Phát triển giao diện Admin và User bằng VueJS, ReactJS, tích hợp API, phân quyền và cập nhật theo yêu cầu khách hàng Nhật Bản.',
      tags: ['Vue.js', 'Reactjs', 'Socket.io'],
      image: 'https://readdy.ai/api/search-image?query=task%20management%20application%20dashboard%20kanban%20board%20project%20tracking%20team%20collaboration%20interface%20productivity%20tool%20modern%20ui%20clean%20layout%20professional%20workspace%20management%20system&width=400&height=250&seq=project2&orientation=landscape',
      demo: '#',
      code: '#'
    },
    {
      title: 'Web thiết bị Thiên Hoàng Hải',
      description: 'Phát triển website giới thiệu và bán thiết bị theo thiết kế, tối ưu hiển thị trên mọi thiết bị và chuẩn SEO. Sử dụng NextJS, RestAPI, tích hợp API và thiết lập router động cho nội dung linh hoạt.',
      tags: ['Nextjs', 'RestAPI'],
      image: 'https://readdy.ai/api/search-image?query=social%20media%20platform%20interface%20news%20feed%20user%20profiles%20messaging%20system%20modern%20social%20network%20design%20community%20platform%20interactive%20ui%20contemporary%20social%20app%20layout&width=400&height=250&seq=project3&orientation=landscape',
      demo: '#',
      code: '#'
    },
    {
      title: 'Hotel management platform',
      description: 'Dự án nền tảng quản lý khách sạn được phát triển nội bộ, hỗ trợ quản lý phòng, thẻ, khu vực, hóa đơn và thanh toán. Sử dụng VueJS, RestAPI và Socket để xây dựng giao diện, phân quyền theo vai trò và kết nối phần mềm khóa thông minh cho xử lý dữ liệu thẻ.',
      tags: ['Vuejs', 'Socket'],
      image: 'https://readdy.ai/api/search-image?query=learning%20management%20system%20online%20education%20platform%20course%20dashboard%20student%20interface%20e-learning%20website%20educational%20technology%20modern%20lms%20design%20academic%20portal&width=400&height=250&seq=project4&orientation=landscape',
      demo: '#',
      code: '#'
    },
    {
      title: 'Ytool',
      description: 'Ứng dụng hỗ trợ lấy và gợi ý tag từ video YouTube nhằm tăng khả năng tiếp cận. Phát triển giao diện theo Figma, tích hợp API YouTube bằng React Native, Redux và RestAPI.',
      tags: ['React Native', 'Redux', 'RestAPI'],
      image: 'https://readdy.ai/api/search-image?query=weather%20application%20interface%20forecast%20dashboard%20meteorology%20app%20climate%20data%20visualization%20weather%20widget%20modern%20weather%20ui%20atmospheric%20conditions%20mobile%20weather%20app&width=400&height=250&seq=project5&orientation=landscape',
      demo: '#',
      code: '#'
    },
    {
      title: 'Coin trading website',
      description: 'Dự án website giao dịch coin được phát triển fullstack, hỗ trợ giao dịch và quản lý người dùng, admin, coin, và đơn hàng theo thời gian thực. Sử dụng VueJS, NodeJS, MongoDB, socket, VietQR, và Telegram bot để tích hợp thanh toán, bảo mật và thông báo giao dịch tự động.',
      tags: ['Vuejs', 'Nodejs', 'MongoDB', 'socket', 'VietQR', 'Telegram bot'],
      image: 'https://readdy.ai/api/search-image?query=cryptocurrency%20trading%20platform%20dashboard%20bitcoin%20exchange%20interface%20financial%20charts%20crypto%20wallet%20blockchain%20technology%20trading%20interface%20digital%20currency%20market%20analysis&width=400&height=250&seq=project6&orientation=landscape',
      demo: '#',
      code: '#'
    }
  ];

  return (
    <div className="App">
      {contextHolder}
      <ScrollToTop />
      {/* Header Navigation */}
      <header className={`py-1.5 fixed top-0 w-full z-50 backdrop-blur-sm border-b border-slate-700 bg-slate-900/95 ${isMenuOpen ? 'bg-slate-900' : ''}`}>
        <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-primary glow-text">
            <img
              src={logo}
              alt="Logo"
              className="w-[60px] md:w-[100px] h-full invert object-cover object-center"
            />
          </div>
          <div className="hidden md:flex gap-10">
            {['about', 'skills', 'projects', 'contact', 'app'].map((section) => (
              <button
                key={section}
                onClick={() => scrollToSection(section)}
                className={`hover:text-primary transition-colors cursor-pointer ${activeSection === section ? 'text-primary' : ''}`}
              >
                {section === 'about' && 'Giới thiệu'}
                {section === 'skills' && 'Kỹ năng'}
                {section === 'projects' && 'Dự án'}
                {section === 'contact' && 'Liên hệ'}
                {section === 'app' && 'App cá nhân'}
              </button>
            ))}
          </div>
          <button
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <MenuOutlined />
          </button>
        </nav>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-slate-900/95 py-4 px-6">
            <div className="flex flex-col space-y-3">
              {['about', 'skills', 'projects', 'contact', 'app'].map((section) => (
                <button
                  key={section}
                  onClick={() => scrollToSection(section)}
                  className={`text-left py-2 hover:text-primary transition-colors ${activeSection === section ? 'text-primary' : ''}`}
                >
                  {section === 'about' && 'Giới thiệu'}
                  {section === 'skills' && 'Kỹ năng'}
                  {section === 'projects' && 'Dự án'}
                  {section === 'contact' && 'Liên hệ'}
                  {section === 'app' && 'App cá nhân'}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section style={{ backgroundImage: `url(${background})` }} id="home" className="bg-center bg-cover bg-no-repeat min-h-screen flex items-center justify-center code-bg relative overflow-hidden pt-20">
        <div className="absolute inset-0 bg-slate-900/70"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left">
              <div className="text-secondary mb-4 text-lg">console.log("Xin chào! Tôi là")</div>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 glow-text">
                Nguyễn<br />
                <span className="text-secondary">Trung Phong</span>
              </h1>
              <div className="text-xl md:text-2xl mb-6 text-slate-300">
                Front-end Developer
              </div>
              <p className="text-lg mb-8 text-slate-400 leading-relaxed">
                Tôi tạo ra những trải nghiệm web tuyệt vời với code sạch và thiết kế đẹp mắt.
                Đam mê công nghệ và luôn học hỏi những điều mới mẻ.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={gotoCV} className="cursor-pointer bg-primary text-slate-900 px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap">
                  Xem CV của tôi
                </button>
                <button onClick={() => scrollToSection('contact')} className=" cursor-pointer border border-secondary text-secondary px-8 py-3 rounded-lg font-semibold hover:bg-secondary hover:text-slate-900 transition-colors whitespace-nowrap">
                  Liên hệ ngay
                </button>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-80 h-80 rounded-full terminal-border p-2">
                <img
                  src={avatar}
                  alt="Nguyễn Trung Phong"
                  className="w-full h-full rounded-full object-cover object-center"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Me Section */}
      <section id="about" className="py-20 bg-slate-800">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16" data-aos="fade-up">
            <h2 className="text-4xl font-bold mb-4 text-primary">&lt; Về tôi /&gt;</h2>
            <div className="w-20 h-1 bg-[#00ff88] mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="space-y-6" data-aos="fade-up" data-aos-delay="200">
              <h3 className="text-2xl font-semibold text-secondary mb-4">Câu chuyện của tôi</h3>
              <p className="text-slate-300 leading-relaxed">
                Với hơn 3 năm kinh nghiệm trong lĩnh vực phát triển web, tôi đã tham gia xây dựng
                nhiều dự án từ website doanh nghiệp đến ứng dụng web phức tạp. Tôi tin rằng code
                tốt không chỉ hoạt động mà còn phải dễ đọc và bảo trì.
              </p>
              <p className="text-slate-300 leading-relaxed">
                Tôi luôn theo đuổi sự hoàn hảo trong từng dòng code và không ngừng học hỏi
                các công nghệ mới để mang lại giá trị tốt nhất cho khách hàng. Đam mê của tôi
                là biến những ý tưởng thành hiện thực thông qua công nghệ.
              </p>
            </div>
            <div className="skill-card p-6 !rounded-lg" data-aos="fade-up" data-aos-delay="400">
              <h3 className="text-xl font-semibold text-secondary mb-6">Thông tin cá nhân</h3>
              <div className="space-y-4 font-mono text-sm">
                <div className="flex">
                  <span className="text-primary w-24">Name:</span>
                  <span className="text-slate-300">Nguyễn Trung Phong</span>
                </div>
                <div className="flex">
                  <span className="text-primary w-24">Dob:</span>
                  <span className="text-slate-300">10/08/1999</span>
                </div>
                <div className="flex">
                  <span className="text-primary w-24">Location:</span>
                  <span className="text-slate-300">Hà Nội, Việt Nam</span>
                </div>
                <div className="flex">
                  <span className="text-primary w-24">Email:</span>
                  <span className="text-slate-300">phong99tb@gmail.com</span>
                </div>
                <div className="flex">
                  <span className="text-primary w-24">Phone:</span>
                  <span className="text-slate-300">0967810899</span>
                </div>
                <div className="flex">
                  <span className="text-primary w-24">Status:</span>
                  <span className="text-secondary">Sẵn sàng làm việc</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="py-20 code-bg">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16" data-aos="fade-up">
            <h2 className="text-4xl font-bold mb-4 text-primary">&lt; Kỹ năng /&gt;</h2>
            <div className="w-20 h-1 bg-[#00ff88] mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {skills.map((skill, index) => (
              <div key={index} className="skill-card p-6 !rounded-lg" data-aos="fade-up" data-aos-delay={index * 100}>
                <div className="w-12 h-12 flex items-center justify-center bg-orange-500 !rounded-lg mb-4 text-2xl text-white">
                  {skill.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-secondary">{skill.category}</h3>
                {skill.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="space-y-3 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{item.name}</span>
                      <span className="text-primary text-sm">{item.level}%</span>
                    </div>
                    <div className="w-full bg-slate-700 !rounded-full h-2">
                      <div
                        className="bg-primary h-2 !rounded-full"
                        style={{ width: `${item.level}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 bg-slate-800">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16" data-aos="fade-up">
            <h2 className="text-4xl font-bold mb-4 text-primary">&lt; Dự án /&gt;</h2>
            <div className="w-20 h-1 bg-[#00ff88] mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
              <div key={index} className="project-card p-6 !rounded-lg" data-aos="fade-up" data-aos-delay={index * 100}>
                <div className="mb-4 overflow-hidden !rounded-lg">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-48 object-cover object-top hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-secondary">{project.title}</h3>
                <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tags.map((tag, tagIndex) => (
                    <span key={tagIndex} className="bg-blue-500/20 text-blue-300 px-2 py-1 !rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
                {/* <div className="flex gap-3">
                  <button className="bg-primary text-slate-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap flex items-center gap-2">
                    <LinkOutlined />
                    Demo
                  </button>
                  <button className="border border-secondary text-secondary px-4 py-2 rounded-lg text-sm font-semibold hover:bg-secondary hover:text-slate-900 transition-colors whitespace-nowrap flex items-center gap-2">
                    <GithubOutlined />
                    Code
                  </button>
                </div> */}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 code-bg">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16" data-aos="fade-up">
            <h2 className="text-4xl font-bold mb-4 text-primary">&lt; Liên hệ /&gt;</h2>
            <div className="w-20 h-1 bg-[#00ff88] mx-auto"></div>
            <p className="text-slate-300 !mt-6 max-w-2xl !mx-auto">
              Bạn có dự án thú vị? Hãy cùng tôi thảo luận và biến ý tưởng thành hiện thực!
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Form */}
            <div className="terminal-border p-8 !rounded-lg bg-slate-900/50" data-aos="fade-up" data-aos-delay="200">
              <h3 className="text-2xl font-semibold mb-6 text-secondary">Gửi tin nhắn</h3>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-300">Họ và tên</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-slate-800 border border-slate-600 !rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none transition-colors text-sm"
                    placeholder="Nhập họ và tên của bạn"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-300">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-slate-800 border border-slate-600 !rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none transition-colors text-sm"
                    placeholder="your.email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-300">Chủ đề</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full bg-slate-800 border border-slate-600 !rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none transition-colors text-sm"
                    placeholder="Chủ đề tin nhắn"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-300">Tin nhắn</label>
                  <textarea
                    rows={5}
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full bg-slate-800 border border-slate-600 !rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none transition-colors resize-none text-sm"
                    placeholder="Nội dung tin nhắn của bạn..."
                  ></textarea>
                </div>
                <button type="submit" disabled={loading} className="cursor-pointer w-full bg-primary text-slate-900 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap disabled:opacity-50">
                  {loading ? 'Đang gửi...' : 'Gửi tin nhắn'}
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-8" data-aos="fade-up" data-aos-delay="400">
              <div className="skill-card p-6 !rounded-lg">
                <h3 className="text-xl font-semibold mb-6 text-secondary">Thông tin liên hệ</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center bg-primary/20 !rounded-lg text-primary text-xl">
                      <MailOutlined />
                    </div>
                    <div>
                      <div className="text-sm text-slate-400">Email</div>
                      <div className="text-white">phong99tb@gmail.com</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center bg-secondary/20 !rounded-lg text-secondary text-xl">
                      <PhoneOutlined />
                    </div>
                    <div>
                      <div className="text-sm text-slate-400">Điện thoại</div>
                      <div className="text-white">0967810899</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center bg-blue-500/20 !rounded-lg text-blue-400 text-xl">
                      <EnvironmentOutlined />
                    </div>
                    <div>
                      <div className="text-sm text-slate-400">Địa chỉ</div>
                      <div className="text-white">Hà Nội, Việt Nam</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="skill-card p-6 !rounded-lg">
                <h3 className="text-xl font-semibold mb-6 text-secondary">Kết nối với tôi</h3>
                <div className="flex gap-4">
                  <a href={import.meta.env.VITE_LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-blue-600 hover:bg-blue-700 !rounded-lg transition-colors text-white text-xl">
                    <LinkedinOutlined />
                  </a>
                  <a href={import.meta.env.VITE_GITHUB_URL} target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-gray-800 hover:bg-gray-700 !rounded-lg transition-colors text-white text-xl">
                    <GithubOutlined />
                  </a>
                  <a href={import.meta.env.VITE_FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-blue-500 hover:bg-blue-600 !rounded-lg transition-colors text-white text-xl">
                    <FacebookOutlined />
                  </a>
                </div>
              </div>

              <div className="skill-card p-6 !rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-secondary">Thời gian làm việc</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Thứ 2 - Thứ 6</span>
                    <span className="text-white">8:00 - 18:30</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Thứ 7, Chủ nhật</span>
                    <span className="text-secondary">Nghỉ</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-8 border-t border-slate-700">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-slate-400 mb-4 md:mb-0">
              © 2025 Nguyễn Trung Phong. All rights reserved.
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-slate-400 hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="text-slate-400 hover:text-primary transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
