"use client";

import { useState, type FormEvent } from "react";
import type { Gender } from "@/lib/fortune/payload";
import { isValidAge } from "@/lib/demographics/validateAge";

interface GenderAgeFormProps {
  onSubmit: (demographics: { gender: Gender; age: number }) => void;
}

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "ชาย" },
  { value: "female", label: "หญิง" },
  { value: "unspecified", label: "ไม่ระบุ" },
];

const primaryButtonClass =
  "rounded-full bg-lacquer px-6 py-3 font-medium text-parchment transition hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100";

export default function GenderAgeForm({ onSubmit }: GenderAgeFormProps) {
  const [gender, setGender] = useState<Gender | null>(null);
  const [ageInput, setAgeInput] = useState("");
  const [ageTouched, setAgeTouched] = useState(false);

  const age = Number(ageInput);
  const ageValid = ageInput !== "" && isValidAge(age);
  const canSubmit = gender !== null && ageValid;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit || gender === null) return;
    onSubmit({ gender, age });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-md flex-col gap-4 rounded-lg border border-gold/40 bg-panel p-6 text-parchment"
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold tracking-wide text-gold/80">เพศ</legend>
        <div className="flex gap-4">
          {GENDER_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-parchment">
              <input
                type="radio"
                name="gender"
                value={option.value}
                checked={gender === option.value}
                onChange={() => setGender(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold tracking-wide text-gold/80">อายุ</span>
        <input
          type="number"
          value={ageInput}
          onChange={(event) => setAgeInput(event.target.value)}
          onBlur={() => setAgeTouched(true)}
          className="rounded-lg border border-gold/30 bg-ink/40 px-4 py-2 text-parchment"
        />
        {ageTouched && !ageValid && (
          <span className="text-sm text-amber-400">กรุณากรอกอายุระหว่าง 1-120 ปี</span>
        )}
      </label>

      <button type="submit" disabled={!canSubmit} className={primaryButtonClass}>
        ยืนยันข้อมูล
      </button>
    </form>
  );
}
