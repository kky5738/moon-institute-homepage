"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PendingButton } from "@/components/ui/pending-button";
import { Textarea } from "@/components/ui/textarea";
import { updateInquiry } from "../../actions";

type Inquiry = { id: number; name: string; email: string | null; phone: string | null; type: string; subject: string | null; message: string };

export function InquiryEditForm({ inquiry }: { inquiry: Inquiry }) {
  const [state, action, pending] = useActionState(updateInquiry, { message: "" });
  return (
    <form action={action} onReset={(event) => event.preventDefault()} className="mt-8 space-y-6">
      <input type="hidden" name="id" value={inquiry.id} />
      <fieldset disabled={pending} className="space-y-6">
        <div>
          <Label htmlFor="type">문의 유형</Label>
          <select id="type" name="type" defaultValue={inquiry.type} required className="mt-2 h-11 w-full rounded-md border border-input bg-card px-3 text-sm">
            <option value="GENERAL">일반 문의</option>
            <option value="PARTICIPATION">참여 신청</option>
            <option value="DONATION_INTEREST">후원 관심</option>
          </select>
        </div>
        <div><Label htmlFor="name">이름</Label><Input id="name" name="name" defaultValue={inquiry.name} required minLength={2} maxLength={80} className="mt-2" /></div>
        <div><Label htmlFor="email">이메일</Label><Input id="email" name="email" type="email" defaultValue={inquiry.email ?? ""} maxLength={120} aria-describedby="contact-help" className="mt-2" /></div>
        <div>
          <Label htmlFor="phone">연락처</Label><Input id="phone" name="phone" type="tel" defaultValue={inquiry.phone ?? ""} maxLength={40} aria-describedby="contact-help" className="mt-2" />
          <p id="contact-help" className="mt-2 text-xs text-muted">이메일 또는 연락처 중 하나는 필수입니다. 연락처는 숫자 7~15자리이며 맨 앞의 +와 숫자 사이 공백 1칸 또는 하이픈 1개를 사용할 수 있습니다.</p>
        </div>
        <div><Label htmlFor="subject">제목</Label><Input id="subject" name="subject" defaultValue={inquiry.subject ?? ""} maxLength={120} className="mt-2" /></div>
        <div><Label htmlFor="message">내용</Label><Textarea id="message" name="message" defaultValue={inquiry.message} required minLength={10} maxLength={2000} rows={8} className="mt-2" /></div>
      </fieldset>
      {state.message && <p role="alert" className="text-sm text-red-700">{state.message}</p>}
      <div className="flex gap-4">
        <Link href={`/admin/inquiries/${inquiry.id}`} className="border border-border px-4 py-2 text-sm">취소</Link>
        <PendingButton pendingLabel="저장 중…" className="border border-primary bg-primary-dark px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">정정 저장</PendingButton>
      </div>
    </form>
  );
}
