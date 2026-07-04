"use client";

import { MemberServices } from "@/services/MemberService";
import { IMember } from "@/types/Member";
import { AuthContext } from "@/context/AuthContext";
import React, { createContext, useContext, useEffect, useState } from "react";

// Portado de resgatar_app/src/context/BirthdayContext.tsx. No app este
// provider só monta dentro da stack autenticada; no web ele mora em
// providers.tsx acima do router (ao lado do login), então a busca precisa
// esperar `isLoggedIn`, senão dispara sem token antes do primeiro login.

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
  const { isLoggedIn } = useContext(AuthContext);
  const [todayBirthdays, setTodayBirthdays] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) {
      setTodayBirthdays(0);
      return;
    }

    MemberServices.listBirthdayMembers()
      .then((data: IMember[]) => setTodayBirthdays(countTodayBirthdays(data)))
      .catch(() => {});
  }, [isLoggedIn]);

  return (
    <BirthdayContext.Provider value={{ todayBirthdays }}>
      {children}
    </BirthdayContext.Provider>
  );
}

export function useBirthday() {
  return useContext(BirthdayContext);
}
