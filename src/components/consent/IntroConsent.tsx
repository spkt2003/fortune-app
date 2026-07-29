import ShrineFrame from "@/components/ui/ShrineFrame";
import SealMark from "@/components/ui/SealMark";

interface IntroConsentProps {
  onAccept: () => void;
}

export default function IntroConsent({ onAccept }: IntroConsentProps) {
  return (
    <ShrineFrame className="flex w-full max-w-lg flex-col gap-6">
      <div className="flex items-center gap-3">
        <SealMark />
        <h1 className="font-display text-2xl font-bold text-gold">
          ยินดีต้อนรับสู่ระบบทำนายโหงวเฮ้ง
        </h1>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold tracking-wide text-gold">
          วิธีใช้งาน
        </h2>
        <ol className="list-decimal space-y-1 pl-5 text-parchment">
          <li>เปิดกล้องและถ่ายภาพใบหน้าของคุณ</li>
          <li>ระบบจะวิเคราะห์ลักษณะใบหน้าโดยอัตโนมัติ</li>
          <li>กรอกเพศและอายุเพื่อเสริมบริบท</li>
          <li>รับคำทำนายโหงวเฮ้ง 4 ด้าน: การงาน ความรัก สุขภาพ การเงิน</li>
        </ol>
        <p className="text-sm font-medium text-amber-400">
          เพื่อความบันเทิงเท่านั้น ไม่ใช่การพยากรณ์ทางวิทยาศาสตร์
        </p>
      </section>

      <section className="flex flex-col gap-2 rounded-lg border border-gold/20 bg-ink/40 p-4">
        <h2 className="text-sm font-semibold tracking-wide text-gold">
          ข้อตกลงความเป็นส่วนตัว (PDPA)
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-parchment">
          <li>
            ระบบไม่บันทึกหรือจัดเก็บภาพถ่ายของคุณ ไม่มีฐานข้อมูลใดๆ ทั้งสิ้น
          </li>
          <li>
            ภาพจะถูกประมวลผลเฉพาะในเครื่อง/เบราว์เซอร์ของคุณเท่านั้น (on-device)
            เพื่อคำนวณลักษณะใบหน้าเป็นค่าตัวเลข
          </li>
          <li>
            มีเพียงค่าตัวเลขลักษณะใบหน้า + เพศ + อายุ ที่ถูกส่งไปยังระบบ AI
            เพื่อสร้างคำทำนาย และจะไม่ถูกบันทึกเก็บไว้หลังแสดงผลลัพธ์
          </li>
          <li>
            ไม่มีการเก็บชื่อ ข้อมูลติดต่อ หรือข้อมูลที่สามารถระบุตัวตนได้อื่นใด
          </li>
          <li>ไม่มีระบบ login/บัญชีผู้ใช้ ไม่มีการติดตามผู้ใช้ข้ามครั้ง</li>
        </ul>
      </section>

      <button
        type="button"
        onClick={onAccept}
        className="rounded-full bg-lacquer px-6 py-3 font-medium text-parchment transition hover:brightness-110"
      >
        เข้าใจแล้ว และยินยอมเริ่มใช้งาน
      </button>

      <p className="text-center text-xs text-parchment/50">
        ผลงานของ นายธนกร ปิ่นสุข นักศึกษาสาขาวิทยาการคอมพิวเตอร์
        คณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยหัวเฉียวเฉลิมพระเกียรติ
      </p>
    </ShrineFrame>
  );
}
