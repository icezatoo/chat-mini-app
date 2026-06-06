import BotAvatar from "@/components/bot-avatar";
import { IcRestructure, IcLoan, IcWallet, IcAgentChip, IcGo } from "@/components/icons";

const BOT_NAME = "น้องฟิน";

const TOPICS = [
  {
    act: "restructure",
    Icon: IcRestructure,
    title: "ปรึกษาปรับโครงสร้างหนี้",
    sub: "ปรับงวด ลดดอกเบี้ย รวมหนี้เป็นก้อนเดียว",
  },
  {
    act: "products",
    Icon: IcLoan,
    title: "ผลิตภัณฑ์สินเชื่อกรุงไทย",
    sub: "สินเชื่อบ้าน รถ ส่วนบุคคล และธุรกิจ",
  },
  {
    act: "balance",
    Icon: IcWallet,
    title: "ตรวจสอบยอดและชำระ",
    sub: "ยอดคงเหลือ งวดถัดไป และเมนูลัด",
  },
  {
    act: "agent",
    Icon: IcAgentChip,
    title: "คุยกับเจ้าหน้าที่",
    sub: "เชื่อมต่อทีมที่ปรึกษาตัวจริง",
  },
];

interface WelcomeProps {
  onPick: (act: string) => void;
}

export default function Welcome({ onPick }: WelcomeProps) {
  return (
    <div className="welcome">
      <div className="welcome-hero">
        <div className="welcome-avatar">
          <BotAvatar size={64} float />
        </div>
        <h1 className="welcome-greet">สวัสดีค่ะ ยินดีให้คำปรึกษา</h1>
        <p className="welcome-sub">
          ดิฉัน <b>{BOT_NAME}</b> ผู้ช่วยที่ปรึกษาทางการเงิน ดูแลเรื่องการปรับโครงสร้างหนี้
          และผลิตภัณฑ์ธนาคารกรุงไทย เลือกหัวข้อด้านล่าง หรือพิมพ์คำถามได้เลยค่ะ
        </p>
      </div>
      <div className="suggest-label">หัวข้อยอดนิยม</div>
      <div className="suggest-list">
        {TOPICS.map((item) => (
          <button key={item.act} className="suggest-card" onClick={() => onPick(item.act)}>
            <span className="suggest-ico">
              <item.Icon />
            </span>
            <span className="suggest-txt">
              {item.title}
              <span className="suggest-sub">{item.sub}</span>
            </span>
            <span className="suggest-go">
              <IcGo />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
