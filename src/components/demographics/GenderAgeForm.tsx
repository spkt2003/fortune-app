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
  "rounded-full bg-black px-6 py-3 text-white disabled:opacity-40 dark:bg-white dark:text-black";

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
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
          เพศ
        </legend>
        <div className="flex gap-4">
          {GENDER_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300"
            >
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
        <span className="text-sm font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
          อายุ
        </span>
        <input
          type="number"
          value={ageInput}
          onChange={(event) => setAgeInput(event.target.value)}
          onBlur={() => setAgeTouched(true)}
          className="rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        {ageTouched && !ageValid && (
          <span className="text-sm text-red-600 dark:text-red-400">
            กรุณากรอกอายุระหว่าง 1-120 ปี
          </span>
        )}
      </label>

      <button type="submit" disabled={!canSubmit} className={primaryButtonClass}>
        ยืนยันข้อมูล
      </button>
    </form>
  );
}
