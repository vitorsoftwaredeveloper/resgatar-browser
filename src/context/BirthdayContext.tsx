"use client";

import { MemberServices } from "@/services/MemberService";
import { IMember } from "@/types/Member";
import React, { createContext, useContext, useEffect, useState } from "react";

// Portado de resgatar_app/src/context/BirthdayContext.tsx (idêntico — sem
// dependências de React Native).

function countTodayBirthdays(members: IMember[]): number {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();

  return members.filter((m) => {
    if (!m.dateOfBirth) return false;
    const numeric = Number(m.dateOfBirth);
    const ts = !isNaN(numeric) ? numeric : Date.parse(String(m.dateOfBirth));
    if (isNaN(ts)) return false;
    const d = new Date(ts);
    return d.getUTCDate() === currentDay && d.getUTCMonth() === currentMonth;
  }).length;
}

interface BirthdayContextData {
  todayBirthdays: number;
}

const BirthdayContext = createContext<BirthdayContextData>({ todayBirthdays: 0 });

export function BirthdayProvider({ children }: { children: React.ReactNode }) {
  const [todayBirthdays, setTodayBirthdays] = useState(0);

  useEffect(() => {
    MemberServices.listBirthdayMembers()
      .then((data: IMember[]) => setTodayBirthdays(countTodayBirthdays(data)))
      .catch(() => {});
  }, []);

  return (
    <BirthdayContext.Provider value={{ todayBirthdays }}>
      {children}
    </BirthdayContext.Provider>
  );
}

export function useBirthday() {
  return useContext(BirthdayContext);
}
