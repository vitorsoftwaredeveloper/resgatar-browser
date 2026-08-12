import { RoleKey, TestUser } from "./roles";

const MEMBER_CPF = "11144477735";
const GUEST_CPF = "12345678909";

function env(name: string): string {
  return String(Cypress.env(name) ?? "");
}

export function getUser(role: RoleKey): TestUser {
  const catalog: Record<RoleKey, TestUser> = {
    admin: {
      role: "admin",
      persistedRole: "admin",
      label: "Administrador",
      sidebarRoleLabel: "Administrador",
      email: env("adminEmail"),
      password: env("adminPassword"),
      firstName: "Vitor",
      lastName: "Admin",
      cpf: "",
      phone: "",
      birthDate: "",
    },
    member: {
      role: "member",
      persistedRole: "user",
      label: "Membro",
      sidebarRoleLabel: "Membro",
      email: env("memberEmail"),
      password: env("memberPassword"),
      firstName: "E2eMembro",
      lastName: "Resgatar",
      cpf: MEMBER_CPF,
      phone: "11987654321",
      birthDate: "10/05/1990",
    },
    guest: {
      role: "guest",
      persistedRole: "guest",
      label: "Convidado",
      sidebarRoleLabel: "Convidado",
      email: env("guestEmail"),
      password: env("guestPassword"),
      firstName: "E2eConvidado",
      lastName: "Resgatar",
      cpf: GUEST_CPF,
      phone: "11912345678",
      birthDate: "22/09/1995",
    },
  };

  return catalog[role];
}

export function provisionableUsers(): TestUser[] {
  return [getUser("member"), getUser("guest")];
}

export function registrationPayload(user: TestUser) {
  const [day, month, year] = user.birthDate.split("/").map(Number);

  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumber: user.phone,
    identification: { type: "CPF" as const, numberType: user.cpf },
    paymentInfo: { datePayment: 1, amount: "10,00" },
    dateOfBirth: new Date(year, month - 1, day).getTime(),
    password: user.password,
  };
}
