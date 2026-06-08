import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyName, name, email, password } = body;

    if (!companyName || !name || !email || !password) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 });
    }

    // Verifica se já existe o email
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email já cadastrado" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Usa transação para criar Empresa e Usuário ao mesmo tempo,
    // garantindo que se um falhar, o outro não é criado.
    const result = await prisma.$transaction(async (tx) => {
      const newCompany = await tx.company.create({
        data: {
          name: companyName,
        },
      });

      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "ADMIN",
          companyId: newCompany.id,
        },
      });

      return { company: newCompany, user: newUser };
    });

    return NextResponse.json(
      { message: "Empresa e usuário criados com sucesso!", userId: result.user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao registrar empresa:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
