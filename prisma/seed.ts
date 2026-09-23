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
	const adminEmail = (
		process.env.DEMO_ADMIN_EMAIL ?? "admin@taskflow.dev"
	).toLowerCase();
	const adminPassword = process.env.DEMO_ADMIN_PASSWORD ?? "Admin@12345";
	await prisma.user.upsert({
		where: { email: adminEmail },
		update: { role: "ADMIN", status: "ACTIVE" },
		create: {
			name: process.env.DEMO_ADMIN_NAME ?? "TaskFlow Admin",
			email: adminEmail,
			password: await bcrypt.hash(adminPassword, 12),
			role: "ADMIN",
			emailVerified: true,
		},
	});
	console.log(`Seeded demo owner: ${email}`);
	console.log(`Seeded demo admin: ${adminEmail}`);
};

main().finally(() => prisma.$disconnect());
