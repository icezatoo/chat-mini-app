"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const ICON_URL = "https://cdn-icons-png.flaticon.com/512/3135/3135706.png";

export interface OfferCardEntry {
  jsonType: string;
  planId: string;
  offerCard: OfferCardData;
}

export interface OfferCardData {
  plan_id: string;
  plan_desc: string;
  ncb_badge: string;
  accounts: string;
  cnt_eligible: string;
  cnt_total: string;
  total_os: string;
  prev_inst: string;
  new_inst: string;
  step_label: string;
  source_desc: string;
  int_rate_new: string;
  term_actual_old: string;
  term_remain_new: string;
  term_change: string;
  inst_y2y3: string;
  inst_after_3m: string;
  int_total_change: string;
  balloon_rows: string[];
  notes: string[];
  account_details: AccountDetailData[];
}

export interface AccountDetailData {
  acc_no: string;
  acc_name: string;
  os: string;
  int_rate: string;
  term_old: string;
  term_change: string;
  inst_old: string;
  inst_change: string;
  inst_change_y1?: string;
  inst_y2y3?: string;
  inst_after_3m?: string;
  inst_new_loan?: string;
  balloon_payment?: string;
  int_total_old: string;
  int_total_change: string;
  inelig_note: string;
}

type OfferCardsBlockProps = {
  cards: OfferCardEntry[];
  onApply?: (entry: OfferCardEntry) => void;
};

export default function OfferCardsBlock({ cards, onApply }: OfferCardsBlockProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="sys-divider">
        <span>จากความต้องการ น้องฟินมีข้อเสนอ {cards.length} แผนให้พิจารณาค่ะ</span>
      </div>
      {cards.map((entry) => (
        <OfferCardFrame key={entry.planId} entry={entry} onApply={onApply} />
      ))}
    </div>
  );
}

function OfferCardFrame({
  entry,
  onApply,
}: {
  entry: OfferCardEntry;
  onApply?: (entry: OfferCardEntry) => void;
}) {
  const [showDetail, setShowDetail] = useState(false);
  const offer = entry.offerCard;
  const balloonText = useMemo(() => buildBalloonLine(offer.balloon_rows), [offer.balloon_rows]);

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[#00a4e5]/10 bg-white p-3 shadow-[0_4px_12px_rgba(0,164,229,0.08)]">
      {showDetail ? (
        <DetailView
          offer={offer}
          balloonText={balloonText}
          onBack={() => setShowDetail(false)}
          onApply={() => onApply?.(entry)}
        />
      ) : (
        <SummaryView offer={offer} balloonText={balloonText} onOpen={() => setShowDetail(true)} />
      )}
    </div>
  );
}

function SummaryView({
  offer,
  balloonText,
  onOpen,
}: {
  offer: OfferCardData;
  balloonText: string;
  onOpen: () => void;
}) {
  return (
    <>
      <div className="mb-2 flex items-start gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#e6f7fd]">
          <img className="h-4.5 w-4.5" src={ICON_URL} alt="" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="mb-0.5 block text-[10px] font-bold text-[#111827]">
            พิจารณาสินเชื่อเลขที่บัญชี {offer.accounts}
          </span>
          {offer.ncb_badge ? (
            <div className="mt-1.5 inline-block rounded-full bg-[#fff4e5] px-2 py-[3px] text-[9px] font-bold text-[#b45309]">
              {offer.ncb_badge}
            </div>
          ) : null}
          <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-[#fde047] bg-[#fefce8] px-2.5 py-1 text-[9px] font-bold whitespace-nowrap text-[#854d0e]">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#eab308]" />
            ข้อเสนอเบื้องต้น
          </div>
        </div>
      </div>

      <div className="my-3 rounded-[14px] bg-[#e6f7fd] p-3 text-center">
        <div className="mb-1.5 text-[11px] text-[#6b7280]">ลดค่างวดรายเดือน{offer.step_label || ""}</div>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <div className="text-[22px] font-bold text-[#111827]">{offer.prev_inst}</div>
          <div className="text-[18px] font-bold text-[#00a4e5]">→</div>
          <div>
            <span className="text-[22px] font-bold text-[#00a4e5]">{offer.new_inst}</span>
            <span className="ml-0.5 text-[11px] text-[#6b7280]">บาท</span>
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-1.5">
        <ValueRow label="พิจารณาจากภาระหนี้คงเหลือรวม" value={formatMoney(offer.total_os)} />
        <ValueRow label="ปรับจำนวนงวด" value={offer.term_remain_new || offer.term_change || ""} strong />
        <ValueRow label="ปรับค่างวดผ่อนชำระในปีที่ 2 และ 3" value={offer.inst_y2y3} strong />
        <ValueRow label="ภายหลังจาก 3 เดือนกลับมาผ่อนชำระที่อัตรา" value={offer.inst_after_3m} strong />
        <ValueRow label="การเปลี่ยนแปลงดอกเบี้ยรวมตลอดสัญญา" value={offer.int_total_change} />
      </div>

      {balloonText ? (
        <div className="mt-2 rounded-[10px] border border-[#e5e7eb] bg-[#f9fafb] px-2.5 py-2 text-[11px] font-bold text-[#374151]">
          {balloonText}
        </div>
      ) : null}

      <button
        type="button"
        className="mt-2.5 block w-full rounded-[10px] border-none bg-[#00a4e5] px-3 py-[11px] text-center text-[12px] font-bold text-white no-underline active:bg-[#0090cc]"
        onClick={onOpen}
      >
        ดูรายละเอียดและสมัคร
      </button>
    </>
  );
}

function DetailView({
  offer,
  balloonText,
  onBack,
  onApply,
}: {
  offer: OfferCardData;
  balloonText: string;
  onBack: () => void;
  onApply: () => void;
}) {
  const notes = offer.notes ?? [];
  const summaryCells = [
    ["จำนวนบัญชีที่เข้าร่วม/พิจารณา", `${offer.cnt_eligible}/${offer.cnt_total} บัญชี`],
    ["ภาระหนี้คงเหลือรวม", formatMoney(offer.total_os)],
    ["ค่างวดรวมเดิม", formatMoney(offer.prev_inst)],
    ["ค่างวดรวมใหม่", formatMoney(offer.new_inst)],
  ] as const;

  return (
    <>
      <div className="mb-3">
        <div className="text-[14px] font-bold text-[#111827]">รายละเอียดมาตรการแยกตามบัญชี</div>
        <div className="mt-0.5 text-[11px] leading-[1.4] text-[#6b7280]">
          กรุณาตรวจสอบเงื่อนไขและผลกระทบของแต่ละบัญชีก่อนสมัคร
        </div>
      </div>

      <div className="mb-2 flex items-start gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#e6f7fd]">
          <img className="h-4.5 w-4.5" src={ICON_URL} alt="" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="mb-0.5 block text-[10px] font-bold text-[#9ca3af]">{offer.plan_id}</span>
          <div className="text-[12px] font-bold leading-[1.4] wrap-break-word text-[#111827]">
            {offer.plan_desc}
          </div>
          {offer.ncb_badge ? (
            <div className="mt-1.5 inline-block rounded-full bg-[#fff4e5] px-2 py-0.75 text-[9px] font-bold text-[#b45309]">
              {offer.ncb_badge}
            </div>
          ) : null}
          <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-[#fde047] bg-[#fefce8] px-2.5 py-1 text-[9px] font-bold whitespace-nowrap text-[#854d0e]">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#eab308]" />
            ข้อเสนอเบื้องต้น
          </div>
        </div>
      </div>

      <div className="mt-2.5 rounded-xl border border-[#00a4e5]/20 bg-[#e6f7fd] p-2.5">
        <div className="grid grid-cols-2 gap-2">
          {summaryCells.map(([label, value]) => (
            <div key={label} className="rounded-[10px] border border-[#00a4e5]/15 bg-white p-2">
              <div className="mb-0.5 text-[10px] text-[#6b7280]">{label}</div>
              <div className="text-[12px] font-bold wrap-break-word text-[#111827]">{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-[#00a4e5]/15 bg-[#f8fcff] p-2.5">
        <div className="mb-2 text-[11px] font-bold text-[#111827]">ภาพรวมข้อเสนอ</div>
        <div className="mt-2 rounded-[10px] border border-[#00a4e5]/20 bg-[#f0faff] px-2.5 py-2">
          <div className="mb-0.5 text-[10px] text-[#6b7280]">บัญชีที่พิจารณาเข้าร่วมมาตรการ</div>
          <div className="text-[12px] font-bold wrap-break-word text-[#111827]">{offer.accounts}</div>
        </div>
        <div className="mt-2 flex flex-col gap-1.5">
          <ValueRow label="ภาระหนี้คงเหลือรวม" value={formatMoney(offer.total_os)} />
          <ValueRow label="พิจารณาข้อเสนอ" value={offer.source_desc} />
          <ValueRow label="อัตราดอกเบี้ยใหม่" value={offer.int_rate_new} strong />
          <ValueRow label="ระยะเวลาผ่อนชำระจากอัตราผ่อนชำระเดิม" value={offer.term_actual_old} />
          <ValueRow label="ระยะเวลาผ่อนชำระจากอัตราผ่อนชำระใหม่" value={offer.term_remain_new} strong />
          <ValueRow label="ระยะเวลาผ่อนชำระ" value={offer.term_change} strong />
          <ValueRow label="ค่างวดผ่อนชำระในปีที่ 2 และ 3" value={offer.inst_y2y3} strong />
          <ValueRow label="อัตราผ่อนชำระรวมภายหลังจาก 3 เดือน" value={offer.inst_after_3m} strong />
          <ValueRow label="ดอกเบี้ยรวมตลอดสัญญา" value={offer.int_total_change} />
        </div>
        {balloonText ? (
          <div className="mt-2 rounded-[10px] border border-[#e5e7eb] bg-[#f9fafb] px-2.5 py-2 text-[11px] font-bold text-[#374151]">
            {balloonText}
          </div>
        ) : null}
      </div>

      <div className="mt-3">
        <div className="mb-2 text-[12px] font-bold text-[#111827]">รายละเอียดรายบัญชี</div>
        {(offer.account_details ?? []).map((account, index) => (
          <div
            key={account.acc_no || account.acc_name}
            className="mt-2 rounded-[14px] border border-[#00a4e5]/20 bg-[#f8fcff] p-3 first:mt-0"
          >
            <div className="mb-1.5 inline-block rounded-full bg-[#e6f7fd] px-2 py-1 text-[10px] font-bold text-[#00a4e5]">
              บัญชีที่ {index + 1}
            </div>
            <div className="wrap-break-word text-[12px] font-bold text-[#111827]">{account.acc_name}</div>
            <div className="mt-0.5 wrap-break-word text-[10px] text-[#6b7280]">
              เลขที่บัญชี {account.acc_no}
            </div>
            <div className="mt-2 flex flex-col gap-1.75">
              <ValueRow label="ยอดหนี้คงเหลือ" value={formatMoney(account.os)} />
              <ValueRow label="อัตราดอกเบี้ย" value={formatPercent(account.int_rate)} />
              <ValueRow label="ระยะเวลาผ่อนชำระตามสัญญาเดิม" value={account.term_old} />
              <ValueRow label="ระยะเวลาผ่อนชำระ" value={account.term_change} strong />
              <ValueRow label="ค่างวดผ่อนชำระตามสัญญาเดิม" value={account.inst_old} />
              <ValueRow label="ค่างวดผ่อนชำระ" value={account.inst_change} strong />
              <ValueRow label="ค่างวดผ่อนชำระในปีที่แรก" value={account.inst_change_y1} strong />
              <ValueRow label="ค่างวดผ่อนชำระในปีที่ 2 และ 3" value={account.inst_y2y3} strong />
              <ValueRow label="อัตราผ่อนชำระรวมภายหลังจาก 3 เดือน" value={account.inst_after_3m} strong />
              <ValueRow label="อัตราการผ่อนชำระของสินเชื่อเพื่อเงินใหม่" value={account.inst_new_loan} strong />
              <ValueRow label="ค่างวดชำระส่วนสุดท้ายหลังสิ้นสุดสัญญา" value={account.balloon_payment} strong />
              <ValueRow label="ดอกเบี้ยรวมตลอดสัญญาตามสัญญาเดิม" value={account.int_total_old} />
              <ValueRow label="ดอกเบี้ยรวมตลอดสัญญา" value={account.int_total_change} strong />
            </div>
            {account.inelig_note ? (
              <div className="mt-2 rounded-[10px] border border-[#e5e7eb] bg-[#f9fafb] px-2.5 py-2">
                <div className="mb-1 text-[10px] font-bold text-[#111827]">หมายเหตุ</div>
                <div className="wrap-break-word text-[10px] leading-[1.45] text-[#6b7280]">{account.inelig_note}</div>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-xl border border-[#00a4e5]/15 bg-[#f8fcff] p-2.5">
        <div className="mb-2 text-[11px] font-bold text-[#111827]">เงื่อนไขสำคัญ</div>
        <ul className="m-0 list-disc pl-[18px]">
          <li>ข้อเสนอนี้เป็นเพียงการประเมินเบื้องต้น มิได้เป็นการรับประกันหรือยืนยันการอนุมัติ</li>
          {notes.map((note) => (
            <li key={noteKey(note)}>{note}</li>
          ))}
        </ul>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="flex-1 rounded-[10px] border border-[#00a4e5]/35 bg-white px-3 py-2.75 text-center text-[12px] font-bold text-[#00a4e5] active:bg-[#f0faff]"
          onClick={onBack}
        >
          ย้อนกลับ
        </button>
        <button
          type="button"
          className="flex-1 rounded-[10px] border-none bg-[#00a4e5] px-3 py-2.75 text-center text-[12px] font-bold text-white active:bg-[#0090cc]"
          onClick={onApply}
        >
          สมัคร
        </button>
      </div>
    </>
  );
}

function ValueRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value?: string;
  strong?: boolean;
}) {
  if (!value) return null;

  return (
    <div className="flex items-start justify-between gap-2.5">
      <div className="flex-1 text-[11px] leading-[1.35] text-[#6b7280]">{label}</div>
      <div
        className={cn(
          "text-right text-[11px] font-bold leading-[1.35] wrap-break-word text-[#111827]",
          strong && "text-[#00a4e5]",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function buildBalloonLine(rows: string[]) {
  const raw: string[] = [];
  rows.forEach((row) => {
    const group = (String(row).split("|")[1] || "").trim();
    if (group && !raw.includes(group)) raw.push(group);
  });

  if (!raw.length) return "";
  if (raw.length === 1) return `มีค่างวดส่วนสุดท้ายต้องชำระในงวดที่ ${raw[0]}`;
  if (raw.length === 2) return `มีค่างวดส่วนสุดท้ายต้องชำระในงวดที่ ${raw[0]} และ ${raw[1]}`;
  const tail = raw[raw.length - 1];
  return `มีค่างวดส่วนสุดท้ายต้องชำระในงวดที่ ${raw.slice(0, -1).join(", ")} และ ${tail}`;
}

function formatMoney(value?: string) {
  if (!value) return "";
  return `${value} บาท`;
}

function formatPercent(value?: string) {
  if (!value) return "";
  return `${value}% ต่อปี`;
}

function noteKey(note: string) {
  let hash = 0;
  for (let i = 0; i < note.length; i += 1) {
    hash = (hash * 31 + note.charCodeAt(i)) >>> 0;
  }
  return `note-${hash.toString(16)}`;
}
