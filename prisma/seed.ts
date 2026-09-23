import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
	adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" }),
});

const main = async () => {
	const name = process.env.DEMO_OWNER_NAME ?? "Demo Owner";
	const email = (
		process.env.DEMO_OWNER_EMAIL ?? "owner@taskflow.dev"
	).toLowerCase();
	const password = process.env.DEMO_OWNER_PASSWORD ?? "Owner@12345";
	const user = await prisma.user.upsert({
		where: { email },
		update: {},
		create: {
			name,
			email,
			password: await bcrypt.hash(password, 12),
			role: "OWNER",
			emailVerified: true,
		},
	});
	const organization = await prisma.organization.upsert({
		where: { slug: "taskflow-demo" },
		update: {},
		create: {
			name: "TaskFlow Demo",
			slug: "taskflow-demo",
			description: "Evaluation workspace",
			ownerId: user.id,
		},
	});
	await prisma.membership.upsert({
		where: {
			userId_organizationId: {
				userId: user.id,
				organizationId: organization.id,
			},
		},
		update: { role: "OWNER" },
		create: { userId: user.id, organizationId: organization.id, role: "OWNER" },
	});
	console.log(`Seeded demo owner: ${email}`);
};

main().finally(() => prisma.$disconnect());
