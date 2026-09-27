// Schema is idempotent (safe on every boot). SEED wipes and refills all tables.

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS tutors (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  rating NUMERIC(2,1) DEFAULT 5.0,
  avatar VARCHAR(50) DEFAULT '🎓',
  earnings_this_month INT DEFAULT 0,
  total_hours_taught NUMERIC(4,1) DEFAULT 0,
  total_students INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);
-- schedule: { "<weekday 0=Sun..6=Sat>": [["HH:MM","HH:MM"], ...] }
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS schedule JSONB NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  level VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS courses (
  code VARCHAR(100) PRIMARY KEY,
  tutor_id VARCHAR(100) NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  rate INT NOT NULL,
  duration_hours NUMERIC(3,1) DEFAULT 2.0,
  tags TEXT[] DEFAULT '{}',
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);
-- mode: online | onsite | hybrid. Inactive courses are hidden from the marketplace and can't be booked.
ALTER TABLE courses ADD COLUMN IF NOT EXISTS subject VARCHAR(50) NOT NULL DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS mode VARCHAR(10) NOT NULL DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS syllabus TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS incoming_requests (
  id BIGSERIAL PRIMARY KEY,
  student_name VARCHAR(255) NOT NULL,
  tutor_id VARCHAR(100) NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  course_code VARCHAR(100) NOT NULL REFERENCES courses(code) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS booked_sessions (
  id BIGSERIAL PRIMARY KEY,
  student_name VARCHAR(255) NOT NULL,
  tutor_id VARCHAR(100) NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  course_title VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  hours NUMERIC(3,1) NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);
ALTER TABLE booked_sessions ADD COLUMN IF NOT EXISTS notes TEXT;`;

export const SEED = `
TRUNCATE tutors, students RESTART IDENTITY CASCADE;

INSERT INTO tutors (id, name, rating, avatar, earnings_this_month, total_hours_taught, total_students, bio, schedule) VALUES
('arisara', 'ดร. อริศรา เค.', 4.9, '🧬', 14850, 33, 12, 'อาจารย์คณิตศาสตร์วิศวกรรม',
  '{"1":[["09:00","11:00"],["13:00","15:00"]],"3":[["17:00","19:00"]],"5":[["15:00","19:00"]]}'),
('kevin', 'โค้ช เควิน สมิธ', 5.0, '🇬🇧', 24000, 40, 18, 'Native English speaking coach',
  '{"2":[["13:00","15:00"],["19:00","21:00"]],"4":[["09:00","11:00"]]}'),
('pitcha', 'ครูพี่พิชชา', 4.8, '✍️', 9450, 27, 8, 'ติวภาษาอังกฤษ ม.ปลาย',
  '{"3":[["15:00","19:00"]],"6":[["09:00","11:00"]]}'),
('natthapat', 'พี่ณัฐภัทร (ตั้ม)', 4.7, '⚙️', 11400, 30, 11, 'ติวฟิสิกส์ ม.ปลาย',
  '{"2":[["17:00","19:00"]],"5":[["15:00","19:00"]]}'),
('dr-chayanon', 'ดร. ชยานนท์', 5.0, '🖥️', 32000, 40, 6, 'Data scientist',
  '{"6":[["13:00","17:00"]],"0":[["09:00","11:00"]]}');

INSERT INTO courses (code, tutor_id, subject, title, rate, duration_hours, tags, mode, syllabus, description) VALUES
('math-calc', 'arisara', 'Mathematics', 'Engineering Calculus I & II', 450, 2.5, '{มหาวิทยาลัย,ติวสอบตรง}', 'hybrid', '{ลิมิตและความต่อเนื่อง,อนุพันธ์และการประยุกต์,อินทิเกรตจำกัดเขต}', 'เจาะลึกวิชาแคลคูลัสวิศวกรรมศาสตร์ ปูพื้นฐานลิมิต อนุพันธ์ และอินทิเกรตอย่างเป็นระบบ'),
('math-alg', 'arisara', 'Mathematics', 'Linear Algebra & Matrix', 400, 2.0, '{มัธยมปลาย,มหาวิทยาลัย}', 'online', '{ระบบสมการเชิงเส้น,เวกเตอร์และเมทริกซ์,ค่าเฉพาะและเวกเตอร์เฉพาะ}', 'เรียนรู้ระบบสมการเชิงเส้น เวกเตอร์ และทฤษฎีเมทริกซ์เพื่อนำไปประยุกต์ใช้งานคอมพิวเตอร์'),
('eng-conv', 'kevin', 'English', 'Fluent English Conversation', 600, 1.5, '{ฝึกพูดภาษาอังกฤษ,วัยทำงาน}', 'online', '{Small talk & networking,Meetings and presentations,Job interview practice}', 'เน้นการสร้างความมั่นใจและการฝึกจำลองสถานการณ์จริงเพื่อการใช้งานได้อย่างเป็นธรรมชาติ'),
('eng-ielts', 'kevin', 'English', 'IELTS Intensive Academic Prep', 750, 2.0, '{IELTS,สอบเรียนต่อ,มหาวิทยาลัย}', 'online', '{Listening,Reading,Writing Task 1 & 2,Speaking mock test}', 'ตะลุยแนวข้อสอบครบทั้ง 4 พาร์ท'),
('eng-grammar', 'pitcha', 'English', 'English Grammar & Writing ม.ปลาย', 350, 2.0, '{มัธยมปลาย,TGAT}', 'onsite', '{Tenses ครบ 12 แบบ,Passive voice และ Conditionals,การเขียนเรียงความ}', 'สรุปโครงสร้างไวยากรณ์ภาษาอังกฤษครบจบในคอร์สเดียว'),
('phy-mechanics', 'natthapat', 'Physics', 'Physics Mechanics (กลศาสตร์ ม.ปลาย)', 380, 2.0, '{มัธยมปลาย}', 'onsite', '{กฎการเคลื่อนที่ของนิวตัน,งานและพลังงาน,โมเมนตัมและการชน}', 'เจาะลึกกฎของนิวตัน แรง มวล และการเคลื่อนที่'),
('data-python', 'dr-chayanon', 'Computer', 'Python for Data Science & AI', 800, 2.0, '{วัยทำงาน}', 'online', '{Python พื้นฐาน,Pandas และ NumPy,Machine learning เบื้องต้น}', 'ปูพื้นฐานการเขียนโปรแกรมวิเคราะห์ข้อมูลขนาดใหญ่');

INSERT INTO students (id, name, level, email, phone) VALUES
('std-mintra', 'น้องมินตรา วรวงศ์', 'มัธยมปลาย', 'mintra.w@windowslive.com', '089-876-5432'),
('std-phoom', 'น้องภูมิ ณภัทร', 'มัธยมปลาย', 'phoom.napat@gmail.com', '081-234-5678'),
('std-anak', 'คุณอนันต์ ชัยดี', 'วัยทำงาน', 'anant.chaidi@company.com', '085-555-9988');

INSERT INTO incoming_requests (student_name, tutor_id, course_code, booking_date, start_time, end_time, notes) VALUES
('น้องภูมิ ณภัทร', 'arisara', 'math-calc', CURRENT_DATE + 1, '13:00', '15:30', 'อยากเน้นเรื่องการหาอนุพันธ์อันดับสูงและอินทิเกรตจำกัดเขตเป็นพิเศษครับ');

INSERT INTO booked_sessions (student_name, tutor_id, course_title, date, start_time, end_time, hours, notes) VALUES
('น้องมินตรา วรวงศ์', 'arisara', 'Engineering Calculus I & II', CURRENT_DATE + 2, '13:00', '15:30', 2.5, 'ขอทบทวนเรื่องอินทิเกรตก่อนสอบกลางภาคค่ะ'),
('คุณอนันต์ ชัยดี', 'kevin', 'Fluent English Conversation', CURRENT_DATE + 4, '18:00', '19:30', 1.5, 'Preparing for a job interview in English');`;
